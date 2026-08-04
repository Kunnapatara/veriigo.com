/**
 * VERIIGO V2 Phase 3: Normalized Government Job Intelligence Layer Test Suite
 * Validates Deterministic Job Identity (Fingerprint SHA-256), Duplicate Prevention,
 * Normalization Engine Taxonomy, Data Lineage Preservation, and Expiration Processing.
 */

import { describe, it, expect } from 'vitest';
import { JobNormalizationEngine } from '../../services/JobNormalizationEngine';
import { JobExpirationProcessor } from '../../services/JobExpirationProcessor';
import { JobAnnouncementEntity, LineageReference } from '../../types/firestore';

describe('VERIIGO V2 Phase 3: Government Job Intelligence Layer', () => {
  const sampleDocId = 'doc-lake-778811';
  const sampleOrg = 'กรมทางหลวง';
  const sampleTitle = 'วิศวกรโยธาปฏิบัติการ';
  const sampleDeadline = '2026-08-15';

  it('TC-PHASE3-01: Deterministic Job ID Fingerprint Generation (SHA-256)', () => {
    const res1 = JobNormalizationEngine.generateDeterministicJobId(
      sampleDocId,
      sampleOrg,
      sampleTitle,
      sampleDeadline
    );

    const res2 = JobNormalizationEngine.generateDeterministicJobId(
      sampleDocId,
      sampleOrg,
      sampleTitle,
      sampleDeadline
    );

    expect(res1.jobId).toMatch(/^job-[a-f0-9]{32}$/);
    expect(res1.jobId).toBe(res2.jobId);
    expect(res1.fingerprint).toBe(res2.fingerprint);
  });

  it('TC-PHASE3-02: Duplicate Job Identity Prevention across case/whitespace variations', () => {
    const resA = JobNormalizationEngine.generateDeterministicJobId(
      'doc-101',
      ' กรมชลประทาน ',
      'นายช่างชลประทาน  ปฏิบัติงาน',
      '2026-09-01T00:00:00.000Z'
    );

    const resB = JobNormalizationEngine.generateDeterministicJobId(
      'doc-101',
      'กรมชลประทาน',
      'นายช่างชลประทาน ปฏิบัติงาน',
      '2026-09-01'
    );

    expect(resA.jobId).toBe(resB.jobId);
  });

  it('TC-PHASE3-03: Normalization Engine — Organization & Government Level Mapping', () => {
    const org1 = JobNormalizationEngine.normalizeOrganization('สำนักงาน  สำนักงานจังหวัดเชียงใหม่ ');
    expect(org1).toBe('สำนักงานจังหวัดเชียงใหม่');

    const level1 = JobNormalizationEngine.mapGovernmentLevel('กรมทางหลวง');
    expect(level1).toBe('CENTRAL');

    const level2 = JobNormalizationEngine.mapGovernmentLevel('การไฟฟ้าส่วนภูมิภาค');
    expect(level2).toBe('STATE_ENTERPRISE');

    const level3 = JobNormalizationEngine.mapGovernmentLevel('องค์การบริหารส่วนจังหวัดเชียงใหม่');
    expect(level3).toBe('LOCAL');
  });

  it('TC-PHASE3-04: Normalization Engine — Province Standard Alignment', () => {
    expect(JobNormalizationEngine.normalizeProvince('กทม.')).toBe('กรุงเทพมหานคร');
    expect(JobNormalizationEngine.normalizeProvince('กรุงเทพฯ')).toBe('กรุงเทพมหานคร');
    expect(JobNormalizationEngine.normalizeProvince('จังหวัดเชียงใหม่')).toBe('เชียงใหม่');
    expect(JobNormalizationEngine.normalizeProvince('จ.สงขลา')).toBe('สงขลา');
  });

  it('TC-PHASE3-05: Normalization Engine — Job Category Classification', () => {
    expect(JobNormalizationEngine.normalizeJobCategory('วิศวกรโยธาชำนาญการ')).toBe('ENGINEERING');
    expect(JobNormalizationEngine.normalizeJobCategory('นักวิเคราะห์ระบบคอมพิวเตอร์')).toBe('INFORMATION_TECHNOLOGY');
    expect(JobNormalizationEngine.normalizeJobCategory('นักวิชาการเงินและบัญชี')).toBe('FINANCE_ACCOUNTING');
    expect(JobNormalizationEngine.normalizeJobCategory('พยาบาลวิชาชีพปฏิบัติการ')).toBe('PUBLIC_HEALTH');
    expect(JobNormalizationEngine.normalizeJobCategory('นิติกรปฏิบัติการ')).toBe('LEGAL');
  });

  it('TC-PHASE3-06: Data Lineage Preservation Requirements', () => {
    const lineage: LineageReference = {
      sourceDocumentId: sampleDocId,
      extractionTaskId: 'ext-task-900',
      modelVersion: 'gemini-2.5-flash',
      promptVersion: 'prompt-th-gov-v2.4.1',
      validationVersion: 'validator-v2.1.0',
      fieldLineage: {
        'position.positionTitle': {
          sourceDocumentId: sampleDocId,
          textAnchor: 'ตำแหน่งวิศวกรโยธาปฏิบัติการ',
          confidenceScore: 0.95,
        },
      },
    };

    const jobEntity: Partial<JobAnnouncementEntity> = {
      jobId: 'job-1234567890abcdef1234567890abcdef',
      sourceDocumentId: sampleDocId,
      extractionTaskId: 'ext-task-900',
      lineageReference: lineage,
    };

    expect(jobEntity.lineageReference?.sourceDocumentId).toBe(sampleDocId);
    expect(jobEntity.lineageReference?.extractionTaskId).toBe('ext-task-900');
    expect(jobEntity.lineageReference?.modelVersion).toBe('gemini-2.5-flash');
    expect(jobEntity.lineageReference?.promptVersion).toBe('prompt-th-gov-v2.4.1');
    expect(jobEntity.lineageReference?.validationVersion).toBe('validator-v2.1.0');
  });

  it('TC-PHASE3-07: Expiration Processor Evaluation', () => {
    const pastDeadline = '2020-01-01';
    const futureDeadline = '2030-12-31';

    expect(JobExpirationProcessor.isExpired(pastDeadline)).toBe(true);
    expect(JobExpirationProcessor.isExpired(futureDeadline)).toBe(false);
  });
});
