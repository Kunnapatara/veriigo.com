import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  Award,
  HelpCircle,
  Zap,
  ArrowRight,
  Sparkles,
  Info,
  Code,
  ListFilter,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ExtractedGovJob } from './GeminiExtractorView';

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
  healthScore: number;
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
  step: string;
  message: string;
  details?: Record<string, unknown>;
}

// Preset Test Jobs with Deliberate Defects for Interactive Audit
const TEST_PRESET_JOBS: { id: string; title: string; description: string; jobData: ExtractedGovJob }[] = [
  {
    id: 'test-perfect',
    title: '✅ ประกาศสมบูรณ์ (กรมทางหลวง - วิศวกรโยธา)',
    description: 'ข้อมูลครบถ้วนทุกฟิลด์ อัตราเงินเดือนถูกต้อง วันที่ผ่านเกณฑ์',
    jobData: {
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
      confidenceScore: { overallConfidenceScore: 0.98 },
      validationStatus: 'VALIDATED',
      validationNotes: [],
    },
  },
  {
    id: 'test-invalid-dates-salary',
    title: '⚠️ วันปิดสมัครก่อนวันเปิด & เงินเดือนติดลบ',
    description: 'ทดสอบการตรวจจับ Invalid Dates และ Invalid Salary (<0 และ Min > Max)',
    jobData: {
      agency: { agencyName: 'กรมสรรพากร', ministry: 'กระทรวงการคลัง' },
      position: { positionTitle: 'นักตรวจสอบภาษีปฏิบัติการ' },
      salary: { salaryMin: -2000, salaryMax: -1000, salaryText: 'เงินเดือนผิดปกติ' },
      education: { degreeRequired: 'ปริญญาตรี', isOcscRequired: true },
      major: { majorsAllowed: ['การบัญชี'] },
      experience: { experienceYearsRequired: 0, experienceText: 'ไม่ระบุ' },
      employmentType: { positionType: 'พนักงานราชการ' },
      applicationPeriod: { startDate: '2026-09-30', endDate: '2026-09-01', rawPeriodText: '30 ก.ย. ถึง 1 ก.ย.' },
      requiredDocuments: [],
      vacanciesCount: 2,
      confidenceScore: { overallConfidenceScore: 0.88 },
      validationStatus: 'REQUIRES_HUMAN_REVIEW',
      validationNotes: [],
    },
  },
  {
    id: 'test-missing-agency-confidence',
    title: '❌ ขาดข้อมูลหน่วยงาน & คะแนนความเชื่อมั่นต่ำ (Low Confidence)',
    description: 'ทดสอบการตรวจจับ Missing Required Fields และ Low Confidence Score (< 0.60)',
    jobData: {
      agency: { agencyName: 'ไม่ระบุหน่วยงาน' },
      position: { positionTitle: 'ไม่ระบุชื่อตำแหน่ง' },
      salary: { salaryMin: null, salaryMax: null, salaryText: 'ไม่ระบุ' },
      education: { degreeRequired: 'ไม่ระบุ', isOcscRequired: false },
      major: { majorsAllowed: [] },
      experience: { experienceYearsRequired: 0, experienceText: 'ไม่ระบุ' },
      employmentType: { positionType: 'ไม่ระบุ' },
      applicationPeriod: { rawPeriodText: 'ไม่ระบุ' },
      requiredDocuments: [],
      vacanciesCount: 1,
      confidenceScore: { overallConfidenceScore: 0.42 },
      validationStatus: 'FLAGGED_INCOMPLETE',
      validationNotes: ['สกัดข้อมูลไม่ครบถ้วน'],
    },
  },
  {
    id: 'test-agency-mismatch',
    title: '⚠️ ชื่อหน่วยงานไม่อยู่ในทะเบียนภาครัฐ (Agency Mismatch)',
    description: 'ทดสอบการตรวจจับ Agency Mismatch เทียบกับทะเบียนหน่วยงานกระทรวง/กรม',
    jobData: {
      agency: { agencyName: 'บริษัท เอกชนแมเนจเม้นท์ อินเตอร์เนชั่นแนล จำกัด' },
      position: { positionTitle: 'เจ้าหน้าที่บริหารงานทั่วไป' },
      salary: { salaryMin: 18000, salaryMax: 22000, salaryText: '18,000 - 22,000 บาท' },
      education: { degreeRequired: 'ปริญญาตรี', isOcscRequired: false },
      major: { majorsAllowed: ['ทุกสาขาวิชา'] },
      experience: { experienceYearsRequired: 1, experienceText: 'ประสบการณ์ 1 ปี' },
      employmentType: { positionType: 'พนักงานจ้างเหมาบริการ' },
      applicationPeriod: { startDate: '2026-08-10', endDate: '2026-08-30', rawPeriodText: '10-30 สิงหาคม 2569' },
      requiredDocuments: ['เรซูเม่'],
      vacanciesCount: 3,
      confidenceScore: { overallConfidenceScore: 0.82 },
      validationStatus: 'REQUIRES_HUMAN_REVIEW',
      validationNotes: [],
    },
  },
];

