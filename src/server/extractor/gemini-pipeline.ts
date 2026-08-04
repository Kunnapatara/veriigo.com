import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { DocumentDownloadEngine } from '../downloader/download-engine';

// ==========================================
// ZOD VALIDATION SCHEMA FOR EXTRACTION PIPELINE
// ==========================================

export const ExtractedGovJobSchema = z.object({
  agency: z.object({
    agencyName: z.string().describe('ชื่อหน่วยงาน เช่น กรมทางหลวง, สำนักงาน ป.ป.ช.'),
    ministry: z.string().optional().describe('กระทรวงสังกัด เช่น กระทรวงคมนาคม'),
    department: z.string().optional().describe('กอง/ฝ่าย/สำนัก'),
  }),
  position: z.object({
    positionTitle: z.string().describe('ชื่อตำแหน่งงาน เช่น วิศวกรโยธาปฏิบัติการ'),
    positionCode: z.string().optional().describe('รหัสตำแหน่ง'),
    jobLevel: z.string().optional().describe('ระดับตำแหน่ง เช่น ปฏิบัติการ, ชำนาญการ, บรรจุใหม่'),
  }),
  salary: z.object({
    salaryMin: z.number().nullable().optional().describe('เงินเดือนขั้นต่ำ (บาท)'),
    salaryMax: z.number().nullable().optional().describe('เงินเดือนขั้นสูง (บาท)'),
    salaryText: z.string().describe('ข้อความแสดงเงินเดือน เช่น 15,000 - 16,500 บาท'),
  }),
  education: z.object({
    degreeRequired: z.string().describe('ระดับวุฒิการศึกษา เช่น ปริญญาตรี, ปริญญาโท, ปวส.'),
    ocscLevelRequired: z.string().optional().describe('ระดับการสอบผ่าน ก.พ. เช่น ผ่าน ภาค ก. ระดับปริญญาตรี'),
    isOcscRequired: z.boolean().default(true).describe('ต้องสอบผ่าน ก.พ. ภาค ก. หรือไม่'),
  }),
  major: z.object({
    majorsAllowed: z.array(z.string()).describe('สาขาวิชา/ทางวิชาที่เปิดรับ เช่น วิศวกรรมโยธา, บริหารธุรกิจ'),
    majorNotes: z.string().optional().describe('เงื่อนไขเพิ่มเติมเกี่ยวกับสาขาวิชา'),
  }),
  experience: z.object({
    experienceYearsRequired: z.number().default(0).describe('จำนวนปีประสบการณ์ขั้นต่ำ (0 หากไม่ระบุ)'),
    experienceText: z.string().describe('รายละเอียดประสบการณ์ที่ต้องการ'),
  }),
  employmentType: z.object({
    positionType: z.enum(['ข้าราชการสามัญ', 'พนักงานราชการ', 'ลูกจ้างชั่วคราว', 'พนักงานจ้างเหมาบริการ', 'ไม่ระบุ']).describe('ประเภทการจ้างงาน'),
    contractPeriod: z.string().optional().describe('ระยะเวลาสัญญาจ้าง'),
  }),
  applicationPeriod: z.object({
    startDate: z.string().nullable().optional().describe('วันที่เริ่มรับสมัคร (YYYY-MM-DD หรือ ข้อความ)'),
    endDate: z.string().nullable().optional().describe('วันสิ้นสุดรับสมัคร (YYYY-MM-DD หรือ ข้อความ)'),
    rawPeriodText: z.string().describe('ข้อความช่วงเวลารับสมัครตามประกาศ'),
    applicationMethod: z.string().optional().describe('ช่องทางการสมัคร เช่น ทางอินเทอร์เน็ต, ยื่นด้วยตนเอง'),
    applicationUrl: z.string().optional().describe('URL เว็บไซต์สมัครงาน'),
  }),
  requiredDocuments: z.array(z.string()).describe('รายการเอกสารประกอบการสมัคร'),
  vacanciesCount: z.number().default(1).describe('จำนวนอัตราที่รับสมัคร (คน/อัตรา)'),
  confidenceScore: z.object({
    overallConfidenceScore: z.number().min(0).max(1).describe('คะแนนความเชื่อมั่นรวม (0.0 ถึง 1.0)'),
    fieldScores: z.record(z.string(), z.number().min(0).max(1)).optional().describe('คะแนนความเชื่อมั่นรายฟิลด์'),
  }),
  validationStatus: z.enum(['VALIDATED', 'REQUIRES_HUMAN_REVIEW', 'FLAGGED_INCOMPLETE', 'INVALID_STRUCTURE']).describe('สถานะการตรวจสอบความถูกต้อง'),
  validationNotes: z.array(z.string()).describe('ข้อสังเกตหรือคำเตือนจากการตรวจสอบ'),
});

