/**
 * VERIIGO V2 - Phase 2 Job Validation Engine
 * Enforces strict verification rules prior to database persistence:
 * Rejects invalid schemas, missing titles, missing organizations,
 * missing source documents, or low confidence scores.
 */

import { logger } from '../lib/logger';

export interface ValidationRuleResult {
  ruleCode: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  status: 'VALIDATED' | 'REQUIRES_HUMAN_REVIEW' | 'REJECTED';
  overallConfidenceScore: number;
  validationVersion: string; // e.g., 'validator-v2.1.0'
  ruleResults: ValidationRuleResult[];
  rejectionReasons: string[];
}

export class JobValidationEngine {
  public static readonly VALIDATION_VERSION = 'validator-v2.1.0';
  public static readonly CONFIDENCE_PASS_THRESHOLD = 0.85;
  public static readonly CONFIDENCE_REVIEW_THRESHOLD = 0.60;

  /**
   * Validate extracted structured job JSON against mandatory compliance rules
   */
  public static validate(
    extractedData: any,
    sourceDocumentId: string,
    traceId: string
  ): ValidationResult {
    const rules: ValidationRuleResult[] = [];
    const rejectionReasons: string[] = [];
    const validationVersion = this.VALIDATION_VERSION;

    // Rule 1: Schema Structure & Null Check
    if (!extractedData || typeof extractedData !== 'object') {
      rejectionReasons.push('Schema validation failed: Extracted data is null or non-object');
      return {
        isValid: false,
        status: 'REJECTED',
        overallConfidenceScore: 0.0,
        validationVersion,
        ruleResults: [{ ruleCode: 'SCHEMA_STRUCTURE', passed: false, message: 'Non-object payload' }],
        rejectionReasons,
      };
    }

    rules.push({ ruleCode: 'SCHEMA_STRUCTURE', passed: true, message: 'Valid object payload structure' });

    // Rule 2: Mandatory Source Document Lineage Check
    if (!sourceDocumentId || sourceDocumentId.trim() === '') {
      rules.push({ ruleCode: 'SOURCE_DOCUMENT_LINEAGE', passed: false, message: 'Missing source document reference ID' });
      rejectionReasons.push('Source document lineage error: missing sourceDocumentId');
    } else {
      rules.push({ ruleCode: 'SOURCE_DOCUMENT_LINEAGE', passed: true, message: `Linked to Document Lake ID: ${sourceDocumentId}` });
    }

    // Rule 3: Mandatory Job Title Check
    const positionTitle = extractedData?.position?.positionTitle || extractedData?.title;
    if (!positionTitle || typeof positionTitle !== 'string' || positionTitle.trim() === '') {
      rules.push({ ruleCode: 'MANDATORY_JOB_TITLE', passed: false, message: 'Missing mandatory position title' });
      rejectionReasons.push('Validation failure: Position title is missing or empty');
    } else {
      rules.push({ ruleCode: 'MANDATORY_JOB_TITLE', passed: true, message: `Position title verified: ${positionTitle}` });
    }

    // Rule 4: Mandatory Organization / Agency Name Check
    const agencyName = extractedData?.agency?.agencyName || extractedData?.agencyName;
    if (!agencyName || typeof agencyName !== 'string' || agencyName.trim() === '') {
      rules.push({ ruleCode: 'MANDATORY_ORGANIZATION', passed: false, message: 'Missing mandatory organization/agency name' });
      rejectionReasons.push('Validation failure: Organization / Agency name is missing or empty');
    } else {
      rules.push({ ruleCode: 'MANDATORY_ORGANIZATION', passed: true, message: `Organization verified: ${agencyName}` });
    }

    // Rule 5: Confidence Score Evaluation
    let score = 0.85; // default fallback if absent
    if (typeof extractedData?.confidenceScore?.overallConfidenceScore === 'number') {
      score = extractedData.confidenceScore.overallConfidenceScore;
    } else if (typeof extractedData?.confidenceScore === 'number') {
      score = extractedData.confidenceScore;
    }

    if (score < this.CONFIDENCE_REVIEW_THRESHOLD) {
      rules.push({
        ruleCode: 'CONFIDENCE_THRESHOLD',
        passed: false,
        message: `Confidence score (${score}) below minimum rejection threshold (${this.CONFIDENCE_REVIEW_THRESHOLD})`,
      });
      rejectionReasons.push(`Confidence score (${score}) is below absolute threshold ${this.CONFIDENCE_REVIEW_THRESHOLD}`);
    } else {
      rules.push({
        ruleCode: 'CONFIDENCE_THRESHOLD',
        passed: true,
        message: `Confidence score (${score}) meets minimum requirement`,
      });
    }

    // Determine Overall Status
    const mandatoryPassed = rules.every((r) => r.passed);
    let status: 'VALIDATED' | 'REQUIRES_HUMAN_REVIEW' | 'REJECTED' = 'REJECTED';

    if (!mandatoryPassed || score < this.CONFIDENCE_REVIEW_THRESHOLD) {
      status = 'REJECTED';
    } else if (score < this.CONFIDENCE_PASS_THRESHOLD) {
      status = 'REQUIRES_HUMAN_REVIEW';
    } else {
      status = 'VALIDATED';
    }

    const isValid = status === 'VALIDATED' || status === 'REQUIRES_HUMAN_REVIEW';

    logger.info(
      {
        traceId,
        operation: 'JobValidationEngine.validate',
        sourceDocumentId,
        status,
        confidenceScore: score,
        rejectionCount: rejectionReasons.length,
      },
      `Job validation completed with status: ${status} (Score: ${score})`
    );

    return {
      isValid,
      status,
      overallConfidenceScore: score,
      validationVersion,
      ruleResults: rules,
      rejectionReasons,
    };
  }
}
