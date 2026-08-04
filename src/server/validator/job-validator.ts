import { ExtractedGovJob } from '../extractor/gemini-pipeline';
import crypto from 'node:crypto';

// ==========================================
// SPRINT 8: JOB VALIDATION TYPES
// ==========================================

export type ValidationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type IssueCategory =
  | 'MISSING_FIELDS'
  | 'DUPLICATE_JOB'
  | 'INVALID_DATES'
  | 'INVALID_SALARY'
  | 'AGENCY_MISMATCH'
  | 'LOW_CONFIDENCE';

export interface ValidationIssue {
  id: string;
  category: IssueCategory;
  severity: ValidationSeverity;
  field: string;
  message: string;
  suggestedFix?: string;
  currentValue?: any;
}

export interface JobValidationReport {
  id: string;
  jobId: string;
  jobTitle: string;
  agencyName: string;
  timestamp: string;
  healthScore: number; // 0 to 100
  overallStatus: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAILED_REJECTED';
  issuesCount: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  issues: ValidationIssue[];
  duplicateMatchId?: string;
  duplicateConfidencePercent?: number;
  validatedByRulesVersion: string;
  rawJobData: ExtractedGovJob;
}

export interface ValidationEngineStats {
  totalValidated: number;
  passedCount: number;
  passedWithWarningsCount: number;
  failedRejectedCount: number;
  issueCountsByCategory: Record<IssueCategory, number>;
  averageHealthScore: number;
  duplicationRatePercent: number;
}

export interface ValidationAuditLog {
  id: string;
  reportId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  step:
    | 'VALIDATION_STARTED'
    | 'MISSING_FIELDS_CHECKED'
    | 'DUPLICATE_CHECKED'
    | 'DATES_VALIDATED'
    | 'SALARY_VALIDATED'
    | 'AGENCY_CHECKED'
    | 'CONFIDENCE_EVALUATED'
    | 'REPORT_GENERATED';
  message: string;
  details?: Record<string, unknown>;
}

// In-Memory Stores
const validationReportsMap: Map<string, JobValidationReport> = new Map();
const knownJobFingerprints: Map<string, { reportId: string; jobTitle: string; agencyName: string }> = new Map();
const validationLogs: ValidationAuditLog[] = [];

