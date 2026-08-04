/**
 * VERIIGO - Firestore Strong Type Definitions (Sprint 2 Data Model)
 * Covers all 10 collections:
 * 1. Users
 * 2. Saved Jobs
 * 3. Government Agencies
 * 4. Recruitment Sources
 * 5. Job Announcements
 * 6. Crawler Logs
 * 7. Extraction Logs
 * 8. Subscriptions
 * 9. Notifications
 * 10. Audit Logs
 */

import { Timestamp } from 'firebase/firestore';

export type UserRole = 'USER' | 'AGENCY' | 'ADMIN';
export type OCSCLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
export type PositionType = 'ข้าราชการพลเรือนสามัญ' | 'พนักงานราชการ' | 'ลูกจ้างประจำ' | 'พนักงานจ้างเหมา';
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED' | 'DRAFT';

/**
 * Phase 1: DocumentEntity Model (Immutable Document Lake)
 * Collection: documents/{documentId}
 */
export interface DocumentEntity {
  documentId: string;
  sourceId: string;
  officialUrl: string;
  mimeType: string;
  contentHash: string; // SHA-256
  downloadTimestamp: string; // UTC ISO-8601
  storagePath: string;
  extractionStatus: 'PENDING' | 'PROCESSING' | 'EXTRACTED' | 'FAILED';
  createdAt: string; // UTC ISO-8601
}

/**
 * Phase 2: ExtractionTaskEntity Model & Lineage Governance
 * Collection: extraction_tasks/{taskId}
 */
export type ExtractionTaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface FieldLineage {
  sourceDocumentId: string;
  textAnchor: string; // Verbatim text snippet or section anchor for audit trail
  confidenceScore: number; // 0.0 to 1.0
}

export interface ExtractionTaskEntity {
  taskId: string;
  documentId: string;
  sourceId: string;
  status: ExtractionTaskStatus;
  modelVersion: string;
  promptVersion: string;
  validationVersion: string;
  confidenceScore: number;
  createdAt: string; // UTC ISO-8601
  processedAt?: string; // UTC ISO-8601
  extractedData?: any;
  lineage?: Record<string, FieldLineage>;
  errorMessage?: string;
  traceId?: string;
  retryCount?: number;
}

export interface DocumentIngestedEvent {
  eventId: string;
  traceId: string;
  documentId: string;
  sourceId: string;
  storagePath: string;
  timestamp: string;
}

/**
 * Phase 3: Normalized Government Job Intelligence Entity Model
 * Collection: jobs/{jobId}
 */
export type GovernmentLevel =
  | 'CENTRAL'
  | 'PROVINCIAL'
  | 'LOCAL'
  | 'UNIVERSITY'
  | 'HOSPITAL'
  | 'STATE_ENTERPRISE'
  | 'INDEPENDENT_AGENCY'
  | 'SPECIAL'
  | 'OTHER';
export type JobCategory =
  | 'ENGINEERING'
  | 'GENERAL_ADMIN'
  | 'FINANCE_ACCOUNTING'
  | 'INFORMATION_TECHNOLOGY'
  | 'PUBLIC_HEALTH'
  | 'EDUCATION'
  | 'LEGAL'
  | 'POLICE_MILITARY'
  | 'OTHER';

export interface SalaryInfo {
  min?: number;
  max?: number;
  text?: string;
  currency?: string;
}

export interface LineageReference {
  sourceDocumentId: string;
  extractionTaskId: string;
  modelVersion: string;
  promptVersion: string;
  validationVersion: string;
  fieldLineage?: Record<string, FieldLineage>;
}

export interface JobAnnouncementEntity {
  jobId: string;
  sourceDocumentId: string;
  extractionTaskId: string;
  sourceId: string;
  title: string;
  organization: string;
  governmentLevel: GovernmentLevel;
  province: string;
  jobCategory: JobCategory | string;
  employmentType: PositionType | 'OTHER';
  salary: SalaryInfo;
  positionsAvailable: number;
  publishedDate: string; // UTC ISO-8601
  applicationDeadline: string; // UTC ISO-8601 or YYYY-MM-DD
  officialUrl: string;
  status: JobStatus;
  confidenceScore: number;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
  lineageReference: LineageReference;
}

/**
 * Phase 4: CQRS Search Read Model Entity
 * Collection: job_search_index/{jobId}
 */
export interface JobSearchIndexEntity {
  jobId: string;
  title: string;
  organization: string;
  province: string;
  governmentLevel: GovernmentLevel;
  jobCategory: string;
  employmentType: string;
  deadline: string; // UTC ISO-8601 or YYYY-MM-DD
  status: JobStatus;
  qualityScore: number; // Normalized 0.0 - 1.0 (derived from AI confidence & completeness)
  freshnessScore: number; // Decaying 0.0 - 1.0 score based on publication age
  compositeScore?: number; // Final search ranking weight
  searchKeywordsTokens: string[]; // Normalized searchable token array for exact/substring match
  officialUrl: string;
  updatedAt: string; // UTC ISO-8601
}

