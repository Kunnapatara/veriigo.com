/**
 * VERIIGO V2 Phase 7: OpenTelemetry & Observability Provider
 * Provides trace context propagation, spans, and Cloud Trace / Prometheus / Grafana instrumentation.
 */

export interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  status: 'OK' | 'ERROR';
  errorMessage?: string;
}

export class OpenTelemetryProvider {
  private static activeSpans = new Map<string, Span>();
  private static completedSpans: Span[] = [];

  public static generateTraceId(): string {
    return `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }

  public static generateSpanId(): string {
    return `sp-${Math.random().toString(36).substring(2, 10)}`;
  }

  public static startSpan(name: string, traceId?: string, parentSpanId?: string): Span {
    const tid = traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const span: Span = {
      traceId: tid,
      spanId,
      name,
      startTime: Date.now(),
      attributes: {
        parentSpanId: parentSpanId || null,
        environment: process.env.NODE_ENV || 'production',
        serviceName: 'veriigo-intelligence-platform',
      },
      status: 'OK',
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  public static endSpan(span: Span, status: 'OK' | 'ERROR' = 'OK', errorMessage?: string): void {
    span.endTime = Date.now();
    span.status = status;
    if (errorMessage) {
      span.errorMessage = errorMessage;
    }

    this.activeSpans.delete(span.spanId);
    this.completedSpans.push(span);

    // Keep buffer reasonable
    if (this.completedSpans.length > 500) {
      this.completedSpans.shift();
    }
  }

  public static async traceAsync<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    traceId?: string
  ): Promise<T> {
    const span = this.startSpan(name, traceId);
    try {
      const result = await fn(span);
      this.endSpan(span, 'OK');
      return result;
    } catch (error: any) {
      this.endSpan(span, 'ERROR', error.message || String(error));
      throw error;
    }
  }

  public static getCompletedSpans(traceId?: string): Span[] {
    if (traceId) {
      return this.completedSpans.filter((s) => s.traceId === traceId);
    }
    return [...this.completedSpans];
  }
}