// Helper: Append Audit Log
function appendValidationLog(
  reportId: string,
  level: 'INFO' | 'WARN' | 'ERROR',
  step: ValidationAuditLog['step'],
  message: string,
  details?: Record<string, unknown>
) {
  const logEntry: ValidationAuditLog = {
    id: `log-val-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reportId,
    timestamp: new Date().toISOString(),
    level,
    step,
    message,
    details,
  };

  validationLogs.unshift(logEntry);
  if (validationLogs.length > 1000) validationLogs.pop();

  console.log(
    JSON.stringify({
      jobValidationEngine: true,
      ...logEntry,
    })
  );
}

// Official Thai Government Ministries & Departments Database for Agency Mismatch Check
const KNOWN_THAI_AGENCIES = [
  'กรมทางหลวง',
  'กรมสรรพากร',
  'กรมชลประทาน',
  'สำนักงาน ป.ป.ช.',
  'สำนักงาน ก.พ.',
  'กรมบัญชีกลาง',
  'กรมการปกครอง',
  'กรมส่งเสริมการปกครองท้องถิ่น',
  'กรมที่ดิน',
  'กรมโยธาธิการและผังเมือง',
  'กระทรวงคมนาคม',
  'กระทรวงการคลัง',
  'กระทรวงมหาดไทย',
  'กระทรวงเกษตรและสหกรณ์',
  'กระทรวงสาธารณสุข',
  'กระทรวงศึกษาธิการ',
  'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม',
  'สำนักงานตำรวจแห่งชาติ',
  'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
];

// ==========================================
// JOB VALIDATION ENGINE CLASS
// ==========================================

export class JobValidationEngine {
  // Main Entry: Validate an Extracted Job
  public static validateJob(job: ExtractedGovJob, jobIdHint?: string): JobValidationReport {
    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const jobId = jobIdHint || `job-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const issues: ValidationIssue[] = [];

    const jobTitle = job.position?.positionTitle || 'ไม่ระบุชื่อตำแหน่ง';
    const agencyName = job.agency?.agencyName || 'ไม่ระบุหน่วยงาน';

    appendValidationLog(reportId, 'INFO', 'VALIDATION_STARTED', `เริ่มต้นการตรวจสอบคุณภาพข้อมูลประกาศ: ${jobTitle} (${agencyName})`);

    // -------------------------------------------------------------
    // RULE 1: MISSING FIELDS DETECTION
    // -------------------------------------------------------------
    if (!job.agency?.agencyName || job.agency.agencyName.includes('ไม่ระบุ')) {
      issues.push({
        id: `iss-${Date.now()}-1`,
        category: 'MISSING_FIELDS',
        severity: 'CRITICAL',
        field: 'agency.agencyName',
        message: 'ขาดข้อมูลชื่อหน่วยงานภาครัฐต้นสังกัด',
        suggestedFix: 'โปรดตรวจสอบประกาศและระบุชื่อกรม หรือกระทรวงให้ถูกต้อง',
        currentValue: job.agency?.agencyName,
      });
    }

    if (!job.position?.positionTitle || job.position.positionTitle.includes('ไม่ระบุ')) {
      issues.push({
        id: `iss-${Date.now()}-2`,
        category: 'MISSING_FIELDS',
        severity: 'CRITICAL',
        field: 'position.positionTitle',
        message: 'ขาดข้อมูลชื่อตำแหน่งงานที่เปิดรับสมัคร',
        suggestedFix: 'โปรดระบุชื่อตำแหน่งงาน เช่น วิศวกรโยธาปฏิบัติการ',
        currentValue: job.position?.positionTitle,
      });
    }

    if (!job.education?.degreeRequired || job.education.degreeRequired === 'ไม่ระบุ') {
      issues.push({
        id: `iss-${Date.now()}-3`,
        category: 'MISSING_FIELDS',
        severity: 'WARNING',
        field: 'education.degreeRequired',
        message: 'ไม่ระบุระดับวุฒิการศึกษาขั้นต่ำ',
        suggestedFix: 'ระบุวุฒิการศึกษา เช่น ปริญญาตรี, ปวส., ปวช.',
        currentValue: job.education?.degreeRequired,
      });
    }

    if (!job.major?.majorsAllowed || job.major.majorsAllowed.length === 0) {
      issues.push({
        id: `iss-${Date.now()}-4`,
        category: 'MISSING_FIELDS',
        severity: 'WARNING',
        field: 'major.majorsAllowed',
        message: 'ไม่ระบุสาขาวิชาที่เปิดรับสมัคร',
        suggestedFix: 'ระบุสาขาวิชา หรือระบุว่า "ทุกสาขาวิชา"',
        currentValue: job.major?.majorsAllowed,
      });
    }

    if (!job.applicationPeriod?.rawPeriodText || job.applicationPeriod.rawPeriodText.includes('ไม่ระบุ')) {
      issues.push({
        id: `iss-${Date.now()}-5`,
        category: 'MISSING_FIELDS',
        severity: 'CRITICAL',
        field: 'applicationPeriod.rawPeriodText',
        message: 'ขาดกำหนดการและช่วงเวลารับสมัครงาน',
        suggestedFix: 'ระบุวันเริ่มต้นและสิ้นสุดการรับสมัครตามประกาศ',
        currentValue: job.applicationPeriod?.rawPeriodText,
      });
    }

    appendValidationLog(reportId, 'INFO', 'MISSING_FIELDS_CHECKED', 'ตรวจสอบความครบถ้วนของฟิลด์ข้อมูลเรียบร้อย');

    // -------------------------------------------------------------
    // RULE 2: DUPLICATE JOB DETECTION
    // -------------------------------------------------------------
    const fingerprintString = `${agencyName.trim().toLowerCase()}_${jobTitle.trim().toLowerCase()}_${job.vacanciesCount}_${
      job.salary?.salaryText || ''
    }`;
    const jobHash = crypto.createHash('md5').update(fingerprintString).digest('hex');

    let duplicateMatchId: string | undefined;
    let duplicateConfidencePercent: number | undefined;

    if (knownJobFingerprints.has(jobHash)) {
      const match = knownJobFingerprints.get(jobHash)!;
      duplicateMatchId = match.reportId;
      duplicateConfidencePercent = 98;

      issues.push({
        id: `iss-${Date.now()}-6`,
        category: 'DUPLICATE_JOB',
        severity: 'CRITICAL',
        field: 'jobFingerprint',
        message: `พบประกาศรับสมัครซ้ำซ้อนในระบบ (ตรงกับรายงาน ID: ${match.reportId})`,
        suggestedFix: 'ตรวจสอบว่าเป็นการประกาศซ้ำ หรือเป็นการเปิดรับสมัครรอบใหม่',
        currentValue: `Hash: ${jobHash.substring(0, 10)}...`,
      });
    } else {
      knownJobFingerprints.set(jobHash, { reportId, jobTitle, agencyName });
    }

    appendValidationLog(reportId, 'INFO', 'DUPLICATE_CHECKED', 'ตรวจสอบลายนิ้วมือข้อมูลซ้ำซ้อนเรียบร้อย');

    // -------------------------------------------------------------
    // RULE 3: INVALID DATES DETECTION
    // -------------------------------------------------------------
    const startDateStr = job.applicationPeriod?.startDate;
    const endDateStr = job.applicationPeriod?.endDate;

    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end.getTime() < start.getTime()) {
          issues.push({
            id: `iss-${Date.now()}-7`,
            category: 'INVALID_DATES',
            severity: 'CRITICAL',
            field: 'applicationPeriod.endDate',
            message: `วันปิดรับสมัคร (${endDateStr}) เกิดขึ้นก่อนวันเริ่มรับสมัคร (${startDateStr})`,
            suggestedFix: 'แก้ไขวันสิ้นสุดรับสมัครให้มากกว่าหรือเท่ากับวันเริ่มต้น',
            currentValue: `${startDateStr} ถึง ${endDateStr}`,
          });
        }
      } else {
        issues.push({
          id: `iss-${Date.now()}-8`,
          category: 'INVALID_DATES',
          severity: 'WARNING',
          field: 'applicationPeriod.startDate',
          message: 'รูปแบบวันที่ไม่เป็นมาตรฐาน ISO (YYYY-MM-DD)',
          suggestedFix: 'แปลงข้อความวันที่เป็นรูปแบบ ISO เช่น 2026-08-01',
          currentValue: `Start: ${startDateStr}, End: ${endDateStr}`,
        });
      }
    }

    appendValidationLog(reportId, 'INFO', 'DATES_VALIDATED', 'ตรวจสอบความถูกต้องของวันและเวลาเรียบร้อย');

    // -------------------------------------------------------------
    // RULE 4: INVALID SALARY DETECTION
    // -------------------------------------------------------------
    const minSalary = job.salary?.salaryMin;
    const maxSalary = job.salary?.salaryMax;

    if (minSalary !== null && minSalary !== undefined) {
      if (minSalary < 0) {
        issues.push({
          id: `iss-${Date.now()}-9`,
          category: 'INVALID_SALARY',
          severity: 'CRITICAL',
          field: 'salary.salaryMin',
          message: 'อัตราเงินเดือนขั้นต่ำติดลบ',
          suggestedFix: 'ปรับปรุงตัวเลขเงินเดือนให้ถูกต้องเป็นบวก',
          currentValue: minSalary,
        });
      } else if (minSalary > 0 && minSalary < 5000) {
        issues.push({
          id: `iss-${Date.now()}-10`,
          category: 'INVALID_SALARY',
          severity: 'WARNING',
          field: 'salary.salaryMin',
          message: `อัตราเงินเดือนต่ำกว่าเกณฑ์มาตรฐานภาครัฐ (${minSalary} บาท)`,
          suggestedFix: 'ตรวจสอบโครงสร้างเงินเดือนตามระเบียบคณะกรรมการข้าราชการพลเรือน',
          currentValue: minSalary,
        });
      }
    }

    if (
      minSalary !== null &&
      minSalary !== undefined &&
      maxSalary !== null &&
      maxSalary !== undefined
    ) {
      if (maxSalary < minSalary) {
        issues.push({
          id: `iss-${Date.now()}-11`,
          category: 'INVALID_SALARY',
          severity: 'CRITICAL',
          field: 'salary.salaryMax',
          message: `เงินเดือนขั้นสูง (${maxSalary}) น้อยกว่าเงินเดือนขั้นต่ำ (${minSalary})`,
          suggestedFix: 'สลับค่าเงินเดือนขั้นต่ำและขั้นสูงให้ถูกต้อง',
          currentValue: `Min: ${minSalary}, Max: ${maxSalary}`,
        });
      }
    }

    appendValidationLog(reportId, 'INFO', 'SALARY_VALIDATED', 'ตรวจสอบโครงสร้างอัตราเงินเดือนเรียบร้อย');

    // -------------------------------------------------------------
    // RULE 5: AGENCY MISMATCH DETECTION
    // -------------------------------------------------------------
    const matchedKnownAgency = KNOWN_THAI_AGENCIES.some(
      (known) => agencyName.includes(known) || known.includes(agencyName)
    );

    if (!matchedKnownAgency && agencyName.length > 2) {
      issues.push({
        id: `iss-${Date.now()}-12`,
        category: 'AGENCY_MISMATCH',
        severity: 'WARNING',
        field: 'agency.agencyName',
        message: `ชื่อหน่วยงาน "${agencyName}" ไม่ตรงกับทะเบียนหน่วยงานภาครัฐส่วนกลาง`,
        suggestedFix: 'ตรวจสอบว่าชื่อหน่วยงานตรงตามทะเบียนทางราชการ หรือเป็นหน่วยงานระดับท้องถิ่น',
        currentValue: agencyName,
      });
    }

    appendValidationLog(reportId, 'INFO', 'AGENCY_CHECKED', 'ตรวจสอบความสอดคล้องของชื่อหน่วยงานเรียบร้อย');

    // -------------------------------------------------------------
    // RULE 6: LOW CONFIDENCE DETECTION
    // -------------------------------------------------------------
    const confidence = job.confidenceScore?.overallConfidenceScore ?? 1.0;

    if (confidence < 0.65) {
      issues.push({
        id: `iss-${Date.now()}-13`,
        category: 'LOW_CONFIDENCE',
        severity: 'CRITICAL',
        field: 'confidenceScore.overallConfidenceScore',
        message: `คะแนนความเชื่อมั่นในการสกัดข้อมูลต่ำกว่าเกณฑ์ (${Math.round(confidence * 100)}%)`,
        suggestedFix: 'ต้องการการตรวจสอบและแก้ไขด้วยมนุษย์ (Human-in-the-loop verification)',
        currentValue: confidence,
      });
    } else if (confidence < 0.8) {
      issues.push({
        id: `iss-${Date.now()}-14`,
        category: 'LOW_CONFIDENCE',
        severity: 'WARNING',
        field: 'confidenceScore.overallConfidenceScore',
        message: `คะแนนความเชื่อมั่นปานกลาง (${Math.round(confidence * 100)}%)`,
        suggestedFix: 'แนะนำให้ทบทวนฟิลด์ที่ไม่มั่นใจก่อนอนุมัติเผยแพร่',
        currentValue: confidence,
      });
    }

    appendValidationLog(reportId, 'INFO', 'CONFIDENCE_EVALUATED', 'ประเมินคะแนนความเชื่อมั่นและเกณฑ์ความเสี่ยงเรียบร้อย');

    // -------------------------------------------------------------
    // CALCULATION OF HEALTH SCORE & STATUS
    // -------------------------------------------------------------
    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = issues.filter((i) => i.severity === 'INFO').length;

    // Deduct points: Critical -25pts, Warning -10pts, Info -3pts
    let healthScore = 100 - (criticalCount * 25 + warningCount * 10 + infoCount * 3);
    if (healthScore < 0) healthScore = 0;

    let overallStatus: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAILED_REJECTED' = 'PASS';

    if (criticalCount > 0 || healthScore < 50) {
      overallStatus = 'FAILED_REJECTED';
    } else if (warningCount > 0 || healthScore < 85) {
      overallStatus = 'PASS_WITH_WARNINGS';
    }

    const report: JobValidationReport = {
      id: reportId,
      jobId,
      jobTitle,
      agencyName,
      timestamp: new Date().toISOString(),
      healthScore,
      overallStatus,
      issuesCount: {
        critical: criticalCount,
        warning: warningCount,
        info: infoCount,
        total: issues.length,
      },
      issues,
      duplicateMatchId,
      duplicateConfidencePercent,
      validatedByRulesVersion: 'v8.0.0-Sprint8',
      rawJobData: job,
    };

    validationReportsMap.set(reportId, report);

    appendValidationLog(
      reportId,
      'INFO',
      'REPORT_GENERATED',
      `สร้างรายงานผลการตรวจสอบสำเร็จ (Health Score: ${healthScore}/100, Status: ${overallStatus})`
    );

    return report;
  }

  // ==========================================
  // MANAGEMENT & QUERY API METHODS
  // ==========================================

  public static getValidationReportsList() {
    return Array.from(validationReportsMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public static getReportById(id: string) {
    return validationReportsMap.get(id);
  }

  public static deleteReport(id: string): boolean {
    return validationReportsMap.delete(id);
  }

  public static getAuditLogs(limit = 100) {
    return validationLogs.slice(0, limit);
  }

  public static getEngineStats(): ValidationEngineStats {
    const list = Array.from(validationReportsMap.values());
    const totalValidated = list.length;
    const passedCount = list.filter((r) => r.overallStatus === 'PASS').length;
    const passedWithWarningsCount = list.filter((r) => r.overallStatus === 'PASS_WITH_WARNINGS').length;
    const failedRejectedCount = list.filter((r) => r.overallStatus === 'FAILED_REJECTED').length;

    const issueCountsByCategory: Record<IssueCategory, number> = {
      MISSING_FIELDS: 0,
      DUPLICATE_JOB: 0,
      INVALID_DATES: 0,
      INVALID_SALARY: 0,
      AGENCY_MISMATCH: 0,
      LOW_CONFIDENCE: 0,
    };

    let totalHealthSum = 0;
    let duplicateCount = 0;

    for (const rep of list) {
      totalHealthSum += rep.healthScore;
      if (rep.duplicateMatchId) duplicateCount++;

      for (const iss of rep.issues) {
        issueCountsByCategory[iss.category] = (issueCountsByCategory[iss.category] || 0) + 1;
      }
    }

    const averageHealthScore = totalValidated > 0 ? Math.round(totalHealthSum / totalValidated) : 100;
    const duplicationRatePercent =
      totalValidated > 0 ? Number(((duplicateCount / totalValidated) * 100).toFixed(1)) : 0;

    return {
      totalValidated,
      passedCount,
      passedWithWarningsCount,
      failedRejectedCount,
      issueCountsByCategory,
      averageHealthScore,
      duplicationRatePercent,
    };
  }
}

// Seed Initial Preset Jobs with Deliberate Quality Variance for Instant Audit
JobValidationEngine.validateJob({
  agency: { agencyName: 'กรมทางหลวง', ministry: 'กระทรวงคมนาคม' },
  position: { positionTitle: 'วิศวกรโยธาปฏิบัติการ', jobLevel: 'ปฏิบัติการ' },
  salary: { salaryMin: 15000, salaryMax: 16500, salaryText: '15,000 - 16,500 บาท' },
  education: { degreeRequired: 'ปริญญาตรี', isOcscRequired: true, ocscLevelRequired: 'ผ่าน ภาค ก. ปริญญาตรี' },
  major: { majorsAllowed: ['วิศวกรรมโยธา', 'วิศวกรรมโครงสร้าง'] },
  experience: { experienceYearsRequired: 0, experienceText: 'ไม่ต้องมีประสบการณ์' },
  employmentType: { positionType: 'ข้าราชการสามัญ' },
  applicationPeriod: { startDate: '2026-08-01', endDate: '2026-08-25', rawPeriodText: '1-25 สิงหาคม 2569' },
  requiredDocuments: ['สำเนาปริญญาบัตร', 'สำเนาบัตรประชาชน'],
  vacanciesCount: 5,
  confidenceScore: { overallConfidenceScore: 0.96 },
  validationStatus: 'VALIDATED',
  validationNotes: ['ข้อมูลถูกต้องสมบูรณ์'],
});

// Seed Job with Invalid Date & Negative Salary Defects
JobValidationEngine.validateJob({
  agency: { agencyName: 'หน่วยงานไม่ระบุชื่อ' },
  position: { positionTitle: 'พนักงานขับรถยนต์' },
  salary: { salaryMin: -5000, salaryMax: 12000, salaryText: '-5000 - 12000 บาท' },
  education: { degreeRequired: 'ไม่ระบุ', isOcscRequired: false },
  major: { majorsAllowed: [] },
  experience: { experienceYearsRequired: 0, experienceText: 'ไม่ระบุ' },
  employmentType: { positionType: 'ลูกจ้างชั่วคราว' },
  applicationPeriod: { startDate: '2026-09-20', endDate: '2026-09-01', rawPeriodText: '20 ก.ย. ถึง 1 ก.ย.' },
  requiredDocuments: [],
  vacanciesCount: 1,
  confidenceScore: { overallConfidenceScore: 0.45 },
  validationStatus: 'REQUIRES_HUMAN_REVIEW',
  validationNotes: ['พบข้อผิดพลาดหลายจุด'],
});
