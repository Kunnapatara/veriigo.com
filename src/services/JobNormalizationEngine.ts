/**
 * VERIIGO V2 - Phase 3 Job Normalization Engine
 * Responsibility: Standardize organization names, province names, government levels,
 * job categories, employment types, status values, and compute deterministic job identity.
 */

import crypto from 'crypto';
import {
  GovernmentLevel,
  JobCategory,
  JobStatus,
  PositionType,
  SalaryInfo,
} from '../types/firestore';

export interface RawJobPayload {
  sourceDocumentId: string;
  extractionTaskId: string;
  sourceId: string;
  title?: string;
  organization?: string;
  governmentLevel?: string;
  province?: string;
  jobCategory?: string;
  employmentType?: string;
  salary?: SalaryInfo | any;
  positionsAvailable?: number | string;
  publishedDate?: string;
  applicationDeadline?: string;
  officialUrl?: string;
  confidenceScore?: number;
  modelVersion?: string;
  promptVersion?: string;
  validationVersion?: string;
  fieldLineage?: Record<string, any>;
}

export class JobNormalizationEngine {
  // Standard Thailand 77 Provinces Map & Aliases
  private static readonly PROVINCE_ALIASES: Record<string, string> = {
    'กทม': 'กรุงเทพมหานคร',
    'กทม.': 'กรุงเทพมหานคร',
    'กรุงเทพ': 'กรุงเทพมหานคร',
    'กรุงเทพฯ': 'กรุงเทพมหานคร',
    'โคราช': 'นครราชสีมา',
    'แปดริ้ว': 'ฉะเชิงเทรา',
    'เมืองชล': 'ชลบุรี',
    'เชียงใหม่': 'เชียงใหม่',
    'นนทบุรี': 'นนทบุรี',
    'ปทุมธานี': 'ปทุมธานี',
    'สมุทรปราการ': 'สมุทรปราการ',
    'สงขลา': 'สงขลา',
    'ภูเก็ต': 'ภูเก็ต',
    'ขอนแก่น': 'ขอนแก่น',
    'เชียงราย': 'เชียงราย',
  };

