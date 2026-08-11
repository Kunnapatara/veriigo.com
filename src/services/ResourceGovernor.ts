import { logger } from '../lib/logger';

export type SystemResourceState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'THROTTLED'
  | 'PAUSED'
  | 'DATABASE_UNAVAILABLE'
  | 'GEMINI_THROTTLED'
  | 'CIRCUIT_OPEN';

export interface DomainHealth {
  consecutiveFailures: number;
  circuitOpenUntil: number; // timestamp ms
  lastStatusCode?: number;
  lastError?: string;
}

class ResourceGovernorClass {
  // System State
  private currentState: SystemResourceState = 'HEALTHY';
  private stateReason: string = 'System operating normally';
  private dbUnavailableUntil: number = 0;
  private geminiThrottledUntil: number = 0;

  // Firestore Concurrency & Rate Limits
  private activeFirestoreReads: number = 0;
  private activeFirestoreWrites: number = 0;
  public maxFirestoreReadConcurrency: number = 2;
  public maxFirestoreWriteConcurrency: number = 2;

  // Gemini Extraction Concurrency & Rate Limits
  private activeGeminiRequests: number = 0;
  public maxGeminiConcurrency: number = 1;

  // Crawler Concurrency
  private activeCrawlerTasks: number = 0;
  public maxSourceConcurrency: number = 2;

  // Domain Circuit Breakers
  private domainHealthMap: Map<string, DomainHealth> = new Map();
  public domainFailureThreshold: number = 3;
  public domainCooldownMs: number = 60000; // 1 minute

  // SHA-256 Document Content Hash Memory Store
  private extractedContentHashes: Set<string> = new Set();

  // Log Aggregator
  private recentLogCounts: Map<string, { count: number; lastLogTime: number }> = new Map();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  public getState(): { state: SystemResourceState; reason: string; dbAvailable: boolean; geminiAvailable: boolean } {
    const now = Date.now();

    // Check if DB cooldown expired
    if (this.currentState === 'DATABASE_UNAVAILABLE' && now > this.dbUnavailableUntil) {
      this.currentState = 'DEGRADED';
      this.stateReason = 'Probing Firestore availability following quota cooldown';
    }

    // Check if Gemini throttling expired
    if (this.currentState === 'GEMINI_THROTTLED' && now > this.geminiThrottledUntil) {
      this.currentState = 'HEALTHY';
      this.stateReason = 'Gemini rate limit cooldown expired';
    }

    const dbAvailable = this.currentState !== 'DATABASE_UNAVAILABLE';
    const geminiAvailable = this.currentState !== 'GEMINI_THROTTLED' && this.currentState !== 'DATABASE_UNAVAILABLE';

    return {
      state: this.currentState,
      reason: this.stateReason,
      dbAvailable,
      geminiAvailable,
    };
  }

  public reportFirestoreQuotaError(err: unknown) {
    const errMsg = String(err);
    logger.error({ operation: 'ResourceGovernor.reportFirestoreQuotaError', errorCode: 'RESOURCE_EXHAUSTED' }, `[ResourceGovernor] Firestore Quota Exhaustion Detected: ${errMsg}`);
    this.currentState = 'DATABASE_UNAVAILABLE';
    this.stateReason = `Firestore Quota Exhausted / Unavailable: ${errMsg.slice(0, 100)}`;
    // Pause database operations for 2 minutes before probing again
    this.dbUnavailableUntil = Date.now() + 120000;
  }

  public reportGeminiRateLimitError(retryAfterMs?: number) {
    const cooldown = retryAfterMs || 30000;
    logger.warn({ operation: 'ResourceGovernor.reportGeminiRateLimitError', errorCode: 'GEMINI_THROTTLED' }, `[ResourceGovernor] Gemini HTTP 429 / Rate Limit Detected! Throttling for ${cooldown}ms`);
    this.currentState = 'GEMINI_THROTTLED';
    this.stateReason = `Gemini Rate Limited (HTTP 429). Cooldown for ${Math.round(cooldown / 1000)}s`;
    this.geminiThrottledUntil = Date.now() + cooldown;
  }

  // ==========================================
  // FIRESTORE GUARDS
  // ==========================================

  public canExecuteFirestoreRead(): boolean {
    const { dbAvailable } = this.getState();
    if (!dbAvailable) return false;
    return this.activeFirestoreReads < this.maxFirestoreReadConcurrency;
  }

