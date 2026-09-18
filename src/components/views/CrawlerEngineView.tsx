import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  Play,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  ShieldCheck,
  Search,
  Filter,
  Zap,
  Server,
  Layers,
  Copy,
  Check,
  Database,
  ArrowRight,
  Flame,
  Globe,
  Radio,
  Ban,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface CrawlTask {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  scrapeTargetUrl: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  maxRetries: number;
  timeoutMs: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  httpStatus?: number;
  itemsFound: number;
  itemsExtracted: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  triggeredBy: string;
}

export interface StructuredCrawlLog {
  id: string;
  crawlJobId: string;
  sourceId: string;
  sourceName: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  step: string;
  message: string;
  latencyMs?: number;
  httpStatus?: number;
  metadata?: Record<string, unknown>;
}

export interface CrawlerStats {
  totalCrawls: number;
  successCrawls: number;
  successRate: number;
  totalExtractedJobs: number;
  duplicatesPrevented: number;
  avgLatencyMs: number;
  knownFingerprintsCount: number;
  circuitBreakersActive: number;
}

export const CrawlerEngineView: React.FC = () => {
  const { getIdToken } = useAuth();

  // Engine States
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [queueState, setQueueState] = useState<{
    activeWorkers: number;
    maxWorkers: number;
    queuedCount: number;
    queue: CrawlTask[];
    recentHistory: CrawlTask[];
  }>({
    activeWorkers: 0,
    maxWorkers: 3,
    queuedCount: 0,
    queue: [],
    recentHistory: [],
  });

  const [logs, setLogs] = useState<StructuredCrawlLog[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<StructuredCrawlLog | null>(null);

  // Duplicate Inspector States
  const [inspectAgency, setInspectAgency] = useState('สำนักงานปลัดกระทรวงมหาดไทย');
  const [inspectTitle, setInspectTitle] = useState('นักวิเคราะห์นโยบายและแผนปฏิบัติการ');
  const [inspectUrl, setInspectUrl] = useState('https://moi.job.thai.com');
  const [dupeTestResult, setDupeTestResult] = useState<any>(null);
  const [testingDupe, setTestingDupe] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Action Notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [enqueuingBatch, setEnqueuingBatch] = useState(false);

  // Live Scraper & Auto-Publish States
  const [liveUrl, setLiveUrl] = useState('https://job.ocsc.go.th');
  const [liveCrawlResult, setLiveCrawlResult] = useState<any>(null);
  const [isLiveCrawling, setIsLiveCrawling] = useState(false);

  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  const [schedulerState, setSchedulerState] = useState<any>(null);
  const [isSchedulerTriggering, setIsSchedulerTriggering] = useState(false);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleRunLiveCrawl = async () => {
    setIsLiveCrawling(true);
    setLiveCrawlResult(null);
    try {
      const res = await fetch('/api/crawler/fetch-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: liveUrl }),
      });
      const data = await res.json();
      setLiveCrawlResult(data);
      showNotice('ทดสอบสกัดข้อมูลสดจากเว็บไซต์ราชการสำเร็จ!');
    } catch (err) {
      showNotice('ข้อผิดพลาดในการดึงข้อมูลสด', 'error');
    } finally {
      setIsLiveCrawling(false);
    }
  };

  const handleRunPipeline = async () => {
    setIsPipelineRunning(true);
    setPipelineResult(null);
    try {
      const res = await fetch('/api/pipeline/auto-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setPipelineResult(data);
      showNotice('รันไปป์ไลน์สกัดข้อมูลและ Auto-Publish สำเร็จ!');
    } catch (err) {
      showNotice('ข้อผิดพลาดในการรัน Auto-Publish Pipeline', 'error');
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const handleTriggerScheduler = async () => {
    setIsSchedulerTriggering(true);
    try {
      const res = await fetch('/api/scheduler/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSchedulerState(data.scheduler);
        showNotice(data.message);
      }
    } catch (err) {
      showNotice('ข้อผิดพลาดในการเรียกใช้ Scheduler', 'error');
    } finally {
      setIsSchedulerTriggering(false);
    }
  };

  // Load Data
  const fetchEngineData = async () => {
    try {
      const [statsRes, queueRes, logsRes] = await Promise.all([
        fetch('/api/crawler/stats').then((r) => r.json()),
        fetch('/api/crawler/queue').then((r) => r.json()),
        fetch(`/api/crawler/logs?level=${logLevelFilter}&limit=150`).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (queueRes.success) setQueueState(queueRes.data);
      if (logsRes.success) setLogs(logsRes.data);
    } catch (err) {
      console.error('Error loading crawler engine data:', err);
    }
  };

  useEffect(() => {
    fetchEngineData();
  }, [logLevelFilter]);

  // Auto-Refresh Polling Loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEngineData();
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, logLevelFilter]);

  // Run Batch Enqueue
  const handleBatchEnqueueAll = async () => {
    setEnqueuingBatch(true);
    try {
      const token = await getIdToken();
      const sourcesRes = await fetch('/api/sources').then((r) => r.json());
      const sourceIds = (sourcesRes.data || []).map((s: any) => s.id);

      if (sourceIds.length === 0) {
        showNotice('ไม่พบแหล่งข้อมูลสำหรับเริ่มการสืบค้น', 'error');
        return;
      }

      const res = await fetch('/api/crawler/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceIds, priority: 'HIGH' }),
      });

      const data = await res.json();
      if (data.success) {
        showNotice(`ส่งคำสั่ง Batch Crawl สำหรับ ${data.tasksCount} แหล่งข้อมูลเข้าสู่ Queue เรียบร้อยแล้ว`);
        fetchEngineData();
      }
    } catch (err) {
      console.error('Batch enqueue error:', err);
      showNotice('ไม่สามารถส่งคำสั่ง Batch Crawl ได้', 'error');
    } finally {
      setEnqueuingBatch(false);
    }
  };

  // Cancel Task
  const handleCancelTask = async (taskId: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/crawler/queue/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`ยกเลิก Task ${taskId} เรียบร้อยแล้ว`);
        fetchEngineData();
      } else {
        showNotice(data.message, 'error');
      }
    } catch (err) {
      showNotice('ไม่สามารถยกเลิก Task ได้', 'error');
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    try {
      const token = await getIdToken();
      await fetch('/api/crawler/clear-queue', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotice('ล้างประวัติการสืบค้นที่เสร็จสมบูรณ์แล้ว');
      fetchEngineData();
    } catch (err) {
      console.error('Failed clearing queue history:', err);
    }
  };

  // Duplicate Fingerprint Test
  const handleTestDuplicateFingerprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingDupe(true);
    setDupeTestResult(null);

    try {
      const res = await fetch('/api/crawler/detect-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: inspectAgency,
          title: inspectTitle,
          targetUrl: inspectUrl,
        }),
      });
      const data = await res.json();
      setDupeTestResult(data);
    } catch (err) {
      console.error('Error testing duplicate:', err);
    } finally {
      setTestingDupe(false);
    }
  };

  const handleCopyFingerprint = (fp: string) => {
    navigator.clipboard.writeText(fp);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  // Filter logs locally by search query
  const filteredLogs = logs.filter((l) => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return (
      l.message.toLowerCase().includes(q) ||
      l.sourceName.toLowerCase().includes(q) ||
      l.step.toLowerCase().includes(q) ||
      l.crawlJobId.toLowerCase().includes(q)
    );
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
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold mb-2">
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
              Sprint 5 Core Architecture • Multi-Source Crawler Engine
            </div>
            <h1 className="text-2xl font-black text-white">ระบบเครื่องมือสืบค้นข้อมูลอัตโนมัติ (Crawler Engine)</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ระบบสืบค้น multi-source อัตโนมัติพร้อม Retry strategy แบบ Exponential Backoff, Timeout handling, การตรวจจับประกาศซ้ำด้วย SHA-256 Fingerprint, Queue processing แบบ Concurrent Workers และระบบ Structured Logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-ping' : ''}`} />
              Auto-Refresh: {autoRefresh ? 'ON (2.5s)' : 'OFF'}
            </button>

            <button
              onClick={handleBatchEnqueueAll}
              disabled={enqueuingBatch}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${enqueuingBatch ? 'animate-spin' : ''}`} />
              {enqueuingBatch ? 'กำลังส่งคำสั่ง...' : 'เริ่มสืบค้นทุกแหล่ง (Batch Crawl)'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Workers Concurrent</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {queueState.activeWorkers} / {queueState.maxWorkers}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${(queueState.activeWorkers / queueState.maxWorkers) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Total Executions</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.totalCrawls || 0}</p>
          <p className="text-[10px] text-slate-400">ประวัติการสืบค้นทั้งหมด</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">{stats?.successRate || 100}%</p>
          <p className="text-[10px] text-slate-400">อัตราดึงข้อมูลสำเร็จ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Extracted Jobs</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.totalExtractedJobs || 0}</p>
          <p className="text-[10px] text-slate-400">ประกาศใหม่สืบค้นได้</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Dupes Prevented</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-600">{stats?.duplicatesPrevented || 0}</p>
          <p className="text-[10px] text-slate-400">ป้องกันประกาศซ้ำ</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Known Hashes</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.knownFingerprintsCount || 0}</p>
          <p className="text-[10px] text-slate-400">SHA-256 Fingerprints</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Avg HTTP Latency</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.avgLatencyMs || 180} ms</p>
          <p className="text-[10px] text-slate-400">ระยะเวลาตอบสนอง</p>
        </div>
      </div>

      {/* Proof Widgets: Live Scraper, Auto Publish Pipeline & Scheduler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Live Real Government Crawler Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-xs text-slate-900">1. Live Government Fetcher</h3>
              <p className="text-[10px] text-slate-500">ดึงข้อมูลสดจริงจากเว็บราชการ (HTML/DOM Parsing)</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] outline-none"
            />
            <button
              onClick={handleRunLiveCrawl}
              disabled={isLiveCrawling}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveCrawling ? 'animate-spin' : ''}`} />
              {isLiveCrawling ? 'กำลังเชื่อมต่อและดึงเว็บ...' : 'ทดสอบดึงข้อมูลสดจากเว็บราชการ'}
            </button>

            {liveCrawlResult && (
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-[11px] font-mono">
                <p className="text-emerald-400 font-bold">Status {liveCrawlResult.httpStatus} OK</p>
                <p className="text-slate-300">Title: {liveCrawlResult.pageTitle}</p>
                <p className="text-slate-400">HTML Size: {liveCrawlResult.htmlLength} bytes</p>
                <p className="text-amber-400 font-bold">พบไฟล์ประกาศ PDF: {liveCrawlResult.extractedPdfLinksCount} ไฟล์</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Auto-Publish Pipeline Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-xs text-slate-900">2. Auto-Publish Pipeline</h3>
              <p className="text-[10px] text-slate-500">Crawler → Gemini → Validation → Auto Publish</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-[11px] text-slate-600">รันระบบประมวลผลอัตโนมัติต้นจนจบพร้อมตรวจสอบกฎ ก.พ.</p>
            <button
              onClick={handleRunPipeline}
              disabled={isPipelineRunning}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isPipelineRunning ? 'animate-spin' : ''}`} />
              {isPipelineRunning ? 'กำลังประมวลผลไปป์ไลน์...' : 'รัน Auto-Publish Pipeline'}
            </button>

            {pipelineResult && (
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 text-[11px]">
                <span className="text-amber-400 font-mono font-bold">{pipelineResult.traceId}</span>
                <div className="space-y-0.5 text-slate-300 pt-1">
                  {pipelineResult.pipelineSteps.map((step: any) => (
                    <div key={step.step} className="flex justify-between items-center text-[10px]">
                      <span>{step.step}. {step.name}</span>
                      <span className="text-emerald-400 font-bold">{step.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Scheduler Engine Control Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-xs text-slate-900">3. Scheduler Engine</h3>
              <p className="text-[10px] text-slate-500">Cron Job & Cloud Scheduler Trigger</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-[11px] text-slate-600">รอบการทำงาน: ทุก 15 นาที (Cron: */15 * * * *)</p>
            <button
              onClick={handleTriggerScheduler}
              disabled={isSchedulerTriggering}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isSchedulerTriggering ? 'animate-spin' : ''}`} />
              {isSchedulerTriggering ? 'กำลังเรียก Cron Trigger...' : 'สั่งรัน Scheduler ล่วงหน้าทันที'}
            </button>

            {schedulerState && (
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 text-[11px] font-mono">
                <p className="text-indigo-400 font-bold">Total Executions: {schedulerState.totalExecutions}</p>
                <p className="text-slate-300">Last Run: {new Date(schedulerState.lastRunAt).toLocaleTimeString('th-TH')}</p>
                <p className="text-slate-400">Next Scheduled: {new Date(schedulerState.nextRunAt).toLocaleTimeString('th-TH')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Task Queue & History + Duplicate Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Queue & Active Workers (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Workers & Task Queue Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-xs text-white">
                  ตารางคิวและประวัติการประมวลผล (Task Queue & Worker Pool)
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleClearHistory}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  ล้างประวัติ
                </button>
              </div>
            </div>

            {/* Currently Active & Queued Tasks */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                รายการที่กำลังประมวลผลใน Queue ({queueState.queue.length})
              </h3>

              {queueState.queue.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  ไม่มี Task ค้างอยู่ใน Queue ขณะนี้ (สถานะปกติ)
                </div>
              ) : (
                <div className="space-y-2">
                  {queueState.queue.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              task.status === 'PROCESSING'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : task.status === 'RETRYING'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span>{task.sourceName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({task.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Target: {task.scrapeTargetUrl} | Attempts: {task.attempts}/{task.maxRetries}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelTask(task.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] border border-rose-200 flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        ยกเลิก
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Job ID & แหล่งข้อมูล</th>
                    <th className="p-3">สถานะ & Priority</th>
                    <th className="p-3">พยายาม / Timeout</th>
                    <th className="p-3">ผลการสืบค้น</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3 text-right">เวลาทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueState.recentHistory.slice(0, 10).map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{task.sourceName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{task.id}</div>
                      </td>

                      <td className="p-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.status}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500">{task.priority} Priority</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        {task.attempts}/{task.maxRetries} ({task.timeoutMs}ms)
                      </td>

                      <td className="p-3">
                        <div className="text-[11px] font-semibold text-slate-800">
                          สืบค้นใหม่: <span className="text-emerald-600 font-bold">{task.itemsExtracted}</span> | ซ้ำ: {' '}
                          <span className="text-amber-600 font-bold">{task.duplicatesSkipped}</span>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px]">{task.latencyMs ? `${task.latencyMs} ms` : '-'}</td>

                      <td className="p-3 text-right font-mono text-[10px] text-slate-500">
                        {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('th-TH') : '-'}
                      </td>
                    </tr>
                  ))}

                  {queueState.recentHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                        ยังไม่มีประวัติการสืบค้น (กด "เริ่มสืบค้นทุกแหล่ง" ด้านบนเพื่อรัน Task ทดสอบ)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: SHA-256 Duplicate Inspector */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="font-bold text-xs text-slate-900">
                  เครื่องมือตรวจสอบประกาศซ้ำ (Duplicate Inspector)
                </h2>
                <p className="text-[11px] text-slate-500">ทดสอบการคำนวณ SHA-256 Fingerprint และตรวจสอบกับสถิติ Fingerprint ในระบบ</p>
              </div>
            </div>

            <form onSubmit={handleTestDuplicateFingerprint} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อหน่วยงาน (Agency Name)</label>
                <input
                  type="text"
                  required
                  value={inspectAgency}
                  onChange={(e) => setInspectAgency(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อตำแหน่งงาน (Position Title)</label>
                <input
                  type="text"
                  required
                  value={inspectTitle}
                  onChange={(e) => setInspectTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL ประกาศ (Target Link)</label>
                <input
                  type="url"
                  value={inspectUrl}
                  onChange={(e) => setInspectUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={testingDupe}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Zap className={`w-4 h-4 ${testingDupe ? 'animate-spin' : ''}`} />
                {testingDupe ? 'กำลังคำนวณ Fingerprint...' : 'คำนวณ SHA-256 & ตรวจสอบรายการซ้ำ'}
              </button>
            </form>

            {dupeTestResult && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs border border-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">SHA-256 Fingerprint Output:</span>
                  <button
                    onClick={() => handleCopyFingerprint(dupeTestResult.fingerprint)}
                    className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
                    title="คัดลอก Hash"
                  >
                    {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg font-mono text-[10px] text-emerald-400 break-all border border-slate-800">
                  {dupeTestResult.fingerprint}
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">สูตรการ Normalized:</strong>{' '}
                    <code className="text-amber-300 font-mono text-[10px]">{dupeTestResult.sha256Algorithm}</code>
                  </p>
                  <p>
                    <strong className="text-slate-400">คลัง Fingerprints ในความจำ:</strong>{' '}
                    {dupeTestResult.registryKnownFingerprintsCount} รายการ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured Logs Viewer Console (Full Width Terminal) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        {/* Console Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-xs text-white">
              ศูนย์รวม Structured Console Logs (Live Event Streamer)
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              JSON Standard
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหา Log message..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Level Filter */}
            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-300"
            >
              <option value="ALL">ทุกระดับ Log Level</option>
              <option value="INFO">INFO (ข่าวสารปกติ)</option>
              <option value="WARN">WARN (คำเตือน / ข้ามรายการซ้ำ)</option>
              <option value="ERROR">ERROR (ข้อผิดพลาด / Retry)</option>
            </select>
          </div>
        </div>

        {/* Logs Terminal Body */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2 font-mono text-[11px] divide-y divide-slate-900">
          {filteredLogs.map((l) => (
            <div key={l.id} className="pt-2 hover:bg-slate-900/50 p-1.5 rounded transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{new Date(l.timestamp).toLocaleTimeString('th-TH')}</span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      l.level === 'INFO'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : l.level === 'WARN'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {l.level}
                  </span>

                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {l.step}
                  </span>

                  <span className="text-slate-300 font-medium">[{l.sourceName}]</span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">Job: {l.crawlJobId}</div>
              </div>

              <p className="mt-1 text-slate-200 font-mono leading-relaxed pl-2 border-l-2 border-slate-800">
                {l.message}
              </p>

              {l.metadata && Object.keys(l.metadata).length > 0 && (
                <div className="mt-1 pl-3 text-[10px] text-slate-400 font-mono">
                  Payload: {JSON.stringify(l.metadata)}
                </div>
              )}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-8 text-center text-slate-600">
              ยังไม่มี Log บันทึกตรงตามเงื่อนไข (กด "เริ่มสืบค้นทุกแหล่ง" ด้านบนเพื่อรัน Task สตรีม Log แบบ Real-time)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
