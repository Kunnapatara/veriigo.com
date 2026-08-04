import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Cpu,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  RefreshCw,
  Search,
  Code,
  Terminal,
  Trash2,
  Eye,
  X,
  Layers,
  Award,
  DollarSign,
  FileCheck,
  Check,
  Copy,
  FolderOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ExtractedGovJob {
  agency: {
    agencyName: string;
    ministry?: string;
    department?: string;
  };
  position: {
    positionTitle: string;
    positionCode?: string;
    jobLevel?: string;
  };
  salary: {
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryText: string;
  };
  education: {
    degreeRequired: string;
    ocscLevelRequired?: string;
    isOcscRequired: boolean;
  };
  major: {
    majorsAllowed: string[];
    majorNotes?: string;
  };
  experience: {
    experienceYearsRequired: number;
    experienceText: string;
  };
  employmentType: {
    positionType: 'ข้าราชการสามัญ' | 'พนักงานราชการ' | 'ลูกจ้างชั่วคราว' | 'พนักงานจ้างเหมาบริการ' | 'ไม่ระบุ';
    contractPeriod?: string;
  };
  applicationPeriod: {
    startDate?: string | null;
    endDate?: string | null;
    rawPeriodText: string;
    applicationMethod?: string;
    applicationUrl?: string;
  };
  requiredDocuments: string[];
  vacanciesCount: number;
  confidenceScore: {
    overallConfidenceScore: number;
    fieldScores?: Record<string, number>;
  };
  validationStatus: 'VALIDATED' | 'REQUIRES_HUMAN_REVIEW' | 'FLAGGED_INCOMPLETE' | 'INVALID_STRUCTURE';
  validationNotes: string[];
}

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
  step: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PipelineStats {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  validatedCount: number;
  reviewNeededCount: number;
  avgConfidenceScore: number;
  avgProcessingTimeMs: number;
  modelUsed: string;
}

// Preset Thai Government Job Announcements
const PRESET_ANNOUNCEMENTS = [
  {
    id: 'preset-doh',
    title: 'กรมทางหลวง - วิศวกรโยธาปฏิบัติการ (5 อัตรา)',
    text: `ประกาศกรมทางหลวง เรื่อง รับสมัครคัดเลือกบุคคลเพื่อบรรจุเข้ารับราชการ
ตำแหน่ง วิศวกรโยธาปฏิบัติการ
สังกัด กรมทางหลวง กระทรวงคมนาคม
อัตราเงินเดือน 15,000 - 16,500 บาท
จำนวนอัตราที่ว่าง 5 อัตรา
คุณสมบัติเฉพาะสำหรับตำแหน่ง:
1. ได้รับวุฒิปริญญาตรี ในสาขาวิชาวิศวกรรมศาสตร์ ทางวิศวกรรมโยธา หรือ ทางวิศวกรรมโครงสร้าง
2. เป็นผู้สอบผ่านการวัดความรู้ความสามารถทั่วไป ของสำนักงาน ก.พ. ระดับปริญญาตรี
วัน เวลา และสถานที่รับสมัคร:
เปิดรับสมัครทางอินเทอร์เน็ต ตั้งแต่วันที่ 1 สิงหาคม 2569 ถึงวันที่ 25 สิงหาคม 2569 ตลอด 24 ชั่วโมง ที่เว็บไซต์ https://doh.job.thai.com
หลักฐานที่ต้องยื่นพร้อมใบสมัคร:
- สำเนาปริญญาบัตร และ ใบแสดงผลการเรียน (Transcript)
- สำเนาบัตรประจำตัวประชาชน และ ทะเบียนบ้าน
- หนังสือรับรองผลการสอบผ่าน ภาค ก. ของ สำนักงาน ก.พ.`,
  },
  {
    id: 'preset-rd',
    title: 'กรมสรรพากร - นักตรวจสอบภาษีปฏิบัติการ (12 อัตรา)',
    text: `ประกาศกรมสรรพากร เรื่อง รับสมัครพนักงานราชการทั่วไป
ตำแหน่ง นักตรวจสอบภาษีปฏิบัติการ
สังกัด กรมสรรพากร กระทรวงการคลัง
อัตราเงินเดือน 18,000 บาท
จำนวน 12 อัตรา
วุฒิการศึกษา: ปริญญาตรี สาขาวิชาการบัญชี หรือ สาขาวิชาบริหารธุรกิจ
การสอบผ่าน ก.พ.: ต้องสอบผ่าน ก.พ. ภาค ก. ระดับปริญญาตรี
การรับสมัคร: ยื่นด้วยตนเอง ณ กองบริหารทรัพยากรบุคคล กรมสรรพากร ตั้งแต่วันที่ 10 สิงหาคม 2569 ถึง 28 สิงหาคม 2569 ในวันและเวลาราชการ`,
  },
  {
    id: 'preset-rid',
    title: 'กรมชลประทาน - นายช่างชลประทานปฏิบัติงาน (8 อัตรา)',
    text: `ประกาศกรมชลประทาน เรื่อง รับสมัครคัดเลือกบุคคลเข้ารับราชการ
ตำแหน่ง นายช่างชลประทานปฏิบัติงาน
กระทรวงเกษตรและสหกรณ์
อัตราเงินเดือน 11,500 - 12,650 บาท
จำนวน 8 อัตรา
คุณสมบัติเฉพาะสำหรับตำแหน่ง:
ได้รับวุฒิประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) สาขาวิชาโยธา หรือ สาขาวิชาการก่อสร้าง
ต้องเป็นผู้สอบผ่านการวัดความรู้ความสามารถทั่วไป ของสำนักงาน ก.พ. ระดับ ปวส. ขึ้นไป
รับสมัครทางอินเทอร์เน็ตที่เว็บไซต์ https://rid.job.thai.com ตั้งแต่วันที่ 5 สิงหาคม 2569 ถึง 30 สิงหาคม 2569`,
  },
];

