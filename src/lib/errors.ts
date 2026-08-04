/**
 * VERIIGO V2 - Operational Error Foundations
 * Enforces explicit error responses without silent fallbacks.
 */

export class OperationalError extends Error {
  public readonly traceId: string;
  public readonly errorCode: string;
  public readonly operation: string;
  public readonly entityId?: string;
  public readonly sourceId?: string;
  public readonly statusCode: number;

  constructor(params: {
    message: string;
    errorCode: string;
    operation: string;
    traceId?: string;
    entityId?: string;
    sourceId?: string;
    statusCode?: number;
  }) {
    super(params.message);
    this.name = 'OperationalError';
    this.traceId = params.traceId || `tr-${Date.now().toString(36)}`;
    this.errorCode = params.errorCode;
    this.operation = params.operation;
    this.entityId = params.entityId;
    this.sourceId = params.sourceId;
    this.statusCode = params.statusCode || 500;
  }

  public toJSON() {
    return {
      error: true,
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      operation: this.operation,
      traceId: this.traceId,
      entityId: this.entityId || null,
      sourceId: this.sourceId || null,
      timestamp: new Date().toISOString(),
    };
  }
}

export class DatabaseOperationalError extends OperationalError {
  constructor(params: {
    message: string;
    operation: string;
    traceId?: string;
    entityId?: string;
    sourceId?: string;
    originalError?: unknown;
  }) {
    super({
      message: `[Database Failure] ${params.message}`,
      errorCode: 'DATABASE_OPERATIONAL_ERROR',
      operation: params.operation,
      traceId: params.traceId,
      entityId: params.entityId,
      sourceId: params.sourceId,
      statusCode: 503,
    });
  }
}

export class IngestionError extends OperationalError {
  constructor(params: {
    message: string;
    operation: string;
    traceId?: string;
    sourceId?: string;
  }) {
    super({
      message: `[Ingestion Failure] ${params.message}`,
      errorCode: 'DOCUMENT_INGESTION_FAILED',
      operation: params.operation,
      traceId: params.traceId,
      sourceId: params.sourceId,
      statusCode: 422,
    });
  }
}
