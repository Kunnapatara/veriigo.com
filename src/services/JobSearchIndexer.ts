/**
 * VERIIGO V2 - Phase 4 CQRS Job Search Indexer Service
 * Responsibility: Build and synchronize read-optimized CQRS entities in /job_search_index/{jobId}
 * from /jobs/{jobId} write-model entities. Calculates quality score, freshness score decay,
 * and tokenizes keywords for search execution.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import { JobAnnouncementEntity, JobSearchIndexEntity } from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const dbName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
console.log(`[Firestore Init - JobSearchIndexer.ts]`);
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Database ID: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`  Database Name: ${dbName}`);

const JOBS_COLLECTION = 'jobs';
const SEARCH_INDEX_COLLECTION = 'job_search_index';

export class JobSearchIndexer {
  /**
   * Calculate quality score (0.0 to 1.0) based on confidence score and data completeness
   */
  public static calculateQualityScore(job: JobAnnouncementEntity): number {
    let score = job.confidenceScore || 0.85;

    // Completeness bonuses
    if (job.title && job.title.length > 5) score += 0.03;
    if (job.organization && job.organization !== 'หน่วยงานราชการ') score += 0.03;
    if (job.applicationDeadline) score += 0.02;
    if (job.salary?.min && job.salary.min > 0) score += 0.02;
    if (job.lineageReference?.sourceDocumentId) score += 0.05;

    return Math.min(1.0, Math.max(0.1, Math.round(score * 100) / 100));
  }

  /**
   * Calculate freshness score (0.0 to 1.0) using exponential decay based on days since publication
   */
  public static calculateFreshnessScore(publishedDateStr: string, now: Date = new Date()): number {
    try {
      const pubDate = new Date(publishedDateStr || now);
      const diffMs = now.getTime() - pubDate.getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      // Exponential decay: score ~ 1.0 on day 0, ~ 0.74 on day 10, ~ 0.40 on day 30
      const score = Math.exp(-0.03 * diffDays);
      return Math.min(1.0, Math.max(0.05, Math.round(score * 100) / 100));
    } catch (e) {
      return 0.5;
    }
  }

  /**
   * Tokenize job fields into clean searchable token array
   */
  public static generateSearchTokens(job: JobAnnouncementEntity): string[] {
    const rawText = `${job.title} ${job.organization} ${job.province} ${job.jobCategory} ${job.employmentType} ${job.governmentLevel}`.toLowerCase();
    
    // Split on whitespace, punctuation
    const tokens = new Set<string>();
    const words = rawText.split(/[\s,\-_/().]+/);

    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed.length >= 2) {
        tokens.add(trimmed);
      }
    }

    // Include full phrases as tokens for exact matching
    tokens.add(job.title.toLowerCase().trim());
    tokens.add(job.organization.toLowerCase().trim());
    tokens.add(job.province.toLowerCase().trim());

    return Array.from(tokens);
  }

  /**
   * Transform write-model JobAnnouncementEntity to CQRS read-model JobSearchIndexEntity
   */
  public static transformToSearchIndex(job: JobAnnouncementEntity, now: Date = new Date()): JobSearchIndexEntity {
    const qualityScore = this.calculateQualityScore(job);
    const freshnessScore = this.calculateFreshnessScore(job.publishedDate || job.createdAt, now);
    const searchKeywordsTokens = this.generateSearchTokens(job);

    return {
      jobId: job.jobId,
      title: job.title,
      organization: job.organization,
      province: job.province,
      governmentLevel: job.governmentLevel,
      jobCategory: String(job.jobCategory),
      employmentType: String(job.employmentType),
      deadline: job.applicationDeadline,
      status: job.status,
      qualityScore,
      freshnessScore,
      searchKeywordsTokens,
      officialUrl: job.officialUrl,
      updatedAt: job.updatedAt || now.toISOString(),
    };
  }

  /**
   * Index or update a single job in /job_search_index/{jobId}
   */
  public static async indexJob(job: JobAnnouncementEntity, traceId?: string): Promise<JobSearchIndexEntity> {
    const tid = traceId || generateTraceId();
    const searchEntity = this.transformToSearchIndex(job);

    try {
      const docRef = doc(db, SEARCH_INDEX_COLLECTION, job.jobId);
      await setDoc(docRef, searchEntity, { merge: true });

      logger.info(
        { traceId: tid, operation: 'JobSearchIndexer.indexJob', entityId: job.jobId },
        `CQRS search index updated for job ${job.jobId} (qualityScore=${searchEntity.qualityScore}, freshnessScore=${searchEntity.freshnessScore})`
      );

      return searchEntity;
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobSearchIndexer.indexJob', entityId: job.jobId }, 'Failed to write to job_search_index', err);
      throw new DatabaseOperationalError({
        message: `Failed to index job ${job.jobId} into CQRS search index`,
        operation: 'JobSearchIndexer.indexJob',
        traceId: tid,
        entityId: job.jobId,
        originalError: err,
      });
    }
  }

  /**
   * Reindex all jobs from /jobs to /job_search_index
   */
  public static async reindexAllJobs(traceId?: string): Promise<{ totalJobs: number; indexedJobs: number }> {
    const tid = traceId || generateTraceId();
    logger.info({ traceId: tid, operation: 'JobSearchIndexer.reindexAllJobs' }, 'Starting bulk CQRS search reindexing...');

    try {
      const colRef = collection(db, JOBS_COLLECTION);
      const snap = await getDocs(query(colRef, firestoreLimit(500)));
      const jobs = snap.docs.map((d) => d.data() as JobAnnouncementEntity);

      let indexedJobs = 0;
      for (const job of jobs) {
        await this.indexJob(job, tid);
        indexedJobs++;
      }

      logger.info(
        { traceId: tid, operation: 'JobSearchIndexer.reindexAllJobs', totalJobs: jobs.length, indexedJobs },
        `Bulk CQRS search reindexing finished successfully.`
      );

      return { totalJobs: jobs.length, indexedJobs };
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobSearchIndexer.reindexAllJobs' }, 'Bulk CQRS reindexing failed', err);
      throw new DatabaseOperationalError({
        message: 'Bulk CQRS reindexing failed',
        operation: 'JobSearchIndexer.reindexAllJobs',
        traceId: tid,
        originalError: err,
      });
    }
  }
}
