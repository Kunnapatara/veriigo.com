/**
 * VERIIGO - National Government Source Data Governance Engine
 * Implements Phase 1 to Phase 5 Governance Mandates:
 * 1. Source Inventory Audit (Real vs Seed vs Test sources)
 * 2. National Source Taxonomy & Reference Alignment
 * 3. Coverage Governance Analysis per Province & Level
 * 4. Data Quality Engine (Duplicates, Expired, Non-official, Broken URLs, Outdated)
 * 5. Source Trust Score Calculation (Authority, Freshness, Availability, Document Quality)
 */

import { CoverageRepository, THAILAND_PROVINCES } from '../../repositories/CoverageRepository';
import { SourceRegistryDoc, GovernmentLevel } from '../../types/firestore';
import {
  NATIONAL_GOVERNMENT_SOURCE_TAXONOMY,
  DEFAULT_PROVINCIAL_EXPECTATIONS,
  OFFICIAL_ORGANIZATION_TYPES,
  TaxonomySourceExpectation,
} from '../../data/government-source-taxonomy';

export interface SourceClassification {
  totalCount: number;
  byLevel: Record<GovernmentLevel, number>;
  realSources: SourceRegistryDoc[];
  seedSources: SourceRegistryDoc[];
  testSources: SourceRegistryDoc[];
}

export interface DataQualityDefects {
  duplicateSources: { sourceIdA: string; sourceIdB: string; reason: string }[];
  expiredDomains: { sourceId: string; name: string; url: string; lastFailure: string }[];
  nonOfficialDomains: { sourceId: string; name: string; url: string; domain: string }[];
  brokenUrls: { sourceId: string; name: string; url: string; error: string }[];
  outdatedDocuments: { sourceId: string; name: string; lastSuccess: string; daysInactive: number }[];
  totalQualityIssues: number;
}

export interface SourceTrustBreakdown {
  sourceId: string;
  sourceName: string;
  province: string;
  governmentLevel: GovernmentLevel;
  totalTrustScore: number; // 0 - 100
  pillars: {
    authorityScore: number; // Max 35
    freshnessScore: number; // Max 25
    availabilityScore: number; // Max 20
    documentQualityScore: number; // Max 20
  };
  trustTier: 'PLATINUM_OFFICIAL' | 'GOLD_VERIFIED' | 'SILVER_STANDARD' | 'BRONZE_RISK' | 'UNTRUSTED';
}

export interface ProvinceCoverageReportItem {
  province: string;
  region: string;
  expected: number;
  registered: number;
  active: number;
  missing: number;
  coverageScore: number; // %
  confidenceScore: number; // %
  trustTierDistribution: Record<string, number>;
}

export interface FullGovernanceAuditResult {
  auditedAt: string;
  governanceStatus: 'DATA GOVERNANCE READY' | 'NEEDS DATA ACQUISITION';
  inventory: {
    totalSources: number;
    realCount: number;
    seedCount: number;
    testCount: number;
    byLevel: Record<GovernmentLevel, number>;
  };
  taxonomyCoverage: {
    totalNationalExpected: number;
    totalRegistered: number;
    totalActive: number;
    overallCoveragePercent: number;
    overallConfidencePercent: number;
    provinceBreakdown: ProvinceCoverageReportItem[];
  };
  qualityEngine: DataQualityDefects;
  trustScores: SourceTrustBreakdown[];
  summaryRecommendations: string[];
}

function parseFirestoreDateMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val && typeof val.seconds === 'number') {
    return val.seconds * 1000;
  }
  return 0;
}