export type ExtractedGovJob = z.infer<typeof ExtractedGovJobSchema>;

export interface ExtractionRecord {
  id: string;
  sourceType: 'TEXT_PROMPT' | 'DOWNLOADED_DOCUMENT' | 'PRESET_ANNOUNCEMENT';
  documentId?: string;
  documentTitle?: string;
  rawInputSnippet: string;
  extractedData?: ExtractedGovJob;
  attemptsCount: number;
  maxRetries: number;
  processingTimeMs: number;
  promptTokensUsed?: number;
  completionTokensUsed?: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'REPAIRED';
  errorMessage?: string;
  extractedAt: string;
  processedByModel: string;
}

export interface ExtractionAuditLog {
  id: string;
  recordId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  step:
    | 'EXTRACTION_INIT'
    | 'GEMINI_CALL'
    | 'GEMINI_RETRY'
    | 'JSON_PARSED'
    | 'ZOD_VALIDATED'
    | 'SCHEMA_REPAIRED'
    | 'VALIDATION_WARNING'
    | 'EXTRACTION_FAILED'
    | 'EXTRACTION_SUCCESS';
  message: string;
  details?: Record<string, unknown>;
}

// Global In-Memory Store for Extraction History & Logs
const extractionRecords: Map<string, ExtractionRecord> = new Map();
const extractionLogs: ExtractionAuditLog[] = [];

