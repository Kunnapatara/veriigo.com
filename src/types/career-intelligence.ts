/**
 * VERIIGO - Career Intelligence Engine Domain Types
 * Defines data structures for User Profile Intelligence, Job Match Engine,
 * Application Success Intelligence, Smart Alert System, and AI Career Assistant.
 */

import { JobListing } from './index';

export interface UserCareerProfile {
  userId: string;
  email: string;
  fullName: string;
  education: {
    degree: string; // e.g., "ปริญญาตรี", "ปริญญาโท"
    major: string; // e.g., "วิศวกรรมคอมพิวเตอร์", "รัฐประศาสนศาสตร์"
    university: string; // e.g., "จุฬาลงกรณ์มหาวิทยาลัย", "มหาวิทยาลัยเชียงใหม่"
    graduationYear: number;
    gpa?: number;
    ocscAccredited: boolean;
  };
  preferences: {
    preferredProvinces: string[]; // e.g., ["กรุงเทพมหานคร", "นนทบุรี", "เชียงใหม่"]
    preferredAgencies: string[]; // e.g., ["สำนักงาน ก.พ.", "กระทรวงมหาดไทย"]
    employmentTypes: string[]; // e.g., "ข้าราชการพลเรือนสามัญ", "พนักงานราชการ"
    minSalary: number;
    maxSalary?: number;
  };
  eligibility: {
    age: number;
    experienceYears: number;
    ocscExamStatus: 'PASSED_LEVEL_1' | 'PASSED_LEVEL_2' | 'PASSED_LEVEL_3' | 'PASSED_LEVEL_4' | 'PENDING' | 'NOT_TAKEN';
    ocscCertificateNo?: string;
    previousApplicationsCount: number;
    certificates: string[]; // e.g., ["TOEIC 750+", "PMP", "วิศวกรควบคุม"]
  };
  updatedAt: string;
}

export interface ScoreComponent {
  score: number; // Obtained points
  maxScore: number; // Max possible
  passed: boolean;
  explanation: string;
  evidence: string;
}

export interface JobMatchBreakdown {
  jobId: string;
  jobTitle: string;
  agencyName: string;
  overallMatchScore: number; // 0 - 100
  components: {
    education: ScoreComponent;
    major: ScoreComponent;
    location: ScoreComponent;
    experience: ScoreComponent;
    eligibility: ScoreComponent;
    salary: ScoreComponent;
  };
  keyMatchReasons: string[];
  gapWarnings: string[];
  evidenceSource: string;
  calculatedAt: string;
}

export interface ApplicationOpportunityIntelligence {
  jobId: string;
  jobTitle: string;
  agencyName: string;
  opportunityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  opportunityScore: number; // 0 - 100
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  competitionRiskText: string;
  daysRemaining: number;
  vacanciesCount: number;
  matchScore: number;
  historicalApplicantDifficulty: 'ACCESSIBLE' | 'BALANCED' | 'COMPETITIVE' | 'HIGHLY_COMPETITIVE';
  rationale: string[];
  evidenceSource: string;
}

export interface SmartJobAlert {
  id: string;
  jobId: string;
  jobTitle: string;
  agencyName: string;
  matchScore: number;
  triggerReason: 'HIGH_MATCH_NEW' | 'DEADLINE_APPROACHING' | 'HIGH_TRUST_AGENCY' | 'COMPETITION_ADVANTAGE';
  triggerBadgeText: string;
  daysLeft: number;
  sourceTrustScore: number;
  evidenceSource: string;
  createdAt: string;
  isRead: boolean;
}

export interface AICareerAssistantQuery {
  userProfile: UserCareerProfile;
  job?: JobListing;
  question: string;
}

export interface AICareerAssistantResponse {
  eligibleToApply: 'YES' | 'CONDITIONAL' | 'NO';
  satisfiedRequirements: string[];
  missingRequirements: string[];
  recommendedActions: string[];
  evidenceSource: string;
  confidenceScore: number; // 0 - 100
  reasoningSummary: string;
  suggestedPreparationDays: number;
}