  /**
   * Compute deterministic Job ID fingerprint using SHA-256
   * Formula: sha256("sourceDocumentId|organization|title|deadline")
   */
  public static generateDeterministicJobId(
    sourceDocumentId: string,
    organization: string,
    title: string,
    applicationDeadline: string
  ): { jobId: string; fingerprint: string } {
    const normDocId = (sourceDocumentId || '').trim().toLowerCase();
    const normOrg = this.normalizeOrganization(organization).toLowerCase();
    const normTitle = (title || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const normDeadline = (applicationDeadline || '').trim().substring(0, 10);

    const rawFingerprint = `${normDocId}|${normOrg}|${normTitle}|${normDeadline}`;
    const hash = crypto.createHash('sha256').update(rawFingerprint).digest('hex');
    const jobId = `job-${hash.substring(0, 32)}`;

    return { jobId, fingerprint: hash };
  }

  /**
   * Normalize Thai Government Organization Name
   */
  public static normalizeOrganization(rawOrg?: string): string {
    if (!rawOrg || typeof rawOrg !== 'string') return 'หน่วยงานราชการ';
    let cleaned = rawOrg.trim().replace(/\s+/g, ' ');
    // Remove redundant leading prefixes if duplicated
    cleaned = cleaned.replace(/^(สำนักงาน|กรม|กระทรวง)\s+(สำนักงาน|กรม|กระทรวง)/g, '$2');
    return cleaned || 'หน่วยงานราชการ';
  }

  /**
   * Map Government Level based on Organization Taxonomy
   */
  public static mapGovernmentLevel(organization: string, rawLevel?: string): GovernmentLevel {
    if (rawLevel) {
      const u = rawLevel.toUpperCase();
      if (['CENTRAL', 'PROVINCIAL', 'LOCAL', 'UNIVERSITY', 'HOSPITAL', 'STATE_ENTERPRISE', 'INDEPENDENT_AGENCY', 'SPECIAL', 'OTHER'].includes(u)) {
        return u as GovernmentLevel;
      }
    }

    const org = organization || '';
    if (/มหาวิทยาลัย|วิทยาลัย|สถาบันการศึกษา/i.test(org)) {
      return 'UNIVERSITY';
    }
    if (/โรงพยาบาล|ศูนย์แพทย์|สถาบันสุขภาพ/i.test(org)) {
      return 'HOSPITAL';
    }
    if (/รัฐวิสาหกิจ|การไฟฟ้า|การประปา|ธนาคาร|บริษัท|การท่องเที่ยว|การท่าเรือ|ปตท/i.test(org)) {
      return 'STATE_ENTERPRISE';
    }
    if (/เทศบาล|อบจ|อบต|อบจ\.|อบต\.|องค์การบริหารส่วนตำบล|องค์การบริหารส่วนจังหวัด|กรุงเทพมหานคร|เมืองพัทยา/i.test(org)) {
      return 'LOCAL';
    }
    if (/จังหวัด|สำนักงานจังหวัด|ศาลากลาง/i.test(org)) {
      return 'PROVINCIAL';
    }
    if (/องค์กรอิสระ|กกต|ปปช|คตง|ผู้ตรวจการแผ่นดิน|สภาผู้แทนราษฎร/i.test(org)) {
      return 'INDEPENDENT_AGENCY';
    }
    if (/กระทรวง|กรม|สำนักงานนายกรัฐมนตรี|สำนักงบประมาณ|สำนักงานตำรวจ|กองทัพ/i.test(org)) {
      return 'CENTRAL';
    }

    return 'CENTRAL';
  }

  /**
   * Normalize Province Name
   */
  public static normalizeProvince(rawProvince?: string): string {
    if (!rawProvince || typeof rawProvince !== 'string') return 'กรุงเทพมหานคร';
    const trimmed = rawProvince.trim();
    if (this.PROVINCE_ALIASES[trimmed]) {
      return this.PROVINCE_ALIASES[trimmed];
    }
    // Clean 'จ.' or 'จังหวัด'
    const cleaned = trimmed.replace(/^(จังหวัด|จ\.)\s*/, '');
    return cleaned || 'กรุงเทพมหานคร';
  }

  /**
   * Categorize Job Title into Standard Functional Category
   */
  public static normalizeJobCategory(title?: string, rawCategory?: string): JobCategory {
    if (rawCategory && ['ENGINEERING', 'GENERAL_ADMIN', 'FINANCE_ACCOUNTING', 'INFORMATION_TECHNOLOGY', 'PUBLIC_HEALTH', 'EDUCATION', 'LEGAL', 'POLICE_MILITARY'].includes(rawCategory.toUpperCase())) {
      return rawCategory.toUpperCase() as JobCategory;
    }

    const t = title || '';
    if (/วิศวกร|สถาปนิก|ช่าง|โยธา|สำรวจ|เครื่องกล|ไฟฟ้า|ผังเมือง/i.test(t)) {
      return 'ENGINEERING';
    }
    if (/โปรแกรมเมอร์|นักวิเคราะห์ระบบ|คอมพิวเตอร์|สารสนเทศ|เทคโนโลยี|นักเทคโนโลยี/i.test(t)) {
      return 'INFORMATION_TECHNOLOGY';
    }
    if (/บัญชี|การเงิน|งบประมาณ|ตรวจสอบภายใน|พัสดุ|การคลัง/i.test(t)) {
      return 'FINANCE_ACCOUNTING';
    }
    if (/แพทย์|พยาบาล|เภสัชกร|สาธารณสุข|นักกายภาพ|เทคนิคการแพทย์/i.test(t)) {
      return 'PUBLIC_HEALTH';
    }
    if (/ครู|อาจารย์|นักวิชาการศึกษา|ผู้ดูแลเด็ก/i.test(t)) {
      return 'EDUCATION';
    }
    if (/นิติกร|กฎหมาย|อัยการ|ศาล/i.test(t)) {
      return 'LEGAL';
    }
    if (/ตำรวจ|ทหาร|ตชด|สืบสวน|ปปส|ปปช/i.test(t)) {
      return 'POLICE_MILITARY';
    }
    if (/วิเคราะห์นโยบาย|ธุรการ|จัดการงานทั่วไป|บุคลากร|เจ้าพนักงาน/i.test(t)) {
      return 'GENERAL_ADMIN';
    }

    return 'OTHER';
  }

  /**
   * Normalize Employment Type (Position Type)
   */
  public static normalizeEmploymentType(rawType?: string): PositionType | 'OTHER' {
    if (!rawType || typeof rawType !== 'string') return 'ข้าราชการพลเรือนสามัญ';
    const t = rawType.trim();
    if (t.includes('ข้าราชการ')) return 'ข้าราชการพลเรือนสามัญ';
    if (t.includes('พนักงานราชการ')) return 'พนักงานราชการ';
    if (t.includes('ลูกจ้างประจำ')) return 'ลูกจ้างประจำ';
    if (t.includes('จ้างเหมา') || t.includes('พนักงานจ้าง')) return 'พนักงานจ้างเหมา';
    return 'OTHER';
  }

  /**
   * Normalize Salary Range
   */
  public static normalizeSalary(rawSalary?: any): SalaryInfo {
    if (!rawSalary) return { min: 15000, max: 16500, text: '15,000 - 16,500 บาท', currency: 'THB' };
    if (typeof rawSalary === 'number') {
      return { min: rawSalary, max: rawSalary, text: `${rawSalary.toLocaleString()} บาท`, currency: 'THB' };
    }
    const min = typeof rawSalary.min === 'number' ? rawSalary.min : (typeof rawSalary.salaryMin === 'number' ? rawSalary.salaryMin : 15000);
    const max = typeof rawSalary.max === 'number' ? rawSalary.max : (typeof rawSalary.salaryMax === 'number' ? rawSalary.salaryMax : min);
    const text = rawSalary.text || rawSalary.salaryText || `${min.toLocaleString()} - ${max.toLocaleString()} บาท`;
    return { min, max, text, currency: 'THB' };
  }

  /**
   * Evaluate Job Status based on Application Deadline
   */
  public static evaluateStatus(applicationDeadline?: string, explicitStatus?: JobStatus): JobStatus {
    if (explicitStatus && explicitStatus !== 'ACTIVE') {
      return explicitStatus;
    }

    if (!applicationDeadline) return 'ACTIVE';

    try {
      const deadlineDate = new Date(applicationDeadline);
      // End of day evaluation
      deadlineDate.setHours(23, 59, 59, 999);
      const now = new Date();
      if (now > deadlineDate) {
        return 'EXPIRED';
      }
    } catch (e) {
      // Ignore parse failure, default ACTIVE
    }

    return 'ACTIVE';
  }
}
