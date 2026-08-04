/**
 * VERIIGO - Firestore Data Access Repositories for All 10 Entities
 * Features: Strong typing, Zod runtime validation, Converter attachment, Error diagnostics.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitTo,
} from 'firebase/firestore';

import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './error-handler';
import {
  userConverter,
  savedJobConverter,
  governmentAgencyConverter,
  recruitmentSourceConverter,
  jobAnnouncementConverter,
  crawlerLogConverter,
  extractionLogConverter,
  subscriptionConverter,
  notificationConverter,
  auditLogConverter,
} from './converters';

import {
  UserSchema,
  SavedJobSchema,
  GovernmentAgencySchema,
  RecruitmentSourceSchema,
  JobAnnouncementSchema,
  CrawlerLogSchema,
  ExtractionLogSchema,
  SubscriptionSchema,
  NotificationSchema,
  AuditLogSchema,
} from './schemas';

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

// ----------------------------------------------------------------------
// Collection References with Converters
// ----------------------------------------------------------------------
export const collections = {
  users: () => collection(db, 'users').withConverter(userConverter),
  savedJobs: () => collection(db, 'saved_jobs').withConverter(savedJobConverter),
  governmentAgencies: () => collection(db, 'government_agencies').withConverter(governmentAgencyConverter),
  recruitmentSources: () => collection(db, 'recruitment_sources').withConverter(recruitmentSourceConverter),
  jobAnnouncements: () => collection(db, 'job_announcements').withConverter(jobAnnouncementConverter),
  crawlerLogs: () => collection(db, 'crawler_logs').withConverter(crawlerLogConverter),
  extractionLogs: () => collection(db, 'extraction_logs').withConverter(extractionLogConverter),
  subscriptions: () => collection(db, 'subscriptions').withConverter(subscriptionConverter),
  notifications: () => collection(db, 'notifications').withConverter(notificationConverter),
  auditLogs: () => collection(db, 'audit_logs').withConverter(auditLogConverter),
};

// ----------------------------------------------------------------------
// 1. Users Repository
// ----------------------------------------------------------------------
export const UserRepository = {
  async getById(uid: string): Promise<UserDoc | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid).withConverter(userConverter));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async upsert(user: UserDoc): Promise<void> {
    const path = `users/${user.uid}`;
    try {
      UserSchema.parse(user);
      await setDoc(doc(db, 'users', user.uid).withConverter(userConverter), user, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 2. Saved Jobs Repository
// ----------------------------------------------------------------------
export const SavedJobRepository = {
  async getByUserId(userId: string): Promise<SavedJobDoc[]> {
    const path = `saved_jobs (query userId=${userId})`;
    try {
      const q = query(collections.savedJobs(), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async save(savedJob: SavedJobDoc): Promise<string> {
    const docId = savedJob.id || `${savedJob.userId}_${savedJob.jobAnnouncementId}`;
    const path = `saved_jobs/${docId}`;
    try {
      const dataToSave = { ...savedJob, id: docId };
      SavedJobSchema.parse(dataToSave);
      await setDoc(doc(db, 'saved_jobs', docId).withConverter(savedJobConverter), dataToSave);
      return docId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async remove(id: string): Promise<void> {
    const path = `saved_jobs/${id}`;
    try {
      await deleteDoc(doc(db, 'saved_jobs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 3. Government Agency Repository
// ----------------------------------------------------------------------
export const GovernmentAgencyRepository = {
  async getAll(): Promise<GovernmentAgencyDoc[]> {
    const path = `government_agencies`;
    try {
      const q = query(collections.governmentAgencies(), limitTo(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getById(id: string): Promise<GovernmentAgencyDoc | null> {
    const path = `government_agencies/${id}`;
    try {
      const snap = await getDoc(doc(db, 'government_agencies', id).withConverter(governmentAgencyConverter));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async upsert(agency: GovernmentAgencyDoc): Promise<void> {
    const path = `government_agencies/${agency.id}`;
    try {
      GovernmentAgencySchema.parse(agency);
      await setDoc(doc(db, 'government_agencies', agency.id).withConverter(governmentAgencyConverter), agency, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 4. Recruitment Source Repository
// ----------------------------------------------------------------------
export const RecruitmentSourceRepository = {
  async getAll(): Promise<RecruitmentSourceDoc[]> {
    const path = `recruitment_sources`;
    try {
      const q = query(collections.recruitmentSources(), limitTo(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getActive(): Promise<RecruitmentSourceDoc[]> {
    const path = `recruitment_sources (isActive=true)`;
    try {
      const q = query(collections.recruitmentSources(), where('isActive', '==', true), limitTo(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getById(id: string): Promise<RecruitmentSourceDoc | null> {
    const path = `recruitment_sources/${id}`;
    try {
      const snap = await getDoc(doc(db, 'recruitment_sources', id).withConverter(recruitmentSourceConverter));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async upsert(source: RecruitmentSourceDoc): Promise<void> {
    const path = `recruitment_sources/${source.id}`;
    try {
      RecruitmentSourceSchema.parse(source);
      await setDoc(doc(db, 'recruitment_sources', source.id).withConverter(recruitmentSourceConverter), source, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async delete(id: string): Promise<void> {
    const path = `recruitment_sources/${id}`;
    try {
      await deleteDoc(doc(db, 'recruitment_sources', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async updateHealth(
    id: string,
    healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE',
    latencyMs?: number,
    responseCode?: number,
    errorMessage?: string
  ): Promise<void> {
    const path = `recruitment_sources/${id}`;
    try {
      const docRef = doc(db, 'recruitment_sources', id);
      const updates: any = {
        healthStatus,
        updatedAt: new Date().toISOString(),
      };
      if (latencyMs !== undefined) updates.lastLatencyMs = latencyMs;
      if (responseCode !== undefined) updates.lastResponseCode = responseCode;
      if (errorMessage !== undefined) updates.lastErrorMessage = errorMessage;

      await updateDoc(docRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 5. Job Announcement Repository
// ----------------------------------------------------------------------
export const JobAnnouncementRepository = {
  async getActive(maxCount = 50): Promise<JobAnnouncementDoc[]> {
    const path = `job_announcements (status=ACTIVE)`;
    try {
      const q = query(
        collections.jobAnnouncements(),
        where('status', '==', 'ACTIVE'),
        orderBy('deadline', 'asc'),
        limitTo(maxCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getById(id: string): Promise<JobAnnouncementDoc | null> {
    const path = `job_announcements/${id}`;
    try {
      const snap = await getDoc(doc(db, 'job_announcements', id).withConverter(jobAnnouncementConverter));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async create(job: JobAnnouncementDoc): Promise<string> {
    const path = `job_announcements/${job.id || 'auto-gen'}`;
    try {
      JobAnnouncementSchema.parse(job);
      if (job.id) {
        await setDoc(doc(db, 'job_announcements', job.id).withConverter(jobAnnouncementConverter), job);
        return job.id;
      } else {
        const docRef = await addDoc(collections.jobAnnouncements(), job);
        return docRef.id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 6. Crawler Log Repository
// ----------------------------------------------------------------------
export const CrawlerLogRepository = {
  async record(log: CrawlerLogDoc): Promise<string> {
    const path = `crawler_logs/${log.id || 'auto-gen'}`;
    try {
      CrawlerLogSchema.parse(log);
      if (log.id) {
        await setDoc(doc(db, 'crawler_logs', log.id).withConverter(crawlerLogConverter), log);
        return log.id;
      } else {
        const ref = await addDoc(collections.crawlerLogs(), log);
        return ref.id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async getRecent(count = 20): Promise<CrawlerLogDoc[]> {
    const path = `crawler_logs (recent ${count})`;
    try {
      const q = query(collections.crawlerLogs(), orderBy('startedAt', 'desc'), limitTo(count));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },
};

// ----------------------------------------------------------------------
// 7. Extraction Log Repository
// ----------------------------------------------------------------------
export const ExtractionLogRepository = {
  async record(log: ExtractionLogDoc): Promise<string> {
    const path = `extraction_logs/${log.id || 'auto-gen'}`;
    try {
      ExtractionLogSchema.parse(log);
      if (log.id) {
        await setDoc(doc(db, 'extraction_logs', log.id).withConverter(extractionLogConverter), log);
        return log.id;
      } else {
        const ref = await addDoc(collections.extractionLogs(), log);
        return ref.id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 8. Subscription Repository
// ----------------------------------------------------------------------
export const SubscriptionRepository = {
  async getByUserId(userId: string): Promise<SubscriptionDoc | null> {
    const path = `subscriptions (userId=${userId})`;
    try {
      const q = query(
        collections.subscriptions(),
        where('userId', '==', userId),
        where('status', '==', 'ACTIVE'),
        limitTo(1)
      );
      const snap = await getDocs(q);
      return snap.empty ? null : snap.docs[0].data();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async upsert(subscription: SubscriptionDoc): Promise<void> {
    const path = `subscriptions/${subscription.id}`;
    try {
      SubscriptionSchema.parse(subscription);
      await setDoc(doc(db, 'subscriptions', subscription.id).withConverter(subscriptionConverter), subscription, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 9. Notification Repository
// ----------------------------------------------------------------------
export const NotificationRepository = {
  async getByUserId(userId: string, count = 20): Promise<NotificationDoc[]> {
    const path = `notifications (userId=${userId})`;
    try {
      const q = query(
        collections.notifications(),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limitTo(count)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async markAsRead(id: string): Promise<void> {
    const path = `notifications/${id}`;
    try {
      await updateDoc(doc(db, 'notifications', id), {
        isRead: true,
        readAt: new Date(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async create(notification: NotificationDoc): Promise<string> {
    const path = `notifications/${notification.id || 'auto-gen'}`;
    try {
      NotificationSchema.parse(notification);
      if (notification.id) {
        await setDoc(doc(db, 'notifications', notification.id).withConverter(notificationConverter), notification);
        return notification.id;
      } else {
        const ref = await addDoc(collections.notifications(), notification);
        return ref.id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },
};

// ----------------------------------------------------------------------
// 10. Audit Log Repository
// ----------------------------------------------------------------------
export const AuditLogRepository = {
  async record(auditLog: AuditLogDoc): Promise<string> {
    const path = `audit_logs/${auditLog.id || 'auto-gen'}`;
    try {
      AuditLogSchema.parse(auditLog);
      if (auditLog.id) {
        await setDoc(doc(db, 'audit_logs', auditLog.id).withConverter(auditLogConverter), auditLog);
        return auditLog.id;
      } else {
        const ref = await addDoc(collections.auditLogs(), auditLog);
        return ref.id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },
};
