/**
 * VERIIGO - Zod Runtime Schema Validation for All 10 Firestore Entities
 */

import { z } from 'zod';

// Common Reusable Schemas
export const OcscLevelSchema = z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4']);
export const UserRoleSchema = z.enum(['USER', 'AGENCY', 'ADMIN']);
export const PositionTypeSchema = z.enum(['ข้าราชการพลเรือนสามัญ', 'พนักงานราชการ', 'ลูกจ้างประจำ', 'พนักงานจ้างเหมา']);
export const JobStatusSchema = z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']);
export const SourceTypeSchema = z.enum(['GOVT_PORTAL', 'AGENCY_WEBSITE', 'RSS_FEED', 'PDF_ANNOUNCEMENT']);
export const CrawlFrequencySchema = z.enum(['HOURLY', 'EVERY_6_HOURS', 'EVERY_12_HOURS', 'DAILY', 'WEEKLY', 'CUSTOM_CRON']);
export const SourceCategorySchema = z.enum([
  'CENTRAL_MINISTRY',
  'DEPARTMENT',
  'STATE_ENTERPRISE',
  'LOCAL_GOVT',
  'INDEPENDENT_AGENCY',
  'EDUCATIONAL_INSTITUTE',
]);
export const SourcePrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const SourceHealthStatusSchema = z.enum(['HEALTHY', 'DEGRADED', 'OFFLINE', 'MAINTENANCE']);

export const CrawlerSelectorConfigSchema = z.object({
  jobListContainerSelector: z.string().optional(),
  titleSelector: z.string().optional(),
  linkSelector: z.string().optional(),
  pdfLinkSelector: z.string().optional(),
  deadlineSelector: z.string().optional(),
  requiresJsRendering: z.boolean().default(false),
  autoExtractPdf: z.boolean().default(true),
});

export const AgencyMetadataSchema = z.object({
  ministry: z.string().optional(),
  department: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  rateLimitPerMin: z.number().int().positive().default(60),
  customHeaders: z.record(z.string(), z.string()).optional(),
});
export const CrawlStatusSchema = z.enum(['STARTED', 'SUCCESS', 'FAILED', 'PARTIAL']);
export const ExtractionStatusSchema = z.enum(['SUCCESS', 'VALIDATION_ERROR', 'AI_PARSING_FAILED']);
export const SubscriptionPlanSchema = z.enum(['FREE', 'PRO_APPLICANT', 'AGENCY_PREMIUM']);
export const SubscriptionStatusSchema = z.enum(['ACTIVE', 'CANCELED', 'EXPIRED']);
export const NotificationTypeSchema = z.enum(['URGENT', 'RECOMMENDATION', 'STATUS_CHANGE', 'EXAM_REMINDER', 'SYSTEM']);
export const ActorRoleSchema = z.enum(['USER', 'AGENCY', 'ADMIN', 'SYSTEM']);

