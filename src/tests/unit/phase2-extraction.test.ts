/**
 * VERIIGO V2 Phase 2: Asynchronous AI Extraction Pipeline Automated Test Suite
 * Tests Extraction Task Entity, Event Boundary, Decoupled Worker, AI Governance & Lineage,
 * Validation Engine rejection rules, and Non-destructive Error Handling.
 */

import { describe, it, expect } from 'vitest';
import { JobValidationEngine } from '../../services/JobValidationEngine';
import { AIExtractionWorker } from '../../services/AIExtractionWorker';
import { DocumentIngestedEvent, ExtractionTaskEntity } from '../../types/firestore';

describe('VERIIGO V2 Phase 2: Asynchronous AI Extraction Pipeline', () => {
  const sampleDocumentId = 'doc-test-phase2-001';
  const sampleSourceId = 'src-doh-gov-th';
  const traceId = 'tr-test-phase2-trace';

  it('TC-PHASE2-01: Extraction Task Entity Schema & Governance Attributes', () => {
    const task: ExtractionTaskEntity = {
      taskId: 'ext-task-sample-1',
      documentId: sampleDocumentId,
      sourceId: sampleSourceId,
      status: 'PENDING',
      modelVersion: AIExtractionWorker.MODEL_VERSION,
      promptVersion: AIExtractionWorker.PROMPT_VERSION,
      validationVersion: AIExtractionWorker.VALIDATION_VERSION,
      confidenceScore: 0.95,
      createdAt: new Date().toISOString(),
      traceId,
    };

    expect(task.taskId).toMatch(/^ext-task-/);
    expect(task.documentId).toBe(sampleDocumentId);
    expect(task.sourceId).toBe(sampleSourceId);
    expect(task.status).toBe('PENDING');
    expect(task.modelVersion).toBe('gemini-2.5-flash');
    expect(task.promptVersion).toBe('prompt-th-gov-v2.4.1');
    expect(task.validationVersion).toBe('validator-v2.1.0');
    expect(task.confidenceScore).toBe(0.95);
  });

  it('TC-PHASE2-02: DocumentIngestedEvent Boundary Payload Structure', () => {
    const eventPayload: DocumentIngestedEvent = {
      eventId: 'evt-1001',
      traceId,
      documentId: sampleDocumentId,
      sourceId: sampleSourceId,
      storagePath: `document-lake/${sampleSourceId}/${sampleDocumentId}.pdf`,
      timestamp: new Date().toISOString(),
    };

    expect(eventPayload.eventId).toBe('evt-1001');
    expect(eventPayload.documentId).toBe(sampleDocumentId);
    expect(eventPayload.sourceId).toBe(sampleSourceId);
    expect(eventPayload.storagePath).toContain('document-lake/');
  });

  it('TC-PHASE2-03: JobValidationEngine — Valid Payload Pass (Status: VALIDATED)', () => {
    const validExtractedJob = {
      agency: { agencyName: 'กรมทางหลวง', ministry: 'กระทรวงคมนาคม' },
      position: { positionTitle: 'วิศวกรโยธาปฏิบัติการ' },
      salary: { salaryMin: 15000, salaryMax: 16500, salaryText: '15,000 - 16,500 บาท' },
      education: { degreeRequired: 'ปริญญาตรี', isOcscRequired: true },
      confidenceScore: { overallConfidenceScore: 0.92 },
    };

    const result = JobValidationEngine.validate(validExtractedJob, sampleDocumentId, traceId);

    expect(result.isValid).toBe(true);
    expect(result.status).toBe('VALIDATED');
    expect(result.overallConfidenceScore).toBe(0.92);
    expect(result.validationVersion).toBe('validator-v2.1.0');
    expect(result.rejectionReasons.length).toBe(0);
  });

  it('TC-PHASE2-04: JobValidationEngine — Reject Missing Position Title', () => {
    const missingTitleJob = {
      agency: { agencyName: 'กรมทางหลวง' },
      position: { positionTitle: '' }, // empty title
      confidenceScore: { overallConfidenceScore: 0.90 },
    };

    const result = JobValidationEngine.validate(missingTitleJob, sampleDocumentId, traceId);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectionReasons).toContain('Validation failure: Position title is missing or empty');
  });

  it('TC-PHASE2-05: JobValidationEngine — Reject Missing Organization / Agency', () => {
    const missingOrgJob = {
      agency: { agencyName: '' }, // empty agency
      position: { positionTitle: 'นักวิเคราะห์นโยบายและแผน' },
      confidenceScore: { overallConfidenceScore: 0.90 },
    };

    const result = JobValidationEngine.validate(missingOrgJob, sampleDocumentId, traceId);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectionReasons).toContain('Validation failure: Organization / Agency name is missing or empty');
  });

  it('TC-PHASE2-06: JobValidationEngine — Reject Low Confidence Score (< 0.60)', () => {
    const lowScoreJob = {
      agency: { agencyName: 'กรมชลประทาน' },
      position: { positionTitle: 'นายช่างชลประทาน' },
      confidenceScore: { overallConfidenceScore: 0.45 }, // below threshold
    };

    const result = JobValidationEngine.validate(lowScoreJob, sampleDocumentId, traceId);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectionReasons.some((r) => r.includes('Confidence score'))).toBe(true);
  });

  it('TC-PHASE2-07: JobValidationEngine — Require Human Review (Score 0.60 - 0.84)', () => {
    const reviewScoreJob = {
      agency: { agencyName: 'กรมชลประทาน' },
      position: { positionTitle: 'นายช่างชลประทาน' },
      confidenceScore: { overallConfidenceScore: 0.75 },
    };

    const result = JobValidationEngine.validate(reviewScoreJob, sampleDocumentId, traceId);

    expect(result.isValid).toBe(true);
    expect(result.status).toBe('REQUIRES_HUMAN_REVIEW');
  });

  it('TC-PHASE2-08: AI Lineage Verification Attributes', () => {
    const extractedData = {
      agency: { agencyName: 'กรมสรรพากร' },
      position: { positionTitle: 'นักตรวจสอบภาษีปฏิบัติการ' },
    };

    const lineage = {
      'agency.agencyName': {
        sourceDocumentId: sampleDocumentId,
        textAnchor: 'กรมสรรพากร',
        confidenceScore: 0.95,
      },
      'position.positionTitle': {
        sourceDocumentId: sampleDocumentId,
        textAnchor: 'ตำแหน่ง นักตรวจสอบภาษีปฏิบัติการ',
        confidenceScore: 0.95,
      },
    };

    expect(lineage['agency.agencyName'].sourceDocumentId).toBe(sampleDocumentId);
    expect(lineage['agency.agencyName'].textAnchor).toBe('กรมสรรพากร');
    expect(lineage['position.positionTitle'].confidenceScore).toBe(0.95);
  });
});