export class DataGovernanceEngine {
  /**
   * Run full National Government Data Governance Audit
   */
  static async runFullGovernanceAudit(): Promise<FullGovernanceAuditResult> {
    const allSources = await CoverageRepository.getAllSources();

    // 1. Audit Source Inventory
    const inventoryClassification = this.auditSourceInventory(allSources);

    // 2. Compute Trust Scores for all sources
    const trustScores = allSources.map((s) => this.calculateSourceTrustScore(s));

    // 3. Run Data Quality Engine checks
    const qualityDefects = this.runDataQualityEngine(allSources);

    // 4. Compute Coverage Governance across all 77 Provinces + Central
    const taxonomyCoverage = this.calculateProvinceCoverageGovernance(allSources, trustScores);

    // 5. Determine Overall Governance Status
    // Target: Overall coverage >= 15% across provinces AND 0 critical non-official domains in REAL sources
    const isReady =
      taxonomyCoverage.overallCoveragePercent >= 15 &&
      inventoryClassification.realSources.length > 0 &&
      qualityDefects.nonOfficialDomains.length === 0;

    const governanceStatus: 'DATA GOVERNANCE READY' | 'NEEDS DATA ACQUISITION' = isReady
      ? 'DATA GOVERNANCE READY'
      : 'NEEDS DATA ACQUISITION';

    const summaryRecommendations: string[] = [];
    if (qualityDefects.duplicateSources.length > 0) {
      summaryRecommendations.push(`พบแหล่งข้อมูลซ้ำซ้อน ${qualityDefects.duplicateSources.length} รายการ - ควรดำเนินการ Merge/Deduplicate`);
    }
    if (qualityDefects.nonOfficialDomains.length > 0) {
      summaryRecommendations.push(`พบโดเมนที่ไม่อยู่ในมาตรฐานราชการ (.go.th/.ac.th) ${qualityDefects.nonOfficialDomains.length} แห่ง - ต้องตรวจสอบใบอนุญาต`);
    }
    if (qualityDefects.expiredDomains.length > 0) {
      summaryRecommendations.push(`พบเว็บไซต์ล่มหรือหมดอายุ ${qualityDefects.expiredDomains.length} แห่ง - ให้ระบบ Crawler Auto-retry / Alert`);
    }
    if (taxonomyCoverage.overallCoveragePercent < 50) {
      summaryRecommendations.push(`ความครอบคลุมภาพรวมยังต่ำกว่า 50% (ปัจจุบัน ${taxonomyCoverage.overallCoveragePercent}%) - แนะนำรัน Autonomous Source Discovery AI Agent เพิ่มเติม`);
    }

    return {
      auditedAt: new Date().toISOString(),
      governanceStatus,
      inventory: {
        totalSources: inventoryClassification.totalCount,
        realCount: inventoryClassification.realSources.length,
        seedCount: inventoryClassification.seedSources.length,
        testCount: inventoryClassification.testSources.length,
        byLevel: inventoryClassification.byLevel,
      },
      taxonomyCoverage,
      qualityEngine: qualityDefects,
      trustScores,
      summaryRecommendations,
    };
  }

  /**
   * Phase 1: Source Inventory Audit
   */
  static auditSourceInventory(sources: SourceRegistryDoc[]): SourceClassification {
    const byLevel: Record<GovernmentLevel, number> = {
      CENTRAL: 0,
      PROVINCIAL: 0,
      LOCAL: 0,
      UNIVERSITY: 0,
      HOSPITAL: 0,
      STATE_ENTERPRISE: 0,
      INDEPENDENT_AGENCY: 0,
      SPECIAL: 0,
      OTHER: 0,
    };

    const realSources: SourceRegistryDoc[] = [];
    const seedSources: SourceRegistryDoc[] = [];
    const testSources: SourceRegistryDoc[] = [];

    for (const source of sources) {
      // Categorize Level
      const level = source.governmentLevel || 'CENTRAL';
      if (byLevel[level] !== undefined) {
        byLevel[level]++;
      } else {
        byLevel['CENTRAL']++;
      }

      // Classification (REAL vs SEED vs TEST)
      const id = (source.id || '').toLowerCase();
      const url = (source.url || '').toLowerCase();
      const name = (source.name || '').toLowerCase();

      if (id.includes('test') || name.includes('test') || url.includes('test-failure') || url.includes('localhost')) {
        testSources.push(source);
      } else if (id.startsWith('src-00') && parseInt(id.replace('src-', ''), 10) <= 8) {
        seedSources.push(source);
      } else {
        realSources.push(source);
      }
    }

    return {
      totalCount: sources.length,
      byLevel,
      realSources,
      seedSources,
      testSources,
    };
  }

