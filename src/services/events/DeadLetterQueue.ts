/**
 * VERIIGO V2 Phase 7: Dead Letter Queue (DLQ) Management Engine
 * Provides isolation for failed pipeline payloads with Replay, Retry, and Discard support.
 */

import { doc, getDoc, setDoc, collection, getDocs, query, where, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DLQItem } from './EventTypes';
import { logger } from '../../utils/logger';

export class DeadLetterQueueService {
  private static inMemoryDlq = new Map<string, DLQItem>();

  /**
   * Enqueue a failed event or payload into the specified DLQ
   */
  public static async pushToDLQ(
    queueName: DLQItem['queueName'],
    params: {
      reason: string;
      retryCount: number;
      stackTrace: string;
      payload: Record<string, any>;
      eventId?: string;
      traceId: string;
    }
  ): Promise<DLQItem> {
    const id = `dlq-${queueName}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dlqItem: DLQItem = {
      id,
      queueName,
      reason: params.reason,
      retryCount: params.retryCount,
      stackTrace: params.stackTrace,
      payload: params.payload,
      lastAttempt: new Date().toISOString(),
      eventId: params.eventId,
      traceId: params.traceId,
      status: 'PENDING',
    };

    this.inMemoryDlq.set(id, dlqItem);

    try {
      await setDoc(doc(db, queueName, id), dlqItem);
      logger.error({ traceId: params.traceId, dlqId: id, queueName, reason: params.reason }, `[DLQ] Item enqueued to ${queueName}`);
    } catch (e) {
      logger.warn({ traceId: params.traceId, dlqId: id, queueName }, `[DLQ] Saved to in-memory fallback`);
    }

    return dlqItem;
  }

  /**
   * List DLQ items across all or specific queues
   */
  public static async listDLQItems(queueName?: DLQItem['queueName']): Promise<DLQItem[]> {
    const results: DLQItem[] = [];

    if (queueName) {
      try {
        const q = query(collection(db, queueName), firestoreLimit(100));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => results.push(d.data() as DLQItem));
      } catch (e) {
        // Fallback to in-memory
      }
    } else {
      const queues: DLQItem['queueName'][] = ['crawl_dlq', 'extraction_dlq', 'normalization_dlq', 'index_dlq'];
      for (const qName of queues) {
        try {
          const q = query(collection(db, qName), firestoreLimit(50));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => results.push(d.data() as DLQItem));
        } catch (e) {
          // Fallback to in-memory
        }
      }
    }

    // Merge in-memory items
    for (const item of this.inMemoryDlq.values()) {
      if (!queueName || item.queueName === queueName) {
        if (!results.some((r) => r.id === item.id)) {
          results.push(item);
        }
      }
    }

    return results;
  }

  /**
   * Replay a DLQ item by re-publishing or re-executing it
   */
  public static async replayDLQItem(id: string, queueName: DLQItem['queueName'], replayHandler: (payload: any) => Promise<void>): Promise<DLQItem> {
    let dlqItem = this.inMemoryDlq.get(id);

    if (!dlqItem) {
      try {
        const docRef = doc(db, queueName, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          dlqItem = snap.data() as DLQItem;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!dlqItem) {
      throw new Error(`DLQ Item ${id} not found in ${queueName}`);
    }

    dlqItem.retryCount += 1;
    dlqItem.lastAttempt = new Date().toISOString();

    try {
      await replayHandler(dlqItem.payload);
      dlqItem.status = 'REPLAYED';
      logger.info({ id, queueName, traceId: dlqItem.traceId }, `[DLQ] Item replayed successfully`);
    } catch (err: any) {
      dlqItem.reason = `Replay failed: ${err.message}`;
      dlqItem.stackTrace = err.stack || String(err);
      logger.error({ id, queueName, traceId: dlqItem.traceId }, `[DLQ] Item replay attempt failed`);
      throw err;
    } finally {
      this.inMemoryDlq.set(id, dlqItem);
      try {
        await setDoc(doc(db, queueName, id), dlqItem, { merge: true });
      } catch (e) {
        // Fallback
      }
    }

    return dlqItem;
  }

  /**
   * Discard a DLQ item
   */
  public static async discardDLQItem(id: string, queueName: DLQItem['queueName']): Promise<DLQItem> {
    let dlqItem = this.inMemoryDlq.get(id);

    if (!dlqItem) {
      try {
        const docRef = doc(db, queueName, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          dlqItem = snap.data() as DLQItem;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!dlqItem) {
      throw new Error(`DLQ Item ${id} not found in ${queueName}`);
    }

    dlqItem.status = 'DISCARDED';
    this.inMemoryDlq.set(id, dlqItem);

    try {
      await setDoc(doc(db, queueName, id), dlqItem, { merge: true });
    } catch (e) {
      // Fallback
    }

    logger.info({ id, queueName }, `[DLQ] Item marked as DISCARDED`);
    return dlqItem;
  }
}
