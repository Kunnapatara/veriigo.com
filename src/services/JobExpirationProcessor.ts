/**
 * VERIIGO V2 - Phase 3 Job Expiration Processor
 * Responsibility: Periodically scan normalized job announcements in /jobs,
 * evaluate application deadlines against current timestamp, update status to EXPIRED
 * for passed deadlines, and record audit log events.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import { JobAnnouncementEntity, JobStatus } from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const JOBS_COLLECTION = 'jobs';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export interface ExpirationCheckResult {
  scannedCount: number;
  expiredCount: number;
  expiredJobIds: string[];
  processedAt: string;
}

export class JobExpirationProcessor {
  /**
   * Evaluate single job entity for expiration
   */
  public static isExpired(applicationDeadline: string, now: Date = new Date()): boolean {
    if (!applicationDeadline) return false;
    try {
      const deadlineDate = new Date(applicationDeadline);
      // Deadline is valid until end of the deadline day (23:59:59.999)
      deadlineDate.setHours(23, 59, 59, 999);
      return now > deadlineDate;
    } catch (e) {
      return false;
    }
  }

  /**
   * Run Batch Expiration Processor
   */
  public static async processExpirations(traceId?: string): Promise<ExpirationCheckResult> {
    const tid = traceId || generateTraceId();
    const now = new Date();
    const nowIso = now.toISOString();

    logger.info({ traceId: tid, operation: 'JobExpirationProcessor.processExpirations' }, 'Starting batch job expiration evaluation...');

    try {
      const colRef = collection(db, JOBS_COLLECTION);
      const q = query(colRef, firestoreLimit(250));
      const snap = await getDocs(q);

      const jobs = snap.docs.map((d) => d.data() as JobAnnouncementEntity);
      const activeJobs = jobs.filter((j) => j.status === 'ACTIVE');

      const expiredJobIds: string[] = [];

      for (const job of activeJobs) {
        if (this.isExpired(job.applicationDeadline, now)) {
          const jobRef = doc(db, JOBS_COLLECTION, job.jobId);
          await setDoc(
            jobRef,
            {
              status: 'EXPIRED' as JobStatus,
              updatedAt: nowIso,
            },
            { merge: true }
          );

          expiredJobIds.push(job.jobId);

          // Audit Log Record
          try {
            const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
            await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
              id: auditId,
              actorId: 'system-expiration-processor',
              actorRole: 'SYSTEM',
              action: 'JOB_EXPIRED',
              entityType: 'JOB_ANNOUNCEMENT',
              entityId: job.jobId,
              targetResource: `/jobs/${job.jobId}`,
              timestamp: nowIso,
              traceId: tid,
              metadata: {
                title: job.title,
                organization: job.organization,
                applicationDeadline: job.applicationDeadline,
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
          scannedCount: jobs.length,
          expiredCount: expiredJobIds.length,
        },
        `Expiration check complete. Updated ${expiredJobIds.length} jobs to EXPIRED.`
      );

      return {
        scannedCount: jobs.length,
        expiredCount: expiredJobIds.length,
        expiredJobIds,
        processedAt: nowIso,
      };
    } catch (err) {
      logger.error({ traceId: tid, operation: 'JobExpirationProcessor.processExpirations', errorCode: 'BATCH_EXPIRATION_FAILED' }, 'Failed during batch job expiration process', err);
      throw new DatabaseOperationalError({
        message: 'Failed to execute job expiration processor batch',
        operation: 'JobExpirationProcessor.processExpirations',
        traceId: tid,
        originalError: err,
      });
    }
  }
}
