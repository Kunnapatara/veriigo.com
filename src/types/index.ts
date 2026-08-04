/**
 * VERIIGO - Domain Models, Data Transfer Objects & Core Types
 */

export type UserRole = 'USER' | 'AGENCY' | 'ADMIN';

export type OCSCLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
export type OCSCExamStatus = 'PASSED' | 'PENDING' | 'FAILED' | 'NOT_TAKEN';

export interface EducationRecord {
  degree: string; // e.g. "ปริญญาตรี" (Bachelor's Degree)
  fieldOfStudy: string; // e.g. "รัฐประศาสนศาสตร์" or "วิศวกรรมคอมพิวเตอร์"
  institution: string; // e.g. "จุฬาลงกรณ์มหาวิทยาลัย"
  gpa: number;
  graduationYear: number;
  ocscAccredited: boolean;
}

export interface OCSCExamRecord {
  paperLevel: OCSCLevel;
  paperName: string; // e.g. "ภาค ก. ปริญญาตรี"
  status: OCSCExamStatus;
  score?: number;
  passedYear?: number;
  certificateNo?: string;
}

export interface CertificateRecord {
  name: string;
  issuer: string;
  issueYear: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  thaiIdEncrypted?: string;
  role: UserRole;
  education: EducationRecord[];
  ocscExams: OCSCExamRecord[];
  certificates: CertificateRecord[];
  skills: string[];
  careerReadinessScore: number; // 0 - 100
  desiredAgencies?: string[];
  desiredMinSalary?: number;
  updatedAt: string;
}

export type JobStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface JobListing {
  id: string;
  title: string;
  agencyName: string;
  agencyCode?: string;
  ministry: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  province?: string;
  positionType: string; // e.g. "ข้าราชการพลเรือนสามัญ", "พนักงานราชการ"
  vacanciesCount: number;
  tags: string[];
  ocscLevelRequired: OCSCLevel;
  degreeRequired: string[];
  majorsAllowed?: string[];
  requirementsText: string;
  applicationUrl: string;
  deadline: string; // ISO date string
  examDate?: string;
  status: JobStatus;
  createdAt: string;
  matchScore?: number; // Calculated on-the-fly for logged-in user
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENT_VERIFIED'
  | 'EXAM_SCHEDULED'
  | 'INTERVIEWING'
  | 'ACCEPTED'
  | 'REJECTED';

export interface ApplicationTimelineEvent {
  status: ApplicationStatus;
  timestamp: string;
  note: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  jobTitle?: string;
  agencyName?: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
  timeline?: ApplicationTimelineEvent[];
}

export interface AIMatchAnalysis {
  jobId: string;
  score: number; // 0 - 100
  summary: string; // Thai summary of eligibility
  qualificationHighlights: string[];
  gapPoints: string[];
  recommendedSteps: string[];
  ocscEligibilityStatus: string;
  estimatedPrepareDays: number;
  analyzedAt: string;
}

export interface AICareerRoadmap {
  targetLevelIn5Years: string;
  recommendedAgencies: string[];
  milestones: {
    phase: string;
    focus: string;
    actions: string[];
  }[];
  topCertificationsToGain: string[];
}

export type NotificationType =
  | 'URGENT'
  | 'RECOMMENDATION'
  | 'STATUS_CHANGE'
  | 'EXAM_REMINDER';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ExamScheduleItem {
  id: string;
  jobId: string;
  jobTitle: string;
  agencyName: string;
  examType: string; // e.g., "สอบ ภาค ข. ข้อเขียน", "สอบสัมภาษณ์ ภาค ค."
  date: string;
  location: string;
  instructions: string;
}

export type SubscriptionTier = 'FREE' | 'PRO' | 'PRO_MAX_ENTERPRISE';

export interface UserSubscription {
  tier: SubscriptionTier;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  validUntil: string;
  autoRenew: boolean;
  features: string[];
  quotaUsed: number;
  quotaLimit: number;
}

export interface SavedJobItem {
  id: string;
  jobId: string;
  job: JobListing;
  savedAt: string;
  notes?: string;
}

export interface RecentSearchItem {
  id: string;
  queryText: string;
  filterSummary: string;
  timestamp: string;
  resultCount: number;
}

/**
 * API Contracts & Standard Envelopes
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface JobSearchFilters {
  keyword?: string;
  province?: string;
  agency?: string;
  ministry?: string;
  degree?: string;
  major?: string;
  positionType?: string;
  minSalary?: number;
  maxSalary?: number;
  closingDateRange?: 'ALL' | 'CLOSING_SOON_7' | 'CLOSING_SOON_30' | 'ACTIVE_ONLY' | 'EXPIRED';
  ocscLevel?: OCSCLevel;
  sortBy?: 'deadline_asc' | 'deadline_desc' | 'salary_desc' | 'salary_asc' | 'created_desc' | 'title_asc' | 'vacancies_desc';
  page?: number;
  limit?: number;
}
