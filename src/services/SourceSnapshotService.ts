/**
 * VERIIGO V2 - Sprint 1 Evidence Trust Layer: Source Snapshot Service
 * Objective: Creates immutable source snapshots in Firestore (/source_snapshots/{snapshotId})
 * with SHA256 payload verification, HTTP metadata, and audit log tracking.
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
import { SourceSnapshotEntity } from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const dbName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
console.log(`[Firestore Init - SourceSnapshotService.ts]`);
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Database ID: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`  Database Name: ${dbName}`);

const SNAPSHOTS_COLLECTION = 'source_snapshots';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export interface CreateSnapshotInput {
  sourceId: string;
  officialUrl: string;
  rawPayload: string | Buffer;
  httpStatus?: number;
  httpHeaders?: Record<string, string>;
  mimeType?: string;
  storagePath?: string;
  extractionVersion?: string;
  traceId?: string;
}

export class SourceSnapshotService {
  public static readonly EXTRACTION_VERSION = 'v2.4.1-evidence-trust';

  /**
   * Compute SHA-256 hash of raw HTTP payload
   */
  public static computeSHA256(payload: string | Buffer): string {
    const buffer = typeof payload === 'string' ? Buffer.from(payload, 'utf-8') : payload;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Create and store immutable source snapshot in Firestore
   */
  public static async createSnapshot(input: CreateSnapshotInput): Promise<SourceSnapshotEntity> {
    const traceId = input.traceId || generateTraceId();
    const fetchTimestamp = new Date().toISOString();
    const payloadBuffer = typeof input.rawPayload === 'string' ? Buffer.from(input.rawPayload, 'utf-8') : input.rawPayload;
    const rawPayloadHashSHA256 = this.computeSHA256(payloadBuffer);
    const contentLength = payloadBuffer.length;

    const hashPrefix = rawPayloadHashSHA256.substring(0, 12);
    const timeCompact = Date.now().toString(36);
    const snapshotId = `snap-${hashPrefix}-${timeCompact}`;

    const snapshotEntity: SourceSnapshotEntity = {
      snapshotId,
      sourceId: input.sourceId,
      officialUrl: input.officialUrl,
      fetchTimestamp,
      httpStatus: input.httpStatus || 200,
      httpHeaders: input.httpHeaders || { 'content-type': input.mimeType || 'text/html' },
      rawPayloadHashSHA256,
      contentLength,
      mimeType: input.mimeType || 'text/html',
      storagePath: input.storagePath || `snapshots/${input.sourceId}/${snapshotId}.html`,
      extractionVersion: input.extractionVersion || this.EXTRACTION_VERSION,
      createdAt: fetchTimestamp,
    };

    try {
      // Write immutable snapshot record
      await setDoc(doc(db, SNAPSHOTS_COLLECTION, snapshotId), snapshotEntity);

      // Record in audit ledger
      const auditId = `audit-snap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, AUDIT_LOGS_COLLECTION, auditId), {
        id: auditId,
        actorId: 'system-snapshot-service',
        actorRole: 'SYSTEM',
        action: 'SOURCE_SNAPSHOT_CREATED',
        entityType: 'SOURCE_SNAPSHOT',
        entityId: snapshotId,
        targetResource: `/source_snapshots/${snapshotId}`,
        timestamp: fetchTimestamp,
        traceId,
        metadata: {
          sourceId: input.sourceId,
          officialUrl: input.officialUrl,
          rawPayloadHashSHA256,
          contentLength,
          httpStatus: snapshotEntity.httpStatus,
        },
      });

      logger.info(
        {
          traceId,
          operation: 'SourceSnapshotService.createSnapshot',
          snapshotId,
          sourceId: input.sourceId,
          sha256: rawPayloadHashSHA256,
        },
        `Created immutable source snapshot ${snapshotId} with hash ${rawPayloadHashSHA256}`
      );

      return snapshotEntity;
    } catch (err) {
      logger.error(
        { traceId, operation: 'SourceSnapshotService.createSnapshot', sourceId: input.sourceId, errorCode: 'SNAPSHOT_WRITE_FAILED' },
        'Failed to store source snapshot entity in Firestore',
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to create source snapshot for source ${input.sourceId}`,
        operation: 'SourceSnapshotService.createSnapshot',
        traceId,
        originalError: err,
      });
    }
  }

  /**
   * Retrieve snapshot by snapshot ID
   */
  public static async getSnapshot(snapshotId: string, traceId?: string): Promise<SourceSnapshotEntity | null> {
    const tid = traceId || generateTraceId();
    try {
      const snapRef = doc(db, SNAPSHOTS_COLLECTION, snapshotId);
      const docSnap = await getDoc(snapRef);
      if (!docSnap.exists()) return null;
      return docSnap.data() as SourceSnapshotEntity;
    } catch (err) {
      logger.error({ traceId: tid, operation: 'SourceSnapshotService.getSnapshot', snapshotId }, 'Failed to fetch snapshot', err);
      throw new DatabaseOperationalError({
        message: `Failed to fetch snapshot ${snapshotId}`,
        operation: 'SourceSnapshotService.getSnapshot',
        traceId: tid,
        originalError: err,
      });
    }
  }

  /**
   * List recent snapshots for verification audit
   */
  public static async listSnapshots(limitCount = 50, traceId?: string): Promise<SourceSnapshotEntity[]> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, SNAPSHOTS_COLLECTION);
      const q = query(colRef, firestoreLimit(limitCount));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data() as SourceSnapshotEntity);
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      logger.error({ traceId: tid, operation: 'SourceSnapshotService.listSnapshots' }, 'Failed to list snapshots', err);
      return [];
    }
  }
}
