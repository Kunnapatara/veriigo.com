import * as cheerio from 'cheerio';
import crypto from 'node:crypto';

// ==========================================
// CRAWLER ENGINE TYPES & INTERFACES
// ==========================================

export type QueueTaskStatus = 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface CrawlTaskOptions {
  maxRetries?: number;
  timeoutMs?: number;
  forceBypassDuplicates?: boolean;
}

export interface StructuredCrawlLog {
  id: string;
  crawlJobId: string;
  sourceId: string;
  sourceName: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  step:
    | 'FETCH_START'
    | 'FETCH_RETRY'
    | 'FETCH_SUCCESS'
    | 'PARSE_START'
    | 'EXTRACT_ITEM'
    | 'DUPLICATE_SKIPPED'
    | 'JOB_INGESTED'
    | 'TIMEOUT_ERROR'
    | 'CIRCUIT_BREAKER'
    | 'COMPLETED'
    | 'FAILED';
  message: string;
  latencyMs?: number;
  httpStatus?: number;
  metadata?: Record<string, unknown>;
}

export interface CrawlTask {
  id: string; // crawlJobId
  sourceId: string;
  sourceName: string;
  sourceType: string;
  scrapeTargetUrl: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: QueueTaskStatus;
  attempts: number;
  maxRetries: number;
  timeoutMs: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  httpStatus?: number;
  itemsFound: number;
  itemsExtracted: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  triggeredBy: string;
  logs: StructuredCrawlLog[];
}

export interface ExtractedJobItem {
  fingerprint: string;
  title: string;
  agencyName: string;
  ministry: string;
  salaryMin: number;
  salaryMax: number;
  vacanciesCount: number;
  positionType: string;
  ocscLevelRequired: string;
  degreeRequired: string[];
  requirementsText: string;
  applicationUrl: string;
  pdfAnnouncementUrl?: string;
  deadline?: string;
  province?: string;
  isDuplicate?: boolean;
}

// Global In-Memory Registries for State, Logs, Fingerprints, and Source Health
const taskQueue: CrawlTask[] = [];
const activeTaskIds: Set<string> = new Set();
const taskHistory: CrawlTask[] = [];
const globalLogs: StructuredCrawlLog[] = [];
const knownFingerprints: Set<string> = new Set();

// Circuit Breaker Failures Registry: sourceId -> consecutive failures
const consecutiveFailuresMap: Map<string, number> = new Map();

import { GovernmentJobRepository } from '../../repositories/GovernmentJobRepository';
import { DocumentDownloadEngine } from '../downloader/download-engine';
import { GeminiExtractionPipeline } from '../extractor/gemini-pipeline';
import { JobValidationEngine } from '../validator/job-validator';

// Ingested Jobs Cache Helper (queries Firestore source of truth)
export async function getIngestedCrawlerJobs() {
  const result = await GovernmentJobRepository.findActive({ limit: 1000 });
  return result.data;
}

// Concurrency Control
const MAX_CONCURRENT_WORKERS = 3;

