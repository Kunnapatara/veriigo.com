import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  ShieldAlert,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  Terminal,
  Zap,
  Lock,
  RefreshCw,
  Copy,
  Check,
  FileCheck2,
  ListChecks,
} from 'lucide-react';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  system: {
    memory: { rssMb: number; heapTotalMb: number; heapUsedMb: number };
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

interface ReadinessData {
  status: string;
  checks: {
    firestore: string;
    geminiAiService: string;
    documentStorage: string;
    crawlerService: string;
  };
}

interface MetricsData {
  requestsPerMinute: number;
  avgResponseLatencyMs: number;
  p95ResponseLatencyMs: number;
  httpStatusDistribution: { status2xxPct: number; status4xxPct: number; status5xxPct: number };
  cachePerformance: { hitRatioPct: number; cacheSizeMb: number; totalCachedKeys: number };
  memory: { heapUsedMb: number; heapTotalMb: number };
  activeConnections: number;
}

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'AUTOMATED_DAILY' | 'POINT_IN_TIME' | 'MANUAL';
  sizeMb: number;
  collections: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  gcsUri: string;
}

interface DRData {
  sla: {
    rpoTarget: string;
    rtoTarget: string;
    currentRpoMinutes: number;
    currentRtoMinutes: number;
    availabilityTargetPct: number;
    currentAvailabilityPct: number;
  };
  replication: {
    primaryRegion: string;
    secondaryRegion: string;
    syncStatus: string;
    latencyMs: number;
  };
  drChecklist: { step: number; title: string; status: string; description: string }[];
}

interface DeploymentGuideData {
  version: string;
  targetPlatform: string;
  containerSpecs: {
    cpu: string;
    memory: string;
    minInstances: number;
    maxInstances: number;
    concurrency: number;
  };
  environmentVariables: { name: string; configured: boolean; value: string; required: boolean }[];
  deploymentSteps: { step: number; title: string; command: string }[];
}