  public canExecuteFirestoreWrite(): boolean {
    const { dbAvailable } = this.getState();
    if (!dbAvailable) return false;
    return this.activeFirestoreWrites < this.maxFirestoreWriteConcurrency;
  }

  public enterFirestoreRead(): boolean {
    if (!this.canExecuteFirestoreRead()) return false;
    this.activeFirestoreReads++;
    return true;
  }

  public exitFirestoreRead() {
    this.activeFirestoreReads = Math.max(0, this.activeFirestoreReads - 1);
  }

  public enterFirestoreWrite(): boolean {
    if (!this.canExecuteFirestoreWrite()) return false;
    this.activeFirestoreWrites++;
    return true;
  }

  public exitFirestoreWrite() {
    this.activeFirestoreWrites = Math.max(0, this.activeFirestoreWrites - 1);
  }

  // ==========================================
  // GEMINI GUARDS
  // ==========================================

  public canExecuteGemini(): boolean {
    const { geminiAvailable } = this.getState();
    if (!geminiAvailable) return false;
    return this.activeGeminiRequests < this.maxGeminiConcurrency;
  }

  public enterGemini(): boolean {
    if (!this.canExecuteGemini()) return false;
    this.activeGeminiRequests++;
    return true;
  }

  public exitGemini() {
    this.activeGeminiRequests = Math.max(0, this.activeGeminiRequests - 1);
  }

  // ==========================================
  // CRAWLER & DOMAIN CIRCUIT BREAKER
  // ==========================================

  public canExecuteCrawler(): boolean {
    const { state } = this.getState();
    if (state === 'PAUSED' || state === 'DATABASE_UNAVAILABLE') return false;
    return this.activeCrawlerTasks < this.maxSourceConcurrency;
  }

  public enterCrawler(): boolean {
    if (!this.canExecuteCrawler()) return false;
    this.activeCrawlerTasks++;
    return true;
  }

  public exitCrawler() {
    this.activeCrawlerTasks = Math.max(0, this.activeCrawlerTasks - 1);
  }

  public isDomainAllowed(urlStr: string): boolean {
    try {
      const hostname = new URL(urlStr).hostname;
      const health = this.domainHealthMap.get(hostname);
      if (!health) return true;

      if (Date.now() < health.circuitOpenUntil) {
        return false; // Circuit is OPEN
      }
      return true;
    } catch {
      return true;
    }
  }

  public reportDomainSuccess(urlStr: string) {
    try {
      const hostname = new URL(urlStr).hostname;
      this.domainHealthMap.delete(hostname);
    } catch {
      // Ignore URL parse errors
    }
  }

  public reportDomainFailure(urlStr: string, statusCode?: number, errorMsg?: string) {
    try {
      const hostname = new URL(urlStr).hostname;
      const health = this.domainHealthMap.get(hostname) || { consecutiveFailures: 0, circuitOpenUntil: 0 };
      health.consecutiveFailures++;
      health.lastStatusCode = statusCode;
      health.lastError = errorMsg;

      if (health.consecutiveFailures >= this.domainFailureThreshold) {
        health.circuitOpenUntil = Date.now() + this.domainCooldownMs;
        logger.warn({ operation: 'ResourceGovernor.reportDomainFailure', errorCode: 'CIRCUIT_OPEN', domain: hostname }, `[ResourceGovernor] Circuit Breaker OPEN for domain ${hostname} due to repeated failures (${health.consecutiveFailures}). Cooldown: ${this.domainCooldownMs / 1000}s`);
      }

      this.domainHealthMap.set(hostname, health);
    } catch {
      // Ignore URL parse errors
    }
  }

  // ==========================================
  // SHA-256 CONTENT DEDUPLICATION
  // ==========================================

  public isHashExtracted(hash: string): boolean {
    return this.extractedContentHashes.has(hash);
  }

  public registerExtractedHash(hash: string) {
    if (hash) {
      this.extractedContentHashes.add(hash);
    }
  }

  // ==========================================
  // LOG AGGREGATION & NO-FLOOD
  // ==========================================

  public shouldLogAggregated(key: string, intervalMs = 10000): boolean {
    const now = Date.now();
    const item = this.recentLogCounts.get(key) || { count: 0, lastLogTime: 0 };
    item.count++;

    if (now - item.lastLogTime > intervalMs) {
      item.lastLogTime = now;
      this.recentLogCounts.set(key, item);
      return true;
    }

    this.recentLogCounts.set(key, item);
    return false;
  }
}

export const ResourceGovernor = new ResourceGovernorClass();
