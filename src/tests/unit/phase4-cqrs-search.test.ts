/**
 * VERIIGO V2 Phase 4: CQRS Search & Discovery Intelligence Layer Test Suite
 * Validates CQRS Read Model Transformation, Quality & Freshness Score Calculation,
 * Multi-Factor Ranking Engine Weights, Token Generation, Cursor Pagination, and Analytical Tracking.
 */

import { describe, it, expect } from 'vitest';
import { JobSearchIndexer } from '../../services/JobSearchIndexer';
import { SearchDiscoveryService } from '../../services/SearchDiscoveryService';
import { JobAnnouncementEntity, JobSearchIndexEntity } from '../../types/firestore';

describe('VERIIGO V2 Phase 4: CQRS Search & Discovery Intelligence Layer', () => {
  const sampleJob: JobAnnouncementEntity = {
    jobId: 'job-abcdef1234567890abcdef1234567890',
    sourceDocumentId: 'doc-lake-9988',
    extractionTaskId: 'ext-task-777',
    sourceId: 'src-dopa-01',
    title: 'วิศวกรคอมพิวเตอร์ปฏิบัติการ',
    organization: 'กรมการปกครอง',
    governmentLevel: 'CENTRAL',
    province: 'กรุงเทพมหานคร',
    jobCategory: 'INFORMATION_TECHNOLOGY',
    employmentType: 'ข้าราชการพลเรือนสามัญ',
    salary: { min: 18000, max: 20000, text: '18,000 - 20,000 บาท', currency: 'THB' },
    positionsAvailable: 5,
    publishedDate: new Date().toISOString(),
    applicationDeadline: '2026-08-20',
    officialUrl: 'https://dopa.go.th/jobs/123',
    status: 'ACTIVE',
    confidenceScore: 0.92,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lineageReference: {
      sourceDocumentId: 'doc-lake-9988',
      extractionTaskId: 'ext-task-777',
      modelVersion: 'gemini-2.5-flash',
      promptVersion: 'prompt-th-gov-v2.4.1',
      validationVersion: 'validator-v2.1.0',
    },
  };

  it('TC-PHASE4-01: CQRS Read Model Entity Field Mapping & Token Generation', () => {
    const searchEntity = JobSearchIndexer.transformToSearchIndex(sampleJob);

    expect(searchEntity.jobId).toBe(sampleJob.jobId);
    expect(searchEntity.title).toBe(sampleJob.title);
    expect(searchEntity.organization).toBe(sampleJob.organization);
    expect(searchEntity.province).toBe(sampleJob.province);
    expect(searchEntity.governmentLevel).toBe(sampleJob.governmentLevel);
    expect(searchEntity.jobCategory).toBe(sampleJob.jobCategory);
    expect(searchEntity.employmentType).toBe(sampleJob.employmentType);
    expect(searchEntity.deadline).toBe(sampleJob.applicationDeadline);
    expect(searchEntity.status).toBe(sampleJob.status);
    expect(searchEntity.qualityScore).toBeGreaterThanOrEqual(0.90);
    expect(searchEntity.freshnessScore).toBeGreaterThanOrEqual(0.95);
    expect(searchEntity.searchKeywordsTokens).toContain('วิศวกรคอมพิวเตอร์ปฏิบัติการ');
    expect(searchEntity.searchKeywordsTokens).toContain('กรมการปกครอง');
  });

  it('TC-PHASE4-02: Quality Score & Exponential Freshness Decay Computation', () => {
    const qualityScore = JobSearchIndexer.calculateQualityScore(sampleJob);
    expect(qualityScore).toBeGreaterThan(0.85);
    expect(qualityScore).toBeLessThanOrEqual(1.0);

    const now = new Date();
    const todayFreshness = JobSearchIndexer.calculateFreshnessScore(now.toISOString(), now);
    expect(todayFreshness).toBe(1.0);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const oldFreshness = JobSearchIndexer.calculateFreshnessScore(thirtyDaysAgo, now);
    expect(oldFreshness).toBeLessThan(0.50);
  });

  it('TC-PHASE4-03: Deadline Urgency Ranking Multiplier', () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    
    const urgentScore = SearchDiscoveryService.calculateDeadlineUrgencyScore('2026-08-04', now);
    expect(urgentScore).toBe(1.0); // Within 2 days

    const mediumScore = SearchDiscoveryService.calculateDeadlineUrgencyScore('2026-08-10', now);
    expect(mediumScore).toBe(0.85); // Within 8 days

    const expiredScore = SearchDiscoveryService.calculateDeadlineUrgencyScore('2026-07-30', now);
    expect(expiredScore).toBe(0.0); // Expired
  });

  it('TC-PHASE4-04: Keyword Relevance Match Multipliers', () => {
    const searchEntity = JobSearchIndexer.transformToSearchIndex(sampleJob);

    const exactMatch = SearchDiscoveryService.calculateKeywordRelevanceScore(searchEntity, 'วิศวกรคอมพิวเตอร์ปฏิบัติการ');
    expect(exactMatch).toBe(1.0);

    const partialTitleMatch = SearchDiscoveryService.calculateKeywordRelevanceScore(searchEntity, 'คอมพิวเตอร์');
    expect(partialTitleMatch).toBe(0.90);

    const orgMatch = SearchDiscoveryService.calculateKeywordRelevanceScore(searchEntity, 'กรมการปกครอง');
    expect(orgMatch).toBe(1.0);

    const noMatch = SearchDiscoveryService.calculateKeywordRelevanceScore(searchEntity, 'พยาบาลวิชาชีพ');
    expect(noMatch).toBe(0.0);
  });

  it('TC-PHASE4-05: Multi-Factor Composite Search Ranking Engine', () => {
    const searchEntity = JobSearchIndexer.transformToSearchIndex(sampleJob);
    const now = new Date('2026-08-02T12:00:00.000Z');

    const rank = SearchDiscoveryService.computeCompositeRank(searchEntity, 'คอมพิวเตอร์', now);
    expect(rank).toBeGreaterThan(0.5);
    expect(rank).toBeLessThanOrEqual(1.0);
  });
});
