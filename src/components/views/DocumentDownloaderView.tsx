import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Shield,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  FileCode,
  FileCheck,
  AlertTriangle,
  Terminal,
  Search,
  Key,
  Clock,
  Layers,
  Cpu,
  Zap,
  Info,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface DocumentMetadata {
  fileName: string;
  originalUrl: string;
  mimeType: string;
  detectedFormat: 'PDF' | 'DOCX' | 'HTML' | 'IMAGE' | 'UNKNOWN';
  fileSizeBytes: number;
  sha256Hash: string;
  md5Hash: string;
  magicBytesHex: string;
  extractedTitle?: string;
  textSnippet?: string;
  pageCountEstimate?: number;
  imageDimensions?: { width: number; height: number };
  downloadedAt: string;
  expiresAt: string;
}

export interface SecurityScanResult {
  status: 'CLEAN' | 'QUARANTINED' | 'SUSPICIOUS' | 'UNSCANNED';
  threatsFound: string[];
  scanTimestamp: string;
  eicarDetected: boolean;
  suspiciousScriptDetected: boolean;
  macroDetected: boolean;
  securityNotes: string;
}

export interface DownloadedDocumentRecord {
  id: string;
  url: string;
  status: 'QUEUED' | 'DOWNLOADING' | 'VALIDATING' | 'SCANNING' | 'COMPLETED' | 'QUARANTINED' | 'FAILED';
  attempts: number;
  maxRetries: number;
  timeoutMs: number;
  localPath?: string;
  metadata?: DocumentMetadata;
  securityScan?: SecurityScanResult;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  triggeredBy: string;
}

export interface DownloadAuditLog {
  id: string;
  documentId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  step: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DownloaderStats {
  totalDownloads: number;
  completedDownloads: number;
  quarantinedDownloads: number;
  failedDownloads: number;
  tempStorageFilesCount: number;
  tempStorageSizeBytes: number;
  tempStorageSizeMB: string;
  sandboxDir: string;
  quarantineDir: string;
}

export const DocumentDownloaderView: React.FC = () => {
  const { getIdToken } = useAuth();

  // Engine States
  const [documents, setDocuments] = useState<DownloadedDocumentRecord[]>([]);
  const [logs, setLogs] = useState<DownloadAuditLog[]>([]);
  const [stats, setStats] = useState<DownloaderStats | null>(null);

  // Download Form State
  const [downloadUrl, setDownloadUrl] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inspector & Modal States
  const [selectedDoc, setSelectedDoc] = useState<DownloadedDocumentRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Toast Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  // Fetch Downloader Engine Data
  const fetchDownloaderData = async () => {
    try {
      const [filesRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/downloader/files').then((r) => r.json()),
        fetch('/api/downloader/stats').then((r) => r.json()),
        fetch('/api/downloader/logs?limit=100').then((r) => r.json()),
      ]);

      if (filesRes.success) setDocuments(filesRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success) setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching downloader engine data:', err);
    }
  };

  useEffect(() => {
    fetchDownloaderData();
  }, []);

