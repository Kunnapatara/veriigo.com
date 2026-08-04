/**
 * VERIIGO V2 - Structured Logging Foundation
 * Standardized enterprise logging for all operations with traceId propagation.
 */

export interface LogContext {
  traceId?: string;
  operation: string;
  entityId?: string;
  sourceId?: string;
  timestamp?: string;
  result?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  errorCode?: string;
  [key: string]: any;
}

export function generateTraceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

class StructuredLogger {
  private formatLog(level: 'INFO' | 'WARN' | 'ERROR', context: LogContext, message: string) {
    const payload = {
      level,
      traceId: context.traceId || generateTraceId(),
      operation: context.operation,
      entityId: context.entityId || null,
      sourceId: context.sourceId || null,
      timestamp: context.timestamp || new Date().toISOString(),
      result: context.result || (level === 'ERROR' ? 'FAILURE' : 'SUCCESS'),
      errorCode: context.errorCode || null,
      message,
      ...Object.fromEntries(
        Object.entries(context).filter(
          ([key]) => !['traceId', 'operation', 'entityId', 'sourceId', 'timestamp', 'result', 'errorCode'].includes(key)
        )
      ),
    };

    return JSON.stringify(payload);
  }

  info(context: LogContext, message: string): void {
    console.log(this.formatLog('INFO', context, message));
  }

  warn(context: LogContext, message: string): void {
    console.warn(this.formatLog('WARN', context, message));
  }

  error(context: LogContext, message: string, errorDetails?: unknown): void {
    const errObj = errorDetails instanceof Error 
      ? { errorMessage: errorDetails.message, stack: errorDetails.stack }
      : { errorMessage: String(errorDetails) };
    
    const enhancedContext: LogContext = {
      ...context,
      result: 'FAILURE',
      ...errObj,
    };

    console.error(this.formatLog('ERROR', enhancedContext, message));
  }
}

export const logger = new StructuredLogger();
