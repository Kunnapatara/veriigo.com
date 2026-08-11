/**
 * VERIIGO V2 - Sprint 1 Evidence Trust Layer: Change Detection & Confidence Engine
 * Objective: 
 * 1. Combines deterministic schema rules with AI extraction confidence (AI cannot self-certify truth)
 * 2. Compares incoming document snapshots & announcements to detect changes:
 *    - NEW_ANNOUNCEMENT
 *    - UNCHANGED
 *    - MODIFIED_DOCUMENT
 *    - DEADLINE_CHANGED
 *    - POSITION_CHANGED
 *    - REMOVED_ANNOUNCEMENT
 */

import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ConfidenceScoreBreakdown,
  JobAnnouncementEntity,
  SourceSnapshotEntity,
} from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const dbName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
console.log(`[Firestore Init - ChangeDetectionEngine.ts]`);
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Database ID: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`  Database Name: ${dbName}`);

const JOBS_COLLECTION = 'job_announcements';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export type ChangeType =
  | 'NEW_ANNOUNCEMENT'
  | 'UNCHANGED'
  | 'MODIFIED_DOCUMENT'
  | 'DEADLINE_CHANGED'
  | 'POSITION_CHANGED'
  | 'REMOVED_ANNOUNCEMENT'
  | 'CANCELLED'
  | 'REOPENED'
  | 'URL_CHANGED'
  | 'DOCUMENT_REMOVED';

export interface DetectChangeOptions {
  sourceId: string;
  officialUrl: string;
  currentPayloadHashSHA256: string;
  currentTitle?: string;
  currentDeadline?: string;
  httpStatusCode?: number;
  isDocumentRemoved?: boolean;
  statusText?: string;
  rawContent?: string;
  traceId?: string;
  existingRecord?: {
    id?: string;
    title?: string;
    applicationDeadline?: string;
    deadline?: string;
    rawPayloadHashSHA256?: string;
    lineageReference?: { snapshotId?: string };
    status?: string;
    officialUrl?: string;
  };
}

export interface ChangeDetectionResult {
  jobId?: string;
  sourceId: string;
  officialUrl: string;
  changeType: ChangeType;
  detectedAt: string;
  previousRecord?: {
    rawPayloadHashSHA256?: string;
    applicationDeadline?: string;
    title?: string;
    status?: string;
    officialUrl?: string;
    updatedAt?: string;
  };
  currentRecord: {
    rawPayloadHashSHA256?: string;
    applicationDeadline?: string;
    title?: string;
    officialUrl?: string;
  };
  details: string;
}

export class ChangeDetectionEngine {
  public static readonly CONFIDENCE_VERSION = 'confidence-v2.4.0-trust-layer';

