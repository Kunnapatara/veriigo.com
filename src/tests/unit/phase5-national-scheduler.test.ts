/**
 * VERIIGO V2 Phase 5: National Government Recruitment Intelligence Scheduler Test Suite
 * Validates Timezone Scheduling (Asia/Bangkok 09:00 & 15:00), Source Health Computation,
 * Task Enqueuing & Retry Logic, 77-Province Coverage Tracking, and Ingestion Reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  NationalSchedulerEngine,
  THAILAND_77_PROVINCES,
} from '../../services/NationalSchedulerEngine';
import { SourceRegistryEntity } from '../../types/firestore';

describe('VERIIGO V2 Phase 5: National Government Recruitment Intelligence Scheduler', () => {
  it('TC-PHASE5-01: Asia/Bangkok Timezone (UTC+7) Schedule Window Evaluation', () => {
    // Test 09:00 Bangkok Time (02:00 UTC)
    const morningUtc = new Date('2026-08-03T02:00:00.000Z');
    const morningEval = NationalSchedulerEngine.evaluateScheduleWindow(morningUtc);
    expect(morningEval.isScheduledWindow).toBe(true);
    expect(morningEval.activeWindow).toBe('09:00');
    expect(morningEval.bangkokTimeFormatted).toBe('09:00');

    // Test 15:00 Bangkok Time (08:00 UTC)
    const afternoonUtc = new Date('2026-08-03T08:00:00.000Z');
    const afternoonEval = NationalSchedulerEngine.evaluateScheduleWindow(afternoonUtc);
    expect(afternoonEval.isScheduledWindow).toBe(true);
    expect(afternoonEval.activeWindow).toBe('15:00');
    expect(afternoonEval.bangkokTimeFormatted).toBe('15:00');

    // Test Off-schedule Window (12:00 Bangkok Time / 05:00 UTC)
    const offScheduleUtc = new Date('2026-08-03T05:00:00.000Z');
    const offEval = NationalSchedulerEngine.evaluateScheduleWindow(offScheduleUtc);
    expect(offEval.isScheduledWindow).toBe(false);
    expect(offEval.activeWindow).toBe('OFF_SCHEDULE');
  });

  it('TC-PHASE5-02: Source Health Score & Coverage Status Transitions', () => {
    const now = new Date();
    const freshIso = now.toISOString();

    // 100% Healthy
    const healthy = NationalSchedulerEngine.calculateSourceHealth(freshIso, 0, now);
    expect(healthy.healthScore).toBe(100);
    expect(healthy.coverageStatus).toBe('ACTIVE');

    // Degraded due to consecutive failure
    const degraded = NationalSchedulerEngine.calculateSourceHealth(freshIso, 1, now);
    expect(degraded.healthScore).toBe(75);
    expect(degraded.coverageStatus).toBe('DEGRADED');

    // Failed due to repeated failures (>= 3)
    const failed = NationalSchedulerEngine.calculateSourceHealth(freshIso, 3, now);
    expect(failed.healthScore).toBeLessThanOrEqual(50);
    expect(failed.coverageStatus).toBe('FAILED');
  });

  it('TC-PHASE5-03: 77-Province National Coverage Tracking', () => {
    expect(THAILAND_77_PROVINCES).toHaveLength(77);
    expect(THAILAND_77_PROVINCES).toContain('กรุงเทพมหานคร');
    expect(THAILAND_77_PROVINCES).toContain('เชียงใหม่');
    expect(THAILAND_77_PROVINCES).toContain('ภูเก็ต');

    const sampleSources: SourceRegistryEntity[] = [
      {
        sourceId: 'src-1',
        officialName: 'สำนักงาน ก.พ.',
        organizationType: 'สำนักงาน',
        governmentLevel: 'CENTRAL',
        province: 'กรุงเทพมหานคร',
        officialDomain: 'job.ocsc.go.th',
        crawlFrequency: 'DAILY',
        healthScore: 100,
        coverageStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        sourceId: 'src-2',
        officialName: 'อบจ.เชียงใหม่',
        organizationType: 'อบจ.',
        governmentLevel: 'LOCAL',
        province: 'เชียงใหม่',
        officialDomain: 'pao-chiangmai.go.th',
        crawlFrequency: 'DAILY',
        healthScore: 90,
        coverageStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const metrics = NationalSchedulerEngine.calculateNationalCoverageMetrics(sampleSources);
    expect(metrics.totalSourcesCount).toBe(2);
    expect(metrics.activeSourcesCount).toBe(2);
    expect(metrics.coveredProvincesCount).toBe(2); // Bangkok & Chiang Mai
    expect(metrics.coverageByProvince['กรุงเทพมหานคร']).toBe(1);
    expect(metrics.coverageByProvince['เชียงใหม่']).toBe(1);
    expect(metrics.nationalCoveragePercentage).toBe(Math.round((2 / 77) * 10000) / 100);
  });

  it('TC-PHASE5-04: Crawl Task Queue Enqueue & Retry Bound Logic', async () => {
    const task = await NationalSchedulerEngine.enqueueCrawlTask('src-test-01', 'trace-test-123');
    expect(task.taskId).toBeDefined();
    expect(task.sourceId).toBe('src-test-01');
    expect(task.status).toBe('PENDING');
    expect(task.retryCount).toBe(0);

    const completedTask = await NationalSchedulerEngine.processCrawlTask(task.taskId, true, 'trace-test-123');
    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.documentsDiscovered).toBeGreaterThan(0);
  });

  it('TC-PHASE5-05: Scheduled Pipeline Execution & Operational Report Generation', async () => {
    const report = await NationalSchedulerEngine.runScheduledPipeline('MANUAL', 'trace-pipeline-999');
    expect(report.reportId).toBeDefined();
    expect(report.scheduleWindow).toBe('MANUAL');
    expect(report.sourcesScanned).toBeGreaterThan(0);
    expect(report.nationalCoveragePercentage).toBeGreaterThan(0);
    expect(report.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