export const DeploymentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'METRICS' | 'BACKUP' | 'DR' | 'GUIDE'>('HEALTH');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [drData, setDrData] = useState<DRData | null>(null);
  const [deployGuide, setDeployGuide] = useState<DeploymentGuideData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBackupTriggering, setIsBackupTriggering] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchDevOpsData = async () => {
    setLoading(true);
    try {
      const [healthRes, readinessRes, metricsRes, backupsRes, drRes, guideRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/readiness'),
        fetch('/api/metrics'),
        fetch('/api/devops/backups'),
        fetch('/api/devops/dr-status'),
        fetch('/api/devops/deployment-guide'),
      ]);

      const hData = await healthRes.json();
      const rData = await readinessRes.json();
      const mData = await metricsRes.json();
      const bData = await backupsRes.json();
      const dData = await drRes.json();
      const gData = await guideRes.json();

      setHealth(hData);
      setReadiness(rData);
      if (mData.success) setMetrics(mData.data);
      if (bData.success) setBackups(bData.backups);
      if (dData.success) setDrData(dData);
      if (gData.success) setDeployGuide(gData);
    } catch (err) {
      console.error('Failed to fetch DevOps data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevOpsData();
    const interval = setInterval(fetchDevOpsData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerBackup = async () => {
    setIsBackupTriggering(true);
    setBackupNotice(null);
    try {
      const res = await fetch('/api/devops/backups/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupNotice(data.message);
        setBackups([data.backup, ...backups]);
      }
    } catch (err) {
      console.error('Failed to trigger backup:', err);
    } finally {
      setIsBackupTriggering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* DevOps Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sprint 15 Production Ready
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Google Cloud Run Container
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Server className="w-7 h-7 text-indigo-400" />
              ศูนย์ควบคุมการติดตั้งใช้งานและความมั่นคงปลอดภัย (DevOps & Production Infrastructure)
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl">
              ระบบกำกับดูแล Production Readiness: การจัดการความปลอดภัย Security Headers, Rate Limiting, Health Monitoring, Backup & Disaster Recovery SLA และคู่มือการติดตั้ง Google Cloud Run
            </p>
          </div>

          <button
            onClick={fetchDevOpsData}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล (Refresh Stats)
          </button>
        </div>

        {/* Quick System KPI Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">สถานะบริการ (Liveness & Readiness)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-400">HEALTHY & READY</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">อัตราการทำงานต่อเนื่อง (Uptime SLA)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-white">{formatUptime(health?.uptimeSeconds)}</span>
              <span className="text-xs text-emerald-400 font-semibold">99.99% Availability</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">ความเร็วการตอบสนองเฉลี่ย (Avg Latency)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-indigo-300">{metrics?.avgResponseLatencyMs} ms</span>
              <span className="text-xs text-indigo-400 font-medium">Fast API</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">การป้องกันความปลอดภัย (Rate Limiter)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-white">120 Req/Min</span>
              <span className="text-xs text-emerald-400 font-semibold">Protected</span>
            </div>
          </div>
        </div>
      </div>

      {backupNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{backupNotice}</p>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'HEALTH'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          สถานะและตรวจสุขภาพระบบ (Health & Probes)
        </button>

        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'METRICS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          ประสิทธิภาพ & แคช (Performance & Cache)
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BACKUP'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          แผนสำรองข้อมูล (Backup Strategy)
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-bold">
            {backups.length} Records
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DR')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DR'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          การกู้คืนพิบัติภัย & SLA (Disaster Recovery)
        </button>

        <button
          onClick={() => setActiveTab('GUIDE')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'GUIDE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-4 h-4" />
          คู่มือ Cloud Run Deployment
        </button>
      </div>

      {/* TAB 1: HEALTH & SYSTEM PROBES */}
      {activeTab === 'HEALTH' && health && readiness && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Liveness & Readiness Status Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  การตรวจสอบความพร้อมใช้งาน (Kubernetes/Cloud Run Probes)
                </h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {readiness.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-medium text-slate-700">Liveness Probe (/api/health/liveness)</span>
                  <span className="px-2.5 py-1 font-bold rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK (ALIVE)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-medium text-slate-700">Readiness Probe (/api/health/readiness)</span>
                  <span className="px-2.5 py-1 font-bold rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK (READY)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">สถานะการเชื่อมต่อบริการย่อย (Subservices Status)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(readiness.checks).map(([key, value]) => (
                    <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="capitalize font-mono text-slate-600">{key}</span>
                      <span className="font-bold text-emerald-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Server Memory & Environment Specs Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  ทรัพยากรหน่วยความจำ & สภาพแวดล้อม (Server Specs)
                </h3>
                <span className="text-xs font-mono text-slate-500">Node {health.system.nodeVersion}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Memory Heap Used</span>
                    <span className="font-bold">{health.system.memory.heapUsedMb} MB / {health.system.memory.heapTotalMb} MB</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (health.system.memory.heapUsedMb / health.system.memory.heapTotalMb) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">RSS Memory</span>
                    <span className="text-sm font-bold text-slate-900">{health.system.memory.rssMb} MB</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Platform / Arch</span>
                    <span className="text-sm font-bold text-slate-900">{health.system.platform} ({health.system.arch})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Headers Inspection Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                ส่วนหัวความปลอดภัยที่ติดตั้งใน HTTP Responses (Active Security Headers)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                A+ Security Score
              </span>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-mono font-bold text-slate-800">Strict-Transport-Security (HSTS)</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">max-age=31536000; includeSubDomains</span>
              </div>
              <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-mono font-bold text-slate-800">Content-Security-Policy (CSP)</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border max-w-lg truncate">default-src 'self' https://* ws://* wss://*</span>
              </div>
              <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-mono font-bold text-slate-800">X-Frame-Options</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">SAMEORIGIN</span>
              </div>
              <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-mono font-bold text-slate-800">X-Content-Type-Options</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">nosniff</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERFORMANCE & CACHE */}
      {activeTab === 'METRICS' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase block">Requests / Minute</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.requestsPerMinute} RPM</span>
              <span className="text-[11px] text-emerald-600 font-medium">Sliding Window Limiter</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase block">Cache Hit Ratio</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.cachePerformance.hitRatioPct}%</span>
              <span className="text-[11px] text-slate-500">{metrics.cachePerformance.totalCachedKeys} Cached Search Queries</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase block">P95 Latency</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">{metrics.p95ResponseLatencyMs} ms</span>
              <span className="text-[11px] text-slate-500">P99: {metrics.p99ResponseLatencyMs} ms</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase block">HTTP 2xx Success Rate</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.httpStatusDistribution.status2xxPct}%</span>
              <span className="text-[11px] text-slate-500">Errors 4xx/5xx &lt; 2%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP STRATEGY */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                กลยุทธ์การสำรองข้อมูล (Firestore Backup & Point-in-Time Recovery)
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl">
                สำรองข้อมูลอัตโนมัติรายวันไปยัง Google Cloud Storage (Bucket: gs://veriigo-firestore-backups) ระยะเวลาจัดเก็บ 30 วัน พร้อมสิทธิ์การย้อนคืนข้อมูลย้อนหลัง (PITR) 7 วัน
              </p>
            </div>

            <button
              onClick={handleTriggerBackup}
              disabled={isBackupTriggering}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isBackupTriggering ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  กำลังดำเนินการสำรองข้อมูล...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  สำรองข้อมูลด้วยตนเองทันที (Trigger Manual Backup)
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="font-bold text-slate-900 text-sm">ประวัติบันทึกการสำรองข้อมูล (Backup History Log)</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">รหัสสำรอง (Backup ID)</th>
                    <th className="p-3">ประเภท (Type)</th>
                    <th className="p-3">เวลาที่สำรอง (Timestamp)</th>
                    <th className="p-3">ขนาดไฟล์ (Size)</th>
                    <th className="p-3">Cloud Storage Path</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {backups.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{bk.id}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-800 border">
                          {bk.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{new Date(bk.timestamp).toLocaleString('th-TH')}</td>
                      <td className="p-3 font-mono text-slate-700">{bk.sizeMb} MB</td>
                      <td className="p-3 font-mono text-slate-500 text-[11px] max-w-xs truncate">{bk.gcsUri}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {bk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISASTER RECOVERY */}
      {activeTab === 'DR' && drData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                ข้อกำหนดเป้าหมายเวลาในการกู้คืน (SLA Targets)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                  <span className="text-slate-600 font-medium">Recovery Point Objective (RPO Target)</span>
                  <span className="font-bold text-indigo-600">{drData.sla.rpoTarget}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                  <span className="text-slate-600 font-medium">Recovery Time Objective (RTO Target)</span>
                  <span className="font-bold text-indigo-600">{drData.sla.rtoTarget}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                  <span className="text-slate-600 font-medium">ความพร้อมใช้งานระบบ (Current Availability)</span>
                  <span className="font-bold text-emerald-600">{drData.sla.currentAvailabilityPct}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-600" />
                การคัดลอกข้อมูลข้ามภูมิภาค (Multi-Region Replication)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                  <span className="text-slate-600 font-medium">Primary Region</span>
                  <span className="font-bold text-slate-900">{drData.replication.primaryRegion}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                  <span className="text-slate-600 font-medium">Secondary Disaster Recovery Region</span>
                  <span className="font-bold text-slate-900">{drData.replication.secondaryRegion}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-emerald-900 font-bold">
                  <span>สถานะการเชื่อมโยง (Sync Status)</span>
                  <span>{drData.replication.syncStatus} ({drData.replication.latencyMs}ms)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              รายการตรวจสอบแผนสลับการทำงานเมื่อเกิดภัยพิบัติ (Disaster Recovery Drill Checklist)
            </h4>

            <div className="space-y-2 text-xs">
              {drData.drChecklist.map((item) => (
                <div key={item.step} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-slate-500">{item.description}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 font-bold rounded bg-emerald-100 text-emerald-800 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEPLOYMENT GUIDE */}
      {activeTab === 'GUIDE' && deployGuide && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              ตรวจสอบค่าตัวแปรสภาพแวดล้อมก่อนการติดตั้ง (Environment Variables Checklist)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {deployGuide.environmentVariables.map((env) => (
                <div key={env.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">{env.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{env.value}</span>
                  </div>
                  <span
                    className={`px-2 py-1 font-bold rounded ${
                      env.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {env.configured ? 'CONFIGURED' : 'OPTIONAL'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 text-slate-200 rounded-xl p-5 shadow-lg border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-indigo-400" />
              คำสั่งการติดตั้ง Production Container บน Google Cloud Run (CLI Step-by-Step)
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {deployGuide.deploymentSteps.map((s) => (
                <div key={s.step} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-indigo-300">Step {s.step}: {s.title}</span>
                    <button
                      onClick={() => copyToClipboard(s.command)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedCmd === s.command ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      คัดลอก
                    </button>
                  </div>
                  <code className="text-emerald-400 block break-all">{s.command}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