  // Auto-Refresh Loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDownloaderData();
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Download Action
  const handleStartDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!downloadUrl) return;

    setDownloading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/downloader/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: downloadUrl,
          fileName: customFileName || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotice('เริ่มต้นกระบวนการดาวน์โหลด ตรวจสอบ Magic Byte และ Virus Scan แล้ว');
        setDownloadUrl('');
        setCustomFileName('');
        fetchDownloaderData();
      } else {
        showNotice(data.message, 'error');
      }
    } catch (err) {
      console.error('Download error:', err);
      showNotice('ไม่สามารถส่งคำสั่งดาวน์โหลดได้', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Test Presets Setup
  const handleSelectPreset = (url: string, name: string) => {
    setDownloadUrl(url);
    setCustomFileName(name);
  };

  // Handle File Deletion
  const handleDeleteDocument = async (id: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/downloader/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`ลบไฟล์ ${id} ออกจาก Sandbox Temp Storage เรียบร้อยแล้ว`);
        if (selectedDoc?.id === id) setSelectedDoc(null);
        fetchDownloaderData();
      } else {
        showNotice(data.message, 'error');
      }
    } catch (err) {
      showNotice('ลบไฟล์ไม่สำเร็จ', 'error');
    }
  };

  // Handle Manual Temp Storage Purge
  const handlePurgeTempStorage = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/downloader/purge-temp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(data.message);
        fetchDownloaderData();
      }
    } catch (err) {
      showNotice('ล้าง Temp Storage ไม่สำเร็จ', 'error');
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return l.message.toLowerCase().includes(q) || l.step.toLowerCase().includes(q) || l.documentId.toLowerCase().includes(q);
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-2">
              <Download className="w-4 h-4 text-blue-400 animate-bounce" />
              Sprint 6 Core Architecture • Document Download Engine
            </div>
            <h1 className="text-2xl font-black text-white">เครื่องมือดาวน์โหลดและสแกนเอกสาร (Document Downloader Engine)</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              รองรับ PDF, DOCX, HTML, Images พร้อมระบบ Magic Byte Validation, Virus-Safe Quarantine Scanner, Sandbox Temporary Storage พร้อม Lifecycle Purge และ Automatic Metadata Extractor
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
              Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={handlePurgeTempStorage}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              ล้าง Temp Storage
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Total Downloads</span>
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.totalDownloads || 0}</p>
          <p className="text-[10px] text-slate-400">ประวัติการดาวน์โหลด</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Virus Scan Passed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">{stats?.completedDownloads || 0}</p>
          <p className="text-[10px] text-slate-400">ผ่านการสแกนความปลอดภัย</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Quarantined Threats</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-600">{stats?.quarantinedDownloads || 0}</p>
          <p className="text-[10px] text-slate-400">กักกันไฟล์มัลแวร์/ภัยคุกคาม</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Temp Storage Used</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats?.tempStorageSizeMB || '0.00'} MB</p>
          <p className="text-[10px] text-slate-400">พื้นที่ใน Sandbox Temp</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Formats Verified</span>
            <FileCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-slate-900">4 Formats</p>
          <p className="text-[10px] text-slate-400">PDF, DOCX, HTML, Image</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Sandbox Directory</span>
            <FileCode className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 font-mono truncate">/tmp/doc_downloads</p>
          <p className="text-[10px] text-slate-400">TTL 2 ชั่วโมง</p>
        </div>
      </div>

      {/* Main Download Form & Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Input Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-xs text-slate-900">ฟอร์มดาวน์โหลดและประมวลผลไฟล์เอกสาร (Document Downloader)</h2>
              <p className="text-[11px] text-slate-500">กรอก URL ประกาศ/เอกสารสำหรับสกัด Metadata และตรวจความปลอดภัย</p>
            </div>
          </div>

          <form onSubmit={handleStartDownload} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                URL เอกสารปลายทาง (Target Document URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.gov.th/announcement.pdf"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ตั้งชื่อไฟล์บันทึก (Custom File Name - ไม่ระบุได้)</label>
              <input
                type="text"
                placeholder="ประกาศสอบ_ภาค_ก_2569.pdf"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={downloading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${downloading ? 'animate-spin' : ''}`} />
              {downloading ? 'กำลังดาวน์โหลดและสแกนไวรัส...' : 'เริ่มดาวน์โหลดและตรวจสอบความปลอดภัย'}
            </button>
          </form>

          {/* Preset Buttons for Instant Verification */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block">
              ชุดตัวอย่างทดสอบด่วน (Quick Test Presets):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset('https://job.ocsc.go.th/Main/GOVExam.pdf', 'ประกาศรับสมัครสอบ_กพ_ภาค_ก_2569.pdf')
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                📄 ประกาศ PDF (ก.พ.)
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'https://ratchakitcha.soc.go.th/documents/2569.html',
                    'ประกาศราชกิจจานุเบกษา_อัตรากำลังข้าราชการ.html'
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                🌐 ราชกิจจานุเบกษา HTML
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset('https://moi.go.th/form/application.docx', 'แบบฟอร์มสมัครงาน_กระทรวงมหาดไทย.docx')
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                📝 ใบสมัคร DOCX
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset('https://eicar.org/eicar-test-file.com', 'eicar_security_threat_test.pdf')
                }
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                ☣️ ทดสอบกักกันไวรัส (EICAR Threat)
              </button>
            </div>
          </div>
        </div>

        {/* Security Policy Panel (1 col) */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-xs text-white">นโยบายความปลอดภัยการดาวน์โหลด (Virus-Safe Rules)</h2>
          </div>

          <div className="space-y-2.5 text-[11px] text-slate-300">
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Magic Byte Verification:</strong> ตรวจสอบลายเซ็น Binary Header (%PDF-, \x89PNG, PK\x03\x04) เพื่อป้องกันการปลอมแปลงนามสกุลไฟล์
              </p>
            </div>

            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Active Quarantine Zone:</strong> แยกไฟล์ต้องสงสัยที่มีสคริปต์/มัลแวร์ไปเก็บไว้ใน <code className="text-rose-300">/tmp/doc_quarantine</code> โดยไม่ประมวลผลต่อ
              </p>
            </div>

            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">SHA-256 Hashing:</strong> สร้าง Cryptographic Hash ยืนยันความถูกต้องและความสมบูรณ์ของเอกสารทุกฉบับ
              </p>
            </div>

            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Automatic TTL Purge:</strong> ลบไฟล์ใน Sandbox Temp Storage โดยอัตโนมัติเมื่อครบกำหนด 2 ชั่วโมง
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downloaded Documents Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-xs text-white">
              ทะเบียนเอกสารดาวน์โหลดในระบบ ({documents.length} รายการ)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">ชื่อเอกสาร & Format</th>
                <th className="p-3">Magic Bytes & Format</th>
                <th className="p-3">ผลการสแกนความปลอดภัย</th>
                <th className="p-3">SHA-256 Checksum</th>
                <th className="p-3">ขนาดไฟล์</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {doc.metadata?.fileName || doc.id}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{doc.url}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px]">
                        {doc.metadata?.detectedFormat || 'UNKNOWN'}
                      </span>
                      {doc.metadata?.magicBytesHex && (
                        <span className="font-mono text-[10px] text-slate-500">
                          ({doc.metadata.magicBytesHex})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    {doc.securityScan?.status === 'CLEAN' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        CLEAN (VIRUS SAFE)
                      </span>
                    ) : doc.securityScan?.status === 'QUARANTINED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black animate-pulse">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        QUARANTINED (HAZARD)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {doc.status}
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-[10px] text-slate-500">
                    {doc.metadata?.sha256Hash ? (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.metadata.sha256Hash.substring(0, 16)}...
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="p-3 font-mono text-[11px]">
                    {doc.metadata?.fileSizeBytes ? `${Math.round(doc.metadata.fileSizeBytes / 1024)} KB` : '-'}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Metadata
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                        title="ลบออกจาก Temp Storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    ยังไม่มีเอกสารในคลังดาวน์โหลดชั่วคราว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Detail Modal / Inspector */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-xs text-white">
                  รายละเอียด Metadata และ Cryptographic Audit ({selectedDoc.id})
                </h2>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">ชื่อเอกสาร:</span>
                  <span className="font-bold text-blue-600">{selectedDoc.metadata?.fileName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">MIME Type:</span>
                  <span className="font-mono text-slate-600">{selectedDoc.metadata?.mimeType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Magic Bytes Hex:</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedDoc.metadata?.magicBytesHex}</span>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Cryptographic Checksums:</span>
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[10px] space-y-1.5 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>SHA-256: {selectedDoc.metadata?.sha256Hash}</span>
                    {selectedDoc.metadata?.sha256Hash && (
                      <button
                        onClick={() => handleCopyHash(selectedDoc.metadata!.sha256Hash)}
                        className="text-amber-400 hover:underline"
                      >
                        {copiedHash ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                      </button>
                    )}
                  </div>
                  <div>MD5: {selectedDoc.metadata?.md5Hash}</div>
                </div>
              </div>

              {/* Security Scan Analysis */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block">รายงานการตรวจสอบความปลอดภัย (Security Scan):</span>
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    selectedDoc.securityScan?.status === 'CLEAN'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{selectedDoc.securityScan?.securityNotes}</p>
                  {selectedDoc.securityScan?.threatsFound && selectedDoc.securityScan.threatsFound.length > 0 && (
                    <ul className="list-disc pl-4 mt-1 font-mono text-[11px]">
                      {selectedDoc.securityScan.threatsFound.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Extracted Text Snippet */}
              {selectedDoc.metadata?.textSnippet && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">ตัวอย่างข้อความในเอกสาร (Text Snippet Extracted):</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans leading-relaxed text-[11px]">
                    {selectedDoc.metadata.textSnippet}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Downloader Audit Logs Terminal */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-xs text-white">
              ประวัติการทำงานของ Downloader Engine (Audit Logs Streamer)
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
              <span className="text-slate-600 font-mono text-[10px]">{l.documentId}</span>
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
