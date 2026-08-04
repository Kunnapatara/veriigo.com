/**
 * VERIIGO V2 Phase 6: National Recruitment Acquisition Engine Test Suite
 * Validates GovernmentPortalClassifier, DocumentDiscoveryEngine, CrawlFetchingWorker,
 * PDF/HTML Ingestion to Document Lake, Pipeline Event Integration, and Health Telemetry Logging.
 */

import { describe, it, expect } from 'vitest';
import { GovernmentPortalClassifier } from '../../services/GovernmentPortalClassifier';
import { DocumentDiscoveryEngine } from '../../services/DocumentDiscoveryEngine';
import { CrawlFetchingWorker } from '../../services/CrawlFetchingWorker';
import { NationalSchedulerEngine } from '../../services/NationalSchedulerEngine';
import { DocumentIngestionService } from '../../services/DocumentIngestionService';

describe('VERIIGO V2 Phase 6: National Recruitment Acquisition Engine', () => {
  it('TC-PHASE6-01: Government Portal Format Classification & Thai Keyword Detection', () => {
    // PDF Classification
    const pdfResult = GovernmentPortalClassifier.classifyFromHeadersAndUrl(
      'https://dopa.go.th/announcement/job-2026.pdf',
      'application/pdf',
      'PDF Header Sample'
    );
    expect(pdfResult.portalType).toBe('PDF_ANNOUNCEMENT');
    expect(pdfResult.mimeType).toBe('application/pdf');

    // HTML Announcement Classification
    const htmlSample = `
      <html>
        <body>
          <h1>ประกาศรับสมัครสอบแข่งขันเพื่อบรรจุบุคคลเข้ารับราชการ</h1>
          <p>ตำแหน่งนักวิเคราะห์นโยบายและแผน และตำแหน่งวิศวกรคอมพิวเตอร์</p>
          <a href="/downloads/file01.pdf">ดาวน์โหลดประกาศ (PDF)</a>
        </body>
      </html>
    `;
    const htmlResult = GovernmentPortalClassifier.classifyFromHeadersAndUrl(
      'https://dopa.go.th/jobs',
      'text/html; charset=utf-8',
      htmlSample
    );
    expect(htmlResult.portalType).toBe('HTML_ANNOUNCEMENT');
    expect(htmlResult.hasPdfLinks).toBe(true);
    expect(htmlResult.detectedKeywords).toContain('รับสมัคร');
    expect(htmlResult.detectedKeywords).toContain('สอบแข่งขัน');
    expect(htmlResult.detectedKeywords).toContain('บรรจุ');
  });

  it('TC-PHASE6-02: Document Discovery Engine Anchor Crawling & Thai Keyword Filtering', () => {
    const htmlSample = `
      <div class="news-list">
        <a href="https://dopa.go.th/announcement-2026.pdf">ประกาศรับสมัครสอบแข่งขันเพื่อบรรจุเข้ารับราชการ 2569</a>
        <a href="https://facebook.com/dopa">Facebook Page</a>
        <a href="/news/general-info">ข่าวประชาสัมพันธ์ทั่วไป</a>
        <a href="https://dopa.go.th/jobs/general-worker">เปิดรับสมัครพนักงานราชการ ประจำปี 2569</a>
      </div>
    `;

    const discovered = DocumentDiscoveryEngine.discoverRecruitmentUrls({
      sourceId: 'src-dopa-01',
      baseUrl: 'https://dopa.go.th/jobs',
      htmlContent: htmlSample,
      traceId: 'trace-disc-01',
    });

    expect(discovered.length).toBeGreaterThanOrEqual(2);
    
    const pdfDoc = discovered.find((d) => d.url.endsWith('.pdf'));
    expect(pdfDoc).toBeDefined();
    expect(pdfDoc?.portalType).toBe('PDF_ANNOUNCEMENT');

    const workerDoc = discovered.find((d) => d.url.includes('general-worker'));
    expect(workerDoc).toBeDefined();
    expect(workerDoc?.matchingKeywords).toContain('รับสมัคร');
    expect(workerDoc?.matchingKeywords).toContain('พนักงานราชการ');
  });

  it('TC-PHASE6-03: XML Sitemap Recruitment Link Extraction', () => {
    const sitemapXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://ocsc.go.th/jobs/exam-2026.pdf</loc></url>
        <url><loc>https://ocsc.go.th/announcement-รับสมัคร</loc></url>
        <url><loc>https://ocsc.go.th/about-us</loc></url>
      </urlset>
    `;

    const discovered = DocumentDiscoveryEngine.discoverFromSitemap(sitemapXml, 'src-ocsc-01', 'trace-sitemap-01');
    expect(discovered.length).toBe(2);
    expect(discovered[0].url).toContain('exam-2026.pdf');
    expect(discovered[1].url).toContain('รับสมัคร');
  });

  it('TC-PHASE6-04: Crawl Fetching Worker Task Execution & Document Lake Ingestion Pipeline', async () => {
    const task = await NationalSchedulerEngine.enqueueCrawlTask('src-ocsc-gov-th', 'trace-crawl-run-01');
    expect(task.taskId).toBeDefined();

    const result = await CrawlFetchingWorker.executeCrawlTask(task.taskId, 'trace-crawl-run-01');
    expect(result.taskId).toBe(task.taskId);
    expect(result.success).toBe(true);
    expect(result.httpStatusCode).toBe(200);
    expect(result.documentsFound).toBeGreaterThan(0);
    expect(result.documentsIngested).toBeGreaterThan(0);
  });

  it('TC-PHASE6-05: Direct Document Lake Ingestion & SHA-256 Deduplication Safeguard', async () => {
    const sampleContent = 'PDF RAW BINARY CONTENT FOR VERIIGO TEST RECRUITMENT ANNOUNCEMENT 2026';
    
    const ingest1 = await DocumentIngestionService.ingest({
      sourceId: 'src-test-lake',
      officialUrl: 'https://test.gov.th/announcement-1.pdf',
      mimeType: 'application/pdf',
      rawContent: sampleContent,
      traceId: 'trace-lake-01',
    });

    expect(ingest1.documentId).toBeDefined();
    expect(ingest1.isDuplicate).toBe(false);

    // Ingest identical content
    const ingest2 = await DocumentIngestionService.ingest({
      sourceId: 'src-test-lake',
      officialUrl: 'https://test.gov.th/announcement-1-copy.pdf',
      mimeType: 'application/pdf',
      rawContent: sampleContent,
      traceId: 'trace-lake-02',
    });

    expect(ingest2.documentId).toBe(ingest1.documentId);
    expect(ingest2.isDuplicate).toBe(true);
  });
});
