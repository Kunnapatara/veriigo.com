/**
 * VERIIGO - System & Domain Constants
 * Centralized constants for OCSC levels, ministries, HTTP status codes, and status metadata.
 */

import { OCSCLevel, ApplicationStatus, JobStatus } from '../types';

export const SYSTEM = {
  NAME: 'VERIIGO',
  FULL_NAME: 'VERIIGO - Government Career Intelligence Platform',
  TAGLINE: 'ระบบข่าวสารและวิเคราะห์ความก้าวหน้าในสายงานราชการด้วย AI',
  VERSION: '1.0.0-sprint1',
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const OCSC_LEVELS: Record<OCSCLevel, { label: string; nameThai: string; minDegree: string }> = {
  LEVEL_1: { label: 'ระดับ 1', nameThai: 'ประกาศนียบัตรวิชาชีพ (ปวช.)', minDegree: 'ปวช.' },
  LEVEL_2: { label: 'ระดับ 2', nameThai: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', minDegree: 'ปวส.' },
  LEVEL_3: { label: 'ระดับ 3', nameThai: 'ปริญญาตรี', minDegree: 'ปริญญาตรี' },
  LEVEL_4: { label: 'ระดับ 4', nameThai: 'ปริญญาโท / ปริญญาเอก', minDegree: 'ปริญญาโท' },
};

export const THAI_MINISTRIES = [
  'สำนักนายกรัฐมนตรี',
  'กระทรวงการคลัง',
  'กระทรวงการต่างประเทศ',
  'กระทรวงการท่องเที่ยวและกีฬา',
  'กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์',
  'กระทรวงอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม',
  'กระทรวงเกษตรและสหกรณ์',
  'กระทรวงคมนาคม',
  'กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม',
  'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม',
  'กระทรวงพลังงาน',
  'กระทรวงพาณิชย์',
  'กระทรวงมหาดไทย',
  'กระทรวงยุติธรรม',
  'กระทรวงแรงงาน',
  'กระทรวงวัฒนธรรม',
  'กระทรวงศึกษาธิการ',
  'กระทรวงสาธารณสุข',
  'กระทรวงอุตสาหกรรม',
  'สำนักงาน ก.พ.',
] as const;

export const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  { labelThai: string; badgeColor: string; stepOrder: number }
> = {
  DRAFT: { labelThai: 'ร่างการสมัคร', badgeColor: 'bg-slate-100 text-slate-700 border-slate-300', stepOrder: 1 },
  SUBMITTED: { labelThai: 'ยื่นใบสมัครแล้ว', badgeColor: 'bg-blue-50 text-blue-700 border-blue-300', stepOrder: 2 },
  DOCUMENT_VERIFIED: { labelThai: 'ผ่านการตรวจเอกสาร', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-300', stepOrder: 3 },
  EXAM_SCHEDULED: { labelThai: 'นัดสอบ ภาค ข.', badgeColor: 'bg-purple-50 text-purple-700 border-purple-300', stepOrder: 4 },
  INTERVIEWING: { labelThai: 'สอบสัมภาษณ์ ภาค ค.', badgeColor: 'bg-amber-50 text-amber-700 border-amber-300', stepOrder: 5 },
  ACCEPTED: { labelThai: 'บรรจุเข้ารับราชการ', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300', stepOrder: 6 },
  REJECTED: { labelThai: 'ไม่ผ่านการคัดเลือก', badgeColor: 'bg-rose-50 text-rose-700 border-rose-300', stepOrder: 99 },
};

export const JOB_STATUS_CONFIG: Record<JobStatus, { labelThai: string; badgeColor: string }> = {
  ACTIVE: { labelThai: 'เปิดรับสมัครอยู่', badgeColor: 'bg-emerald-100 text-emerald-800' },
  CLOSED: { labelThai: 'ปิดรับสมัครแล้ว', badgeColor: 'bg-rose-100 text-rose-800' },
  ARCHIVED: { labelThai: 'จัดเก็บในคลัง', badgeColor: 'bg-slate-100 text-slate-600' },
};