export const JobValidationView: React.FC = () => {
  const { getIdToken } = useAuth();

  // State Management
  const [reports, setReports] = useState<JobValidationReport[]>([]);
  const [stats, setStats] = useState<ValidationEngineStats | null>(null);
  const [logs, setLogs] = useState<ValidationAuditLog[]>([]);

  // Selected Custom Test Job
  const [selectedPresetId, setSelectedPresetId] = useState<string>('test-perfect');
  const [customJobJson, setCustomJobJson] = useState<string>(
    JSON.stringify(TEST_PRESET_JOBS[0].jobData, null, 2)
  );

  // Active Report View
  const [activeReport, setActiveReport] = useState<JobValidationReport | null>(null);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'PASS_WITH_WARNINGS' | 'FAILED_REJECTED'>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [validating, setValidating] = useState(false);
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Notification Toast
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  // Fetch Validator Engine Data
  const fetchValidatorData = async () => {
    try {
      const [repsRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/validator/reports').then((r) => r.json()),
        fetch('/api/validator/stats').then((r) => r.json()),
        fetch('/api/validator/logs?limit=100').then((r) => r.json()),
      ]);

      if (repsRes.success) {
        setReports(repsRes.data);
        if (repsRes.data.length > 0 && !activeReport) {
          setActiveReport(repsRes.data[0]);
        }
      }
      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching validator engine data:', err);
    }
  };

  useEffect(() => {
    fetchValidatorData();
  }, []);

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const item = TEST_PRESET_JOBS.find((p) => p.id === presetId);
    if (item) {
      setCustomJobJson(JSON.stringify(item.jobData, null, 2));
    }
  };

  // Execute Validation Rules
  const handleRunValidation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let parsedData: ExtractedGovJob;
    try {
      parsedData = JSON.parse(customJobJson);
    } catch {
      showNotice('รูปแบบ JSON ไม่ถูกต้อง โปรดตรวจสอบไวยากรณ์', 'error');
      return;
    }

    setValidating(true);
    try {
      const res = await fetch('/api/validator/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobData: parsedData }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        showNotice(`ตรวจสอบความถูกต้องสำเร็จ (Health Score: ${data.data.healthScore}/100)`);
        setActiveReport(data.data);
        fetchValidatorData();
      } else {
        showNotice(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบ', 'error');
      }
    } catch (err) {
      console.error('Validation error:', err);
      showNotice('ไม่สามารถเชื่อมต่อกับเครื่องมือ Validation Engine ได้', 'error');
    } finally {
      setValidating(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/validator/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`ลบรายงานการตรวจสอบ ${id} สำเร็จ`);
        if (activeReport?.id === id) setActiveReport(null);
        fetchValidatorData();
      }
    } catch {
      showNotice('ลบรายงานไม่สำเร็จ', 'error');
    }
  };

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered Reports
  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.overallStatus === statusFilter;
  });

  const filteredLogs = logs.filter((l) => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return l.message.toLowerCase().includes(q) || l.step.toLowerCase().includes(q) || l.reportId.toLowerCase().includes(q);
  });

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
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 animate-pulse" />
              Sprint 8 Core Architecture • Rule-based Job Quality & Audit Engine
            </div>
            <h1 className="text-2xl font-black text-white">ระบบตรวจสอบความถูกต้องข้อมูลงานราชการ (Job Validation & Quality Audit)</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ตรวจจับข้อผิดพลาด 6 มิติหลัก: Missing Fields (ฟิลด์ขาดหาย), Duplicate Jobs (งานซ้ำซ้อน), Invalid Dates (วันที่ไม่ถูกต้อง), Invalid Salary (เงินเดือนผิดปกติ), Agency Mismatch (หน่วยงานไม่ตรง) และ Low Confidence Score (คะแนนความเชื่อมั่นต่ำ)
            </p>
          </div>

          <button
            onClick={fetchValidatorData}
            className="px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรชข้อมูล Validator
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Validated Jobs</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.totalValidated || 0}</p>
          <p className="text-[10px] text-slate-400">จำนวนประกาศที่เข้าตรวจ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Avg Health Score</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">{stats?.averageHealthScore || 100}/100</p>
          <p className="text-[10px] text-slate-400">คะแนนคุณภาพข้อมูลเฉลี่ย</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {stats?.totalValidated
              ? Math.round(((stats.passedCount + stats.passedWithWarningsCount) / stats.totalValidated) * 100)
              : 100}
            %
          </p>
          <p className="text-[10px] text-slate-400">ผ่านเกณฑ์ขั้นต่ำ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Critical Defect Rate</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-600">{stats?.failedRejectedCount || 0}</p>
          <p className="text-[10px] text-slate-400">ข้อผิดพลาดร้ายแรง (Rejected)</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Duplication Rate</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600">{stats?.duplicationRatePercent || 0}%</p>
          <p className="text-[10px] text-slate-400">อัตราการพบประกาศซ้ำ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Rules Version</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 font-mono mt-1">v8.0.0</p>
          <p className="text-[10px] text-slate-400">6 Quality Rules Active</p>
        </div>
      </div>

      {/* Main Validation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Test Input Workspace (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-xs text-slate-900">ทดสอบรัน Validation Rules บนข้อมูลสกัด</h2>
              <p className="text-[11px] text-slate-500">เลือกกรณีทดสอบจำลองหรือป้อน JSON Custom Job</p>
            </div>
          </div>

          {/* Test Presets Picker */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">เลือกชุดกรณีทดสอบ (Validation Test Presets):</label>
            <div className="grid grid-cols-1 gap-1.5">
              {TEST_PRESET_JOBS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-2.5 rounded-xl text-left transition-all border flex flex-col gap-0.5 ${
                    selectedPresetId === p.id
                      ? 'bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center justify-between">
                    <span>{p.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable JSON Area */}
          <form onSubmit={handleRunValidation} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                โครงสร้างข้อมูลงาน Extracted JSON <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={11}
                required
                value={customJobJson}
                onChange={(e) => {
                  setCustomJobJson(e.target.value);
                  setSelectedPresetId('');
                }}
                className="w-full p-3 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={validating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
              {validating ? 'กำลังตรวจเช็คกฎ 6 มิติ...' : 'ประเมินคุณภาพและสร้างรายงาน Validation Report'}
            </button>
          </form>
        </div>

        {/* Right Inspector: Validation Report Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeReport ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              {/* Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-400" />
                  <div>
                    <h2 className="font-bold text-xs text-white">
                      รายงานผลการตรวจคุณภาพประกาศ (Quality Report)
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">{activeReport.id} • Rules {activeReport.validatedByRulesVersion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRawJsonMode(!rawJsonMode)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-blue-400" />
                    {rawJsonMode ? 'ดูรายงาน UI' : 'ดู Raw JSON'}
                  </button>

                  <button
                    onClick={() => handleCopyJson(activeReport)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                    title="คัดลอก JSON รายงาน"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Status & Health Gauge Banner */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">สถานะสรุป:</span>
                  {activeReport.overallStatus === 'PASS' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      PASSED (ผ่านเกณฑ์สมบูรณ์)
                    </span>
                  ) : activeReport.overallStatus === 'PASS_WITH_WARNINGS' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      PASS WITH WARNINGS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      FAILED REJECTED
                    </span>
                  )}
                </div>

                {/* Health Score Gauge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">คะแนนสุขภาพประกาศ (Health Score):</span>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200">
                    <div className="w-20 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          activeReport.healthScore >= 85
                            ? 'bg-emerald-500'
                            : activeReport.healthScore >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${activeReport.healthScore}%` }}
                      />
                    </div>
                    <span
                      className={`font-black text-xs ${
                        activeReport.healthScore >= 85
                          ? 'text-emerald-700'
                          : activeReport.healthScore >= 50
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {activeReport.healthScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {rawJsonMode ? (
                /* Raw JSON Mode */
                <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre>{JSON.stringify(activeReport, null, 2)}</pre>
                </div>
              ) : (
                /* Main Inspection Breakdown */
                <div className="p-5 space-y-4 text-xs">
                  {/* Title & Agency Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{activeReport.jobTitle}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{activeReport.agencyName}</p>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                        Critical: {activeReport.issuesCount.critical}
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                        Warning: {activeReport.issuesCount.warning}
                      </div>
                    </div>
                  </div>

                  {/* Issues List by Categories */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span>รายการข้อผิดพลาดที่ตรวจพบ ({activeReport.issues.length} รายการ):</span>
                    </h4>

                    {activeReport.issues.length === 0 ? (
                      <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ไม่พบข้อผิดพลาด ประกาศนี้ผ่านการตรวจสอบคุณภาพสมบูรณ์แบบ
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeReport.issues.map((iss) => (
                          <div
                            key={iss.id}
                            className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                              iss.severity === 'CRITICAL'
                                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                                : iss.severity === 'WARNING'
                                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                                : 'bg-blue-50/80 border-blue-200 text-blue-950'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    iss.severity === 'CRITICAL'
                                      ? 'bg-rose-600 text-white'
                                      : iss.severity === 'WARNING'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {iss.severity}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white border font-bold text-[10px] text-slate-700 font-mono">
                                  {iss.category}
                                </span>
                                <span className="font-bold text-xs font-mono text-slate-800">[{iss.field}]</span>
                              </div>
                            </div>

                            <p className="font-bold text-xs">{iss.message}</p>

                            {iss.currentValue !== undefined && (
                              <p className="text-[11px] font-mono text-slate-600">
                                ค่าในประกาศปัจจุบัน: <span className="bg-white/80 px-1.5 py-0.5 rounded border">{String(iss.currentValue)}</span>
                              </p>
                            )}

                            {iss.suggestedFix && (
                              <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-700 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>ข้อเสนอแนะแก้ไข: <strong>{iss.suggestedFix}</strong></span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 space-y-3">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">ยังไม่มีการเลือกรายงาน ให้กดปุ่มรันตรวจสอบด้านซ้าย</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Reports History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-xs text-white">
              คลังรายงานผลการตรวจสอบคุณภาพประกาศ ({reports.length} รายการ)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold">กรองตามสถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold focus:outline-none"
            >
              <option value="ALL">ทั้งหมด (All Reports)</option>
              <option value="PASS">PASSED (ผ่านสมบูรณ์)</option>
              <option value="PASS_WITH_WARNINGS">PASS WITH WARNINGS</option>
              <option value="FAILED_REJECTED">FAILED REJECTED (มีข้อผิดพลาด)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">ตำแหน่ง & หน่วยงาน</th>
                <th className="p-3">Health Score</th>
                <th className="p-3">สถานะสรุป</th>
                <th className="p-3">จำนวนข้อผิดพลาด</th>
                <th className="p-3">เวลาตรวจเช็ค</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{rep.jobTitle}</div>
                    <div className="text-[10px] text-slate-500">{rep.agencyName}</div>
                  </td>

                  <td className="p-3">
                    <span
                      className={`font-black text-xs ${
                        rep.healthScore >= 85
                          ? 'text-emerald-700'
                          : rep.healthScore >= 50
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {rep.healthScore}/100
                    </span>
                  </td>

                  <td className="p-3">
                    {rep.overallStatus === 'PASS' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        PASSED
                      </span>
                    ) : rep.overallStatus === 'PASS_WITH_WARNINGS' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        WARNINGS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black">
                        REJECTED
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-[11px] text-slate-600">
                    Critical: {rep.issuesCount.critical} | Warn: {rep.issuesCount.warning}
                  </td>

                  <td className="p-3 text-slate-500 text-[11px]">
                    {new Date(rep.timestamp).toLocaleTimeString('th-TH')}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveReport(rep)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เรียกดู
                      </button>

                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                        title="ลบรายงานนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    ไม่พบรายงานการตรวจสอบตามเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Audit Logs Streamer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-xs text-white">
              ประวัติการทำงานเครื่องมือ Job Validation Engine (Audit Logs Streamer)
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา Log..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-blue-500"
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
                      ? 'bg-blue-500/20 text-blue-400'
                      : l.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {l.step}
                </span>
                <span className="text-slate-200">{l.message}</span>
              </div>
              <span className="text-slate-600 font-mono text-[10px]">{l.reportId}</span>
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
