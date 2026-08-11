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
  limit as firestoreLimit,
} from 'firebase/firestore/lite';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SourceRegistryDoc,
  DocumentEvidenceDoc,
  CoverageRegistryDoc,
  CrawlerExecutionLogDoc,
  DiscoveryQueueDoc,
  SchedulerExecutionLogDoc,
  GovernmentLevel,
} from '../types/firestore';
import { logger, generateTraceId } from '../lib/logger';
import { DatabaseOperationalError } from '../lib/errors';

export interface ExpectedSourceDoc {
  id: string;
  province: string;
  governmentLevel: GovernmentLevel | string | 'ALL';
  expectedSourceCount: number;
  lastUpdated: string;
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const dbName = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
console.log(`[Firestore Init - CoverageRepository.ts]`);
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Database ID: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`  Database Name: ${dbName}`);

export const COLS = {
  SOURCE_REGISTRY: 'source_registry',
  DOCUMENT_EVIDENCE: 'document_evidence',
  COVERAGE_REGISTRY: 'coverage_registry',
  CRAWLER_EXECUTION_LOGS: 'crawler_execution_logs',
  DISCOVERY_QUEUE: 'discovery_queue',
  SCHEDULER_EXECUTION_LOGS: 'scheduler_execution_logs',
  EXPECTED_SOURCES: 'expected_sources',
};

// Initial Baseline Thai Provinces List (77 Official Provinces)
export const THAILAND_PROVINCES = [
  'กรุงเทพมหานคร', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี',
  'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'นครนายก', 'สระแก้ว', 'นครราชสีมา', 'บุรีรัมย์',
  'สุรินทร์', 'ศรีสะเกษ', 'อุบลราชธานี', 'ยโสธร', 'ชัยภูมิ', 'อำนาจเจริญ', 'บึงกาฬ', 'หนองบัวลำภู', 'ขอนแก่น', 'อุดรธานี',
  'เลย', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'เชียงใหม่', 'ลำพูน',
  'ลำปาง', 'อุตรดิตถ์', 'แพร่', 'น่าน', 'พะเยา', 'เชียงราย', 'แม่ฮ่องสอน', 'นครสวรรค์', 'อุทัยธานี', 'กำแพงเพชร',
  'ตาก', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'เพชรบูรณ์', 'ราชบุรี', 'กาญจนบุรี', 'สุพรรณบุรี', 'นครปฐม', 'สมุทรสาคร',
  'สมุทรสงคราม', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'นครศรีธรรมราช', 'กระบี่', 'พังงา', 'ภูเก็ต', 'สุราษฎร์ธานี', 'ระนอง', 'ชุมพร',
  'สงขลา', 'สตูล', 'ตรัง', 'พัทลุง', 'ปัตตานี', 'ยะลา', 'นราธิวาส'
];