  /**
   * Phase 4: Data Quality Engine
   */
  static runDataQualityEngine(sources: SourceRegistryDoc[]): DataQualityDefects {
    const duplicateSources: { sourceIdA: string; sourceIdB: string; reason: string }[] = [];
    const expiredDomains: { sourceId: string; name: string; url: string; lastFailure: string }[] = [];
    const nonOfficialDomains: { sourceId: string; name: string; url: string; domain: string }[] = [];
    const brokenUrls: { sourceId: string; name: string; url: string; error: string }[] = [];
    const outdatedDocuments: { sourceId: string; name: string; lastSuccess: string; daysInactive: number }[] = [];

    const urlMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    const nowMs = Date.now();

    for (const source of sources) {
      const url = (source.url || '').trim();
      const name = (source.name || '').trim();
      const lowerUrl = url.toLowerCase();
      const lowerName = name.toLowerCase();

      // Check Duplicates
      if (urlMap.has(lowerUrl)) {
        duplicateSources.push({
          sourceIdA: urlMap.get(lowerUrl)!,
          sourceIdB: source.id,
          reason: `ใช้ URL ซ้ำกัน (${url})`,
        });
      } else if (url) {
        urlMap.set(lowerUrl, source.id);
      }

      if (nameMap.has(lowerName)) {
        duplicateSources.push({
          sourceIdA: nameMap.get(lowerName)!,
          sourceIdB: source.id,
          reason: `ใช้ชื่อหน่วยงานซ้ำกัน (${name})`,
        });
      } else if (name) {
        nameMap.set(lowerName, source.id);
      }

      // Check Domain Legitimacy
      try {
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
          brokenUrls.push({
            sourceId: source.id,
            name: source.name,
            url: source.url,
            error: 'รูปแบบ URL ไม่ถูกต้อง (ขาดโปรโตคอล http/https)',
          });
        } else {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();

          // Check Official TLD
          const isOfficial =
            hostname.endsWith('.go.th') ||
            hostname.endsWith('.ac.th') ||
            hostname.endsWith('.or.th') ||
            hostname.endsWith('.mi.th') ||
            hostname.endsWith('.co.th') ||
            hostname.endsWith('.pao.go.th') ||
            hostname.endsWith('.moph.go.th');

          if (!isOfficial && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
            nonOfficialDomains.push({
              sourceId: source.id,
              name: source.name,
              url: source.url,
              domain: hostname,
            });
          }
        }
      } catch (err) {
        brokenUrls.push({
          sourceId: source.id,
          name: source.name,
          url: source.url,
          error: 'URL Syntax Invalid Parse Error',
        });
      }

      // Check Expired / Offline Status
      if (source.healthStatus === 'OFFLINE' || (source.consecutiveFailures && source.consecutiveFailures >= 3)) {
        expiredDomains.push({
          sourceId: source.id,
          name: source.name,
          url: source.url,
          lastFailure: source.lastCheckedAt ? String(source.lastCheckedAt) : 'ไม่ทราบ',
        });
      }

      // Check Outdated Activity
      const lastSuccessVal = source.lastSuccess || source.lastCheckedAt;
      const lastSuccessMs = parseFirestoreDateMs(lastSuccessVal);
      if (lastSuccessMs > 0) {
        const diffDays = Math.floor((nowMs - lastSuccessMs) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          outdatedDocuments.push({
            sourceId: source.id,
            name: source.name,
            lastSuccess: String(lastSuccessVal),
            daysInactive: diffDays,
          });
        }
      }
    }

    const totalQualityIssues =
      duplicateSources.length +
      expiredDomains.length +
      nonOfficialDomains.length +
      brokenUrls.length +
      outdatedDocuments.length;

