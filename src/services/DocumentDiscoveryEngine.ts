/**
 * VERIIGO V2 - Phase 6 Document Discovery Engine
 * Responsibility: Discover official government recruitment announcement URLs on target portal pages
 * and sitemaps using domain-level crawling, anchor link extraction, and Thai recruitment keyword matching.
 */

import { DiscoveredDocument, PortalClassificationType } from '../types/firestore';
import { GovernmentPortalClassifier } from './GovernmentPortalClassifier';
import { logger } from '../lib/logger';

export interface DiscoverOptions {
  sourceId: string;
  baseUrl: string;
  htmlContent: string;
  traceId?: string;
}

export class DocumentDiscoveryEngine {
  /**
   * Parse HTML content to discover recruitment URLs matching Thai government recruitment keywords
   */
  public static discoverRecruitmentUrls(options: DiscoverOptions): DiscoveredDocument[] {
    const { sourceId, baseUrl, htmlContent, traceId } = options;
    const discoveredMap = new Map<string, DiscoveredDocument>();

    try {
      // 1. Extract href links via regex (or DOM parsing simulation)
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
      let match: RegExpExecArray | null;

      const baseOrigin = new URL(baseUrl).origin;

      while ((match = linkRegex.exec(htmlContent)) !== null) {
        const rawHref = match[1].trim();
        const linkText = match[2].replace(/<[^>]+>/g, '').trim();

        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
          continue;
        }

        // Resolve absolute URL
        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(rawHref, baseUrl).href;
        } catch (e) {
          continue;
        }

        // Skip non-HTTP links and external social media
        if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
          continue;
        }
        if (
          absoluteUrl.includes('facebook.com') ||
          absoluteUrl.includes('twitter.com') ||
          absoluteUrl.includes('youtube.com') ||
          absoluteUrl.includes('line.me')
        ) {
          continue;
        }

        // Combine link text and URL for keyword check
        const combinedText = `${linkText} ${absoluteUrl}`.toLowerCase();
        const matchingKeywords: string[] = [];

        for (const kw of GovernmentPortalClassifier.THAI_RECRUITMENT_KEYWORDS) {
          if (combinedText.includes(kw) || absoluteUrl.toLowerCase().includes(encodeURIComponent(kw))) {
            matchingKeywords.push(kw);
          }
        }

        const isPdf = absoluteUrl.toLowerCase().endsWith('.pdf');
        
        // If matches Thai recruitment keywords OR is a PDF link on a recruitment portal
        if (matchingKeywords.length > 0 || isPdf) {
          const portalType: PortalClassificationType = isPdf ? 'PDF_ANNOUNCEMENT' : 'HTML_ANNOUNCEMENT';
          const mimeType = isPdf ? 'application/pdf' : 'text/html';

          if (!discoveredMap.has(absoluteUrl)) {
            discoveredMap.set(absoluteUrl, {
              url: absoluteUrl,
              title: linkText || 'ประกาศรับสมัครงานราชการ',
              portalType,
              mimeType,
              discoveredAt: new Date().toISOString(),
              matchingKeywords,
            });
          }
        }
      }

      const results = Array.from(discoveredMap.values());
      logger.info(
        {
          traceId,
          operation: 'DocumentDiscoveryEngine.discoverRecruitmentUrls',
          sourceId,
          baseUrl,
          discoveredCount: results.length,
        },
        `Discovered ${results.length} official recruitment URLs from ${baseUrl}`
      );

      return results;
    } catch (err) {
      logger.error(
        { traceId, operation: 'DocumentDiscoveryEngine.discoverRecruitmentUrls', sourceId, baseUrl },
        'Error during document URL discovery',
        err
      );
      return [];
    }
  }

  /**
   * Parse XML sitemap content to discover recruitment links
   */
  public static discoverFromSitemap(sitemapXml: string, sourceId: string, traceId?: string): DiscoveredDocument[] {
    const results: DiscoveredDocument[] = [];
    const locRegex = /<loc>(.*?)<\/loc>/gis;
    let match: RegExpExecArray | null;

    while ((match = locRegex.exec(sitemapXml)) !== null) {
      const url = match[1].trim();
      const lowerUrl = url.toLowerCase();

      const matchingKeywords = GovernmentPortalClassifier.THAI_RECRUITMENT_KEYWORDS.filter((kw) =>
        lowerUrl.includes(kw)
      );

      if (matchingKeywords.length > 0 || lowerUrl.endsWith('.pdf')) {
        const isPdf = lowerUrl.endsWith('.pdf');
        results.push({
          url,
          title: 'ประกาศรับสมัครงานราชการ (Sitemap)',
          portalType: isPdf ? 'PDF_ANNOUNCEMENT' : 'HTML_ANNOUNCEMENT',
          mimeType: isPdf ? 'application/pdf' : 'text/html',
          discoveredAt: new Date().toISOString(),
          matchingKeywords,
        });
      }
    }

    logger.info(
      { traceId, operation: 'DocumentDiscoveryEngine.discoverFromSitemap', sourceId, discoveredCount: results.length },
      `Discovered ${results.length} recruitment URLs from sitemap XML`
    );

    return results;
  }
}
