/**
 * VERIIGO V2 - Phase 6 Government Portal Classifier Service
 * Responsibility: Inspect government portal URL structures, HTTP Content-Type headers,
 * and page content samples to classify the target portal format (HTML_ANNOUNCEMENT,
 * PDF_ANNOUNCEMENT, RSS_FEED, DYNAMIC_PAGE) and detect recruitment intent.
 */

import { PortalClassificationResult, PortalClassificationType } from '../types/firestore';
import { logger } from '../lib/logger';

export class GovernmentPortalClassifier {
  public static readonly THAI_RECRUITMENT_KEYWORDS = [
    'รับสมัคร',
    'สอบแข่งขัน',
    'บรรจุ',
    'พนักงานราชการ',
    'ข้าราชการ',
    'ลูกจ้างชั่วคราว',
    'ตำแหน่ง',
    'ประกาศ',
    'สรรหา',
    'การสอบ',
  ];

  /**
   * Classify portal type based on URL pattern, Content-Type, and optional body sample
   */
  public static classifyFromHeadersAndUrl(
    url: string,
    contentType: string = '',
    bodySample: string = '',
    traceId?: string
  ): PortalClassificationResult {
    const lowerUrl = url.toLowerCase();
    const lowerCT = contentType.toLowerCase();
    const lowerBody = bodySample.toLowerCase();

    const detectedKeywords: string[] = [];
    for (const kw of this.THAI_RECRUITMENT_KEYWORDS) {
      if (lowerBody.includes(kw) || lowerUrl.includes(encodeURIComponent(kw))) {
        detectedKeywords.push(kw);
      }
    }

    // 1. PDF Announcement Check
    if (lowerUrl.endsWith('.pdf') || lowerCT.includes('application/pdf')) {
      logger.info({ traceId, operation: 'GovernmentPortalClassifier.classify', url }, 'Classified as PDF_ANNOUNCEMENT');
      return {
        portalType: 'PDF_ANNOUNCEMENT',
        mimeType: 'application/pdf',
        hasPdfLinks: false,
        hasRssFeed: false,
        requiresDynamicRendering: false,
        detectedKeywords,
        confidence: 0.98,
      };
    }

    // 2. RSS Feed Check
    if (
      lowerUrl.includes('/rss') ||
      lowerUrl.endsWith('.xml') ||
      lowerCT.includes('application/rss+xml') ||
      lowerCT.includes('application/xml') ||
      lowerCT.includes('text/xml')
    ) {
      logger.info({ traceId, operation: 'GovernmentPortalClassifier.classify', url }, 'Classified as RSS_FEED');
      return {
        portalType: 'RSS_FEED',
        mimeType: lowerCT || 'application/rss+xml',
        hasPdfLinks: false,
        hasRssFeed: true,
        requiresDynamicRendering: false,
        detectedKeywords,
        confidence: 0.95,
      };
    }

    // 3. Dynamic JS Rendered Page Check
    const isDynamic =
      lowerBody.includes('<app-root') ||
      lowerBody.includes('<div id="root"') ||
      lowerBody.includes('react-root') ||
      lowerBody.includes('vue-root') ||
      lowerUrl.includes('/#/') ||
      lowerUrl.includes('/spa/');

    // 4. HTML Announcement Page Check
    const hasPdfLinks = lowerBody.includes('.pdf') || lowerBody.includes('href=') && lowerBody.includes('download');
    const hasRss = lowerBody.includes('type="application/rss+xml"');

    const portalType: PortalClassificationType = isDynamic ? 'DYNAMIC_PAGE' : 'HTML_ANNOUNCEMENT';

    return {
      portalType,
      mimeType: 'text/html',
      hasPdfLinks,
      hasRssFeed: hasRss,
      requiresDynamicRendering: isDynamic,
      detectedKeywords,
      confidence: detectedKeywords.length > 0 ? 0.90 : 0.75,
    };
  }
}
