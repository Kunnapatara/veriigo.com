/**
 * VERIIGO V2 Phase 7: Distributed Event Architecture Types
 */

export interface EventEnvelope<T = any> {
  eventId: string;
  traceId: string;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  producer: string;
  payloadVersion: string;
  eventType: 'crawl.completed' | 'extraction.completed' | 'normalization.completed' | 'search.updated';
  payload: T;
}

export interface CrawlCompletedPayload {
  taskId: string;
  sourceId: string;
  documentsDiscovered: number;
  crawlLatencyMs: number;
  httpStatusCode?: number;
  errorType?: string;
  documents?: Array<{
    documentId: string;
    rawContentSha256: string;
    officialUrl: string;
  }>;
}

export interface ExtractionCompletedPayload {
  documentId: string;
  rawContentSha256: string;
  extractedTitle?: string;
  organizationName?: string;
  confidenceScore: number;
  tokenUsage?: number;
  rawExtractedData: Record<string, any>;
}

export interface NormalizationCompletedPayload {
  jobId: string;
  documentId: string;
  normalizedTitle: string;
  provinceNormalized: string;
  organizationNormalized: string;
  governmentLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadlineIso?: string;
  healthScore: number;
}

export interface SearchUpdatedPayload {
  jobId: string;
  indexedAt: string;
  status: string;
  action: 'CREATED' | 'UPDATED' | 'EXPIRED';
}

export interface DLQItem {
  id: string;
  queueName: 'crawl_dlq' | 'extraction_dlq' | 'normalization_dlq' | 'index_dlq';
  reason: string;
  retryCount: number;
  stackTrace: string;
  payload: Record<string, any>;
  lastAttempt: string;
  eventId?: string;
  traceId: string;
  status: 'PENDING' | 'REPLAYED' | 'DISCARDED';
}

export interface ProcessedEventRecord {
  eventId: string;
  idempotencyKey: string;
  processedAt: string;
  workerName: string;
  traceId: string;
}