export const GeminiExtractorView: React.FC = () => {
  const { getIdToken } = useAuth();

  // State Management
  const [history, setHistory] = useState<ExtractionRecord[]>([]);
  const [logs, setLogs] = useState<ExtractionAuditLog[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);

  // Form State
  const [documentText, setDocumentText] = useState(PRESET_ANNOUNCEMENTS[0].text);
  const [selectedPreset, setSelectedPreset] = useState<string>('preset-doh');
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [extracting, setExtracting] = useState<boolean>(false);

  // Inspector & Active Selection
  const [activeRecord, setActiveRecord] = useState<ExtractionRecord | null>(null);
  const [rawJsonView, setRawJsonView] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Toast Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  // Fetch Extractor Pipeline Data
  const fetchPipelineData = async () => {
    try {
      const [histRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/extractor/history').then((r) => r.json()),
        fetch('/api/extractor/stats').then((r) => r.json()),
        fetch('/api/extractor/logs?limit=100').then((r) => r.json()),
      ]);

      if (histRes.success) {
        setHistory(histRes.data);
        if (histRes.data.length > 0 && !activeRecord) {
          setActiveRecord(histRes.data[0]);
        }
      }
      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching Gemini extractor data:', err);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  // Handle Select Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESET_ANNOUNCEMENTS.find((x) => x.id === presetId);
    if (p) {
      setDocumentText(p.text);
    }
  };

  // Execute Extraction Command
  const handleStartExtraction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!documentText.trim()) return;

    setExtracting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/extractor/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentText,
          sourceType: selectedPreset ? 'PRESET_ANNOUNCEMENT' : 'TEXT_PROMPT',
          maxRetries,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        showNotice('สกัดข้อมูลด้วย Gemini 3.6 Flash สำเร็จ!');
        setActiveRecord(data.data);
        fetchPipelineData();
      } else {
        showNotice(data.message || 'สกัดข้อมูลไม่สำเร็จ', 'error');
      }
    } catch (err) {
      console.error('Extraction error:', err);
      showNotice('ไม่สามารถเชื่อมต่อ Gemini Extraction Pipeline ได้', 'error');
    } finally {
      setExtracting(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/extractor/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`ลบประวัติการสกัดข้อมูล ${id} สำเร็จ`);
        if (activeRecord?.id === id) setActiveRecord(null);
        fetchPipelineData();
      }
    } catch {
      showNotice('ลบประวัติไม่สำเร็จ', 'error');
    }
  };

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return l.message.toLowerCase().includes(q) || l.step.toLowerCase().includes(q) || l.recordId.toLowerCase().includes(q);
  });

  const activeJob = activeRecord?.extractedData;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 transition-all border ${
            notice.type === 'success'
              ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
              : 'bg-rose-900 text-rose-200 border-rose-700'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold mb-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Sprint 7 Core Architecture • Gemini Extraction Pipeline
            </div>
            <h1 className="text-2xl font-black text-white">ระบบสกัดข้อมูลประกาศรับสมัครงานภาครัฐด้วย Gemini AI</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              วิเคราะห์และสกัดข้อมูล 12 ฟิลด์สำคัญ (Agency, Position, Salary, Education, Major, Experience, Employment Type, Application Period, Vacancies, Documents, Confidence Score & Validation Status) พร้อม Retry Handling, Strict Zod Validation และ Error Recovery
            </p>
          </div>

          <button
            onClick={fetchPipelineData}
            className="px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรชข้อมูล Pipeline
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Total Extractions</span>
            <BrainCircuit className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.totalProcessed || 0}</p>
          <p className="text-[10px] text-slate-400">รายการวิเคราะห์ทั้งหมด</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Validation Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">
            {stats?.totalProcessed ? Math.round(((stats.validatedCount + stats.reviewNeededCount) / stats.totalProcessed) * 100) : 100}%
          </p>
          <p className="text-[10px] text-slate-400">ผ่านโครงสร้าง Zod Schema</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Avg Confidence Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600">
            {stats?.avgConfidenceScore ? Math.round(stats.avgConfidenceScore * 100) : 0}%
          </p>
          <p className="text-[10px] text-slate-400">คะแนนความมั่นใจเฉลี่ย</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Avg Processing Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.avgProcessingTimeMs || 0} ms</p>
          <p className="text-[10px] text-slate-400">ความเร็วประมวลผลต่อฉบับ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>AI Model Engine</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 font-mono truncate">gemini-3.6-flash</p>
          <p className="text-[10px] text-slate-400">@google/genai SDK</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Retry & Error Recovery</span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-slate-900">3 Retries</p>
          <p className="text-[10px] text-slate-400">Exponential Backoff</p>
        </div>
      </div>

      {/* Main Extraction Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input & Control Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BrainCircuit className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="font-bold text-xs text-slate-900">ตัวป้อนประกาศสมัครงาน (Recruitment Document Input)</h2>
              <p className="text-[11px] text-slate-500">วางข้อความประกาศหรือเลือกชุดตัวอย่างสำเร็จรูป</p>
            </div>
          </div>

          {/* Quick Presets Picker */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">เลือกประกาศตัวอย่าง (Presets):</label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_ANNOUNCEMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between ${
                    selectedPreset === p.id
                      ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{p.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Document Text Area */}
          <form onSubmit={handleStartExtraction} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ข้อความประกาศรับสมัครงานภาษาไทย (Raw Document Text) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={10}
                required
                value={documentText}
                onChange={(e) => {
                  setDocumentText(e.target.value);
                  setSelectedPreset('');
                }}
                placeholder="วางข้อความประกาศรับสมัครงานราชการ..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 text-[11px]">จำนวนรอบ Retry เมื่อเกิดข้อผิดพลาด:</span>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="p-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              >
                <option value={1}>1 ครั้ง</option>
                <option value={3}>3 ครั้ง (แนะนำ)</option>
                <option value={5}>5 ครั้ง</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={extracting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${extracting ? 'animate-spin' : ''}`} />
              {extracting ? 'กำลังวิเคราะห์ด้วย Gemini 3.6 Flash...' : 'สกัดข้อมูลด้วย Gemini AI Pipeline'}
            </button>
          </form>
        </div>

        {/* Results Display Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeRecord && activeJob ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              {/* Result Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="font-bold text-xs text-white">
                      ผลการสกัดข้อมูลโครงสร้าง (Extracted Output)
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">{activeRecord.id} • {activeRecord.processedByModel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRawJsonView(!rawJsonView)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-purple-400" />
                    {rawJsonView ? 'ดูมุมมอง UI' : 'ดู Raw JSON'}
                  </button>

                  <button
                    onClick={() => handleCopyJson(activeJob)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                    title="คัดลอก JSON"
                  >
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Status & Confidence Score Banner */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">สถานะการตรวจสอบ:</span>
                  {activeJob.validationStatus === 'VALIDATED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      VALIDATED (สมบูรณ์ 100%)
                    </span>
                  ) : activeJob.validationStatus === 'REQUIRES_HUMAN_REVIEW' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      REQUIRES HUMAN REVIEW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {activeJob.validationStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">คะแนนความเชื่อมั่น (Confidence):</span>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{ width: `${Math.round(activeJob.confidenceScore.overallConfidenceScore * 100)}%` }}
                      />
                    </div>
                    <span className="font-black text-xs text-purple-700">
                      {Math.round(activeJob.confidenceScore.overallConfidenceScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {rawJsonView ? (
                /* Raw JSON View */
                <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre>{JSON.stringify(activeJob, null, 2)}</pre>
                </div>
              ) : (
                /* Structured Extraction Grid */
                <div className="p-5 space-y-4 text-xs">
                  {/* Agency & Position Highlight */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
                      <span className="font-black text-sm text-slate-900">{activeJob.agency.agencyName}</span>
                      {activeJob.agency.ministry && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                          {activeJob.agency.ministry}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span className="font-bold text-xs text-indigo-900">{activeJob.position.positionTitle}</span>
                      {activeJob.position.jobLevel && (
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          {activeJob.position.jobLevel}
                        </span>
                      )}
                      <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                        {activeJob.vacanciesCount} อัตรา
                      </span>
                    </div>
                  </div>

                  {/* Field Attribute Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Salary */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อัตราเงินเดือน (Salary):</span>
                      </div>
                      <p className="font-black text-slate-900 text-xs">{activeJob.salary.salaryText}</p>
                    </div>

                    {/* Employment Type */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>ประเภทการจ้างงาน (Employment Type):</span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">
                        {activeJob.employmentType.positionType}
                      </span>
                    </div>

                    {/* Education */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                        <span>วุฒิการศึกษา (Education):</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{activeJob.education.degreeRequired}</p>
                      <div className="text-[10px] text-slate-500">
                        สอบผ่าน ก.พ. ภาค ก.:{' '}
                        <strong className={activeJob.education.isOcscRequired ? 'text-amber-700' : 'text-slate-600'}>
                          {activeJob.education.ocscLevelRequired || (activeJob.education.isOcscRequired ? 'ต้องผ่าน ภาค ก.' : 'ไม่บังคับ')}
                        </strong>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>ประสบการณ์ (Experience):</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{activeJob.experience.experienceText}</p>
                    </div>
                  </div>

                  {/* Allowed Majors */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-600 text-[11px] block">สาขาวิชาที่เปิดรับ (Allowed Majors):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeJob.major.majorsAllowed.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold rounded-lg text-[11px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Application Period & Method */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span>กำหนดการรับสมัคร (Application Period):</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{activeJob.applicationPeriod.rawPeriodText}</p>
                    {activeJob.applicationPeriod.applicationUrl && (
                      <a
                        href={activeJob.applicationPeriod.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-[10px] font-mono block truncate"
                      >
                        {activeJob.applicationPeriod.applicationUrl}
                      </a>
                    )}
                  </div>

                  {/* Required Documents */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-600 text-[11px] block">เอกสารที่ต้องยื่นประกอบ (Required Documents):</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                      {activeJob.requiredDocuments.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Validation Notes */}
                  {activeJob.validationNotes && activeJob.validationNotes.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-[11px]">
                      <span className="font-bold text-amber-900 block">ข้อสังเกตจากการวิเคราะห์:</span>
                      <ul className="list-disc pl-4 text-amber-800 space-y-0.5">
                        {activeJob.validationNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 space-y-3">
              <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">ยังไม่มีการสกัดข้อมูล ให้กดปุ่มด้านซ้ายเพื่อทดสอบวิเคราะห์</p>
            </div>
          )}
        </div>
      </div>

      {/* History Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-xs text-white">
              ประวัติการสกัดข้อมูลในคลัง ({history.length} รายการ)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">หน่วยงาน & ตำแหน่ง</th>
                <th className="p-3">สถานะ Zod Validation</th>
                <th className="p-3">คะแนนความเชื่อมั่น</th>
                <th className="p-3">ความเร็ว (ms)</th>
                <th className="p-3">เวลาประมวลผล</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {rec.extractedData?.agency.agencyName || 'หน่วยงานภาครัฐ'}
                    </div>
                    <div className="text-[10px] text-purple-700 font-bold">{rec.extractedData?.position.positionTitle}</div>
                  </td>

                  <td className="p-3">
                    {rec.extractedData?.validationStatus === 'VALIDATED' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        VALIDATED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {rec.extractedData?.validationStatus || rec.status}
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-bold text-slate-800">
                    {rec.extractedData?.confidenceScore
                      ? `${Math.round(rec.extractedData.confidenceScore.overallConfidenceScore * 100)}%`
                      : '-'}
                  </td>

                  <td className="p-3 font-mono text-[11px] text-slate-600">{rec.processingTimeMs} ms</td>

                  <td className="p-3 text-slate-500 text-[11px]">
                    {new Date(rec.extractedAt).toLocaleTimeString('th-TH')}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveRecord(rec)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เรียกดู
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    ยังไม่มีประวัติการสกัดข้อมูลในคลัง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extractor Audit Logs Streamer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-xs text-white">
              ประวัติขั้นตอนประมวลผล Gemini Pipeline (Audit Logs Streamer)
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา Log..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="p-4 max-h-72 overflow-y-auto space-y-1.5 text-[11px] divide-y divide-slate-900">
          {filteredLogs.map((l) => (
            <div key={l.id} className="pt-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{new Date(l.timestamp).toLocaleTimeString('th-TH')}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    l.level === 'INFO'
                      ? 'bg-purple-500/20 text-purple-400'
                      : l.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {l.step}
                </span>
                <span className="text-slate-200">{l.message}</span>
              </div>
              <span className="text-slate-600 font-mono text-[10px]">{l.recordId}</span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-6 text-center text-slate-600">ยังไม่มี Audit Log บันทึก</div>
          )}
        </div>
      </div>
    </div>
  );
};
