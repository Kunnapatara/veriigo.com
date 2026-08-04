/**
 * VERIIGO V2 - Phase 3 Government Job Intelligence Service
 * Responsibility: Ingest validated AI extractions, run normalization, enforce deterministic
 * duplicate prevention on /jobs/{jobId}, preserve field lineage governance, and log audit trails.
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
  where,
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  JobAnnouncementEntity,
  LineageReference,
  JobStatus,
  ExtractionTaskEntity,
} from '../types/firestore';
import { JobNormalizationEngine, RawJobPayload } from './JobNormalizationEngine';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError, OperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const JOBS_COLLECTION = 'jobs';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export interface IngestJobIntelligenceInput {
  extractionTask: ExtractionTaskEntity;
  traceId?: string;
}

export interface IngestJobIntelligenceResult {
  job: JobAnnouncementEntity;
  isDuplicate: boolean;
  action: 'JOB_CREATED' | 'JOB_UPDATED';
}

export class JobIntelligenceService {
  /**
   * Normalize extraction task output into official /jobs/{jobId} document
   */
  public static async normalizeAndIngestJob(input: IngestJobIntelligenceInput): Promise<IngestJobIntelligenceResult> {
    const traceId = input.traceId || input.extractionTask.traceId || generateTraceId();
    const task = input.extractionTask;

    if (!task || task.status !== 'COMPLETED' || !task.extractedData) {
      throw new OperationalError({
        message: 'Cannot normalize incomplete or failed extraction task',
        errorCode: 'INVALID_EXTRACTION_TASK',
        operation: 'JobIntelligenceService.normalizeAndIngestJob',
        traceId,
        entityId: task?.taskId || 'unknown',
      });
    }

    const data = task.extractedData;
    const sourceDocumentId = task.documentId;
    const extractionTaskId = task.taskId;
    const sourceId = task.sourceId;

    // Extract core fields from extraction payload
    const title = data.position?.positionTitle || data.title || 'ประกาศรับสมัครงาน';
    const organization = JobNormalizationEngine.normalizeOrganization(data.agency?.agencyName || data.organization);
    const governmentLevel = JobNormalizationEngine.mapGovernmentLevel(organization, data.agency?.governmentLevel || data.governmentLevel);
    const province = JobNormalizationEngine.normalizeProvince(data.agency?.province || data.province);
    const jobCategory = JobNormalizationEngine.normalizeJobCategory(title, data.jobCategory);
    const employmentType = JobNormalizationEngine.normalizeEmploymentType(data.position?.positionType || data.employmentType);
    const salary = JobNormalizationEngine.normalizeSalary(data.salary);
    const positionsAvailable = typeof data.position?.positionsAvailable === 'number'
      ? data.position.positionsAvailable
      : (parseInt(String(data.positionsAvailable), 10) || 1);
    const publishedDate = data.publishedDate || task.createdAt || new Date().toISOString();
    const applicationDeadline = data.applicationDeadline || new Date(Date.now() + 14 * 86400000).toISOString();
    const officialUrl = data.officialUrl || `https://veriigo.gov.th/docs/${sourceDocumentId}`;
    const status = JobNormalizationEngine.evaluateStatus(applicationDeadline);
    const confidenceScore = task.confidenceScore || 0.90;

    // 1. Generate Deterministic Job Identity (Fingerprint SHA-256)
    const { jobId } = JobNormalizationEngine.generateDeterministicJobId(
      sourceDocumentId,
      organization,
      title,
      applicationDeadline
    );

    // 2. Construct Data Lineage Governance Reference
    const lineageReference: LineageReference = {
      sourceDocumentId,
      extractionTaskId,
      modelVersion: task.modelVersion || 'gemini-2.5-flash',
      promptVersion: task.promptVersion || 'prompt-th-gov-v2.4.1',
      validationVersion: task.validationVersion || 'validator-v2.1.0',
      fieldLineage: task.lineage || {},
    };

    const now = new Date().toISOString();

    // 3. Check for existing duplicate in /jobs/{jobId}
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    let existingJob: JobAnnouncementEntity | null = null;
    let isDuplicate = false;

    try {
      const snap = await getDoc(jobRef);
      if (snap.exists()) {
        existingJob = snap.data() as JobAnnouncementEntity;
        isDuplicate = true;
      }
    } catch (e) {
      // Non-fatal lookup check
    }

    const action: 'JOB_CREATED' | 'JOB_UPDATED' = isDuplicate ? 'JOB_UPDATED' : 'JOB_CREATED';

    const normalizedJob: JobAnnouncementEntity = {
      jobId,
      sourceDocumentId,
      extractionTaskId,
      sourceId,
      title,
      organization,
      governmentLevel,
      province,
      jobCategory,
      employmentType,
      salary,
      positionsAvailable,
      publishedDate,
      applicationDeadline,
      officialUrl,
      status,
      confidenceScore,
      createdAt: existingJob?.createdAt || now,
      updatedAt: now,
      lineageReference,
    };

    // 4. Save to Firestore /jobs/{jobId}
    try {
      await setDoc(jobRef, normalizedJob, { merge: true });
      logger.info(
        {
          traceId,
          operation: 'JOB_INTELLIGENCE_INGESTION',
          entityId: jobId,
          action,
          isDuplicate,
          title,
          organization,
        },
        `${action} record saved for job ${jobId} (${title} - ${organization})`
      );

      // Trigger CQRS Read-Model Sync to /job_search_index/{jobId}
      try {
        const { JobSearchIndexer } = await import('./JobSearchIndexer');
        await JobSearchIndexer.indexJob(normalizedJob, traceId);
      } catch (indexErr) {
        logger.warn({ traceId, operation: 'JobIntelligenceService.normalizeAndIngestJob', entityId: jobId }, 'CQRS index auto-sync failed');
      }
    } catch (dbErr) {
      logger.error({ traceId, operation: 'JobIntelligenceService.normalizeAndIngestJob', entityId: jobId }, 'Failed to save job to database', dbErr);
      throw new DatabaseOperationalError({
        message: `Failed to persist normalized job ${jobId}`,
        operation: 'JobIntelligenceService.normalizeAndIngestJob',
        traceId,
        entityId: jobId,
        originalError: dbErr,
      });
    }

    // 5. Create Audit Log Entry
    try {
      const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
        id: auditId,
        actorId: 'system-job-intelligence',
        actorRole: 'SYSTEM',
        action,
        entityType: 'JOB_ANNOUNCEMENT',
        entityId: jobId,
        targetResource: `/jobs/${jobId}`,
        timestamp: now,
        traceId,
        metadata: {
          sourceDocumentId,
          extractionTaskId,
          confidenceScore,
          isDuplicate,
        },
      });
    } catch (auditErr) {
      // Non-fatal audit log failure
    }

    return {
      job: normalizedJob,
      isDuplicate,
      action,
    };
  }

  /**
   * Query all normalized jobs from /jobs collection
   */
  public static async getJobs(traceId?: string): Promise<JobAnnouncementEntity[]> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, JOBS_COLLECTION);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      const jobs = snap.docs.map((d) => d.data() as JobAnnouncementEntity);
      return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobIntelligenceService.getJobs', errorCode: 'DB_READ_FAILED' }, 'Failed to query jobs', err);
      throw new DatabaseOperationalError({
        message: 'Failed to retrieve job announcements from database',
        operation: 'JobIntelligenceService.getJobs',
        traceId: tid,
        originalError: err,
      });
    }
  }

  /**
   * Get single job by deterministic jobId
   */
  public static async getJobById(jobId: string, traceId?: string): Promise<JobAnnouncementEntity | null> {
    const tid = traceId || generateTraceId();
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return snap.data() as JobAnnouncementEntity;
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobIntelligenceService.getJobById', entityId: jobId }, 'Failed to read job by ID', err);
      throw new DatabaseOperationalError({
        message: `Failed to retrieve job ${jobId}`,
        operation: 'JobIntelligenceService.getJobById',
        traceId: tid,
        entityId: jobId,
        originalError: err,
      });
    }
  }
}