    return {
      duplicateSources,
      expiredDomains,
      nonOfficialDomains,
      brokenUrls,
      outdatedDocuments,
      totalQualityIssues,
    };
  }

  /**
   * Phase 5: Source Trust Score Calculation
   */
  static calculateSourceTrustScore(source: SourceRegistryDoc): SourceTrustBreakdown {
    const url = (source.url || '').toLowerCase();

    // 1. Authority Score (Max 35)
    let authorityScore = 15;
    if (url.includes('.go.th') || url.includes('.ac.th') || url.includes('.pao.go.th')) {
      authorityScore = 35;
    } else if (url.includes('.or.th') || url.includes('.moph.go.th') || url.includes('.co.th')) {
      authorityScore = 28;
    } else if (url.includes('.org')) {
      authorityScore = 20;
    }

    // 2. Freshness Score (Max 25)
    let freshnessScore = 10;
    const lastCheckedMs = parseFirestoreDateMs(source.lastCheckedAt);
    if (lastCheckedMs > 0) {
      const diffHours = (Date.now() - lastCheckedMs) / (1000 * 60 * 60);
      if (diffHours <= 24) freshnessScore = 25;
      else if (diffHours <= 168) freshnessScore = 20; // within 7 days
      else if (diffHours <= 720) freshnessScore = 14; // within 30 days
      else freshnessScore = 5;
    }

    // 3. Availability Score (Max 20)
    const avail = source.availability !== undefined ? source.availability : 95;
    const availabilityScore = Math.round((Math.min(100, Math.max(0, avail)) / 100) * 20);

    // 4. Document Quality Score (Max 20)
    const discovered = source.documentsDiscovered || 1;
    const processed = source.documentsProcessed || 0;
    const successRatio = Math.min(1, processed / Math.max(1, discovered));
    let documentQualityScore = Math.round(successRatio * 15);
    if (source.ocrEnabled) documentQualityScore += 3;
    if (source.playwrightEnabled) documentQualityScore += 2;
    documentQualityScore = Math.min(20, documentQualityScore);

    const totalTrustScore = authorityScore + freshnessScore + availabilityScore + documentQualityScore;

    let trustTier: SourceTrustBreakdown['trustTier'] = 'BRONZE_RISK';
    if (totalTrustScore >= 90) trustTier = 'PLATINUM_OFFICIAL';
    else if (totalTrustScore >= 75) trustTier = 'GOLD_VERIFIED';
    else if (totalTrustScore >= 60) trustTier = 'SILVER_STANDARD';
    else if (totalTrustScore >= 40) trustTier = 'BRONZE_RISK';
    else trustTier = 'UNTRUSTED';

    return {
      sourceId: source.id,
      sourceName: source.name,
      province: source.province || 'กรุงเทพมหานคร',
      governmentLevel: source.governmentLevel || 'CENTRAL',
      totalTrustScore,
      pillars: {
        authorityScore,
        freshnessScore,
        availabilityScore,
        documentQualityScore,
      },
      trustTier,
    };
  }

  /**
   * Phase 3: Coverage Governance per Province
   */
  static calculateProvinceCoverageGovernance(
    sources: SourceRegistryDoc[],
    trustScores: SourceTrustBreakdown[]
  ): FullGovernanceAuditResult['taxonomyCoverage'] {
    // Build map of expected sources per province from taxonomy
    const taxonomyMap = new Map<string, TaxonomySourceExpectation>();
    for (const item of NATIONAL_GOVERNMENT_SOURCE_TAXONOMY) {
      taxonomyMap.set(item.province, item);
    }

    // Group actual sources by province
    const provinceSourcesMap = new Map<string, SourceRegistryDoc[]>();
    for (const s of sources) {
      const p = s.province || 'กรุงเทพมหานคร';
      if (!provinceSourcesMap.has(p)) {
        provinceSourcesMap.set(p, []);
      }
      provinceSourcesMap.get(p)!.push(s);
    }

    // Trust map lookup
    const trustMap = new Map<string, SourceTrustBreakdown>();
    for (const ts of trustScores) {
      trustMap.set(ts.sourceId, ts);
    }

    const provinceBreakdown: ProvinceCoverageReportItem[] = [];
    let totalNationalExpected = 0;
    let totalRegistered = 0;
    let totalActive = 0;

    // Evaluate explicit taxonomy provinces first
    const evaluatedProvinces = new Set<string>();

    for (const tax of NATIONAL_GOVERNMENT_SOURCE_TAXONOMY) {
      evaluatedProvinces.add(tax.province);
      const regSources = provinceSourcesMap.get(tax.province) || [];
      const activeSources = regSources.filter((s) => s.status === 'ACTIVE' || s.healthStatus === 'HEALTHY');

      const expected = tax.totalExpected;
      const registered = regSources.length;
      const active = activeSources.length;
      const missing = Math.max(0, expected - registered);
      const coverageScore = Math.min(100, Math.round((registered / Math.max(1, expected)) * 100));

      // Calculate confidence score from trust scores
      let trustSum = 0;
      const trustDist: Record<string, number> = { PLATINUM_OFFICIAL: 0, GOLD_VERIFIED: 0, SILVER_STANDARD: 0, BRONZE_RISK: 0, UNTRUSTED: 0 };

      for (const s of regSources) {
        const t = trustMap.get(s.id);
        if (t) {
          trustSum += t.totalTrustScore;
          trustDist[t.trustTier] = (trustDist[t.trustTier] || 0) + 1;
        } else {
          trustSum += 70;
        }
      }
      const confidenceScore = registered > 0 ? Math.round(trustSum / registered) : 0;

      totalNationalExpected += expected;
      totalRegistered += registered;
      totalActive += active;

      provinceBreakdown.push({
        province: tax.province,
        region: tax.region,
        expected,
        registered,
        active,
        missing,
        coverageScore,
        confidenceScore,
        trustTierDistribution: trustDist,
      });
    }

    // Evaluate all remaining 68 provinces in THAILAND_PROVINCES
    for (const prov of THAILAND_PROVINCES) {
      if (evaluatedProvinces.has(prov)) continue;
      evaluatedProvinces.add(prov);

      const regSources = provinceSourcesMap.get(prov) || [];
      const activeSources = regSources.filter((s) => s.status === 'ACTIVE' || s.healthStatus === 'HEALTHY');

      const expected = DEFAULT_PROVINCIAL_EXPECTATIONS.totalExpected;
      const registered = regSources.length;
      const active = activeSources.length;
      const missing = Math.max(0, expected - registered);
      const coverageScore = Math.min(100, Math.round((registered / Math.max(1, expected)) * 100));

      let trustSum = 0;
      const trustDist: Record<string, number> = { PLATINUM_OFFICIAL: 0, GOLD_VERIFIED: 0, SILVER_STANDARD: 0, BRONZE_RISK: 0, UNTRUSTED: 0 };

      for (const s of regSources) {
        const t = trustMap.get(s.id);
        if (t) {
          trustSum += t.totalTrustScore;
          trustDist[t.trustTier] = (trustDist[t.trustTier] || 0) + 1;
        } else {
          trustSum += 70;
        }
      }
      const confidenceScore = registered > 0 ? Math.round(trustSum / registered) : 0;

      totalNationalExpected += expected;
      totalRegistered += registered;
      totalActive += active;

      provinceBreakdown.push({
        province: prov,
        region: 'PROVINCIAL_REGION',
        expected,
        registered,
        active,
        missing,
        coverageScore,
        confidenceScore,
        trustTierDistribution: trustDist,
      });
    }

    const overallCoveragePercent = Math.round((totalRegistered / Math.max(1, totalNationalExpected)) * 100);
    const overallConfidencePercent =
      trustScores.length > 0
        ? Math.round(trustScores.reduce((acc, t) => acc + t.totalTrustScore, 0) / trustScores.length)
        : 85;

    return {
      totalNationalExpected,
      totalRegistered,
      totalActive,
      overallCoveragePercent,
      overallConfidencePercent,
      provinceBreakdown,
    };
  }
}