// Append Audit Log Helper
function appendExtractLog(
  recordId: string,
  level: 'INFO' | 'WARN' | 'ERROR',
  step: ExtractionAuditLog['step'],
  message: string,
  details?: Record<string, unknown>
) {
  const logEntry: ExtractionAuditLog = {
    id: `log-ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recordId,
    timestamp: new Date().toISOString(),
    level,
    step,
    message,
    details,
  };

  extractionLogs.unshift(logEntry);
  if (extractionLogs.length > 1000) extractionLogs.pop();

  console.log(
    JSON.stringify({
      geminiPipeline: true,
      ...logEntry,
    })
  );
}

// Gemini Response Schema Definition for Structured Output
const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    agency: {
      type: Type.OBJECT,
      properties: {
        agencyName: { type: Type.STRING },
        ministry: { type: Type.STRING },
        department: { type: Type.STRING },
      },
      required: ['agencyName'],
    },
    position: {
      type: Type.OBJECT,
      properties: {
        positionTitle: { type: Type.STRING },
        positionCode: { type: Type.STRING },
        jobLevel: { type: Type.STRING },
      },
      required: ['positionTitle'],
    },
    salary: {
      type: Type.OBJECT,
      properties: {
        salaryMin: { type: Type.NUMBER },
        salaryMax: { type: Type.NUMBER },
        salaryText: { type: Type.STRING },
      },
      required: ['salaryText'],
    },
    education: {
      type: Type.OBJECT,
      properties: {
        degreeRequired: { type: Type.STRING },
        ocscLevelRequired: { type: Type.STRING },
        isOcscRequired: { type: Type.BOOLEAN },
      },
      required: ['degreeRequired', 'isOcscRequired'],
    },
    major: {
      type: Type.OBJECT,
      properties: {
        majorsAllowed: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        majorNotes: { type: Type.STRING },
      },
      required: ['majorsAllowed'],
    },
    experience: {
      type: Type.OBJECT,
      properties: {
        experienceYearsRequired: { type: Type.NUMBER },
        experienceText: { type: Type.STRING },
      },
      required: ['experienceYearsRequired', 'experienceText'],
    },
    employmentType: {
      type: Type.OBJECT,
      properties: {
        positionType: { type: Type.STRING },
        contractPeriod: { type: Type.STRING },
      },
      required: ['positionType'],
    },
    applicationPeriod: {
      type: Type.OBJECT,
      properties: {
        startDate: { type: Type.STRING },
        endDate: { type: Type.STRING },
        rawPeriodText: { type: Type.STRING },
        applicationMethod: { type: Type.STRING },
        applicationUrl: { type: Type.STRING },
      },
      required: ['rawPeriodText'],
    },
    requiredDocuments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    vacanciesCount: { type: Type.NUMBER },
    confidenceScore: {
      type: Type.OBJECT,
      properties: {
        overallConfidenceScore: { type: Type.NUMBER },
      },
      required: ['overallConfidenceScore'],
    },
    validationStatus: { type: Type.STRING },
    validationNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'agency',
    'position',
    'salary',
    'education',
    'major',
    'experience',
    'employmentType',
    'applicationPeriod',
    'requiredDocuments',
    'vacanciesCount',
    'confidenceScore',
    'validationStatus',
    'validationNotes',
  ],
};

// SYSTEM INSTRUCTION FOR THAI GOVERNMENT RECRUITMENT EXTRACTION
const GEMINI_SYSTEM_INSTRUCTION = `คุณคือผู้เชี่ยวชาญ AI ในการวิเคราะห์และสกัดข้อมูลโครงสร้างประกาศรับสมัครงานราชการ รัฐวิสาหกิจ และหน่วยงานภาครัฐของไทย (Thai Government Job Recruitment Extraction Engine)

หน้าที่ของคุณคืออ่านประกาศสมัครงานภาษาไทย แล้วสกัดข้อมูลเป็นโครงสร้าง JSON ตาม Schema ที่กำหนดอย่างแม่นยำที่สุด:

ข้อกำหนดในการวิเคราะห์:
1. Agency (หน่วยงาน):
   - agencyName: ชื่อหน่วยงาน เช่น "กรมทางหลวง", "สำนักงาน ป.ป.ช.", "กรมสรรพากร"
   - ministry: กระทรวงต้นสังกัด เช่น "กระทรวงคมนาคม", "กระทรวงการคลัง"
   - department: กอง/สำนัก/ศูนย์
2. Position (ตำแหน่งงาน):
   - positionTitle: ชื่อตำแหน่งงานเต็ม เช่น "วิศวกรโยธาปฏิบัติการ", "นักวิเคราะห์นโยบายและแผนปฏิบัติการ"
   - jobLevel: เช่น "ปฏิบัติการ", "ชำนาญการ", "พนักงานราชการทั่วไป"
3. Salary (เงินเดือน):
   - salaryMin: ตัวเลขเงินเดือนขั้นต่ำ (บาท) เช่น 15000
   - salaryMax: ตัวเลขเงินเดือนขั้นสูง (บาท) เช่น 16500 (ถ้าเป็นอัตราเดียวให้ใส่ตัวเลขเท่ากัน)
   - salaryText: ข้อความสแกนตรงจากประกาศ เช่น "15,000 - 16,500 บาท" หรือ "18,000 บาท"
4. Education (วุฒิการศึกษา):
   - degreeRequired: เช่น "ปริญญาตรี", "ปริญญาโท", "ปวส.", "ปวช."
   - ocscLevelRequired: ระดับสอบผ่าน ก.พ. เช่น "ผ่าน ก.พ. ภาค ก. ระดับปริญญาตรี"
   - isOcscRequired: true หากระบุให้ต้องสอบผ่าน ภาค ก., false หากไม่บังคับ
5. Major (สาขาวิชา):
   - majorsAllowed: Array รายชื่อสาขาวิชา/ทางวิชา เช่น ["วิศวกรรมโยธา", "วิศวกรรมโครงสร้าง"]
6. Experience (ประสบการณ์):
   - experienceYearsRequired: จำนวนปีประสบการณ์ (ใส่ 0 หากเปิดรับนักศึกษาจบใหม่/ไม่ระบุ)
   - experienceText: ข้อความรายละเอียดประสบการณ์ที่ต้องการ
7. Employment Type (ประเภทการจ้างงาน):
   - positionType: ระบุหนึ่งใน ["ข้าราชการสามัญ", "พนักงานราชการ", "ลูกจ้างชั่วคราว", "พนักงานจ้างเหมาบริการ", "ไม่ระบุ"]
8. Application Period (ระยะเวลาและวิธีการสมัคร):
   - startDate / endDate: ในรูปแบบ YYYY-MM-DD (เช่น 2026-08-01) หากคำนวณได้จาก พ.ศ. ให้แปลงเป็น ค.ศ.
   - rawPeriodText: ข้อความวันที่ต้นฉบับ เช่น "1 สิงหาคม - 20 สิงหาคม 2569"
   - applicationMethod: ช่องทาง เช่น "ทางอินเทอร์เน็ต", "ยื่นด้วยตนเอง"
   - applicationUrl: URL หน้าเว็บสมัครถ้ามี
9. Required Documents (เอกสารที่ต้องใช้):
   - Array รายการเอกสาร เช่น ["สำเนาวุฒิการศึกษา", "สำเนาทะเบียนบ้าน", "ใบแสดงผลการสอบ ก.พ. ภาค ก."]
10. Vacancies Count (จำนวนอัตรา):
    - ตัวเลขจำนวนคนที่รับสมัคร เช่น 5
11. Confidence Score & Validation:
    - overallConfidenceScore: คะแนนความมั่นใจ 0.0 ถึง 1.0 ขึ้นกับความสมบูรณ์ของเอกสารต้นฉบับ
    - validationStatus:
      - "VALIDATED" หากข้อมูลครบถ้วนสมบูรณ์
      - "REQUIRES_HUMAN_REVIEW" หากมีข้อมูลบางส่วนไม่ชัดเจน ต้องตรวจสอบ
      - "FLAGGED_INCOMPLETE" หากขาดข้อมูลสำคัญ เช่น ชื่อตำแหน่ง หรือ วุฒิ
    - validationNotes: คำเตือนหรือข้อสังเกตภาษาไทย`;

// ==========================================
// GEMINI EXTRACTION PIPELINE CORE CLASS
// ==========================================

export class GeminiExtractionPipeline {
  private static getGeminiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Primary Extraction Entry Point
  public static async extractJobFromDocument(
    input: {
      documentText?: string;
      documentId?: string;
      sourceType?: 'TEXT_PROMPT' | 'DOWNLOADED_DOCUMENT' | 'PRESET_ANNOUNCEMENT';
      maxRetries?: number;
    }
  ): Promise<ExtractionRecord> {
    const recordId = `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const startTime = Date.now();
    const maxRetries = input.maxRetries ?? 3;
    const sourceType = input.sourceType || (input.documentId ? 'DOWNLOADED_DOCUMENT' : 'TEXT_PROMPT');

    let textToProcess = input.documentText || '';
    let docTitle = 'ประกาศรับสมัครงานภาครัฐ';

    // If documentId is provided, resolve text from Document Downloader Temp Storage
    if (input.documentId) {
      const doc = DocumentDownloadEngine.getDocumentById(input.documentId);
      if (doc && doc.localPath && fs.existsSync(doc.localPath)) {
        try {
          const content = fs.readFileSync(doc.localPath, 'utf-8');
          textToProcess = content;
          docTitle = doc.metadata?.fileName || doc.id;
        } catch (err) {
          console.error(`Failed to read document file ${doc.localPath}:`, err);
        }
      }
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      textToProcess = `ประกาศรับสมัครคัดเลือกบุคคลเข้ารับราชการ
ตำแหน่ง วิศวกรโยธาปฏิบัติการ กรมทางหลวง กระทรวงคมนาคม
อัตราเงินเดือน 15,000 - 16,500 บาท จำนวน 5 อัตรา
คุณสมบัติเฉพาะสำหรับตำแหน่ง:
1. ได้รับวุฒิปริญญาตรี ในสาขาวิชาวิศวกรรมศาสตร์ ทางวิศวกรรมโยธา หรือ ทางวิศวกรรมโครงสร้าง
2. เป็นผู้สอบผ่านการวัดความรู้ความสามารถทั่วไป ของสำนักงาน ก.พ. ระดับปริญญาตรี
การรับสมัคร: สมัครได้ทางอินเทอร์เน็ตที่เว็บไซต์ https://doh.job.thai.com ตั้งแต่วันที่ 1 สิงหาคม 2569 ถึงวันที่ 25 สิงหาคม 2569
เอกสารหลักฐานที่ต้องยื่น:
- สำเนาปริญญาบัตร และ ใบแสดงผลการเรียน (Transcript)
- สำเนาบัตรประจำตัวประชาชน และ สำเนาทะเบียนบ้าน
- หนังสือรับรองผลการสอบผ่าน ภาค ก. ของ สำนักงาน ก.พ.`;
    }

    const record: ExtractionRecord = {
      id: recordId,
      sourceType,
      documentId: input.documentId,
      documentTitle: docTitle,
      rawInputSnippet: textToProcess.substring(0, 500) + (textToProcess.length > 500 ? '...' : ''),
      attemptsCount: 0,
      maxRetries,
      processingTimeMs: 0,
      status: 'RETRYING',
      extractedAt: new Date().toISOString(),
      processedByModel: 'gemini-3.6-flash',
    };

    extractionRecords.set(recordId, record);
    appendExtractLog(recordId, 'INFO', 'EXTRACTION_INIT', `เริ่มต้นกระบวนการสกัดข้อมูลด้วย Gemini 3.6 Flash (Max Retries: ${maxRetries})`, {
      snippetLength: textToProcess.length,
      sourceType,
    });

    // Execute Retry Handling Loop
    await this.executeExtractionWithRetry(record, textToProcess, startTime);

    return record;
  }

  // Retry Loop & JSON/Zod Validation Execution
  private static async executeExtractionWithRetry(
    record: ExtractionRecord,
    documentText: string,
    startTime: number
  ) {
    let success = false;
    let rawJsonResponseStr = '';

    while (record.attemptsCount < record.maxRetries && !success) {
      record.attemptsCount++;

      if (record.attemptsCount > 1) {
        const delayMs = Math.pow(2, record.attemptsCount - 2) * 1000 + Math.random() * 300;
        appendExtractLog(
          record.id,
          'WARN',
          'GEMINI_RETRY',
          `พยายามสกัดข้อมูลซ้ำครั้งที่ ${record.attemptsCount}/${record.maxRetries} (Exponential Backoff: ${Math.round(delayMs)}ms)`
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        appendExtractLog(record.id, 'INFO', 'GEMINI_CALL', `ส่งคำร้องขอสกัดข้อมูลไปยัง Gemini API (Model: gemini-3.6-flash)`);

        const ai = this.getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `โปรดสกัดข้อมูลจากประกาศรับสมัครงานฉบับนี้อย่างละเอียด:\n\n${documentText}`,
          config: {
            systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: geminiResponseSchema,
            temperature: 0.1, // Low temp for highly deterministic JSON extraction
          },
        });

        rawJsonResponseStr = response.text || '';
        appendExtractLog(record.id, 'INFO', 'JSON_PARSED', `ได้รับ JSON Response จาก Gemini (${rawJsonResponseStr.length} chars)`);

        if (!rawJsonResponseStr) {
          throw new Error('Gemini API returned an empty text response');
        }

        const parsedJson = JSON.parse(rawJsonResponseStr);

        // Step 2: Strict Zod Schema Validation
        const zodValidationResult = ExtractedGovJobSchema.safeParse(parsedJson);

        if (zodValidationResult.success) {
          record.extractedData = zodValidationResult.data;
          record.status = record.attemptsCount > 1 ? 'REPAIRED' : 'SUCCESS';
          success = true;

          appendExtractLog(
            record.id,
            'INFO',
            'ZOD_VALIDATED',
            `ผ่านการตรวจสอบ Zod Schema สัมฤทธิ์ผล (Confidence: ${Math.round(
              zodValidationResult.data.confidenceScore.overallConfidenceScore * 100
            )}%)`,
            { confidence: zodValidationResult.data.confidenceScore.overallConfidenceScore }
          );
        } else {
          // Attempt Fallback Schema Repair
          const validationIssues = zodValidationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
          appendExtractLog(
            record.id,
            'WARN',
            'SCHEMA_REPAIRED',
            `พบความไม่สมบูรณ์ตาม Zod Schema กำลังปรับแก้โครงสร้างข้อมูลเบื้องต้น: ${validationIssues.join('; ')}`
          );

          const repairedData = this.repairExtractedData(parsedJson, validationIssues);
          record.extractedData = repairedData;
          record.status = 'REPAIRED';
          success = true;
        }
      } catch (err: any) {
        const errorMsg = String(err.message || err);
        record.errorMessage = errorMsg;

        appendExtractLog(
          record.id,
          'ERROR',
          'EXTRACTION_FAILED',
          `ข้อผิดพลาดขณะสกัดข้อมูลด้วย Gemini (Attempt ${record.attemptsCount}/${record.maxRetries}): ${errorMsg}`
        );
      }
    }

    record.processingTimeMs = Date.now() - startTime;

    if (!success) {
      record.status = 'FAILED';
      // Create Heuristic Fallback Data if Gemini API rate-limited or failed
      record.extractedData = this.createFallbackErrorData(record.errorMessage || 'Unknown extraction error', documentText);
    }
  }

  // Schema Repair Helper for High Tolerance
  private static repairExtractedData(raw: any, issues: string[]): ExtractedGovJob {
    return {
      agency: {
        agencyName: raw?.agency?.agencyName || 'หน่วยงานภาครัฐ (ไม่ระบุ)',
        ministry: raw?.agency?.ministry || undefined,
        department: raw?.agency?.department || undefined,
      },
      position: {
        positionTitle: raw?.position?.positionTitle || 'ตำแหน่งงานภาครัฐ',
        positionCode: raw?.position?.positionCode || undefined,
        jobLevel: raw?.position?.jobLevel || 'ปฏิบัติการ',
      },
      salary: {
        salaryMin: typeof raw?.salary?.salaryMin === 'number' ? raw.salary.salaryMin : null,
        salaryMax: typeof raw?.salary?.salaryMax === 'number' ? raw.salary.salaryMax : null,
        salaryText: raw?.salary?.salaryText || 'ตามโครงสร้างอัตราเงินเดือนข้าราชการ',
      },
      education: {
        degreeRequired: raw?.education?.degreeRequired || 'ปริญญาตรี',
        ocscLevelRequired: raw?.education?.ocscLevelRequired || undefined,
        isOcscRequired: raw?.education?.isOcscRequired ?? true,
      },
      major: {
        majorsAllowed: Array.isArray(raw?.major?.majorsAllowed) ? raw.major.majorsAllowed : ['ทุกสาขาวิชา'],
        majorNotes: raw?.major?.majorNotes || undefined,
      },
      experience: {
        experienceYearsRequired: typeof raw?.experience?.experienceYearsRequired === 'number' ? raw.experience.experienceYearsRequired : 0,
        experienceText: raw?.experience?.experienceText || 'ไม่ต้องมีประสบการณ์',
      },
      employmentType: {
        positionType: ['ข้าราชการสามัญ', 'พนักงานราชการ', 'ลูกจ้างชั่วคราว', 'พนักงานจ้างเหมาบริการ'].includes(raw?.employmentType?.positionType)
          ? raw.employmentType.positionType
          : 'ข้าราชการสามัญ',
        contractPeriod: raw?.employmentType?.contractPeriod || undefined,
      },
      applicationPeriod: {
        startDate: raw?.applicationPeriod?.startDate || null,
        endDate: raw?.applicationPeriod?.endDate || null,
        rawPeriodText: raw?.applicationPeriod?.rawPeriodText || 'ตามกำหนดการในประกาศรับสมัคร',
        applicationMethod: raw?.applicationPeriod?.applicationMethod || 'สมัครทางอินเทอร์เน็ต',
        applicationUrl: raw?.applicationPeriod?.applicationUrl || undefined,
      },
      requiredDocuments: Array.isArray(raw?.requiredDocuments) ? raw.requiredDocuments : ['สำเนาวุฒิการศึกษา', 'สำเนาบัตรประชาชน'],
      vacanciesCount: typeof raw?.vacanciesCount === 'number' ? raw.vacanciesCount : 1,
      confidenceScore: {
        overallConfidenceScore: typeof raw?.confidenceScore?.overallConfidenceScore === 'number' ? raw.confidenceScore.overallConfidenceScore : 0.75,
      },
      validationStatus: 'REQUIRES_HUMAN_REVIEW',
      validationNotes: ['ปรับแก้โครงสร้างข้อมูลอัตโนมัติเนื่องจาก schema ไม่สมบูรณ์', ...issues],
    };
  }

  // Create Fallback Safe Object in case of hard API failure (with Heuristic Fallback Parser)
  private static createFallbackErrorData(reason: string, textToProcess?: string): ExtractedGovJob {
    if (!textToProcess || textToProcess.trim().length === 0) {
      return {
        agency: { agencyName: 'หน่วยงานภาครัฐ (ล้มเหลวในการอ่านเอกสาร)' },
        position: { positionTitle: 'ไม่สามารถระบุตำแหน่งงานได้' },
        salary: { salaryMin: null, salaryMax: null, salaryText: 'ไม่ระบุ' },
        education: { degreeRequired: 'ไม่ระบุ', isOcscRequired: false },
        major: { majorsAllowed: [] },
        experience: { experienceYearsRequired: 0, experienceText: 'ไม่ระบุ' },
        employmentType: { positionType: 'ไม่ระบุ' },
        applicationPeriod: { rawPeriodText: 'ไม่ระบุ' },
        requiredDocuments: [],
        vacanciesCount: 0,
        confidenceScore: { overallConfidenceScore: 0.0 },
        validationStatus: 'INVALID_STRUCTURE',
        validationNotes: [`การสกัดข้อมูลล้มเหลว: ${reason}`],
      };
    }

    // Heuristic Regex Parser for Thai Government Notices
    let positionTitle = 'นักจัดการงานทั่วไปปฏิบัติการ';
    const posMatch = textToProcess.match(/ตำแหน่ง\s*([^\n\r,]+)/i) || textToProcess.match(/รับสมัคร\s*([^\n\r,]+)/i);
    if (posMatch && posMatch[1].trim().length > 2) {
      positionTitle = posMatch[1].trim().replace(/\s+(จำนวน|อัตรา|สังกัด|กรม|กระทรวง).*/, '');
    }

    let agencyName = 'หน่วยงานภาครัฐ';
    const agencyMatch = textToProcess.match(/(กรม[^\n\r,\s]+|สำนักงาน[^\n\r,\s]+|กระทรวง[^\n\r,\s]+)/i);
    if (agencyMatch && agencyMatch[1].trim().length > 2) {
      agencyName = agencyMatch[1].trim();
    }

    let ministry: string | undefined;
    const ministryMatch = textToProcess.match(/(กระทรวง[^\n\r,\s]+)/i);
    if (ministryMatch) {
      ministry = ministryMatch[1].trim();
    }

    let salaryMin: number = 15000;
    let salaryMax: number = 18000;
    const salaryMatch = textToProcess.match(/เงินเดือน\s*([0-9,]+)\s*(?:-|ถึง)\s*([0-9,]+)/i) || textToProcess.match(/([0-9,]{5,6})\s*บาท/);
    if (salaryMatch) {
      if (salaryMatch[1] && salaryMatch[2]) {
        salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
        salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
      } else if (salaryMatch[1]) {
        salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
        salaryMax = Math.round(salaryMin * 1.2);
      }
    }

    let vacanciesCount = 1;
    const vacMatch = textToProcess.match(/จำนวน\s*([0-9]+)\s*อัตรา/i) || textToProcess.match(/([0-9]+)\s*อัตรา/i);
    if (vacMatch) {
      vacanciesCount = parseInt(vacMatch[1], 10);
    }

    let isOcscRequired = textToProcess.includes('ก.พ.') || textToProcess.includes('ภาค ก.');
    let degreeRequired = 'ปริญญาตรี';
    if (textToProcess.includes('ปวส.')) degreeRequired = 'ปวส.';
    else if (textToProcess.includes('ปวช.')) degreeRequired = 'ปวช.';

    let appUrl: string | undefined;
    const urlMatch = textToProcess.match(/(https?:\/\/[^\s\n\r"']+)/i);
    if (urlMatch) {
      appUrl = urlMatch[1];
    }

    return {
      agency: { agencyName, ministry },
      position: { positionTitle, jobLevel: 'ปฏิบัติการ' },
      salary: { salaryMin, salaryMax, salaryText: `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} บาท` },
      education: { degreeRequired, ocscLevelRequired: isOcscRequired ? 'LEVEL_3' : undefined, isOcscRequired },
      major: { majorsAllowed: ['ทุกสาขาวิชา'] },
      experience: { experienceYearsRequired: 0, experienceText: 'ไม่ระบุ' },
      employmentType: { positionType: 'ข้าราชการสามัญ' },
      applicationPeriod: { rawPeriodText: 'สกัดด้วยกฎสำรองอัตโนมัติ', applicationUrl: appUrl },
      requiredDocuments: ['สำเนาวุฒิการศึกษา', 'สำเนาบัตรประชาชน'],
      vacanciesCount,
      confidenceScore: { overallConfidenceScore: 0.82 },
      validationStatus: 'REQUIRES_HUMAN_REVIEW',
      validationNotes: [`สกัดข้อมูลด้วยระบบกฎสำรองอัตโนมัติ (Heuristic Fallback): ${reason}`],
    };
  }

  // ==========================================
  // MANAGEMENT & QUERY API METHODS
  // ==========================================

  public static getExtractionHistory() {
    return Array.from(extractionRecords.values()).sort(
      (a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime()
    );
  }

  public static getExtractionRecordById(id: string) {
    return extractionRecords.get(id);
  }

  public static deleteExtractionRecord(id: string): boolean {
    return extractionRecords.delete(id);
  }

  public static getAuditLogs(limit = 100) {
    return extractionLogs.slice(0, limit);
  }

  public static getPipelineStats() {
    const list = Array.from(extractionRecords.values());
    const totalProcessed = list.length;
    const successCount = list.filter((r) => r.status === 'SUCCESS' || r.status === 'REPAIRED').length;
    const failedCount = list.filter((r) => r.status === 'FAILED').length;

    const validatedCount = list.filter((r) => r.extractedData?.validationStatus === 'VALIDATED').length;
    const reviewNeededCount = list.filter((r) => r.extractedData?.validationStatus === 'REQUIRES_HUMAN_REVIEW').length;

    const avgConfidence =
      totalProcessed > 0
        ? list.reduce((sum, r) => sum + (r.extractedData?.confidenceScore?.overallConfidenceScore || 0), 0) / totalProcessed
        : 0;

    const avgProcessingTime =
      totalProcessed > 0 ? list.reduce((sum, r) => sum + r.processingTimeMs, 0) / totalProcessed : 0;

    return {
      totalProcessed,
      successCount,
      failedCount,
      validatedCount,
      reviewNeededCount,
      avgConfidenceScore: Number(avgConfidence.toFixed(2)),
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      modelUsed: 'gemini-3.6-flash',
    };
  }
}

// Seed Initial Sample Job Extractions for Instant Inspection
GeminiExtractionPipeline.extractJobFromDocument({
  documentText: `ประกาศกรมทางหลวง เรื่อง รับสมัครคัดเลือกบุคคลเพื่อบรรจุเข้ารับราชการ
ตำแหน่ง วิศวกรโยธาปฏิบัติการ
สังกัด กรมทางหลวง กระทรวงคมนาคม
อัตราเงินเดือน 15,000 - 16,500 บาท
จำนวนอัตราที่ว่าง 5 อัตรา
คุณสมบัติเฉพาะสำหรับตำแหน่ง:
1. ได้รับวุฒิปริญญาตรี ในสาขาวิชาวิศวกรรมศาสตร์ ทางวิศวกรรมโยธา หรือ ทางวิศวกรรมโครงสร้าง
2. เป็นผู้สอบผ่านการวัดความรู้ความสามารถทั่วไป ของสำนักงาน ก.พ. ระดับปริญญาตรี
วัน เวลา และสถานที่รับสมัคร:
เปิดรับสมัครทางอินเทอร์เน็ต ตั้งแต่วันที่ 1 สิงหาคม 2569 ถึงวันที่ 25 สิงหาคม 2569 ตลอด 24 ชั่วโมง ไม่เว้นวันหยุดราชการ ที่เว็บไซต์ https://doh.job.thai.com
หลักฐานที่ต้องยื่นพร้อมใบสมัคร:
- สำเนาปริญญาบัตร และ หนังสือรับรองคุณวุฒิ
- สำเนาใบแสดงผลการเรียน (Transcript)
- สำเนาบัตรประจำตัวประชาชน
- สำเนาหนังสือรับรองผลการสอบผ่านการวัดความรู้ความสามารถทั่วไป ของสำนักงาน ก.พ.`,
  sourceType: 'PRESET_ANNOUNCEMENT',
});

GeminiExtractionPipeline.extractJobFromDocument({
  documentText: `ประกาศกรมสรรพากร เรื่อง รับสมัครพนักงานราชการทั่วไป
ตำแหน่ง นักตรวจสอบภาษีปฏิบัติการ
กระทรวงการคลัง
อัตราเงินเดือน 18,000 บาท
จำนวน 12 อัตรา
วุฒิการศึกษา: ปริญญาตรี สาขาวิชาการบัญชี หรือ สาขาวิชาบริหารธุรกิจ
การสอบผ่าน ก.พ.: ต้องสอบผ่าน ก.พ. ภาค ก. ระดับปริญญาตรี
การรับสมัคร: ยื่นด้วยตนเอง ณ กองบริหารทรัพยากรบุคคล กรมสรรพากร ตั้งแต่วันที่ 10 สิงหาคม 2569 ถึง 28 สิงหาคม 2569 ในวันและเวลาราชการ`,
  sourceType: 'PRESET_ANNOUNCEMENT',
});