/**
 * Phase 4: Search Analytics Tracking Entity
 * Collection: search_analytics/{analyticsId}
 */
export interface SearchAnalyticsEntity {
  analyticsId: string;
  searchKeyword?: string;
  filters: {
    province?: string;
    governmentLevel?: string;
    jobCategory?: string;
    employmentType?: string;
    status?: string;
  };
  resultCount: number;
  timestamp: string; // UTC ISO-8601
  traceId: string;
  executionTimeMs: number;
}

export interface SearchJobsQuery {
  keyword?: string;
  province?: string;
  governmentLevel?: string;
  jobCategory?: string;
  employmentType?: string;
  status?: JobStatus;
  limit?: number;
  cursor?: string; // Cursor offset or document ID for pagination
}

export interface SearchJobsResponse {
  results: JobSearchIndexEntity[];
  nextCursor: string | null;
  totalMatches: number;
  hasMore: boolean;
  queryTimeMs: number;
}

/**
 * Phase 5: National Government Recruitment Source Registry
 * Collection: sources/{sourceId}
 */
export type SourceCoverageStatus = 'ACTIVE' | 'DEGRADED' | 'INACTIVE' | 'FAILED' | 'DISCOVERING';

export interface SourceRegistryEntity {
  sourceId: string;
  officialName: string;
  organizationType: string;
  governmentLevel: GovernmentLevel;
  province: string;
  officialDomain: string;
  crawlFrequency: 'DAILY' | 'HOURLY' | 'EVERY_12_HOURS' | 'WEEKLY' | string;
  lastSuccessfulCrawl?: string; // UTC ISO-8601
  lastDocumentFound?: string; // UTC ISO-8601
  healthScore: number; // 0 to 100
  coverageStatus: SourceCoverageStatus;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

/**
 * Phase 5: Crawl Task Queue
 * Collection: crawl_tasks/{taskId}
 */
export type CrawlTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export interface CrawlTaskEntity {
  taskId: string;
  sourceId: string;
  scheduledTime: string; // UTC ISO-8601
  status: CrawlTaskStatus;
  retryCount: number;
  traceId: string;
  startedAt?: string; // UTC ISO-8601
  completedAt?: string; // UTC ISO-8601
  documentsDiscovered?: number;
  errorMessage?: string;
}

/**
 * Phase 5: Operational Ingestion Report
 * Collection: operational_reports/{reportId}
 */
export interface OperationalReportEntity {
  reportId: string;
  date: string; // YYYY-MM-DD
  scheduleWindow: '09:00' | '15:00' | 'MANUAL';
  sourcesScanned: number;
  tasksEnqueued: number;
  documentsDiscovered: number;
  jobsCreated: number;
  failedSources: number;
  nationalCoveragePercentage: number;
  coverageByProvince?: Record<string, number>;
  executionTimeMs: number;
  traceId: string;
  createdAt: string; // UTC ISO-8601
}

/**
 * Phase 6: National Recruitment Acquisition Engine
 * Collection: source_health_events/{eventId}
 */
export type PortalClassificationType = 'HTML_ANNOUNCEMENT' | 'PDF_ANNOUNCEMENT' | 'RSS_FEED' | 'DYNAMIC_PAGE' | 'UNKNOWN';

export interface PortalClassificationResult {
  portalType: PortalClassificationType;
  mimeType: string;
  hasPdfLinks: boolean;
  hasRssFeed: boolean;
  requiresDynamicRendering: boolean;
  detectedKeywords: string[];
  confidence: number;
}

export interface DiscoveredDocument {
  url: string;
  title: string;
  portalType: PortalClassificationType;
  mimeType: string;
  discoveredAt: string; // UTC ISO-8601
  matchingKeywords: string[];
}

export interface SourceHealthEventEntity {
  eventId: string;
  sourceId: string;
  taskId: string;
  timestamp: string; // UTC ISO-8601
  successRate: number; // 0.0 to 1.0
  documentsFound: number;
  crawlLatencyMs: number;
  httpStatusCode: number;
  errorType?: string;
  traceId: string;
}
export type SourceType = 'GOVT_PORTAL' | 'AGENCY_WEBSITE' | 'RSS_FEED' | 'PDF_ANNOUNCEMENT';
export type CrawlFrequency = 'HOURLY' | 'EVERY_6_HOURS' | 'EVERY_12_HOURS' | 'DAILY' | 'WEEKLY' | 'CUSTOM_CRON';
export type SourceCategory = 'CENTRAL_MINISTRY' | 'DEPARTMENT' | 'STATE_ENTERPRISE' | 'LOCAL_GOVT' | 'INDEPENDENT_AGENCY' | 'EDUCATIONAL_INSTITUTE';
export type SourcePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SourceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';

export interface CrawlerSelectorConfig {
  jobListContainerSelector?: string;
  titleSelector?: string;
  linkSelector?: string;
  pdfLinkSelector?: string;
  deadlineSelector?: string;
  requiresJsRendering?: boolean;
  autoExtractPdf?: boolean;
}

export interface AgencyMetadata {
  ministry?: string;
  department?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  rateLimitPerMin?: number;
  customHeaders?: Record<string, string>;
}
export type CrawlStatus = 'STARTED' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
export type ExtractionStatus = 'SUCCESS' | 'VALIDATION_ERROR' | 'AI_PARSING_FAILED';
export type SubscriptionPlan = 'FREE' | 'PRO_APPLICANT' | 'AGENCY_PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED';
export type NotificationType = 'URGENT' | 'RECOMMENDATION' | 'STATUS_CHANGE' | 'EXAM_REMINDER' | 'SYSTEM';
export type ActorRole = 'USER' | 'AGENCY' | 'ADMIN' | 'SYSTEM';

/**
 * Phase 1: SourceRegistry Model
 */
export interface SourceRegistryDoc {
  id: string;
  name: string;
  officialName?: string;
  shortName?: string;
  organizationType: string;
  governmentLevel: GovernmentLevel;
  province: string;
  url: string;
  website?: string;
  careerPage?: string;
  rss?: string;
  sitemap?: string;
  apiEndpoint?: string;
  robotsTxt?: string;
  crawlStrategy: string;
  crawlInterval?: string;
  priority?: SourcePriority;
  healthStatus: SourceHealthStatus;
  availability?: number;
  averageLatency?: number;
  documentsDiscovered?: number;
  documentsProcessed?: number;
  documentsFailed?: number;
  lastCheckedAt: FirestoreDate;
  lastSuccess?: FirestoreDate;
  lastFailure?: FirestoreDate;
  consecutiveFailures?: number;
  etag?: string;
  etagSupport?: boolean;
  lastModified?: string;
  lastModifiedSupport?: boolean;
  authenticationRequired?: boolean;
  requiresPlaywright?: boolean;
  requiresOCR?: boolean;
  supportsPDF?: boolean;
  supportsRSS?: boolean;
  supportsJSON?: boolean;
  supportsHTML?: boolean;
  crawlerVersion: string;
  parserVersion: string;
  ocrEnabled: boolean;
  playwrightEnabled: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'DISCOVERING' | 'OFFLINE';
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * Phase 1: DocumentEvidence Model
 */
export interface DocumentEvidenceDoc {
  id: string;
  sourceId: string;
  jobId?: string;
  agencyName?: string;
  documentUrl: string;
  discoveryUrl?: string;
  documentHashSHA256: string;
  publishedDate?: FirestoreDate;
  retrievedDate: FirestoreDate;
  rawContent?: string;
  fileType: 'PDF' | 'HTML' | 'JSON' | 'RSS' | 'XML';
  crawlerVersion?: string;
  parserVersion: string;
  aiModel: string;
  extractedData: Record<string, any>;
  confidenceScore: number;
  validationStatus: 'VALIDATED' | 'REQUIRES_HUMAN_REVIEW' | 'REJECTED';
  validationResult?: {
    isValid: boolean;
    missingRequiredFields: string[];
    confidenceReasons: string[];
  };
  createdAt: FirestoreDate;
}

/**
 * Phase 1: CoverageRegistry Model
 */
export interface CoverageRegistryDoc {
  id: string;
  province: string;
  organizationCategory: GovernmentLevel | 'ALL';
  expectedSources: number;
  registeredSources: number;
  activeSources: number;
  missingSources: number;
  coverageScore: number;
  healthFactor: number;
  freshnessFactor: number;
  reasonsBreakdown: string[];
  calculatedAt: FirestoreDate;
}

/**
 * Phase 1: CrawlerExecutionLog Model
 */
export interface CrawlerExecutionLogDoc {
  id: string;
  sourceId: string;
  sourceName?: string;
  startedAt: FirestoreDate;
  completedAt?: FirestoreDate;
  status: 'STARTED' | 'SUCCESS' | 'FAILED' | 'CIRCUIT_OPEN';
  success: boolean;
  failedReason?: string;
  documentsFound: number;
  duplicatesRemoved: number;
  jobsExtracted: number;
  retryCount?: number;
  latencyMs?: number;
}

/**
 * Phase 4: DiscoveryQueue Model
 */
export interface DiscoveryQueueDoc {
  id: string;
  suggestedSource: string;
  officialName: string;
  organizationType: string;
  governmentLevel: GovernmentLevel;
  province: string;
  url: string;
  reason: string;
  discoveredBy: string;
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: FirestoreDate;
  discoveredAt: FirestoreDate;
}

// Helper date type for Firestore models (handles both JS Date / ISO String and Firestore Timestamp)
export type FirestoreDate = Date | Timestamp | string;

/**
 * 1. Users Model
 */
export interface UserPreferences {
  ministries?: string[];
  jobCategories?: string[];
  notificationEmail?: boolean;
  notificationPush?: boolean;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  ocscExamPassed: boolean;
  ocscLevel?: OCSCLevel;
  educationLevel?: string;
  fieldOfStudy?: string;
  preferences?: UserPreferences;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * 2. Saved Jobs Model
 */
export interface SavedJobDoc {
  id: string;
  userId: string;
  jobAnnouncementId: string;
  jobTitle: string;
  agencyName: string;
  ministry: string;
  deadline?: FirestoreDate;
  notes?: string;
  savedAt: FirestoreDate;
}

/**
 * 3. Government Agencies Model
 */
export interface GovernmentAgencyDoc {
  id: string;
  code: string;
  nameThai: string;
  nameEnglish?: string;
  ministry: string;
  websiteUrl: string;
  logoUrl?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  activeJobsCount: number;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * 4. Recruitment Sources Model
 */
export interface RecruitmentSourceDoc {
  id: string;
  name: string;
  agencyId?: string;
  baseUrl: string;
  scrapeTargetUrl: string;
  sourceType: SourceType;
  category: SourceCategory;
  priority: SourcePriority;
  healthStatus: SourceHealthStatus;
  crawlFrequency: CrawlFrequency;
  cronExpression?: string;
  isActive: boolean;
  lastCrawledAt?: FirestoreDate;
  lastCrawlStatus?: CrawlStatus;
  lastLatencyMs?: number;
  lastResponseCode?: number;
  lastErrorMessage?: string;
  consecutiveFailures?: number;
  agencyMetadata?: AgencyMetadata;
  selectors?: CrawlerSelectorConfig;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * 5. Job Announcements Model
 */
export interface JobAnnouncementDoc {
  id: string;
  title: string;
  positionCode?: string;
  agencyId?: string;
  agencyName: string;
  ministry: string;
  recruitmentSourceId?: string;
  salaryMin: number;
  salaryMax: number;
  vacanciesCount: number;
  positionType: PositionType;
  ocscLevelRequired: OCSCLevel | 'NONE';
  degreeRequired: string[];
  description?: string;
  requirementsText: string;
  pdfAnnouncementUrl?: string;
  applicationUrl: string;
  publishDate?: FirestoreDate;
  deadline: FirestoreDate;
  examDate?: FirestoreDate;
  status: JobStatus;
  isVerified: boolean;
  tags: string[];
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * 6. Crawler Logs Model
 */
export interface CrawlerLogDoc {
  id: string;
  sourceId: string;
  sourceName?: string;
  status: CrawlStatus;
  pagesScraped: number;
  itemsFound: number;
  itemsExtracted: number;
  errorMessage?: string;
  executionTimeMs: number;
  startedAt: FirestoreDate;
  completedAt?: FirestoreDate;
}

/**
 * 7. Extraction Logs Model
 */
export interface ExtractionLogDoc {
  id: string;
  crawlerLogId: string;
  rawSourceUrl: string;
  announcementId?: string;
  status: ExtractionStatus;
  aiConfidenceScore?: number;
  extractedFields?: Record<string, any>;
  validationErrors?: string[];
  createdAt: FirestoreDate;
}

/**
 * 8. Subscriptions Model
 */
export interface SubscriptionDoc {
  id: string;
  userId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: FirestoreDate;
  endDate: FirestoreDate;
  autoRenew: boolean;
  features: string[];
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * 9. Notifications Model
 */
export interface NotificationDoc {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedJobId?: string;
  relatedApplicationId?: string;
  isRead: boolean;
  readAt?: FirestoreDate;
  createdAt: FirestoreDate;
}

/**
 * 10. Audit Logs Model
 */
export interface AuditLogDoc {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorRole: ActorRole;
  action: string;
  targetResource: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: FirestoreDate;
}

/**
 * 11. Scheduler Execution Logs Model (Production Audit)
 */
export interface SchedulerExecutionLogDoc {
  id: string;
  jobName: 'Coverage Recalculation' | 'Source Discovery Scan' | 'Crawler Health Monitoring' | string;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'FAILED';
  triggerSource: 'CLOUD_SCHEDULER' | 'CRON_WORKER' | 'ADMIN_MANUAL';
  durationMs: number;
  recordsProcessed: number;
  errorMessage?: string | null;
}