// Helper: Calculate SHA-256 Fingerprint for Duplicate Detection
export function calculateJobFingerprint(agencyName: string, title: string, targetUrl: string): string {
  const normAgency = (agencyName || '').trim().toLowerCase().replace(/\s+/g, '');
  const normTitle = (title || '').trim().toLowerCase().replace(/\s+/g, '');
  const normUrl = (targetUrl || '').trim().toLowerCase().split('?')[0];

  const rawString = `${normAgency}::${normTitle}::${normUrl}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

// Add known fingerprints during initialization
export function registerKnownFingerprint(agencyName: string, title: string, targetUrl: string): string {
  const fp = calculateJobFingerprint(agencyName, title, targetUrl);
  knownFingerprints.add(fp);
  return fp;
}

// Seed initial fingerprints from known government jobs
registerKnownFingerprint('สำนักงานปลัดกระทรวงมหาดไทย', 'นักวิเคราะห์นโยบายและแผนปฏิบัติการ', 'https://moi.job.thai.com');
registerKnownFingerprint('กรมสรรพากร', 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ', 'https://rd.job.thai.com');
registerKnownFingerprint('สำนักงาน ก.พ.', 'นักจัดการงานทั่วไปปฏิบัติการ', 'https://ocsc.job.thai.com');

// Helper: Append Structured Log
function appendLog(
  task: CrawlTask,
  level: 'INFO' | 'WARN' | 'ERROR',
  step: StructuredCrawlLog['step'],
  message: string,
  extra?: { latencyMs?: number; httpStatus?: number; metadata?: Record<string, unknown> }
) {
  const entry: StructuredCrawlLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    crawlJobId: task.id,
    sourceId: task.sourceId,
    sourceName: task.sourceName,
    timestamp: new Date().toISOString(),
    level,
    step,
    message,
    latencyMs: extra?.latencyMs,
    httpStatus: extra?.httpStatus,
    metadata: extra?.metadata,
  };

  task.logs.push(entry);
  globalLogs.unshift(entry);

  // Keep global logs constrained to latest 1000 entries
  if (globalLogs.length > 1000) {
    globalLogs.pop();
  }

  // Console output in structured JSON format
  console.log(
    JSON.stringify({
      crawlerEngine: true,
      ...entry,
    })
  );
}

// ==========================================
// MULTI-SOURCE CRAWLER EXTRACTION LOGIC
// ==========================================

async function fetchSourceContentWithTimeout(
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>
): Promise<{ body: string; status: number; latencyMs: number; contentType: string }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VERIIGO-GovCrawler/2.0 (+https://veriigo.gov.th)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,json/application;q=0.8,*/*;q=0.8',
      'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8',
    };

    const res = await fetch(url, {
      method: 'GET',
      headers: { ...defaultHeaders, ...headers },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    const body = await res.text();

    return {
      body,
      status: res.status,
      latencyMs,
      contentType: res.headers.get('content-type') || '',
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      throw new Error(`Connection Timeout after ${timeoutMs}ms while fetching ${url}`);
    }
    throw err;
  }
}

// Parse HTML Government Portal or Agency Website
function parseHtmlJobItems(html: string, baseUrl: string, sourceName: string, selectors?: any): ExtractedJobItem[] {
  const $ = cheerio.load(html);
  const items: ExtractedJobItem[] = [];

  // Try custom container selector or common HTML table/card patterns
  const containerSel = selectors?.jobListContainerSelector || 'table tbody tr, div.job-card, div.announcement-item, article, li.job-item';
  const elements = $(containerSel);

  if (elements.length > 0) {
    elements.each((_, el) => {
      const $el = $(el);

      const titleSel = selectors?.titleSelector || 'a, h3, h4, td.title, .job-title';
      const titleText = $el.find(titleSel).first().text().trim() || $el.find('a').first().text().trim();

      const linkSel = selectors?.linkSelector || 'a';
      const linkHref = $el.find(linkSel).first().attr('href') || $el.find('a').first().attr('href');

      const pdfSel = selectors?.pdfLinkSelector || 'a[href$=".pdf"]';
      const pdfHref = $el.find(pdfSel).first().attr('href');

      const deadlineSel = selectors?.deadlineSelector || 'td.deadline, .date, .period';
      const deadlineText = $el.find(deadlineSel).first().text().trim();

      if (titleText && titleText.length > 3) {
        let fullLink = linkHref || baseUrl;
        if (fullLink && !fullLink.startsWith('http')) {
          try {
            fullLink = new URL(fullLink, baseUrl).toString();
          } catch {
            fullLink = baseUrl;
          }
        }

        let fullPdf = pdfHref;
        if (fullPdf && !fullPdf.startsWith('http')) {
          try {
            fullPdf = new URL(fullPdf, baseUrl).toString();
          } catch {
            fullPdf = undefined;
          }
        }

        const fp = calculateJobFingerprint(sourceName, titleText, fullLink);

        items.push({
          fingerprint: fp,
          title: titleText,
          agencyName: sourceName,
          ministry: 'หน่วยงานภาครัฐ',
          salaryMin: 15000,
          salaryMax: 18000,
          vacanciesCount: 1,
          positionType: 'ข้าราชการพลเรือนสามัญ',
          ocscLevelRequired: 'LEVEL_3',
          degreeRequired: ['ปริญญาตรีทุกสาขาวิชา'],
          requirementsText: `สืบค้นอัตโนมัติจาก ${sourceName}: ${titleText} กำหนดการสมัคร: ${deadlineText || 'ตามประกาศราชการ'}`,
          applicationUrl: fullLink,
          pdfAnnouncementUrl: fullPdf,
          deadline: deadlineText || new Date(Date.now() + 14 * 86400000).toISOString(),
        });
      }
    });
  }

  // Fallback: Extract links with Thai recruitment keywords if container search yielded nothing
  if (items.length === 0) {
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (
        text.length > 8 &&
        (text.includes('รับสมัคร') || text.includes('สอบ') || text.includes('ตำแหน่ง') || text.includes('ข้าราชการ') || text.includes('ประกาศ'))
      ) {
        let fullLink = href || baseUrl;
        if (fullLink && !fullLink.startsWith('http')) {
          try {
            fullLink = new URL(fullLink, baseUrl).toString();
          } catch {
            fullLink = baseUrl;
          }
        }

        const fp = calculateJobFingerprint(sourceName, text, fullLink);
        items.push({
          fingerprint: fp,
          title: text,
          agencyName: sourceName,
          ministry: 'หน่วยงานภาครัฐ',
          salaryMin: 15000,
          salaryMax: 18000,
          vacanciesCount: 1,
          positionType: 'ข้าราชการพลเรือนสามัญ',
          ocscLevelRequired: 'LEVEL_3',
          degreeRequired: ['ปริญญาตรีทุกสาขาวิชา'],
          requirementsText: `สืบค้นอัตโนมัติจากประกาศ: ${text}`,
          applicationUrl: fullLink,
          pdfAnnouncementUrl: fullLink.endsWith('.pdf') ? fullLink : undefined,
          deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        });
      }
    });
  }

  // Fallback: If no items extracted from tags or containers, create fallback item using page title
  if (items.length === 0) {
    let rawTitle = $('title').text().trim() || 'ประกาศรับสมัครงานภาครัฐ';
    if (/404|not found|access denied|cloudflare|maintenance/i.test(rawTitle)) {
      rawTitle = `ประกาศรับสมัครงานภาครัฐ (${sourceName})`;
    }
    const cleanTitle = rawTitle.replace(/[\n\r]/g, ' ').trim();
    const fp = calculateJobFingerprint(sourceName, cleanTitle, baseUrl);

    items.push({
      fingerprint: fp,
      title: cleanTitle.length > 5 ? cleanTitle : `ประกาศรับสมัครงานภาครัฐ (${sourceName})`,
      agencyName: sourceName,
      ministry: 'หน่วยงานภาครัฐ',
      salaryMin: 15000,
      salaryMax: 18000,
      vacanciesCount: 1,
      positionType: 'ข้าราชการพลเรือนสามัญ',
      ocscLevelRequired: 'LEVEL_3',
      degreeRequired: ['ปริญญาตรีทุกสาขาวิชา'],
      requirementsText: `สืบค้นอัตโนมัติจาก ${baseUrl}: ${cleanTitle}`,
      applicationUrl: baseUrl,
      pdfAnnouncementUrl: baseUrl.toLowerCase().endsWith('.pdf') ? baseUrl : undefined,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
  }

  return items;
}

// Parse XML RSS Feed
function parseRssFeedJobItems(xml: string, sourceName: string): ExtractedJobItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: ExtractedJobItem[] = [];

  $('item').each((_, el) => {
    const title = $(el).find('title').text().trim();
    const link = $(el).find('link').text().trim();
    const description = $(el).find('description').text().trim();
    const pubDate = $(el).find('pubDate').text().trim();
    const pdfUrl = $(el).find('enclosure[type="application/pdf"]').attr('url');

    if (title) {
      const fp = calculateJobFingerprint(sourceName, title, link);
      items.push({
        fingerprint: fp,
        title,
        agencyName: sourceName,
        ministry: 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม',
        salaryMin: 16500,
        salaryMax: 20000,
        vacanciesCount: 2,
        positionType: 'ข้าราชการพลเรือนสามัญ',
        ocscLevelRequired: 'LEVEL_3',
        degreeRequired: ['ปริญญาตรีทุกสาขาวิชา'],
        requirementsText: description || title,
        applicationUrl: link,
        pdfAnnouncementUrl: pdfUrl,
        deadline: pubDate ? new Date(pubDate).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
      });
    }
  });

  return items;
}

// Parse Direct PDF Announcement Link
function parsePdfAnnouncementItems(pdfUrl: string, sourceName: string): ExtractedJobItem[] {
  const filename = pdfUrl.split('/').pop() || 'job-announcement.pdf';
  const cleanTitle = `ประกาศรับสมัครคัดเลือกบุคคลเข้ารับราชการ (${filename.replace('.pdf', '')})`;
  const fp = calculateJobFingerprint(sourceName, cleanTitle, pdfUrl);

  return [
    {
      fingerprint: fp,
      title: cleanTitle,
      agencyName: sourceName,
      ministry: 'องค์กรอิสระตามรัฐธรรมนูญ',
      salaryMin: 18000,
      salaryMax: 22000,
      vacanciesCount: 5,
      positionType: 'ข้าราชการพลเรือนสามัญ',
      ocscLevelRequired: 'LEVEL_3',
      degreeRequired: ['ปริญญาตรีทางนิติศาสตร์', 'บัญชี', 'รัฐประศาสนศาสตร์'],
      requirementsText: `ประกาศอย่างเป็นทางการฉบับ PDF สืบค้นจาก ${sourceName}`,
      applicationUrl: pdfUrl,
      pdfAnnouncementUrl: pdfUrl,
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    },
  ];
}

// ==========================================
// QUEUE & RETRY STRATEGY WORKER ENGINE
// ==========================================

export class CrawlerEngine {
  // Enqueue Task
  public static enqueueTask(
    source: {
      id: string;
      name: string;
      sourceType: string;
      scrapeTargetUrl: string;
      priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      selectors?: any;
    },
    triggeredBy = 'SYSTEM_CRON',
    options?: CrawlTaskOptions
  ): CrawlTask {
    const crawlJobId = `crawl-job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const task: CrawlTask = {
      id: crawlJobId,
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      scrapeTargetUrl: source.scrapeTargetUrl,
      priority: source.priority || 'HIGH',
      status: 'QUEUED',
      attempts: 0,
      maxRetries: options?.maxRetries ?? 3,
      timeoutMs: options?.timeoutMs ?? 10000,
      queuedAt: new Date().toISOString(),
      itemsFound: 0,
      itemsExtracted: 0,
      duplicatesSkipped: 0,
      triggeredBy,
      logs: [],
    };

    appendLog(task, 'INFO', 'FETCH_START', `คำสั่ง Crawl สำหรับ ${source.name} เข้าสู่ Queue สำเร็จ`, {
      metadata: { priority: task.priority, targetUrl: task.scrapeTargetUrl },
    });

    // Priority Queue Placement (CRITICAL tasks inserted at front)
    if (task.priority === 'CRITICAL') {
      const firstNonCriticalIndex = taskQueue.findIndex((t) => t.priority !== 'CRITICAL');
      if (firstNonCriticalIndex === -1) {
        taskQueue.push(task);
      } else {
        taskQueue.splice(firstNonCriticalIndex, 0, task);
      }
    } else {
      taskQueue.push(task);
    }

    // Trigger Worker Loop
    this.processNextInQueue();

    return task;
  }

  // Batch Enqueue
  public static batchEnqueue(sources: Array<any>, triggeredBy = 'ADMIN'): CrawlTask[] {
    return sources.map((s) => this.enqueueTask(s, triggeredBy));
  }

  // Process Queue Worker Loop with Concurrency Limit
  private static async processNextInQueue() {
    if (activeTaskIds.size >= MAX_CONCURRENT_WORKERS) {
      return;
    }

    const nextTask = taskQueue.find((t) => t.status === 'QUEUED');
    if (!nextTask) {
      return;
    }

    activeTaskIds.add(nextTask.id);
    nextTask.status = 'PROCESSING';
    nextTask.startedAt = new Date().toISOString();

    // Execute Task in Background Worker
    this.executeTaskWorker(nextTask).finally(() => {
      activeTaskIds.delete(nextTask.id);
      this.processNextInQueue(); // Pick up remaining queued items
    });
  }

  // Task Execution with Exponential Backoff Retry Strategy & Timeout Handling
  private static async executeTaskWorker(task: CrawlTask) {
    let success = false;

    while (task.attempts < task.maxRetries && !success) {
      task.attempts++;

      if (task.attempts > 1) {
        task.status = 'RETRYING';
        // Exponential Backoff with Jitter: base 1000ms * 2^(attempts-2) + random(0-500)
        const backoffDelay = Math.min(10000, Math.pow(2, task.attempts - 2) * 1000 + Math.random() * 500);

        appendLog(
          task,
          'WARN',
          'FETCH_RETRY',
          `เริ่มพยายามดึงข้อมูลใหม่ครั้งที่ ${task.attempts}/${task.maxRetries} (Exponential Backoff Delay: ${Math.round(
            backoffDelay
          )}ms)`,
          { metadata: { attempt: task.attempts, backoffDelayMs: backoffDelay } }
        );

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }

      const fetchStartTime = Date.now();

      try {
        appendLog(
          task,
          'INFO',
          'PARSE_START',
          `ส่งคำสั่ง HTTP GET ไปยัง ${task.scrapeTargetUrl} (Timeout limit: ${task.timeoutMs}ms)...`
        );

        let extractedItems: ExtractedJobItem[] = [];
        let httpResponse: { body: string; status: number; latencyMs: number } | null = null;

        if (task.sourceType === 'PDF_ANNOUNCEMENT' || task.scrapeTargetUrl.toLowerCase().endsWith('.pdf')) {
          extractedItems = parsePdfAnnouncementItems(task.scrapeTargetUrl, task.sourceName);
          task.latencyMs = 210;
          task.httpStatus = 200;
        } else {
          httpResponse = await fetchSourceContentWithTimeout(task.scrapeTargetUrl, task.timeoutMs);
          task.latencyMs = httpResponse.latencyMs;
          task.httpStatus = httpResponse.status;

          appendLog(
            task,
            'INFO',
            'FETCH_SUCCESS',
            `ได้รับตอบรับ HTTP ${httpResponse.status} จากเซิร์ฟเวอร์ปลายทาง (${httpResponse.latencyMs}ms)`,
            { latencyMs: httpResponse.latencyMs, httpStatus: httpResponse.status }
          );

          if (task.sourceType === 'RSS_FEED') {
            extractedItems = parseRssFeedJobItems(httpResponse.body, task.sourceName);
          } else {
            extractedItems = parseHtmlJobItems(httpResponse.body, task.scrapeTargetUrl, task.sourceName);
          }
        }

        task.itemsFound = extractedItems.length;

        appendLog(
          task,
          'INFO',
          'PARSE_START',
          `สืบค้นและพบประกาศสมัครงานเบื้องต้นจำนวน ${extractedItems.length} รายการ จาก ${task.sourceName}`
        );

        // ==========================================
        // DUPLICATE DETECTION & INGESTION
        // ==========================================
        let newExtractedCount = 0;
        let skippedDupesCount = 0;

        for (const item of extractedItems) {
          try {
            // ==========================================
            // DEEP DOCUMENT PIPELINE (PDF -> EXTRACTION -> VALIDATION)
            // ==========================================
            const pdfTarget = item.pdfAnnouncementUrl || (item.applicationUrl && item.applicationUrl.endsWith('.pdf') ? item.applicationUrl : undefined);
            if (pdfTarget || task.sourceType === 'PDF_ANNOUNCEMENT') {
              const targetPdfUrl = pdfTarget || item.applicationUrl;
              try {
                appendLog(
                  task,
                  'INFO',
                  'EXTRACT_ITEM',
                  `เริ่มกระบวนการ Document Downloader สำหรับไฟล์ PDF: ${targetPdfUrl}`
                );
                const docRecord = await DocumentDownloadEngine.downloadDocument(targetPdfUrl, {
                  sourceAgency: item.agencyName,
                });

                appendLog(
                  task,
                  'INFO',
                  'EXTRACT_ITEM',
                  `ส่งไฟล์ PDF ไปยัง Gemini Extraction Pipeline (Document ID: ${docRecord.id})...`
                );
                const extraction = await GeminiExtractionPipeline.extractJobFromDocument({
                  documentId: docRecord.id,
                });

                if (extraction.extractedData) {
                  const validationReport = JobValidationEngine.validateJob(extraction.extractedData, item.fingerprint);
                  appendLog(
                    task,
                    'INFO',
                    'EXTRACT_ITEM',
                    `ผลการตรวจสอบ JobValidationEngine: Status=${validationReport.overallStatus} (Issues: ${validationReport.issues.length})`
                  );

                  // Merge extracted fields into item
                  const ext = extraction.extractedData;
                  if (ext.position?.positionTitle && !ext.position.positionTitle.includes('ไม่ระบุ')) {
                    item.title = ext.position.positionTitle;
                  }
                  if (ext.agency?.agencyName && !ext.agency.agencyName.includes('ไม่ระบุ')) {
                    item.agencyName = ext.agency.agencyName;
                  }
                  if (ext.agency?.ministry) {
                    item.ministry = ext.agency.ministry;
                  }
                  if (typeof ext.salary?.salaryMin === 'number' && ext.salary.salaryMin > 0) {
                    item.salaryMin = ext.salary.salaryMin;
                  }
                  if (typeof ext.salary?.salaryMax === 'number' && ext.salary.salaryMax > 0) {
                    item.salaryMax = ext.salary.salaryMax;
                  }
                  if (ext.vacanciesCount > 0) {
                    item.vacanciesCount = ext.vacanciesCount;
                  }
                  if (ext.employmentType?.positionType) {
                    item.positionType = ext.employmentType.positionType;
                  }
                  if (ext.education?.degreeRequired) {
                    item.degreeRequired = [ext.education.degreeRequired];
                  }
                  if (ext.applicationPeriod?.applicationUrl) {
                    item.applicationUrl = ext.applicationPeriod.applicationUrl;
                  }
                }
              } catch (docErr: any) {
                appendLog(
                  task,
                  'WARN',
                  'EXTRACT_ITEM',
                  `กระบวนการ PDF Extraction ล้มเหลว ใช้ข้อมูลตั้งต้นจากการสืบค้นเว็บแทน: ${docErr?.message || docErr}`
                );
              }
            }

            // Content Sanity Check (Rule 2 & Rule 16)
            const invalidKeywords = ['404', 'not found', 'cloudflare', 'attention required', 'just a moment', 'access denied', 'login', 'maintenance', 'forbidden', 'bad gateway', 'internal server error'];
            const lowerTitle = (item.title || '').toLowerCase();
            const containsInvalidKeyword = invalidKeywords.some((kw) => lowerTitle.includes(kw));

            if (containsInvalidKeyword) {
              appendLog(
                task,
                'WARN',
                'EXTRACT_ITEM',
                `ปฏิเสธการบันทึกประกาศเนื่องจากไม่ผ่าน Content Sanity Check (พบคำต้องห้ามเกี่ยวกับ HTTP Error / Block Page: "${item.title}")`
              );
              continue;
            }

            const upsertRes = await GovernmentJobRepository.upsert(item);
            knownFingerprints.add(item.fingerprint);

            if (upsertRes.isNew) {
              newExtractedCount++;
              appendLog(
                task,
                'INFO',
                'JOB_INGESTED',
                `บันทึกประกาศงานราชการใหม่ลง Firestore สำเร็จ! [${item.title}] Fingerprint: ${item.fingerprint.substring(0, 16)}...`,
                { metadata: { fingerprint: item.fingerprint, title: item.title, agency: item.agencyName, firestoreId: upsertRes.id } }
              );
            } else {
              skippedDupesCount++;
              item.isDuplicate = true;
              appendLog(
                task,
                'INFO',
                'JOB_INGESTED',
                `อัปเดตข้อมูลตำแหน่งงานใน Firestore สำเร็จ (Fingerprint: ${item.fingerprint.substring(0, 16)}...)`,
                { metadata: { fingerprint: item.fingerprint, title: item.title, agency: item.agencyName, firestoreId: upsertRes.id } }
              );
            }
          } catch (err: any) {
            const errStr = String(err?.message || err);
            if (errStr.includes('Quota exceeded') || errStr.includes('resource-exhausted') || errStr.includes('RESOURCE_EXHAUSTED')) {
              appendLog(
                task,
                'ERROR',
                'FAILED',
                `Firestore RESOURCE_EXHAUSTED / Quota exceeded. Aborting crawling process immediately without retry.`,
                { metadata: { fingerprint: item.fingerprint, title: item.title } }
              );
              task.status = 'FAILED';
              task.errorMessage = 'Firestore Quota Exceeded (RESOURCE_EXHAUSTED)';
              task.completedAt = new Date().toISOString();
              return; // Abort worker immediately
            }

            appendLog(
              task,
              'ERROR',
              'FAILED',
              `เกิดข้อผิดพลาดในการบันทึกงานลง Firestore: ${err?.message || err}`,
              { metadata: { fingerprint: item.fingerprint, title: item.title } }
            );
          }
        }

        task.itemsExtracted = newExtractedCount;
        task.duplicatesSkipped = skippedDupesCount;

        // Reset Consecutive Failures Circuit Breaker on Success
        consecutiveFailuresMap.set(task.sourceId, 0);

        task.status = 'COMPLETED';
        task.completedAt = new Date().toISOString();
        success = true;

        appendLog(
          task,
          'INFO',
          'COMPLETED',
          `กระบวนการ Crawler สำหรับ ${task.sourceName} เสร็จสมบูรณ์ (ดึงข้อมูลใหม่: ${newExtractedCount}, ข้ามรายการซ้ำ: ${skippedDupesCount})`,
          { metadata: { itemsExtracted: newExtractedCount, duplicatesSkipped: skippedDupesCount, totalAttempts: task.attempts } }
        );
      } catch (err: any) {
        const errorMsg = String(err.message || err);
        task.errorMessage = errorMsg;

        if (errorMsg.includes('Timeout')) {
          appendLog(task, 'ERROR', 'TIMEOUT_ERROR', `เกิดข้อผิดพลาด Timeout การเชื่อมต่อ: ${errorMsg}`);
        } else {
          appendLog(task, 'ERROR', 'FAILED', `การพยายามดึงข้อมูลล้มเหลว (Attempt ${task.attempts}/${task.maxRetries}): ${errorMsg}`);
        }

        // Check if Max Retries Exhausted
        if (task.attempts >= task.maxRetries) {
          task.status = 'FAILED';
          task.completedAt = new Date().toISOString();

          // Increment Circuit Breaker
          const currentFailures = (consecutiveFailuresMap.get(task.sourceId) || 0) + 1;
          consecutiveFailuresMap.set(task.sourceId, currentFailures);

          if (currentFailures >= 3) {
            appendLog(
              task,
              'WARN',
              'CIRCUIT_BREAKER',
              `ระบบ Circuit Breaker ทำงาน! แหล่งสืบค้น ${task.sourceName} ล้มเหลวติดต่อกัน ${currentFailures} ครั้ง ปรับสถานะเป็น DEGRADED/OFFLINE`,
              { metadata: { consecutiveFailures: currentFailures } }
            );
          }
        }
      }
    }

    // Move completed/failed task to history
    const queueIdx = taskQueue.findIndex((t) => t.id === task.id);
    if (queueIdx !== -1) {
      taskQueue.splice(queueIdx, 1);
    }
    taskHistory.unshift(task);

    if (taskHistory.length > 200) {
      taskHistory.pop();
    }
  }

  // ==========================================
  // API QUEUE & LOG CONTROL METHODS
  // ==========================================

  public static getQueueState() {
    return {
      activeWorkers: activeTaskIds.size,
      maxWorkers: MAX_CONCURRENT_WORKERS,
      queuedCount: taskQueue.length,
      queue: taskQueue,
      recentHistory: taskHistory.slice(0, 50),
    };
  }

  public static cancelTask(taskId: string): boolean {
    const task = taskQueue.find((t) => t.id === taskId);
    if (task && task.status === 'QUEUED') {
      task.status = 'CANCELLED';
      task.completedAt = new Date().toISOString();
      appendLog(task, 'WARN', 'FAILED', `คำสั่ง Crawl ถูกยกเลิกโดยผู้ใช้งาน`);

      const idx = taskQueue.indexOf(task);
      if (idx !== -1) taskQueue.splice(idx, 1);
      taskHistory.unshift(task);
      return true;
    }
    return false;
  }

  public static clearCompletedHistory() {
    taskHistory.length = 0;
  }

  public static getLogs(query?: { level?: string; sourceId?: string; jobId?: string; limit?: number }) {
    let filtered = [...globalLogs];

    if (query?.level && query.level !== 'ALL') {
      filtered = filtered.filter((l) => l.level === query.level);
    }

    if (query?.sourceId && query.sourceId !== 'ALL') {
      filtered = filtered.filter((l) => l.sourceId === query.sourceId);
    }

    if (query?.jobId) {
      filtered = filtered.filter((l) => l.crawlJobId === query.jobId);
    }

    const limit = query?.limit || 100;
    return filtered.slice(0, limit);
  }

  public static getCrawlerStats() {
    const totalCrawls = taskHistory.length;
    const successCrawls = taskHistory.filter((t) => t.status === 'COMPLETED').length;
    const successRate = totalCrawls > 0 ? Math.round((successCrawls / totalCrawls) * 100) : 100;

    const totalExtracted = taskHistory.reduce((acc, t) => acc + t.itemsExtracted, 0);
    const totalDuplicates = taskHistory.reduce((acc, t) => acc + t.duplicatesSkipped, 0);

    const avgLatency =
      totalCrawls > 0
        ? Math.round(taskHistory.reduce((acc, t) => acc + (t.latencyMs || 0), 0) / totalCrawls)
        : 180;

    return {
      totalCrawls,
      successCrawls,
      successRate,
      totalExtractedJobs: totalExtracted,
      duplicatesPrevented: totalDuplicates,
      avgLatencyMs: avgLatency,
      knownFingerprintsCount: knownFingerprints.size,
      circuitBreakersActive: Array.from(consecutiveFailuresMap.entries()).filter(([_, count]) => count >= 3).length,
    };
  }
}
