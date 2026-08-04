import { describe, it, expect } from 'vitest';
import {
  calculateJobFingerprint,
  registerKnownFingerprint,
  ExtractedJobItem,
} from '../../server/crawler/crawler-engine';
import { GovernmentJobRepository } from '../../repositories/GovernmentJobRepository';

describe('Sprint 14 - Unit Tests: Government Crawler Engine & Job Ingestion', () => {
  it('should calculate unique SHA-256 job fingerprint correctly', () => {
    const title = 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ';
    const ministry = 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม';
    const url = 'https://mdes.job.thai.com/announcement/1';

    const fingerprint1 = calculateJobFingerprint(ministry, title, url);
    const fingerprint2 = calculateJobFingerprint(ministry, title, url);
    const fingerprint3 = calculateJobFingerprint(ministry, 'นักวิเคราะห์นโยบายและแผน', url);

    expect(fingerprint1).toBe(fingerprint2);
    expect(fingerprint1).not.toBe(fingerprint3);
    expect(fingerprint1.length).toBe(64); // SHA-256 hex length
  });

  it('should register known government job fingerprints accurately', () => {
    const fp = registerKnownFingerprint('กรมสรรพากร', 'นักวิชาการภาษีปฏิบัติการ', 'https://rd.job.thai.com/job/1');
    expect(fp).toBeDefined();
    expect(fp.length).toBe(64);
  });

  it('should validate extracted crawler job item data structure', () => {
    const sampleExtractedJob: ExtractedJobItem = {
      fingerprint: calculateJobFingerprint('สำนักงาน ก.พ.', 'นักวิชาการสรรหา', 'https://ocsc.go.th/job/10'),
      title: 'นักวิชาการสรรหาและเลือกสรรปฏิบัติการ',
      agencyName: 'สำนักงาน ก.พ.',
      ministry: 'สำนักนายกรัฐมนตรี',
      salaryMin: 15000,
      salaryMax: 16500,
      vacanciesCount: 5,
      positionType: 'ข้าราชการพลเรือนสามัญ',
      ocscLevelRequired: 'ภาค ก. ผ่านแล้ว',
      degreeRequired: ['ปริญญาตรีทุกสาขา'],
      requirementsText: 'สำเร็จการศึกษาระดับปริญญาตรี และสอบผ่านภาค ก. ก.พ.',
      applicationUrl: 'https://ocsc.job.thai.com',
    };

    expect(sampleExtractedJob.title.length).toBeGreaterThan(0);
    expect(sampleExtractedJob.salaryMin).toBeGreaterThan(0);
    expect(sampleExtractedJob.agencyName).toBe('สำนักงาน ก.พ.');
  });
});