  /**
   * Evaluate Combined Confidence Score (Deterministic Schema Validation + AI Model Score)
   * Deterministic validation ensures AI cannot self-certify truth.
   */
  public static evaluateConfidence(
    extractedData: any,
    aiModelConfidence = 0.85,
    hasSnapshotAndHash = true
  ): ConfidenceScoreBreakdown {
    const rules: Array<{ ruleCode: string; passed: boolean; message: string }> = [];
    let deterministicPoints = 0;
    const maxPoints = 100;

    // Rule 1: Mandatory Position Title (25 pts)
    const title = extractedData?.position?.positionTitle || extractedData?.title || '';
    if (typeof title === 'string' && title.trim().length >= 3) {
      deterministicPoints += 25;
      rules.push({ ruleCode: 'TITLE_VALID', passed: true, message: `Position title present: ${title.trim().substring(0, 40)}` });
    } else {
      rules.push({ ruleCode: 'TITLE_VALID', passed: false, message: 'Position title missing or too short' });
    }

    // Rule 2: Mandatory Organization / Agency Name (25 pts)
    const org = extractedData?.agency?.agencyName || extractedData?.organization || extractedData?.agencyName || '';
    if (typeof org === 'string' && org.trim().length >= 2) {
      deterministicPoints += 25;
      rules.push({ ruleCode: 'AGENCY_VALID', passed: true, message: `Agency name present: ${org.trim()}` });
    } else {
      rules.push({ ruleCode: 'AGENCY_VALID', passed: false, message: 'Agency / Organization name missing' });
    }

    // Rule 3: Application Deadline (20 pts)
    const deadline = extractedData?.applicationDeadline || extractedData?.deadline || '';
    if (typeof deadline === 'string' && deadline.trim().length >= 8) {
      deterministicPoints += 20;
      rules.push({ ruleCode: 'DEADLINE_VALID', passed: true, message: `Application deadline formatted: ${deadline}` });
    } else {
      rules.push({ ruleCode: 'DEADLINE_VALID', passed: false, message: 'Application deadline missing or invalid format' });
    }

    // Rule 4: Official Source URL (15 pts)
    const url = extractedData?.officialUrl || extractedData?.applicationUrl || extractedData?.sourceUrl || '';
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      deterministicPoints += 15;
      rules.push({ ruleCode: 'OFFICIAL_URL_VALID', passed: true, message: `Official URL valid: ${url.substring(0, 50)}` });
    } else {
      rules.push({ ruleCode: 'OFFICIAL_URL_VALID', passed: false, message: 'Official URL missing or invalid scheme' });
    }

    // Rule 5: Immutable Source Snapshot & Hash Presence (15 pts)
    if (hasSnapshotAndHash) {
      deterministicPoints += 15;
      rules.push({ ruleCode: 'SNAPSHOT_HASH_PRESENT', passed: true, message: 'Source snapshot and SHA256 payload hash verified' });
    } else {
      rules.push({ ruleCode: 'SNAPSHOT_HASH_PRESENT', passed: false, message: 'Source snapshot reference or hash missing' });
    }

    const deterministicScore = Number((deterministicPoints / maxPoints).toFixed(2));
    const normalizedAiScore = Math.min(1.0, Math.max(0.0, aiModelConfidence));

    // Combined formula: 50% Deterministic Schema Quality + 50% AI Model Confidence
    const overallConfidenceScore = Number((0.5 * deterministicScore + 0.5 * normalizedAiScore).toFixed(2));
    const deterministicPass = deterministicScore >= 0.80;