// 1. User Schema
export const UserSchema = z.object({
  uid: z.string().min(1, 'UID is required'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required'),
  role: UserRoleSchema.default('USER'),
  photoURL: z.string().url().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  ocscExamPassed: z.boolean().default(false),
  ocscLevel: OcscLevelSchema.optional(),
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  preferences: z.object({
    ministries: z.array(z.string()).optional(),
    jobCategories: z.array(z.string()).optional(),
    notificationEmail: z.boolean().optional(),
    notificationPush: z.boolean().optional(),
  }).optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// 2. Saved Job Schema
export const SavedJobSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  jobAnnouncementId: z.string().min(1),
  jobTitle: z.string().min(1),
  agencyName: z.string().min(1),
  ministry: z.string().default(''),
  deadline: z.any().optional(),
  notes: z.string().max(500).optional(),
  savedAt: z.any(),
});

// 3. Government Agency Schema
export const GovernmentAgencySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  nameThai: z.string().min(1),
  nameEnglish: z.string().optional(),
  ministry: z.string().min(1),
  websiteUrl: z.string().url(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  activeJobsCount: z.number().nonnegative().default(0),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// 4. Recruitment Source Schema
export const RecruitmentSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Source name is required'),
  agencyId: z.string().optional(),
  baseUrl: z.string().url('Base URL must be a valid URL'),
  scrapeTargetUrl: z.string().url('Scrape target must be a valid URL'),
  sourceType: SourceTypeSchema,
  category: SourceCategorySchema.default('DEPARTMENT'),
  priority: SourcePrioritySchema.default('HIGH'),
  healthStatus: SourceHealthStatusSchema.default('HEALTHY'),
  crawlFrequency: CrawlFrequencySchema.default('DAILY'),
  cronExpression: z.string().optional(),
  isActive: z.boolean().default(true),
  lastCrawledAt: z.any().optional(),
  lastCrawlStatus: CrawlStatusSchema.optional(),
  lastLatencyMs: z.number().nonnegative().optional(),
  lastResponseCode: z.number().int().optional(),
  lastErrorMessage: z.string().optional(),
  consecutiveFailures: z.number().int().nonnegative().default(0),
  agencyMetadata: AgencyMetadataSchema.optional(),
  selectors: CrawlerSelectorConfigSchema.optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// 5. Job Announcement Schema
export const JobAnnouncementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  positionCode: z.string().optional(),
  agencyId: z.string().optional(),
  agencyName: z.string().min(1, 'Agency name is required'),
  ministry: z.string().min(1, 'Ministry is required'),
  recruitmentSourceId: z.string().optional(),
  salaryMin: z.number().nonnegative(),
  salaryMax: z.number().nonnegative(),
  vacanciesCount: z.number().int().nonnegative().default(1),
  positionType: PositionTypeSchema.default('ข้าราชการพลเรือนสามัญ'),
  ocscLevelRequired: OcscLevelSchema.or(z.literal('NONE')).default('NONE'),
  degreeRequired: z.array(z.string()).default([]),
  description: z.string().optional(),
  requirementsText: z.string().min(1, 'Requirements text is required'),
  pdfAnnouncementUrl: z.string().url().optional().or(z.literal('')),
  applicationUrl: z.string().url(),
  publishDate: z.any().optional(),
  deadline: z.any(),
  examDate: z.any().optional(),
  status: JobStatusSchema.default('ACTIVE'),
  isVerified: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// 6. Crawler Log Schema
export const CrawlerLogSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  sourceName: z.string().optional(),
  status: CrawlStatusSchema,
  pagesScraped: z.number().int().nonnegative().default(0),
  itemsFound: z.number().int().nonnegative().default(0),
  itemsExtracted: z.number().int().nonnegative().default(0),
  errorMessage: z.string().optional(),
  executionTimeMs: z.number().nonnegative().default(0),
  startedAt: z.any(),
  completedAt: z.any().optional(),
});

// 7. Extraction Log Schema
export const ExtractionLogSchema = z.object({
  id: z.string().min(1),
  crawlerLogId: z.string().min(1),
  rawSourceUrl: z.string().url(),
  announcementId: z.string().optional(),
  status: ExtractionStatusSchema,
  aiConfidenceScore: z.number().min(0).max(1).optional(),
  extractedFields: z.record(z.string(), z.any()).optional(),
  validationErrors: z.array(z.string()).optional(),
  createdAt: z.any(),
});

// 8. Subscription Schema
export const SubscriptionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  planType: SubscriptionPlanSchema.default('FREE'),
  status: SubscriptionStatusSchema.default('ACTIVE'),
  startDate: z.any(),
  endDate: z.any(),
  autoRenew: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  createdAt: z.any(),
  updatedAt: z.any(),
});

// 9. Notification Schema
export const NotificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: NotificationTypeSchema.default('SYSTEM'),
  relatedJobId: z.string().optional(),
  relatedApplicationId: z.string().optional(),
  isRead: z.boolean().default(false),
  readAt: z.any().optional(),
  createdAt: z.any(),
});

// 10. Audit Log Schema
export const AuditLogSchema = z.object({
  id: z.string().min(1),
  actorId: z.string().min(1),
  actorEmail: z.string().email().optional(),
  actorRole: ActorRoleSchema.default('USER'),
  action: z.string().min(1),
  targetResource: z.string().min(1),
  changes: z.record(z.string(), z.object({ old: z.any(), new: z.any() })).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.any(),
});
