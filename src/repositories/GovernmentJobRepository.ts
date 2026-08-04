import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit as firestoreLimit
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import { INITIAL_JOBS_SEED, JobItem } from '../data/initialJobsSeed.js';
import crypto from 'crypto';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

// Initialize Firebase App & Firestore
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const COLLECTION_NAME = 'job_announcements';

export interface JobFilterOptions {
  q?: string;
  keyword?: string;
  province?: string;
  agency?: string;
  ministry?: string;
  degree?: string;
  major?: string;
  positionType?: string;
  minSalary?: number | string;
  maxSalary?: number | string;
  closingDateRange?: string;
  ocscLevel?: string;
  sortBy?: string;
  page?: number | string;
  limit?: number | string;
  status?: string;
  traceId?: string;
}

export function calculateJobFingerprint(agencyName: string, title: string, applicationUrl?: string): string {
  const normAgency = (agencyName || '').trim().toLowerCase();
  const normTitle = (title || '').trim().toLowerCase();
  const normUrl = (applicationUrl || '').trim().toLowerCase();
  const raw = `${normAgency}|${normTitle}|${normUrl}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

export class GovernmentJobRepository {
  /**
   * Helper: Ensure fingerprint exists on a job item with standardized ISO-8601 timestamps
   */
  private static sanitizeJob(job: Partial<JobItem>): JobItem {
    const agencyName = job.agencyName || 'หน่วยงานภาครัฐ';
    const title = job.title || 'ตำแหน่งงานภาครัฐ';
    const applicationUrl = job.applicationUrl || '';
    const fingerprint = job.fingerprint || calculateJobFingerprint(agencyName, title, applicationUrl);
    const id = job.id || `crawled-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Standardize status: ACTIVE | CLOSED | EXPIRED | DRAFT
    let validStatus: 'ACTIVE' | 'CLOSED' | 'EXPIRED' | 'DRAFT' = 'ACTIVE';
    if (job.status === 'CLOSED' || job.status === 'EXPIRED' || job.status === 'DRAFT') {
      validStatus = job.status;
    }

    return {
      id,
      fingerprint,
      title,
      agencyName,
      agencyCode: job.agencyCode || '',
      ministry: job.ministry || 'กระทรวง',
      salaryMin: Number(job.salaryMin) || 15000,
      salaryMax: Number(job.salaryMax) || 18000,
      location: job.location || job.province || 'กรุงเทพมหานคร',
      province: job.province || 'กรุงเทพมหานคร',
      positionType: job.positionType || 'ข้าราชการพลเรือนสามัญ',
      vacanciesCount: Number(job.vacanciesCount) || 1,
      tags: Array.isArray(job.tags) ? job.tags : ['งานราชการ', 'เปิดสอบ'],
      ocscLevelRequired: job.ocscLevelRequired || 'LEVEL_3',
      degreeRequired: Array.isArray(job.degreeRequired) ? job.degreeRequired : ['ปริญญาตรี'],
      majorsAllowed: Array.isArray(job.majorsAllowed) ? job.majorsAllowed : ['ทุกสาขาวิชา'],
      requirementsText: job.requirementsText || 'คุณสมบัติเป็นไปตามที่หน่วยงานกำหนด',
      applicationUrl: job.applicationUrl || 'https://job.thai.com',
      deadline: job.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      examDate: job.examDate || '',
      status: validStatus,
      createdAt: job.createdAt || now,
      updatedAt: now,
      crawledAt: job.crawledAt || now
    };
  }

  /**
   * 1. findByFingerprint: Find an existing job document in Firestore by unique fingerprint
   */
  static async findByFingerprint(fingerprint: string, traceId?: string): Promise<JobItem | null> {
    const tid = traceId || generateTraceId();
    if (!fingerprint) return null;
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('fingerprint', '==', fingerprint), firestoreLimit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as JobItem;
    } catch (error) {
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.findByFingerprint', errorCode: 'DB_READ_FAILED' },
        `Failed to find job by fingerprint ${fingerprint}`,
        error
      );
      throw new DatabaseOperationalError({
        message: `Failed to query job by fingerprint`,
        operation: 'GovernmentJobRepository.findByFingerprint',
        traceId: tid,
        originalError: error,
      });
    }
  }

  /**
   * 2. upsert: Insert a new job or update existing if fingerprint exists
   */
  static async upsert(jobData: Partial<JobItem>, traceId?: string): Promise<{ id: string; isNew: boolean; job: JobItem }> {
    const tid = traceId || generateTraceId();
    const sanitized = this.sanitizeJob(jobData);
    
    // Check if job with this fingerprint already exists
    const existingByFingerprint = await this.findByFingerprint(sanitized.fingerprint, tid);
    let targetId = sanitized.id;
    let isNew = true;

    if (existingByFingerprint) {
      targetId = existingByFingerprint.id;
      isNew = false;
      sanitized.id = targetId;
      sanitized.createdAt = existingByFingerprint.createdAt || sanitized.createdAt;
    } else if (sanitized.id) {
      try {
        const docRef = doc(db, COLLECTION_NAME, sanitized.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          isNew = false;
          const existingData = snap.data() as JobItem;
          sanitized.createdAt = existingData.createdAt || sanitized.createdAt;
        }
      } catch (e) {
        // Ignored non-fatal lookup error
      }
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, targetId);
      await setDoc(docRef, sanitized, { merge: true });

      logger.info(
        {
          traceId: tid,
          operation: 'GovernmentJobRepository.upsert',
          entityId: targetId,
          result: 'SUCCESS',
        },
        `Successfully ${isNew ? 'inserted' : 'updated'} job announcement: ${targetId}`
      );

      return { id: targetId, isNew, job: sanitized };
    } catch (error) {
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.upsert', entityId: targetId, errorCode: 'DB_WRITE_FAILED' },
        `Failed to upsert job document ${targetId}`,
        error
      );
      throw new DatabaseOperationalError({
        message: `Failed to persist job document ${targetId}`,
        operation: 'GovernmentJobRepository.upsert',
        traceId: tid,
        entityId: targetId,
        originalError: error,
      });
    }
  }

  /**
   * 3. findActive: Hardened retrieval of job announcements from Firestore.
   * Zero silent fallbacks — database errors raise explicit operational errors.
   */
  static async findActive(filters: JobFilterOptions = {}): Promise<{
    data: JobItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tid = filters.traceId || generateTraceId();

    try {
      const colRef = collection(db, COLLECTION_NAME);
      const limitNum = Math.max(1, Math.min(100, parseInt(String(filters.limit || 100), 10)));
      const targetStatus = filters.status || 'ACTIVE';

      let allJobs: JobItem[] = [];

      try {
        let q;
        if (targetStatus !== 'ALL') {
          q = query(colRef, where('status', '==', targetStatus), firestoreLimit(100));
        } else {
          q = query(colRef, firestoreLimit(100));
        }
        const snap = await getDocs(q);
        allJobs = snap.docs.map(doc => doc.data() as JobItem);
      } catch (dbErr: any) {
        logger.error(
          { traceId: tid, operation: 'GovernmentJobRepository.findActive', errorCode: 'DB_QUERY_FAILED' },
          'Database query failed in findActive. Throwing operational error (zero silent fallbacks).',
          dbErr
        );
        throw new DatabaseOperationalError({
          message: `Database query failure during findActive execution: ${dbErr?.message || String(dbErr)}`,
          operation: 'GovernmentJobRepository.findActive',
          traceId: tid,
          originalError: dbErr,
        });
      }

      // Memory filtering over retrieved Firestore dataset
      if (targetStatus !== 'ALL') {
        allJobs = allJobs.filter(j => j.status === targetStatus);
      }

      // Query Keyword Filter
      const searchTerm = (filters.q || filters.keyword || '').trim().toLowerCase();
      if (searchTerm) {
        allJobs = allJobs.filter(j => 
          (j.title && j.title.toLowerCase().includes(searchTerm)) ||
          (j.agencyName && j.agencyName.toLowerCase().includes(searchTerm)) ||
          (j.ministry && j.ministry.toLowerCase().includes(searchTerm)) ||
          (j.requirementsText && j.requirementsText.toLowerCase().includes(searchTerm)) ||
          (j.province && j.province.toLowerCase().includes(searchTerm)) ||
          (j.tags && j.tags.some(t => t.toLowerCase().includes(searchTerm)))
        );
      }

      // Province Filter
      if (filters.province && filters.province !== 'ALL' && filters.province !== 'ทุกจังหวัด') {
        allJobs = allJobs.filter(j => j.province === filters.province || (j.location && j.location.includes(filters.province!)));
      }

      // Agency Filter
      if (filters.agency && filters.agency !== 'ALL') {
        allJobs = allJobs.filter(j => j.agencyName === filters.agency || j.agencyCode === filters.agency);
      }

      // Ministry Filter
      if (filters.ministry && filters.ministry !== 'ALL') {
        allJobs = allJobs.filter(j => j.ministry === filters.ministry);
      }

      // Degree Filter
      if (filters.degree && filters.degree !== 'ALL') {
        allJobs = allJobs.filter(j => j.degreeRequired && j.degreeRequired.includes(filters.degree!));
      }

      // Position Type Filter
      if (filters.positionType && filters.positionType !== 'ALL') {
        allJobs = allJobs.filter(j => j.positionType === filters.positionType);
      }

      // Salary Filter
      if (filters.minSalary) {
        const minVal = Number(filters.minSalary);
        if (!isNaN(minVal) && minVal > 0) {
          allJobs = allJobs.filter(j => (j.salaryMax || j.salaryMin || 0) >= minVal);
        }
      }

      if (filters.maxSalary) {
        const maxVal = Number(filters.maxSalary);
        if (!isNaN(maxVal) && maxVal > 0) {
          allJobs = allJobs.filter(j => (j.salaryMin || 0) <= maxVal);
        }
      }

      // OCSC Level Filter
      if (filters.ocscLevel && filters.ocscLevel !== 'ALL') {
        allJobs = allJobs.filter(j => j.ocscLevelRequired === filters.ocscLevel);
      }

      // Closing Date Range Filter
      if (filters.closingDateRange === 'CLOSING_SOON_7_DAYS') {
        const now = Date.now();
        const next7Days = now + 7 * 24 * 60 * 60 * 1000;
        allJobs = allJobs.filter(j => {
          if (!j.deadline) return false;
          const dlTime = new Date(j.deadline).getTime();
          return dlTime >= now && dlTime <= next7Days;
        });
      }

      // Sorting
      const sortBy = filters.sortBy || 'deadline_asc';
      allJobs.sort((a, b) => {
        if (sortBy === 'deadline_asc') {
          return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
        }
        if (sortBy === 'deadline_desc') {
          return new Date(b.deadline || '').getTime() - new Date(a.deadline || '').getTime();
        }
        if (sortBy === 'salary_desc') {
          return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
        }
        if (sortBy === 'vacancies_desc') {
          return (b.vacanciesCount || 0) - (a.vacanciesCount || 0);
        }
        if (sortBy === 'created_desc') {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
        return 0;
      });

      // Pagination
      const total = allJobs.length;
      const pageNum = Math.max(1, parseInt(String(filters.page || 1), 10));
      const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = allJobs.slice(startIndex, startIndex + limitNum);

      logger.info(
        {
          traceId: tid,
          operation: 'GovernmentJobRepository.findActive',
          result: 'SUCCESS',
          totalFound: total,
          pageSize: paginatedData.length,
        },
        `Retrieved ${paginatedData.length} job announcements (total: ${total})`
      );

      return {
        data: paginatedData,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      };
    } catch (error) {
      if (error instanceof DatabaseOperationalError) {
        throw error;
      }
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.findActive', errorCode: 'UNEXPECTED_READ_ERROR' },
        'Unexpected error in GovernmentJobRepository.findActive',
        error
      );
      throw new DatabaseOperationalError({
        message: 'Unexpected database failure while querying job announcements',
        operation: 'GovernmentJobRepository.findActive',
        traceId: tid,
        originalError: error,
      });
    }
  }

  /**
   * 4. expireJobs: Automatically set jobs past deadline to EXPIRED
   */
  static async expireJobs(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('status', '==', 'ACTIVE'), firestoreLimit(50));
      const snap = await getDocs(q);
      const nowTime = Date.now();
      let expiredCount = 0;

      for (const docSnap of snap.docs) {
        const job = docSnap.data() as JobItem;
        if (job.status === 'ACTIVE' && job.deadline) {
          const dlTime = new Date(job.deadline).getTime();
          if (dlTime < nowTime) {
            await setDoc(doc(db, COLLECTION_NAME, job.id), { status: 'EXPIRED', updatedAt: new Date().toISOString() }, { merge: true });
            expiredCount++;
          }
        }
      }
      logger.info(
        { traceId: tid, operation: 'GovernmentJobRepository.expireJobs', result: 'SUCCESS', count: expiredCount },
        `Expired ${expiredCount} job announcements past deadline`
      );
      return expiredCount;
    } catch (error) {
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.expireJobs', errorCode: 'DB_EXPIRE_FAILED' },
        'Error expiring jobs in database',
        error
      );
      throw new DatabaseOperationalError({
        message: 'Failed to execute job expiration process in database',
        operation: 'GovernmentJobRepository.expireJobs',
        traceId: tid,
        originalError: error,
      });
    }
  }

  /**
   * 5. count: Return document count in Firestore with explicit limits and operational error throwing
   */
  static async count(traceId?: string): Promise<{ total: number; active: number }> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      const total = snap.docs.length;
      const active = snap.docs.filter(d => (d.data() as JobItem).status === 'ACTIVE').length;
      return { total, active };
    } catch (error) {
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.count', errorCode: 'DB_COUNT_FAILED' },
        'Error retrieving job count from database',
        error
      );
      throw new DatabaseOperationalError({
        message: 'Failed to count job records in database',
        operation: 'GovernmentJobRepository.count',
        traceId: tid,
        originalError: error,
      });
    }
  }

  /**
   * 6. seedInitialDataIfEmpty: Seed initial verified government jobs if collection has 0 documents
   */
  static async seedInitialDataIfEmpty(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.length;
      }

      logger.info(
        { traceId: tid, operation: 'GovernmentJobRepository.seedInitialDataIfEmpty' },
        `Firestore ${COLLECTION_NAME} is empty. Seeding ${INITIAL_JOBS_SEED.length} baseline verified jobs...`
      );
      let count = 0;
      for (const item of INITIAL_JOBS_SEED) {
        try {
          const sanitized = this.sanitizeJob(item);
          const docRef = doc(db, COLLECTION_NAME, sanitized.id);
          await setDoc(docRef, sanitized, { merge: true });
          count++;
        } catch (writeErr: any) {
          logger.error(
            { traceId: tid, operation: 'GovernmentJobRepository.seedInitialDataIfEmpty', errorCode: 'SEED_WRITE_FAILED' },
            'Failed writing seed item to Firestore',
            writeErr
          );
          break;
        }
      }
      return count;
    } catch (error: any) {
      logger.error(
        { traceId: tid, operation: 'GovernmentJobRepository.seedInitialDataIfEmpty', errorCode: 'SEED_FAILED' },
        'Error seeding initial job data',
        error
      );
      return 0;
    }
  }
}
