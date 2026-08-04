/**
 * VERIIGO V2 - Phase 2 Decoupled Asynchronous AI Extraction Worker
 * Objective: Reads ingested raw documents from Document Lake, calls Gemini AI with
 * versioned prompt & model, constructs mandatory lineage attributes, runs strict
 * validation, and stores Extraction Task entities in Firestore (/extraction_tasks/{taskId}).
 * 
 * Worker Constraints:
 * - MUST NOT crawl websites
 * - MUST NOT write raw documents
 * - MUST NOT modify source registry
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
  DocumentEntity,
  ExtractionTaskEntity,
  ExtractionTaskStatus,
  FieldLineage,
  DocumentIngestedEvent,
} from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError, OperationalError } from '../lib/errors';
import { JobValidationEngine, ValidationResult } from './JobValidationEngine';
import { GeminiExtractionPipeline } from '../server/extractor/gemini-pipeline';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const EXTRACTION_TASKS_COLLECTION = 'extraction_tasks';
const DOCUMENTS_COLLECTION = 'documents';

export interface ProcessExtractionTaskInput {
  documentId: string;
  sourceId: string;
  storagePath?: string;
  rawTextOverride?: string;
  traceId?: string;
}

export class AIExtractionWorker {
  public static readonly MODEL_VERSION = 'gemini-2.5-flash';
  public static readonly PROMPT_VERSION = 'prompt-th-gov-v2.4.1';
  public static readonly VALIDATION_VERSION = JobValidationEngine.VALIDATION_VERSION;

  /**
   * Event Boundary Handler: Responds to DocumentIngestedEvent from Phase 1
   */
  public static async handleDocumentIngested(event: DocumentIngestedEvent): Promise<ExtractionTaskEntity> {
    logger.info(
      {
        traceId: event.traceId,
        operation: 'AIExtractionWorker.handleDocumentIngested',
        eventId: event.eventId,
        documentId: event.documentId,
        sourceId: event.sourceId,
      },
      `Received DocumentIngestedEvent for document ${event.documentId}. Initializing decoupled extraction task.`
    );

    return this.processDocumentExtraction({
      documentId: event.documentId,
      sourceId: event.sourceId,
      storagePath: event.storagePath,
      traceId: event.traceId,
    });
  }

  /**
   * Core Extraction Worker Pipeline
   */
  public static async processDocumentExtraction(input: ProcessExtractionTaskInput): Promise<ExtractionTaskEntity> {
    const traceId = input.traceId || generateTraceId();
    const taskId = `ext-task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Initialize PENDING Task Record
    let taskEntity: ExtractionTaskEntity = {
      taskId,
      documentId: input.documentId,
      sourceId: input.sourceId,
      status: 'PENDING',
      modelVersion: this.MODEL_VERSION,
      promptVersion: this.PROMPT_VERSION,
      validationVersion: this.VALIDATION_VERSION,
      confidenceScore: 0.0,
      createdAt: now,
      traceId,
      retryCount: 0,
    };

    try {
      await setDoc(doc(db, EXTRACTION_TASKS_COLLECTION, taskId), taskEntity);
      logger.info(
        { traceId, operation: 'AIExtractionWorker.processDocumentExtraction', entityId: taskId },
        `Created extraction task ${taskId} with status PENDING`
      );
    } catch (dbErr) {
      logger.error(
        { traceId, operation: 'AIExtractionWorker.processDocumentExtraction', entityId: taskId, errorCode: 'TASK_INIT_FAILED' },
        'Failed to write initial extraction task entity',
        dbErr
      );
      throw new DatabaseOperationalError({
        message: `Failed to initialize extraction task ${taskId}`,
        operation: 'AIExtractionWorker.processDocumentExtraction',
        traceId,
        entityId: taskId,
        originalError: dbErr,
      });
    }

    // 2. Transition Status to PROCESSING
    taskEntity.status = 'PROCESSING';
    await setDoc(doc(db, EXTRACTION_TASKS_COLLECTION, taskId), { status: 'PROCESSING' }, { merge: true });

    try {
      // 3. Retrieve Raw Document Entity from Document Lake (documents/{documentId})
      let rawText = input.rawTextOverride || '';
      let officialUrl = '';

      if (!rawText) {
        const docRef = doc(db, DOCUMENTS_COLLECTION, input.documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data() as DocumentEntity;
          officialUrl = docData.officialUrl || '';
        }
      }

      // 4. Execute AI Model Call via Gemini Pipeline with Prompt Governance
      logger.info(
        {
          traceId,
          operation: 'AI_GEMINI_CALL',
          entityId: taskId,
          documentId: input.documentId,
          modelVersion: this.MODEL_VERSION,
          promptVersion: this.PROMPT_VERSION,
        },
        `Calling Gemini AI Model (${this.MODEL_VERSION}) with prompt version ${this.PROMPT_VERSION}`
      );

      const geminiResult = await GeminiExtractionPipeline.extractJobFromDocument({
        documentId: input.documentId,
        documentText: rawText || undefined,
        maxRetries: 3,
      });

      if (geminiResult.status === 'FAILED' || !geminiResult.extractedData) {
        throw new OperationalError({
          message: geminiResult.errorMessage || 'Gemini extraction pipeline failed to produce valid output',
          errorCode: 'AI_EXTRACTION_MODEL_FAILURE',
          operation: 'AIExtractionWorker.processDocumentExtraction',
          traceId,
          entityId: taskId,
          sourceId: input.sourceId,
        });
      }

      const extractedData = geminiResult.extractedData;

      // 5. Construct Field-Level Lineage Mapping
      const lineage: Record<string, FieldLineage> = {
        'agency.agencyName': {
          sourceDocumentId: input.documentId,
          textAnchor: extractedData.agency?.agencyName || 'ประกาศรับสมัครงาน',
          confidenceScore: extractedData.confidenceScore?.overallConfidenceScore || 0.90,
        },
        'position.positionTitle': {
          sourceDocumentId: input.documentId,
          textAnchor: extractedData.position?.positionTitle || 'ตำแหน่งงาน',
          confidenceScore: extractedData.confidenceScore?.overallConfidenceScore || 0.90,
        },
        'education.degreeRequired': {
          sourceDocumentId: input.documentId,
          textAnchor: extractedData.education?.degreeRequired || 'คุณสมบัติวุฒิ',
          confidenceScore: extractedData.confidenceScore?.overallConfidenceScore || 0.88,
        },
        'salary.salaryText': {
          sourceDocumentId: input.documentId,
          textAnchor: extractedData.salary?.salaryText || 'อัตราเงินเดือน',
          confidenceScore: extractedData.confidenceScore?.overallConfidenceScore || 0.88,
        },
      };

      // 6. Run Strict Schema & Data Validation Engine
      const validation: ValidationResult = JobValidationEngine.validate(extractedData, input.documentId, traceId);

      if (!validation.isValid || validation.status === 'REJECTED') {
        const failureReason = validation.rejectionReasons.join('; ') || 'Validation rules rejected payload';
        throw new OperationalError({
          message: `Job Validation Engine rejected output: ${failureReason}`,
          errorCode: 'EXTRACTION_VALIDATION_REJECTED',
          operation: 'AIExtractionWorker.processDocumentExtraction',
          traceId,
          entityId: taskId,
          sourceId: input.sourceId,
        });
      }

      // 7. Mark Task COMPLETED & Save Governance Data
      const processedAt = new Date().toISOString();
      taskEntity = {
        ...taskEntity,
        status: 'COMPLETED',
        processedAt,
        confidenceScore: validation.overallConfidenceScore,
        extractedData,
        lineage,
      };

      await setDoc(doc(db, EXTRACTION_TASKS_COLLECTION, taskId), taskEntity, { merge: true });

      // Update Document Lake status to EXTRACTED
      try {
        await setDoc(doc(db, DOCUMENTS_COLLECTION, input.documentId), { extractionStatus: 'EXTRACTED' }, { merge: true });
      } catch (e) {
        // Non-fatal status update failure
      }

      logger.info(
        {
          traceId,
          operation: 'EXTRACTION_TASK_COMPLETED',
          entityId: taskId,
          documentId: input.documentId,
          confidenceScore: validation.overallConfidenceScore,
          result: 'SUCCESS',
        },
        `Successfully completed extraction task ${taskId} for document ${input.documentId}`
      );

      return taskEntity;
    } catch (err: any) {
      // 8. Error Handling: Mark Task FAILED, create audit log, KEEP raw document intact
      const processedAt = new Date().toISOString();
      const errorMessage = err?.message || String(err);

      taskEntity = {
        ...taskEntity,
        status: 'FAILED',
        processedAt,
        errorMessage,
      };

      try {
        await setDoc(doc(db, EXTRACTION_TASKS_COLLECTION, taskId), taskEntity, { merge: true });
        await setDoc(doc(db, DOCUMENTS_COLLECTION, input.documentId), { extractionStatus: 'FAILED' }, { merge: true });
      } catch (dbWriteErr) {
        // Non-fatal fallback
      }

      logger.error(
        {
          traceId,
          operation: 'EXTRACTION_TASK_FAILED',
          entityId: taskId,
          documentId: input.documentId,
          sourceId: input.sourceId,
          errorCode: err?.errorCode || 'EXTRACTION_FAILED',
        },
        `Extraction task ${taskId} failed. Document Lake file ${input.documentId} preserved intact.`,
        err
      );

      return taskEntity;
    }
  }

  /**
   * Retry Task Mechanism for Failed Extractions
   */
  public static async retryTask(taskId: string, traceId?: string): Promise<ExtractionTaskEntity> {
    const tid = traceId || generateTraceId();
    logger.info({ traceId: tid, operation: 'AIExtractionWorker.retryTask', entityId: taskId }, `Initiating retry for extraction task ${taskId}`);

    try {
      const taskRef = doc(db, EXTRACTION_TASKS_COLLECTION, taskId);
      const snap = await getDoc(taskRef);

      if (!snap.exists()) {
        throw new OperationalError({
          message: `Extraction task ${taskId} not found for retry`,
          errorCode: 'TASK_NOT_FOUND',
          operation: 'AIExtractionWorker.retryTask',
          traceId: tid,
          entityId: taskId,
        });
      }

      const existingTask = snap.data() as ExtractionTaskEntity;
      const retryCount = (existingTask.retryCount || 0) + 1;

      await setDoc(taskRef, { status: 'PROCESSING', retryCount, errorMessage: null }, { merge: true });

      return this.processDocumentExtraction({
        documentId: existingTask.documentId,
        sourceId: existingTask.sourceId,
        traceId: tid,
      });
    } catch (err: any) {
      logger.error({ traceId: tid, operation: 'AIExtractionWorker.retryTask', entityId: taskId }, `Retry failed for task ${taskId}`, err);
      throw err;
    }
  }

  /**
   * List recent extraction tasks
   */
  public static async getExtractionTasks(traceId?: string): Promise<ExtractionTaskEntity[]> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, EXTRACTION_TASKS_COLLECTION);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      const tasks = snap.docs.map((d) => d.data() as ExtractionTaskEntity);
      return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      logger.error({ traceId: tid, operation: 'AIExtractionWorker.getExtractionTasks', errorCode: 'DB_READ_FAILED' }, 'Failed to list extraction tasks', err);
      throw new DatabaseOperationalError({
        message: 'Failed to query extraction tasks from database',
        operation: 'AIExtractionWorker.getExtractionTasks',
        traceId: tid,
        originalError: err,
      });
    }
  }
}