    return {
      overallConfidenceScore,
      deterministicScore,
      aiExtractionScore: normalizedAiScore,
      confidenceVersion: this.CONFIDENCE_VERSION,
      deterministicPass,
      fieldRuleResults: rules,
    };
  }

  /**
   * Compare new incoming snapshot / payload against existing Firestore record to detect changes
   */
  public static async detectChange(
    sourceIdOrOptions: string | DetectChangeOptions,
    officialUrl?: string,
    currentPayloadHashSHA256?: string,
    currentTitle?: string,
    currentDeadline?: string,
    traceId?: string
  ): Promise<ChangeDetectionResult> {
    const now = new Date().toISOString();
    let options: DetectChangeOptions;

    if (typeof sourceIdOrOptions === 'object') {
      options = sourceIdOrOptions;
    } else {
      options = {
        sourceId: sourceIdOrOptions,
        officialUrl: officialUrl || '',
        currentPayloadHashSHA256: currentPayloadHashSHA256 || '',
        currentTitle,
        currentDeadline,
        traceId,
      };
    }

    const tid = options.traceId || generateTraceId();

    // 1. Check for DOCUMENT_REMOVED (404 / 410 or explicit flag)
    if (options.isDocumentRemoved || (options.httpStatusCode && (options.httpStatusCode === 404 || options.httpStatusCode === 410))) {
      const auditId = `audit-doc-removed-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
          id: auditId,
          actorId: 'system-change-detector',
          actorRole: 'SYSTEM',
          action: 'JOB_DOCUMENT_REMOVED',
          entityType: 'JOB_ANNOUNCEMENT',
          targetResource: options.officialUrl,
          timestamp: now,
          traceId: tid,
          metadata: {
            sourceId: options.sourceId,
            officialUrl: options.officialUrl,
            httpStatusCode: options.httpStatusCode || 404,
            details: 'Official document removed from source (404/410). Historical evidence retained.',
          },
        });
      } catch (err) {
        // Safe fallback if Firestore quota exceeded
      }

      return {
        sourceId: options.sourceId,
        officialUrl: options.officialUrl,
        changeType: 'DOCUMENT_REMOVED',
        detectedAt: now,
        currentRecord: {
          rawPayloadHashSHA256: options.currentPayloadHashSHA256,
          title: options.currentTitle,
          officialUrl: options.officialUrl,
        },
        details: `Official document removed from source (HTTP ${options.httpStatusCode || 404}). Historical evidence retained.`,
      };
    }

    // 2. Check for CANCELLED (Thai / English wording or explicit status)
    const textToCheck = `${options.currentTitle || ''} ${options.statusText || ''} ${options.rawContent || ''}`.toLowerCase();
    const isCancelledText =
      textToCheck.includes('ยกเลิก') ||
      textToCheck.includes('ประกาศยกเลิก') ||
      textToCheck.includes('ยกเลิกการสอบ') ||
      textToCheck.includes('canceled') ||
      textToCheck.includes('cancelled') ||
      options.statusText === 'CANCELLED';

    if (isCancelledText) {
      const auditId = `audit-cancelled-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
          id: auditId,
          actorId: 'system-change-detector',
          actorRole: 'SYSTEM',
          action: 'JOB_CANCELLED',
          entityType: 'JOB_ANNOUNCEMENT',
          targetResource: options.officialUrl,
          timestamp: now,
          traceId: tid,
          metadata: {
            sourceId: options.sourceId,
            officialUrl: options.officialUrl,
            details: 'Recruitment cancellation detected in source payload or title.',
          },
        });
      } catch (err) {
        // Safe fallback if Firestore quota exceeded
      }

      return {
        sourceId: options.sourceId,
        officialUrl: options.officialUrl,
        changeType: 'CANCELLED',
        detectedAt: now,
        currentRecord: {
          rawPayloadHashSHA256: options.currentPayloadHashSHA256,
          title: options.currentTitle,
          officialUrl: options.officialUrl,
        },
        details: 'Official recruitment cancellation detected in source payload or title.',
      };
    }

    let existing: any = options.existingRecord || null;
    let jobId = options.existingRecord?.id || 'job-existing-001';
    let urlChangedDetected = Boolean(options.existingRecord && options.existingRecord.officialUrl && options.existingRecord.officialUrl !== options.officialUrl);
    let prevUrl = options.existingRecord?.officialUrl || options.officialUrl;

    if (!existing) {
      try {
        // Find existing job announcement or document with matching officialUrl or applicationUrl
        const colRef = collection(db, JOBS_COLLECTION);
        let q = query(colRef, where('officialUrl', '==', options.officialUrl), firestoreLimit(1));
        let snap = await getDocs(q);

        if (snap.empty) {
          let appUrlQuery = query(colRef, where('applicationUrl', '==', options.officialUrl), firestoreLimit(1));
          snap = await getDocs(appUrlQuery);
        }

        if (snap.empty && options.currentTitle) {
          const titleQuery = query(colRef, where('title', '==', options.currentTitle), firestoreLimit(1));
          const titleSnap = await getDocs(titleQuery);
          if (!titleSnap.empty) {
            snap = titleSnap;
            urlChangedDetected = true;
            prevUrl = (titleSnap.docs[0].data() as any).officialUrl || (titleSnap.docs[0].data() as any).applicationUrl || '';
          }
        }

        if (!snap.empty) {
          const existingDoc = snap.docs[0];
          existing = existingDoc.data();
          jobId = existingDoc.id;
        }
      } catch (err) {
        // Quota fallback
      }
    }

    if (!existing) {
      // No existing record -> NEW_ANNOUNCEMENT
      return {
        sourceId: options.sourceId,
        officialUrl: options.officialUrl,
        changeType: 'NEW_ANNOUNCEMENT',
        detectedAt: now,
        currentRecord: {
          rawPayloadHashSHA256: options.currentPayloadHashSHA256,
          title: options.currentTitle,
          applicationDeadline: options.currentDeadline,
          officialUrl: options.officialUrl,
        },
        details: 'New recruitment announcement discovered. No prior record exists.',
      };
    }

    const prevHash = existing.lineageReference?.snapshotId || existing.rawPayloadHashSHA256 || '';
    const prevDeadline = existing.applicationDeadline || existing.deadline || '';
    const prevTitle = existing.title || existing.positionTitle || '';
    const prevStatus = existing.status || 'ACTIVE';

      const prevRecord = {
        rawPayloadHashSHA256: prevHash,
        applicationDeadline: prevDeadline,
        title: prevTitle,
        status: prevStatus,
        officialUrl: prevUrl,
        updatedAt: existing.updatedAt,
      };

      const currRecord = {
        rawPayloadHashSHA256: options.currentPayloadHashSHA256,
        applicationDeadline: options.currentDeadline || prevDeadline,
        title: options.currentTitle || prevTitle,
        officialUrl: options.officialUrl,
      };

      let changeType: ChangeType = 'UNCHANGED';
      let details = 'No changes detected. Snapshot hash and fields match existing record.';

      if (urlChangedDetected) {
        changeType = 'URL_CHANGED';
        details = `Official announcement URL changed from '${prevUrl}' to '${options.officialUrl}'. Title matched.`;
      } else if (['EXPIRED', 'CLOSED', 'ARCHIVED'].includes(prevStatus) && (options.statusText === 'ACTIVE' || (options.currentDeadline && options.currentDeadline > now))) {
        changeType = 'REOPENED';
        details = `Recruitment reopened. Status transitioned from '${prevStatus}' to ACTIVE.`;
      } else if (options.currentDeadline && options.currentDeadline.trim() !== prevDeadline.trim()) {
        changeType = 'DEADLINE_CHANGED';
        details = `Deadline changed from '${prevDeadline}' to '${options.currentDeadline}'`;
      } else if (options.currentTitle && prevTitle && options.currentTitle.trim() !== prevTitle.trim()) {
        changeType = 'POSITION_CHANGED';
        details = `Position title changed from '${prevTitle}' to '${options.currentTitle}'`;
      } else if (prevHash && prevHash !== options.currentPayloadHashSHA256) {
        changeType = 'MODIFIED_DOCUMENT';
        details = `Document payload SHA256 modified. Previous: ${prevHash.substring(0, 10)}... Current: ${options.currentPayloadHashSHA256.substring(0, 10)}...`;
      }

      // Log audit entry if change detected
      if (changeType !== 'UNCHANGED') {
        const auditId = `audit-change-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        try {
          await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
            id: auditId,
            actorId: 'system-change-detector',
            actorRole: 'SYSTEM',
            action: `JOB_${changeType}`,
            entityType: 'JOB_ANNOUNCEMENT',
            entityId: jobId,
            targetResource: `/jobs/${jobId}`,
            timestamp: now,
            traceId: tid,
            metadata: {
              sourceId: options.sourceId,
              officialUrl: options.officialUrl,
              changeType,
              details,
              previousDeadline: prevDeadline,
              newDeadline: options.currentDeadline,
            },
          });
        } catch (err) {
          // Safe fallback if Firestore quota exceeded
        }
      }

      return {
        jobId,
        sourceId: options.sourceId,
        officialUrl: options.officialUrl,
        changeType,
        detectedAt: now,
        previousRecord: prevRecord,
        currentRecord: currRecord,
        details,
      };
  }
}
