/**
 * VERIIGO V2 - Phase 4 CQRS Search & Discovery Intelligence Service
 * Responsibility: Execute read-optimized queries against /job_search_index/{jobId}, apply multi-factor
 * ranking engine (keyword relevance, deadline urgency, quality score, freshness score), enforce cursor-based
 * pagination, and log query performance metrics into /search_analytics/{analyticsId}.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  JobSearchIndexEntity,
  SearchAnalyticsEntity,
  SearchJobsQuery,
  SearchJobsResponse,
} from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const SEARCH_INDEX_COLLECTION = 'job_search_index';
const SEARCH_ANALYTICS_COLLECTION = 'search_analytics';

export class SearchDiscoveryService {
  /**
   * Calculate Deadline Urgency Score (0.0 - 1.0)
   * Higher score for deadlines approaching within 1-7 days
   */
  public static calculateDeadlineUrgencyScore(deadlineStr?: string, now: Date = new Date()): number {
    if (!deadlineStr) return 0.5;
    try {
      const deadline = new Date(deadlineStr);
      deadline.setHours(23, 59, 59, 999);
      const diffMs = deadline.getTime() - now.getTime();
      const daysLeft = diffMs / (1000 * 60 * 60 * 24);

      if (daysLeft < 0) return 0.0; // Expired
      if (daysLeft <= 3) return 1.0; // Extremely urgent
      if (daysLeft <= 10) return 0.85; // Urgent
      if (daysLeft <= 20) return 0.70; // Medium urgency
      if (daysLeft <= 30) return 0.50;
      return 0.30;
    } catch (e) {
      return 0.5;
    }
  }

  /**
   * Calculate Keyword Relevance Score (0.0 - 1.0)
   */
  public static calculateKeywordRelevanceScore(job: JobSearchIndexEntity, keyword?: string): number {
    if (!keyword || !keyword.trim()) return 0.5; // Neutral relevance when no keyword requested
    const q = keyword.trim().toLowerCase();
    const title = (job.title || '').toLowerCase();
    const org = (job.organization || '').toLowerCase();
    const province = (job.province || '').toLowerCase();
    const cat = (job.jobCategory || '').toLowerCase();

    // Exact title or org match
    if (title === q || org === q) return 1.0;
    // Prefix / Substring match in title
    if (title.includes(q)) return 0.90;
    // Prefix / Substring match in org or category
    if (org.includes(q) || cat.includes(q)) return 0.80;
    // Match in province
    if (province.includes(q)) return 0.70;

    // Token match check
    if (job.searchKeywordsTokens && job.searchKeywordsTokens.some((t) => t.includes(q) || q.includes(t))) {
      return 0.60;
    }

    return 0.0;
  }

  /**
   * Compute Multi-Factor Ranking Score
   * Formula: (Relevance * 0.40) + (Urgency * 0.25) + (Quality * 0.20) + (Freshness * 0.15)
   */
  public static computeCompositeRank(
    job: JobSearchIndexEntity,
    keyword?: string,
    now: Date = new Date()
  ): number {
    const keywordRelevance = this.calculateKeywordRelevanceScore(job, keyword);
    const urgencyScore = this.calculateDeadlineUrgencyScore(job.deadline, now);
    const qualityScore = job.qualityScore || 0.8;
    const freshnessScore = job.freshnessScore || 0.8;

    const rank = (keywordRelevance * 0.40) + (urgencyScore * 0.25) + (qualityScore * 0.20) + (freshnessScore * 0.15);
    return Math.round(rank * 1000) / 1000;
  }

  /**
   * Execute CQRS Search Query with Multi-Factor Ranking, Filtering & Cursor Pagination
   */
  public static async searchJobs(
    queryParams: SearchJobsQuery,
    traceId?: string
  ): Promise<SearchJobsResponse> {
    const startTime = Date.now();
    const tid = traceId || generateTraceId();

    // Enforce limit bounds (1 to 100, default 20)
    const pageLimit = Math.min(100, Math.max(1, queryParams.limit || 20));
    
    // Parse cursor offset
    let cursorOffset = 0;
    if (queryParams.cursor) {
      try {
        const decoded = Buffer.from(queryParams.cursor, 'base64').toString('utf-8');
        cursorOffset = parseInt(decoded, 10) || 0;
      } catch (e) {
        cursorOffset = parseInt(queryParams.cursor, 10) || 0;
      }
    }

    try {
      const colRef = collection(db, SEARCH_INDEX_COLLECTION);
      // Fetch documents from read-model collection
      const snap = await getDocs(query(colRef, firestoreLimit(500)));
      let allDocs = snap.docs.map((d) => d.data() as JobSearchIndexEntity);

      // 1. Apply Filtering Logic
      const filtered = allDocs.filter((job) => {
        // Status filter (default ACTIVE if status not explicitly set to ALL)
        if (queryParams.status && queryParams.status !== ('ALL' as any)) {
          if (job.status !== queryParams.status) return false;
        } else if (!queryParams.status) {
          if (job.status !== 'ACTIVE') return false;
        }

        // Government level filter
        if (queryParams.governmentLevel && queryParams.governmentLevel.toUpperCase() !== 'ALL') {
          if (job.governmentLevel?.toUpperCase() !== queryParams.governmentLevel.toUpperCase()) return false;
        }

        // Province filter
        if (queryParams.province && queryParams.province !== 'ALL') {
          if (!job.province?.includes(queryParams.province)) return false;
        }

        // Job Category filter
        if (queryParams.jobCategory && queryParams.jobCategory !== 'ALL') {
          if (job.jobCategory?.toUpperCase() !== queryParams.jobCategory.toUpperCase()) return false;
        }

        // Employment Type filter
        if (queryParams.employmentType && queryParams.employmentType !== 'ALL') {
          if (!job.employmentType?.includes(queryParams.employmentType)) return false;
        }

        // Keyword filter
        if (queryParams.keyword && queryParams.keyword.trim()) {
          const score = this.calculateKeywordRelevanceScore(job, queryParams.keyword);
          if (score <= 0.0) return false;
        }

        return true;
      });

      // 2. Multi-Factor Ranking Engine
      const now = new Date();
      const ranked = filtered.map((job) => {
        const compositeScore = this.computeCompositeRank(job, queryParams.keyword, now);
        return {
          ...job,
          compositeScore,
        };
      });

      // Sort descending by composite score, then by deadline
      ranked.sort((a, b) => {
        if (b.compositeScore !== a.compositeScore) {
          return b.compositeScore - a.compositeScore;
        }
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      // 3. Cursor Pagination
      const totalMatches = ranked.length;
      const paginatedResults = ranked.slice(cursorOffset, cursorOffset + pageLimit);
      const nextOffset = cursorOffset + pageLimit;
      const hasMore = nextOffset < totalMatches;
      const nextCursor = hasMore ? Buffer.from(String(nextOffset)).toString('base64') : null;

      const queryTimeMs = Date.now() - startTime;

      // 4. Record Search Analytics Telemetry
      try {
        const analyticsId = `analytics-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        const analyticsRecord: SearchAnalyticsEntity = {
          analyticsId,
          searchKeyword: queryParams.keyword || undefined,
          filters: {
            province: queryParams.province,
            governmentLevel: queryParams.governmentLevel,
            jobCategory: queryParams.jobCategory,
            employmentType: queryParams.employmentType,
            status: queryParams.status,
          },
          resultCount: totalMatches,
          timestamp: new Date().toISOString(),
          traceId: tid,
          executionTimeMs: queryTimeMs,
        };

        await setDoc(doc(db, SEARCH_ANALYTICS_COLLECTION, analyticsId), analyticsRecord);
      } catch (analyticsErr) {
        // Non-fatal telemetry recording error
      }

      logger.info(
        {
          traceId: tid,
          operation: 'SearchDiscoveryService.searchJobs',
          keyword: queryParams.keyword,
          totalMatches,
          returnedCount: paginatedResults.length,
          queryTimeMs,
        },
        `CQRS search executed in ${queryTimeMs}ms (Matches: ${totalMatches})`
      );

      return {
        results: paginatedResults,
        nextCursor,
        totalMatches,
        hasMore,
        queryTimeMs,
      };
    } catch (err) {
      logger.error({ traceId: tid, operation: 'SearchDiscoveryService.searchJobs', errorCode: 'SEARCH_QUERY_FAILED' }, 'CQRS search query execution failed', err);
      throw new DatabaseOperationalError({
        message: 'Failed to execute search discovery query',
        operation: 'SearchDiscoveryService.searchJobs',
        traceId: tid,
        originalError: err,
      });
    }
  }
}