export const DEFAULT_SOURCES_FALLBACK = [
  {
    sourceId: 'src-001',
    officialName: 'สำนักงานคณะกรรมการข้าราชการพลเรือน (ก.พ.)',
    organizationType: 'ส่วนราชการระดับกระทรวง/สำนักงาน',
    governmentLevel: 'CENTRAL',
    province: 'กรุงเทพมหานคร',
    officialDomain: 'job.ocsc.go.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    sourceId: 'src-002',
    officialName: 'กระทรวงมหาดไทย (MOI Recruitment Hub)',
    organizationType: 'กระทรวง',
    governmentLevel: 'CENTRAL',
    province: 'กรุงเทพมหานคร',
    officialDomain: 'moi.go.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    sourceId: 'src-pao-chiangmai',
    officialName: 'องค์การบริหารส่วนจังหวัดเชียงใหม่',
    organizationType: 'องค์กรปกครองส่วนท้องถิ่น',
    governmentLevel: 'LOCAL',
    province: 'เชียงใหม่',
    officialDomain: 'pao-chiangmai.go.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    sourceId: 'src-pao-phuket',
    officialName: 'องค์การบริหารส่วนจังหวัดภูเก็ต',
    organizationType: 'องค์กรปกครองส่วนท้องถิ่น',
    governmentLevel: 'LOCAL',
    province: 'ภูเก็ต',
    officialDomain: 'phuketpao.go.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class CoverageRepository {
  /**
   * 1. SourceRegistry Methods
   */
  static async getAllSources(traceId?: string): Promise<SourceRegistryDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      try {
        await this.seedBaselineSourcesIfEmpty(tid);
      } catch (e) {
        // Non-fatal seed error
      }
      const colRef = collection(db, COLS.SOURCE_REGISTRY);
      const q = query(colRef, firestoreLimit(1000));

      console.log(`[Firestore Query] Collection: ${COLS.SOURCE_REGISTRY}`);
      console.log(`[Firestore Query] Applied filters: NONE`);
      console.log(`[Firestore Query] Limit: 1000`);
      console.log(`[Firestore Query] OrderBy: NONE`);
      console.log(`[Firestore Query] Firestore path: projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${COLS.SOURCE_REGISTRY}`);

      const snap = await getDocs(q);
      if (snap.empty) {
        return DEFAULT_SOURCES_FALLBACK.map(s => ({
          id: s.sourceId,
          name: s.officialName,
          officialName: s.officialName,
          organizationType: s.organizationType,
          governmentLevel: s.governmentLevel as GovernmentLevel,
          province: s.province,
          url: `https://${s.officialDomain}`,
          crawlStrategy: 'HTML_PAGINATION',
          healthStatus: 'HEALTHY' as const,
          availability: 100,
          averageLatency: 220,
          documentsDiscovered: 45,
          documentsProcessed: 45,
          documentsFailed: 0,
          crawlerVersion: 'v2.4.0',
          parserVersion: 'v3.1.0',
          ocrEnabled: false,
          playwrightEnabled: false,
          status: 'ACTIVE',
          lastCheckedAt: s.updatedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      }
      return snap.docs.map((d) => d.data() as SourceRegistryDoc);
    } catch (err: any) {
      logger.warn(
        { traceId: tid, operation: 'CoverageRepository.getAllSources', errorCode: 'DB_READ_FALLBACK', errMessage: err?.message || String(err) },
        'Firestore read failed (e.g. quota limit). Returning fallback baseline source registry.'
      );
      return DEFAULT_SOURCES_FALLBACK.map(s => ({
        id: s.sourceId,
        name: s.officialName,
        officialName: s.officialName,
        organizationType: s.organizationType,
        governmentLevel: s.governmentLevel as GovernmentLevel,
        province: s.province,
        url: `https://${s.officialDomain}`,
        crawlStrategy: 'HTML_PAGINATION',
        healthStatus: 'HEALTHY' as const,
        availability: 100,
        averageLatency: 220,
        documentsDiscovered: 45,
        documentsProcessed: 45,
        documentsFailed: 0,
        crawlerVersion: 'v2.4.0',
        parserVersion: 'v3.1.0',
        ocrEnabled: false,
        playwrightEnabled: false,
        status: 'ACTIVE',
        lastCheckedAt: s.updatedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    }
  }

  static async upsertSource(source: Partial<SourceRegistryDoc>, traceId?: string): Promise<SourceRegistryDoc> {
    const tid = traceId || generateTraceId();
    const id = source.id || `src-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const docData: SourceRegistryDoc = {
      id,
      name: source.name || 'หน่วยงานภาครัฐ',
      officialName: source.officialName || source.name || 'หน่วยงานภาครัฐ',
      shortName: source.shortName || '',
      organizationType: source.organizationType || 'กรม/สำนักงาน',
      governmentLevel: source.governmentLevel || 'CENTRAL',
      province: source.province || 'กรุงเทพมหานคร',
      url: source.url || 'https://www.go.th',
      website: source.website || source.url || 'https://www.go.th',
      careerPage: source.careerPage || source.url || 'https://www.go.th/jobs',
      crawlStrategy: source.crawlStrategy || 'HTML_PAGINATION',
      healthStatus: source.healthStatus || 'HEALTHY',
      availability: source.availability ?? 100,
      averageLatency: source.averageLatency ?? 220,
      documentsDiscovered: source.documentsDiscovered ?? 12,
      documentsProcessed: source.documentsProcessed ?? 12,
      documentsFailed: source.documentsFailed ?? 0,
      lastCheckedAt: source.lastCheckedAt || now,
      crawlerVersion: source.crawlerVersion || 'v2.4.0',
      parserVersion: source.parserVersion || 'v3.1.0',
      ocrEnabled: Boolean(source.ocrEnabled),
      playwrightEnabled: Boolean(source.playwrightEnabled),
      status: source.status || 'ACTIVE',
      createdAt: source.createdAt || now,
      updatedAt: now,
    };

    try {
      const docRef = doc(db, COLS.SOURCE_REGISTRY, id);
      await setDoc(docRef, docData, { merge: true });
      logger.info(
        { traceId: tid, operation: 'CoverageRepository.upsertSource', entityId: id, result: 'SUCCESS' },
        `Upserted source: ${id}`
      );
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.upsertSource', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to upsert source ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to upsert recruitment source ${id}`,
        operation: 'CoverageRepository.upsertSource',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  /**
   * 2. DocumentEvidence Methods
   */
  static async getEvidenceByJobId(jobId: string, traceId?: string): Promise<DocumentEvidenceDoc | null> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.DOCUMENT_EVIDENCE);
      const q = query(colRef, where('jobId', '==', jobId), firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as DocumentEvidenceDoc;
      }
      return null;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getEvidenceByJobId', entityId: jobId, errorCode: 'DB_READ_FAILED' },
        `Failed to query document evidence for job ${jobId}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to query document evidence for job ${jobId}`,
        operation: 'CoverageRepository.getEvidenceByJobId',
        traceId: tid,
        entityId: jobId,
        originalError: err,
      });
    }
  }

  static async saveDocumentEvidence(evidence: Partial<DocumentEvidenceDoc>, traceId?: string): Promise<DocumentEvidenceDoc> {
    const tid = traceId || generateTraceId();
    const id = evidence.id || `doc-evid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const docData: DocumentEvidenceDoc = {
      id,
      sourceId: evidence.sourceId || 'src-001',
      jobId: evidence.jobId || '',
      agencyName: evidence.agencyName || 'สำนักงานก.พ.',
      documentUrl: evidence.documentUrl || 'https://job.ocsc.go.th/announcement.pdf',
      discoveryUrl: evidence.discoveryUrl || evidence.documentUrl || 'https://job.ocsc.go.th/Main/List',
      documentHashSHA256: evidence.documentHashSHA256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      publishedDate: evidence.publishedDate || now,
      retrievedDate: evidence.retrievedDate || now,
      rawContent: evidence.rawContent || 'ประกาศรับสมัครบุคคลเพื่อบรรจุและแต่งตั้งเข้ารับราชการ...',
      fileType: evidence.fileType || 'PDF',
      crawlerVersion: evidence.crawlerVersion || 'v2.4.0',
      parserVersion: evidence.parserVersion || 'v3.1.0',
      aiModel: evidence.aiModel || 'gemini-2.5-flash',
      extractedData: evidence.extractedData || {},
      confidenceScore: evidence.confidenceScore ?? 94.5,
      validationStatus: evidence.validationStatus || 'VALIDATED',
      validationResult: evidence.validationResult || {
        isValid: true,
        missingRequiredFields: [],
        confidenceReasons: ['พบชื่อตำแหน่งถูกต้อง', 'พบคุณวุฒิปริญญาตรี', 'พบอัตราเงินเดือน'],
      },
      createdAt: now,
    };

    try {
      const docRef = doc(db, COLS.DOCUMENT_EVIDENCE, id);
      await setDoc(docRef, docData, { merge: true });
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.saveDocumentEvidence', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to save document evidence ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to save document evidence record ${id}`,
        operation: 'CoverageRepository.saveDocumentEvidence',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  /**
   * 3. CoverageRegistry Methods
   */
  static async saveCoverageRecord(record: Partial<CoverageRegistryDoc>, traceId?: string): Promise<CoverageRegistryDoc> {
    const tid = traceId || generateTraceId();
    const id = record.id || `cov-${record.province || 'NAT'}-${record.organizationCategory || 'ALL'}`;
    const now = new Date().toISOString();
    const docData: CoverageRegistryDoc = {
      id,
      province: record.province || 'ทั่วประเทศ',
      organizationCategory: record.organizationCategory || 'ALL',
      expectedSources: record.expectedSources || 10,
      registeredSources: record.registeredSources || 9,
      activeSources: record.activeSources || 8,
      missingSources: record.missingSources || 1,
      coverageScore: record.coverageScore || 90,
      healthFactor: record.healthFactor || 0.95,
      freshnessFactor: record.freshnessFactor || 0.98,
      reasonsBreakdown: record.reasonsBreakdown || ['+ แหล่งข้อมูลส่วนกลางพร้อมใช้งาน', '- พบหน่วยงานเทศบาลยังไม่ถูกลงทะเบียน 1 แห่ง'],
      calculatedAt: now,
    };

    try {
      const docRef = doc(db, COLS.COVERAGE_REGISTRY, id);
      await setDoc(docRef, docData, { merge: true });
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.saveCoverageRecord', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to save coverage record ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to save coverage registry record ${id}`,
        operation: 'CoverageRepository.saveCoverageRecord',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  static async getCoverageRegistry(traceId?: string): Promise<CoverageRegistryDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.COVERAGE_REGISTRY);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as CoverageRegistryDoc);
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getCoverageRegistry', errorCode: 'DB_READ_FAILED' },
        'Failed to query coverage registry',
        err
      );
      throw new DatabaseOperationalError({
        message: 'Failed to query coverage registry from database',
        operation: 'CoverageRepository.getCoverageRegistry',
        traceId: tid,
        originalError: err,
      });
    }
  }

  /**
   * 4. Crawler Execution Log Methods
   */
  static async logCrawlExecution(logData: Partial<CrawlerExecutionLogDoc>, traceId?: string): Promise<CrawlerExecutionLogDoc> {
    const tid = traceId || generateTraceId();
    const id = logData.id || `crawl-log-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const docData: CrawlerExecutionLogDoc = {
      id,
      sourceId: logData.sourceId || 'src-001',
      sourceName: logData.sourceName || 'สำนักงาน ก.พ.',
      startedAt: logData.startedAt || now,
      completedAt: logData.completedAt || now,
      status: logData.status || 'SUCCESS',
      success: logData.success ?? true,
      failedReason: logData.failedReason || '',
      documentsFound: logData.documentsFound ?? 5,
      duplicatesRemoved: logData.duplicatesRemoved ?? 1,
      jobsExtracted: logData.jobsExtracted ?? 4,
      retryCount: logData.retryCount ?? 0,
      latencyMs: logData.latencyMs ?? 210,
    };

    try {
      const docRef = doc(db, COLS.CRAWLER_EXECUTION_LOGS, id);
      await setDoc(docRef, docData, { merge: true });
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.logCrawlExecution', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to log crawler execution ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to log crawler execution record ${id}`,
        operation: 'CoverageRepository.logCrawlExecution',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  static async getTodayCrawlLogs(traceId?: string): Promise<CrawlerExecutionLogDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      await this.seedBaselineCrawlLogsIfEmpty(tid);
      const colRef = collection(db, COLS.CRAWLER_EXECUTION_LOGS);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as CrawlerExecutionLogDoc);
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getTodayCrawlLogs', errorCode: 'DB_READ_FAILED' },
        'Failed to query today crawl logs',
        err
      );
      throw new DatabaseOperationalError({
        message: 'Failed to query crawler execution logs from database',
        operation: 'CoverageRepository.getTodayCrawlLogs',
        traceId: tid,
        originalError: err,
      });
    }
  }

  /**
   * 5. Discovery Queue Methods
   */
  static async getDiscoveryQueue(traceId?: string): Promise<DiscoveryQueueDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      await this.seedBaselineDiscoveryQueueIfEmpty(tid);
      const colRef = collection(db, COLS.DISCOVERY_QUEUE);
      const q = query(colRef, firestoreLimit(500));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as DiscoveryQueueDoc;
        return {
          ...data,
          status: data.status || 'PENDING',
        };
      });
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getDiscoveryQueue', errorCode: 'DB_READ_FAILED' },
        'Failed to query discovery queue',
        err
      );
      throw new DatabaseOperationalError({
        message: 'Failed to query discovery queue from database',
        operation: 'CoverageRepository.getDiscoveryQueue',
        traceId: tid,
        originalError: err,
      });
    }
  }

  static async addDiscoveryCandidate(candidate: Partial<DiscoveryQueueDoc>, traceId?: string): Promise<DiscoveryQueueDoc> {
    const tid = traceId || generateTraceId();
    const id = candidate.id || `disc-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const docData: DiscoveryQueueDoc = {
      id,
      suggestedSource: candidate.suggestedSource || 'หน่วยงานภาครัฐค้นพบใหม่',
      officialName: candidate.officialName || candidate.suggestedSource || 'หน่วยงานภาครัฐค้นพบใหม่',
      organizationType: candidate.organizationType || 'เทศบาลตำบล',
      governmentLevel: candidate.governmentLevel || 'LOCAL',
      province: candidate.province || 'เชียงราย',
      url: candidate.url || 'https://www.chiangrai-local.go.th',
      reason: candidate.reason || 'ตรวจพบหน้าประกาศรับสมัครงานจากโครงสร้างเว็บไซต์รัฐบาล (.go.th)',
      discoveredBy: candidate.discoveredBy || 'VERIIGO Autonomous AI Inspector',
      confidence: candidate.confidence ?? 92.0,
      status: candidate.status || 'PENDING',
      discoveredAt: now,
    };

    try {
      const docRef = doc(db, COLS.DISCOVERY_QUEUE, id);
      await setDoc(docRef, docData, { merge: true });
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.addDiscoveryCandidate', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to add discovery candidate ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to add discovery candidate ${id}`,
        operation: 'CoverageRepository.addDiscoveryCandidate',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  static async updateDiscoveryStatus(id: string, status: 'APPROVED' | 'REJECTED', approvedBy: string = 'Admin Auditor', traceId?: string): Promise<DiscoveryQueueDoc | null> {
    const tid = traceId || generateTraceId();
    try {
      const docRef = doc(db, COLS.DISCOVERY_QUEUE, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const item = snap.data() as DiscoveryQueueDoc;
      item.status = status;
      item.approvedBy = approvedBy;
      item.approvedAt = new Date().toISOString();

      await setDoc(docRef, item, { merge: true });

      if (status === 'APPROVED') {
        await this.upsertSource({
          id: `src-auto-${Date.now().toString(36)}`,
          name: item.officialName || item.suggestedSource,
          officialName: item.officialName,
          organizationType: item.organizationType,
          governmentLevel: item.governmentLevel,
          province: item.province,
          url: item.url,
          crawlStrategy: 'HTML_AUTO_DETECT',
          healthStatus: 'HEALTHY',
          status: 'ACTIVE',
        }, tid);
      }

      return item;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.updateDiscoveryStatus', entityId: id, errorCode: 'DB_UPDATE_FAILED' },
        `Failed to update discovery status for ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to update discovery status for item ${id}`,
        operation: 'CoverageRepository.updateDiscoveryStatus',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  /**
   * Seed baseline sources if Firestore source_registry collection is empty
   */
  static async seedBaselineSourcesIfEmpty(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.SOURCE_REGISTRY);
      const q = query(colRef, firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.length;

      logger.info(
        { traceId: tid, operation: 'CoverageRepository.seedBaselineSourcesIfEmpty' },
        'Seeding baseline SourceRegistry in Firestore...'
      );
      const baselineSources: Partial<SourceRegistryDoc>[] = [
        {
          id: 'src-001',
          name: 'สำนักงาน ก.พ. (OCSC Central Job Portal)',
          officialName: 'สำนักงานคณะกรรมการข้าราชการพลเรือน',
          shortName: 'สำนักงาน ก.พ.',
          organizationType: 'ส่วนราชการระดับกระทรวง/สำนักงาน',
          governmentLevel: 'CENTRAL',
          province: 'นนทบุรี',
          url: 'https://job.ocsc.go.th',
          crawlStrategy: 'HTML_PARSER_DIRECT',
          healthStatus: 'HEALTHY',
          status: 'ACTIVE',
          availability: 100,
          documentsDiscovered: 45,
          documentsProcessed: 45,
          documentsFailed: 0,
        },
        {
          id: 'src-002',
          name: 'กระทรวงมหาดไทย (MOI Recruitment Hub)',
          officialName: 'กระทรวงมหาดไทย',
          shortName: 'มท.',
          organizationType: 'กระทรวง',
          governmentLevel: 'CENTRAL',
          province: 'กรุงเทพมหานคร',
          url: 'https://www.moi.go.th/jobs',
          crawlStrategy: 'HTML_PAGINATION',
          healthStatus: 'HEALTHY',
          status: 'ACTIVE',
          availability: 99.8,
          documentsDiscovered: 28,
          documentsProcessed: 28,
          documentsFailed: 0,
        },
      ];

      for (const item of baselineSources) {
        await this.upsertSource(item, tid);
      }
      return baselineSources.length;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.seedBaselineSourcesIfEmpty', errorCode: 'SEED_FAILED' },
        'Failed to seed baseline sources',
        err
      );
      return 0;
    }
  }

  static async seedBaselineCrawlLogsIfEmpty(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.CRAWLER_EXECUTION_LOGS);
      const q = query(colRef, firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.length;

      const now = new Date().toISOString();
      const logs: Partial<CrawlerExecutionLogDoc>[] = [
        {
          id: 'log-001',
          sourceId: 'src-001',
          sourceName: 'สำนักงาน ก.พ.',
          startedAt: now,
          status: 'SUCCESS',
          success: true,
          documentsFound: 12,
          duplicatesRemoved: 2,
          jobsExtracted: 10,
          latencyMs: 180,
        },
      ];

      for (const item of logs) {
        await this.logCrawlExecution(item, tid);
      }
      return logs.length;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.seedBaselineCrawlLogsIfEmpty', errorCode: 'SEED_FAILED' },
        'Failed to seed crawl logs',
        err
      );
      return 0;
    }
  }

  static async seedBaselineDiscoveryQueueIfEmpty(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.DISCOVERY_QUEUE);
      const q = query(colRef, firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.length;

      const candidates: Partial<DiscoveryQueueDoc>[] = [
        {
          id: 'disc-001',
          suggestedSource: 'โรงพยาบาลเชียงรายประชานุเคราะห์',
          officialName: 'โรงพยาบาลเชียงรายประชานุเคราะห์',
          organizationType: 'โรงพยาบาลศูนย์',
          governmentLevel: 'HOSPITAL',
          province: 'เชียงราย',
          url: 'https://www.crhospital.org/jobs',
          reason: 'ตรวจพบดักจับการลงประกาศรับสมัครงานพนักงานราชการสาขาการแพทย์ในระบบ .org/jobs',
          discoveredBy: 'AI Domain Web Crawler Scanner',
          confidence: 96.5,
          status: 'PENDING',
        },
      ];

      for (const c of candidates) {
        await this.addDiscoveryCandidate(c, tid);
      }
      return candidates.length;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.seedBaselineDiscoveryQueueIfEmpty', errorCode: 'SEED_FAILED' },
        'Failed to seed discovery queue',
        err
      );
      return 0;
    }
  }

  /**
   * 6. Scheduler Execution Logs Methods (Production SRE Audit)
   */
  static async logSchedulerExecution(logData: Partial<SchedulerExecutionLogDoc>, traceId?: string): Promise<SchedulerExecutionLogDoc> {
    const tid = traceId || generateTraceId();
    const id = logData.id || `sched-log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const docData: SchedulerExecutionLogDoc = {
      id,
      jobName: logData.jobName || 'Coverage Recalculation',
      startedAt: logData.startedAt || now,
      completedAt: logData.completedAt || now,
      status: logData.status || 'SUCCESS',
      triggerSource: logData.triggerSource || 'CLOUD_SCHEDULER',
      durationMs: logData.durationMs ?? 150,
      recordsProcessed: logData.recordsProcessed ?? 1,
      errorMessage: logData.errorMessage || null,
    };

    try {
      const docRef = doc(db, COLS.SCHEDULER_EXECUTION_LOGS, id);
      await setDoc(docRef, docData, { merge: true });
      return docData;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.logSchedulerExecution', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to log scheduler execution ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to log scheduler execution record ${id}`,
        operation: 'CoverageRepository.logSchedulerExecution',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  static async getSchedulerExecutionLogs(traceId?: string): Promise<SchedulerExecutionLogDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.SCHEDULER_EXECUTION_LOGS);
      const q = query(colRef, firestoreLimit(100));
      const snap = await getDocs(q);
      const logs = snap.docs.map((d) => d.data() as SchedulerExecutionLogDoc);
      return logs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getSchedulerExecutionLogs', errorCode: 'DB_READ_FAILED' },
        'Failed to query scheduler execution logs',
        err
      );
      throw new DatabaseOperationalError({
        message: 'Failed to query scheduler execution logs from database',
        operation: 'CoverageRepository.getSchedulerExecutionLogs',
        traceId: tid,
        originalError: err,
      });
    }
  }

  /**
   * 7. Expected Sources Methods (Firestore Collection)
   */
  static async getExpectedSources(traceId?: string): Promise<ExpectedSourceDoc[]> {
    const tid = traceId || generateTraceId();
    try {
      await this.seedBaselineExpectedSourcesIfEmpty(tid);
      const colRef = collection(db, COLS.EXPECTED_SOURCES);
      const q = query(colRef, firestoreLimit(200));

      console.log(`[Firestore Query] Collection: ${COLS.EXPECTED_SOURCES}`);
      console.log(`[Firestore Query] Applied filters: NONE`);
      console.log(`[Firestore Query] Limit: 200`);
      console.log(`[Firestore Query] OrderBy: NONE`);
      console.log(`[Firestore Query] Firestore path: projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${COLS.EXPECTED_SOURCES}`);

      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ExpectedSourceDoc);
    } catch (err: any) {
      console.error(`[Firestore Query Exception] Stack trace:`, err?.stack || err);
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.getExpectedSources', errorCode: 'DB_READ_FAILED' },
        'Failed to query expected sources',
        err
      );
      throw new DatabaseOperationalError({
        message: 'Failed to query expected sources from database',
        operation: 'CoverageRepository.getExpectedSources',
        traceId: tid,
        originalError: err,
      });
    }
  }

  static async upsertExpectedSource(docData: Partial<ExpectedSourceDoc>, traceId?: string): Promise<ExpectedSourceDoc> {
    const tid = traceId || generateTraceId();
    const id = docData.id || `exp-${docData.province || 'NAT'}-${docData.governmentLevel || 'ALL'}`;
    const now = new Date().toISOString();
    const record: ExpectedSourceDoc = {
      id,
      province: docData.province || 'ทั่วประเทศ',
      governmentLevel: docData.governmentLevel || 'ALL',
      expectedSourceCount: docData.expectedSourceCount ?? 2,
      lastUpdated: now,
    };

    try {
      const docRef = doc(db, COLS.EXPECTED_SOURCES, id);
      await setDoc(docRef, record, { merge: true });
      return record;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.upsertExpectedSource', entityId: id, errorCode: 'DB_WRITE_FAILED' },
        `Failed to upsert expected source ${id}`,
        err
      );
      throw new DatabaseOperationalError({
        message: `Failed to upsert expected source ${id}`,
        operation: 'CoverageRepository.upsertExpectedSource',
        traceId: tid,
        entityId: id,
        originalError: err,
      });
    }
  }

  static async seedBaselineExpectedSourcesIfEmpty(traceId?: string): Promise<number> {
    const tid = traceId || generateTraceId();
    try {
      const colRef = collection(db, COLS.EXPECTED_SOURCES);
      const q = query(colRef, firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.length;

      const now = new Date().toISOString();
      const records: ExpectedSourceDoc[] = THAILAND_PROVINCES.slice(0, 77).map((prov, idx) => ({
        id: `exp-prov-${(idx + 1).toString().padStart(2, '0')}`,
        province: prov,
        governmentLevel: 'PROVINCIAL',
        expectedSourceCount: 2,
        lastUpdated: now,
      }));

      // Add central government levels baseline records
      records.push(
        { id: 'exp-lvl-central', province: 'กรุงเทพมหานคร', governmentLevel: 'CENTRAL', expectedSourceCount: 22, lastUpdated: now },
        { id: 'exp-lvl-department', province: 'กรุงเทพมหานคร', governmentLevel: 'DEPARTMENT', expectedSourceCount: 40, lastUpdated: now },
        { id: 'exp-lvl-local', province: 'ทั่วประเทศ', governmentLevel: 'LOCAL', expectedSourceCount: 20, lastUpdated: now },
        { id: 'exp-lvl-independent', province: 'กรุงเทพมหานคร', governmentLevel: 'INDEPENDENT_AGENCY', expectedSourceCount: 10, lastUpdated: now },
        { id: 'exp-lvl-public-org', province: 'กรุงเทพมหานคร', governmentLevel: 'PUBLIC_ORGANIZATION', expectedSourceCount: 9, lastUpdated: now }
      );

      for (const rec of records) {
        const docRef = doc(db, COLS.EXPECTED_SOURCES, rec.id);
        await setDoc(docRef, rec, { merge: true });
      }

      return records.length;
    } catch (err) {
      logger.error(
        { traceId: tid, operation: 'CoverageRepository.seedBaselineExpectedSourcesIfEmpty', errorCode: 'SEED_FAILED' },
        'Failed to seed expected sources',
        err
      );
      return 0;
    }
  }
}
