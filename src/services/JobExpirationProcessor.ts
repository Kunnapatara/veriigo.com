/**
 * VERIIGO V2 - Sprint 1 Evidence Trust Layer: Job Lifecycle & Expiration Processor
 * Responsibility: Periodically scan normalized job announcements in /jobs & /job_announcements,
 * evaluate application deadlines against current timestamp, update lifecycle status:
 * ACTIVE -> EXPIRING_SOON -> EXPIRED -> ARCHIVED
 * and record audit log events.
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
import { JobAnnouncementEntity, JobStatus } from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const dbName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
console.log(`[Firestore Init - JobExpirationProcessor.ts]`);
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Database ID: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`  Database Name: ${dbName}`);

const JOBS_COLLECTION = 'jobs';
const ANNOUNCEMENTS_COLLECTION = 'job_announcements';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export interface ExpirationCheckResult {
  scannedCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  archivedCount: number;
  updatedJobIds: string[];
  processedAt: string;
}

export class JobExpirationProcessor {
  /**
   * Evaluate lifecycle status based on application deadline and current date
   * - ACTIVE: > 3 days remaining
   * - EXPIRING_SOON: <= 3 days remaining and >= 0 days
   * - EXPIRED: < 0 days remaining and < 30 days past deadline
   * - ARCHIVED: >= 30 days past deadline
   */
  public static evaluateLifecycleStatus(applicationDeadline: string, now: Date = new Date()): JobStatus {
    if (!applicationDeadline) return 'ACTIVE';
    try {
      const deadlineDate = new Date(applicationDeadline);
      deadlineDate.setHours(23, 59, 59, 999);

      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays < -30) {
        return 'ARCHIVED';
      }
      if (diffDays < 0) {
        return 'EXPIRED';
      }
      if (diffDays <= 3) {
        return 'EXPIRING_SOON';
      }
      return 'ACTIVE';
    } catch (e) {
      return 'ACTIVE';
    }
  }

  public static isExpired(applicationDeadline: string, now: Date = new Date()): boolean {
    const status = this.evaluateLifecycleStatus(applicationDeadline, now);
    return status === 'EXPIRED' || status === 'ARCHIVED';
  }

  /**
   * Run Batch Lifecycle Processor
   */
  public static async processExpirations(traceId?: string): Promise<ExpirationCheckResult> {
    const tid = traceId || generateTraceId();
    const now = new Date();
    const nowIso = now.toISOString();

    logger.info({ traceId: tid, operation: 'JobExpirationProcessor.processExpirations' }, 'Starting batch job lifecycle evaluation...');

    try {
      let scannedJobs: Array<{ id: string; collectionName: string; data: any }> = [];

      // Query /jobs
      try {
        const jobsSnap = await getDocs(query(collection(db, JOBS_COLLECTION), firestoreLimit(250)));
        jobsSnap.docs.forEach((d) => scannedJobs.push({ id: d.id, collectionName: JOBS_COLLECTION, data: d.data() }));
      } catch (e) {
        // Fallback
      }

      // Query /job_announcements
      try {
        const annSnap = await getDocs(query(collection(db, ANNOUNCEMENTS_COLLECTION), firestoreLimit(250)));
        annSnap.docs.forEach((d) => scannedJobs.push({ id: d.id, collectionName: ANNOUNCEMENTS_COLLECTION, data: d.data() }));
      } catch (e) {
        // Fallback
      }

      let expiringSoonCount = 0;
      let expiredCount = 0;
      let archivedCount = 0;
      const updatedJobIds: string[] = [];

      for (const item of scannedJobs) {
        const j = item.data;
        const currentStatus = j.status || 'ACTIVE';
        const deadline = j.applicationDeadline || j.deadline || j.closingDate || '';

        const calculatedStatus = this.evaluateLifecycleStatus(deadline, now);

        if (calculatedStatus !== currentStatus && (calculatedStatus === 'EXPIRING_SOON' || calculatedStatus === 'EXPIRED' || calculatedStatus === 'ARCHIVED')) {
          const docRef = doc(db, item.collectionName, item.id);
          await setDoc(docRef, { status: calculatedStatus, updatedAt: nowIso }, { merge: true });

          updatedJobIds.push(item.id);

          if (calculatedStatus === 'EXPIRING_SOON') expiringSoonCount++;
          if (calculatedStatus === 'EXPIRED') expiredCount++;
          if (calculatedStatus === 'ARCHIVED') archivedCount++;

          // Audit Log Record
          try {
            const auditId = `audit-lc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
            await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
              id: auditId,
              actorId: 'system-lifecycle-processor',
              actorRole: 'SYSTEM',
              action: `JOB_LIFECYCLE_${calculatedStatus}`,
              entityType: 'JOB_ANNOUNCEMENT',
              entityId: item.id,
              targetResource: `/${item.collectionName}/${item.id}`,
              timestamp: nowIso,
              traceId: tid,
              metadata: {
                previousStatus: currentStatus,
                newStatus: calculatedStatus,
                applicationDeadline: deadline,
                title: j.title || j.positionTitle,
                organization: j.organization || j.agencyName,
              },
            });
          } catch (auditErr) {
            // Non-fatal
          }
        }
      }

      logger.info(
        {
          traceId: tid,
          operation: 'JobExpirationProcessor.processExpirations',
          scannedCount: scannedJobs.length,
          expiringSoonCount,
          expiredCount,
          archivedCount,
        },
        `Lifecycle evaluation complete. Updated ${updatedJobIds.length} jobs.`
      );

      return {
        scannedCount: scannedJobs.length,
        expiringSoonCount,
        expiredCount,
        archivedCount,
        updatedJobIds,
        processedAt: nowIso,
      };
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobExpirationProcessor.processExpirations', errorCode: 'LIFECYCLE_PROCESSOR_FAILED' }, 'Failed during job lifecycle processor batch', err);
      throw new DatabaseOperationalError({
        message: 'Failed to execute job lifecycle processor batch',
        operation: 'JobExpirationProcessor.processExpirations',
        traceId: tid,
        originalError: err,
      });
    }
  }
}
