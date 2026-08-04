/**
 * VERIIGO - Firestore Data Converters for Strongly Typed Collections
 * Safely handles conversion between Firestore Timestamps, JS Dates, and typed JS Objects.
 */

import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

import {
  UserDoc,
  SavedJobDoc,
  GovernmentAgencyDoc,
  RecruitmentSourceDoc,
  JobAnnouncementDoc,
  CrawlerLogDoc,
  ExtractionLogDoc,
  SubscriptionDoc,
  NotificationDoc,
  AuditLogDoc,
} from '../../types/firestore';

/**
 * Helper to normalize Timestamp / Date / String to a standard JS Date object or Timestamp
 */
export const toDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  if (typeof val === 'object' && 'seconds' in val) return new Timestamp(val.seconds, val.nanoseconds || 0).toDate();
  return new Date();
};

export const toTimestamp = (val: any): Timestamp => {
  if (!val) return Timestamp.now();
  if (val instanceof Timestamp) return val;
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'string' || typeof val === 'number') return Timestamp.fromDate(new Date(val));
  return Timestamp.now();
};

/**
 * Strips undefined properties from objects before sending to Firestore
 */
const cleanUndefined = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
};

// 1. User Converter
export const userConverter: FirestoreDataConverter<UserDoc> = {
  toFirestore(user: UserDoc) {
    return cleanUndefined({
      ...user,
      createdAt: user.createdAt ? toTimestamp(user.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserDoc {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      email: data.email || '',
      displayName: data.displayName || '',
      role: data.role || 'USER',
      photoURL: data.photoURL || '',
      phoneNumber: data.phoneNumber || '',
      ocscExamPassed: Boolean(data.ocscExamPassed),
      ocscLevel: data.ocscLevel,
      educationLevel: data.educationLevel,
      fieldOfStudy: data.fieldOfStudy,
      preferences: data.preferences || {},
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

// 2. Saved Jobs Converter
export const savedJobConverter: FirestoreDataConverter<SavedJobDoc> = {
  toFirestore(savedJob: SavedJobDoc) {
    return cleanUndefined({
      ...savedJob,
      deadline: savedJob.deadline ? toTimestamp(savedJob.deadline) : null,
      savedAt: savedJob.savedAt ? toTimestamp(savedJob.savedAt) : serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): SavedJobDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId || '',
      jobAnnouncementId: data.jobAnnouncementId || '',
      jobTitle: data.jobTitle || '',
      agencyName: data.agencyName || '',
      ministry: data.ministry || '',
      deadline: data.deadline ? toDate(data.deadline) : undefined,
      notes: data.notes || '',
      savedAt: toDate(data.savedAt),
    };
  },
};

// 3. Government Agency Converter
export const governmentAgencyConverter: FirestoreDataConverter<GovernmentAgencyDoc> = {
  toFirestore(agency: GovernmentAgencyDoc) {
    return cleanUndefined({
      ...agency,
      createdAt: agency.createdAt ? toTimestamp(agency.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): GovernmentAgencyDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      code: data.code || '',
      nameThai: data.nameThai || '',
      nameEnglish: data.nameEnglish || '',
      ministry: data.ministry || '',
      websiteUrl: data.websiteUrl || '',
      logoUrl: data.logoUrl || '',
      address: data.address || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      activeJobsCount: data.activeJobsCount || 0,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

// 4. Recruitment Source Converter
export const recruitmentSourceConverter: FirestoreDataConverter<RecruitmentSourceDoc> = {
  toFirestore(source: RecruitmentSourceDoc) {
    return cleanUndefined({
      ...source,
      lastCrawledAt: source.lastCrawledAt ? toTimestamp(source.lastCrawledAt) : null,
      createdAt: source.createdAt ? toTimestamp(source.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): RecruitmentSourceDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name || '',
      agencyId: data.agencyId,
      baseUrl: data.baseUrl || '',
      scrapeTargetUrl: data.scrapeTargetUrl || '',
      sourceType: data.sourceType || 'GOVT_PORTAL',
      category: data.category || 'DEPARTMENT',
      priority: data.priority || 'HIGH',
      healthStatus: data.healthStatus || 'HEALTHY',
      crawlFrequency: data.crawlFrequency || 'DAILY',
      cronExpression: data.cronExpression,
      isActive: data.isActive ?? true,
      lastCrawledAt: data.lastCrawledAt ? toDate(data.lastCrawledAt) : undefined,
      lastCrawlStatus: data.lastCrawlStatus,
      lastLatencyMs: data.lastLatencyMs,
      lastResponseCode: data.lastResponseCode,
      lastErrorMessage: data.lastErrorMessage,
      consecutiveFailures: data.consecutiveFailures || 0,
      agencyMetadata: data.agencyMetadata,
      selectors: data.selectors,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

// 5. Job Announcement Converter
export const jobAnnouncementConverter: FirestoreDataConverter<JobAnnouncementDoc> = {
  toFirestore(job: JobAnnouncementDoc) {
    return cleanUndefined({
      ...job,
      publishDate: job.publishDate ? toTimestamp(job.publishDate) : serverTimestamp(),
      deadline: toTimestamp(job.deadline),
      examDate: job.examDate ? toTimestamp(job.examDate) : null,
      createdAt: job.createdAt ? toTimestamp(job.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): JobAnnouncementDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || '',
      positionCode: data.positionCode || '',
      agencyId: data.agencyId || '',
      agencyName: data.agencyName || '',
      ministry: data.ministry || '',
      recruitmentSourceId: data.recruitmentSourceId || '',
      salaryMin: data.salaryMin || 0,
      salaryMax: data.salaryMax || 0,
      vacanciesCount: data.vacanciesCount || 1,
      positionType: data.positionType || 'ข้าราชการพลเรือนสามัญ',
      ocscLevelRequired: data.ocscLevelRequired || 'NONE',
      degreeRequired: Array.isArray(data.degreeRequired) ? data.degreeRequired : [],
      description: data.description || '',
      requirementsText: data.requirementsText || '',
      pdfAnnouncementUrl: data.pdfAnnouncementUrl || '',
      applicationUrl: data.applicationUrl || '',
      publishDate: data.publishDate ? toDate(data.publishDate) : undefined,
      deadline: toDate(data.deadline),
      examDate: data.examDate ? toDate(data.examDate) : undefined,
      status: data.status || 'ACTIVE',
      isVerified: Boolean(data.isVerified),
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

// 6. Crawler Log Converter
export const crawlerLogConverter: FirestoreDataConverter<CrawlerLogDoc> = {
  toFirestore(log: CrawlerLogDoc) {
    return cleanUndefined({
      ...log,
      startedAt: toTimestamp(log.startedAt),
      completedAt: log.completedAt ? toTimestamp(log.completedAt) : null,
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CrawlerLogDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      sourceId: data.sourceId || '',
      sourceName: data.sourceName || '',
      status: data.status || 'STARTED',
      pagesScraped: data.pagesScraped || 0,
      itemsFound: data.itemsFound || 0,
      itemsExtracted: data.itemsExtracted || 0,
      errorMessage: data.errorMessage || '',
      executionTimeMs: data.executionTimeMs || 0,
      startedAt: toDate(data.startedAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    };
  },
};

// 7. Extraction Log Converter
export const extractionLogConverter: FirestoreDataConverter<ExtractionLogDoc> = {
  toFirestore(log: ExtractionLogDoc) {
    return cleanUndefined({
      ...log,
      createdAt: log.createdAt ? toTimestamp(log.createdAt) : serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ExtractionLogDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      crawlerLogId: data.crawlerLogId || '',
      rawSourceUrl: data.rawSourceUrl || '',
      announcementId: data.announcementId,
      status: data.status || 'SUCCESS',
      aiConfidenceScore: data.aiConfidenceScore ?? 1.0,
      extractedFields: data.extractedFields || {},
      validationErrors: Array.isArray(data.validationErrors) ? data.validationErrors : [],
      createdAt: toDate(data.createdAt),
    };
  },
};

// 8. Subscription Converter
export const subscriptionConverter: FirestoreDataConverter<SubscriptionDoc> = {
  toFirestore(sub: SubscriptionDoc) {
    return cleanUndefined({
      ...sub,
      startDate: toTimestamp(sub.startDate),
      endDate: toTimestamp(sub.endDate),
      createdAt: sub.createdAt ? toTimestamp(sub.createdAt) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): SubscriptionDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId || '',
      planType: data.planType || 'FREE',
      status: data.status || 'ACTIVE',
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      autoRenew: Boolean(data.autoRenew),
      features: Array.isArray(data.features) ? data.features : [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};

// 9. Notification Converter
export const notificationConverter: FirestoreDataConverter<NotificationDoc> = {
  toFirestore(notif: NotificationDoc) {
    return cleanUndefined({
      ...notif,
      readAt: notif.readAt ? toTimestamp(notif.readAt) : null,
      createdAt: notif.createdAt ? toTimestamp(notif.createdAt) : serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): NotificationDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId || '',
      title: data.title || '',
      message: data.message || '',
      type: data.type || 'SYSTEM',
      relatedJobId: data.relatedJobId,
      relatedApplicationId: data.relatedApplicationId,
      isRead: Boolean(data.isRead),
      readAt: data.readAt ? toDate(data.readAt) : undefined,
      createdAt: toDate(data.createdAt),
    };
  },
};

// 10. Audit Log Converter
export const auditLogConverter: FirestoreDataConverter<AuditLogDoc> = {
  toFirestore(audit: AuditLogDoc) {
    return cleanUndefined({
      ...audit,
      timestamp: audit.timestamp ? toTimestamp(audit.timestamp) : serverTimestamp(),
    });
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AuditLogDoc {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      actorId: data.actorId || '',
      actorEmail: data.actorEmail,
      actorRole: data.actorRole || 'USER',
      action: data.action || '',
      targetResource: data.targetResource || '',
      changes: data.changes || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: toDate(data.timestamp),
    };
  },
};
