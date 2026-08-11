import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Server,
  Activity,
  Database,
  Users,
  RefreshCw,
  Key,
  Shield,
  FileCheck,
  Building,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit3,
  Plus,
  Search,
  Filter,
  Cpu,
  BrainCircuit,
  BarChart3,
  Eye,
  Check,
  X,
  UserCheck,
  UserX,
  Crown,
  Clock,
  Sparkles,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AdminTab = 'stats' | 'crawler' | 'extraction-logs' | 'failed-jobs' | 'verification' | 'sources' | 'users';

interface SystemStats {
  totalUsers: number;
  usersByRole: { USER: number; AGENCY: number; ADMIN: number };
  usersByTier: { FREE: number; PRO: number; PRO_MAX_ENTERPRISE: number };
  activeJobsCount: number;
  pendingVerificationCount: number;
  failedJobsCount: number;
  activeCrawlers: number;
  totalCrawledToday: number;
  aiExtractionsTotal: number;
  aiAccuracyRate: number;
  crawlerUptime: number;
  systemHealth: string;
  jobsByMinistry: { ministry: string; count: number }[];
  dailyCrawlHistory: { date: string; crawledCount: number; extractedCount: number; failedCount: number }[];
}

interface FailedJob {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  agencyName: string;
  ministry: string;
  errorType: string;
  errorMessage: string;
  rawSnippet: string;
  failedAt: string;
  attempts: number;
  status: string;
}

interface VerificationJob {
  id: string;
  title: string;
  agencyName: string;
  agencyCode: string;
  ministry: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  province: string;
  positionType: string;
  vacanciesCount: number;
  ocscLevelRequired: string;
  degreeRequired: string[];
  majorsAllowed: string[];
  requirementsText: string;
  applicationUrl: string;
  deadline: string;
  examDate: string;
  confidenceScore: number;
  flaggedReason: string;
  scrapedAt: string;
  sourceName: string;
  status: string;
}

interface SourceItem {
  id: string;
  name: string;
  agencyId: string;
  baseUrl: string;
  scrapeTargetUrl: string;
  sourceType: string;
  category: string;
  priority: string;
  healthStatus: string;
  crawlFrequency: string;
  isActive: boolean;
  lastCrawledAt: string;
  lastCrawlStatus: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'AGENCY' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  tier: 'FREE' | 'PRO' | 'PRO_MAX_ENTERPRISE';
  ocscPassed: boolean;
  ocscLevel: string;
  agencyName: string;
  createdAt: string;
  lastActive: string;
}

export const AdminPortalView: React.FC = () => {
  const { role, getIdToken, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats Data
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Failed Jobs Data
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);

  // Verification Queue Data
  const [verificationQueue, setVerificationQueue] = useState<VerificationJob[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [editingJob, setEditingJob] = useState<VerificationJob | null>(null);

  // Sources Data
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [newSourceData, setNewSourceData] = useState({
    name: '',
    baseUrl: '',
    sourceType: 'AGENCY_WEBSITE',
    ministry: 'กระทรวงมหาดไทย',
    priority: 'HIGH',
    crawlFrequency: 'DAILY',
  });

  // Users Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Extraction Logs Data
  const [extractionLogs, setExtractionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Crawler Stats Data
  const [crawlerQueueState, setCrawlerQueueState] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetching methods
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/system-stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFailedJobs = async () => {
    setLoadingFailed(true);
    try {
      const res = await fetch('/api/admin/failed-jobs');
      const data = await res.json();
      if (data.success) setFailedJobs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFailed(false);
    }
  };

  const fetchVerificationQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/admin/verification-queue');
      const data = await res.json();
      if (data.success) setVerificationQueue(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch('/api/admin/sources');
      const data = await res.json();
      if (data.success) setSources(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSources(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchExtractionLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/extractor/logs?limit=50');
      const data = await res.json();
      if (data.success) setExtractionLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchCrawlerQueue = async () => {
    try {
      const res = await fetch('/api/crawler/queue');
      const data = await res.json();
      if (data.success) setCrawlerQueueState(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFailedJobs();
    fetchVerificationQueue();
    fetchSources();
    fetchUsers();
    fetchExtractionLogs();
    fetchCrawlerQueue();
  }, []);

  // Action handlers

  // Failed Jobs actions
  const handleRetryFailedJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/failed-jobs/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchFailedJobs();
        fetchVerificationQueue();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissFailedJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/failed-jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchFailedJobs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verification queue actions
  const handleApproveJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/verification-queue/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVerificationQueue();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/verification-queue/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'ไม่อนุมัติโดยเจ้าหน้าที่ตรวจสอบ' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVerificationQueue();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditedJob = async () => {
    if (!editingJob) return;
    try {
      const res = await fetch(`/api/admin/verification-queue/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJob),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditingJob(null);
        fetchVerificationQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sources actions
  const handleToggleSourceActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sources/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchSources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSource = async () => {
    if (!newSourceData.name || !newSourceData.baseUrl) {
      alert('กรุณากรอกชื่อหน่วยงานและ URL ตั้งต้น');
      return;
    }
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSourceData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsAddSourceModalOpen(false);
        setNewSourceData({
          name: '',
          baseUrl: '',
          sourceType: 'AGENCY_WEBSITE',
          ministry: 'กระทรวงมหาดไทย',
          priority: 'HIGH',
          crawlFrequency: 'DAILY',
        });
        fetchSources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแหล่งข้อมูลสืบค้นนี้?')) return;
    try {
      const res = await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchSources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Users actions
  const handleChangeUserRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUserStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUserTier = async (id: string, tier: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('ยืนยันลบบัญชีผู้ใช้งานนี้ออกจากระบบ?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.agencyName.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              VERIIGO Production Ready Admin System (Sprint 11)
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              ศูนย์ควบคุมระบบสืบค้นและบริหารจัดการภาครัฐ
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              ควบคุมการทำงาน Crawler Monitor, ตรวจสอบ Extraction Logs, จัดการ Failed Jobs, ยืนยันประกาศงาน (Manual Verification), จัดการแหล่งข้อมูล และสิทธิ์ผู้ใช้งาน (RBAC User Management)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => switchRole(role === 'ADMIN' ? 'AGENCY' : 'ADMIN')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              สลับสิทธิ์การทำงาน ({role})
            </button>
            <button
              onClick={() => {
                fetchStats();
                fetchFailedJobs();
                fetchVerificationQueue();
                fetchSources();
                fetchUsers();
                fetchExtractionLogs();
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="รีเฟรชข้อมูลทั้งหมด"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80">
          {[
            { id: 'stats', label: 'ภาพรวม & สถิติ', icon: BarChart3, badge: null },
            { id: 'crawler', label: 'Crawler Monitor', icon: Cpu, badge: stats?.activeCrawlers || 6 },
            { id: 'extraction-logs', label: 'Extraction Logs', icon: BrainCircuit, badge: null },
            { id: 'failed-jobs', label: 'Failed Jobs', icon: AlertTriangle, badge: stats?.failedJobsCount || 0, badgeColor: 'bg-rose-500' },
            { id: 'verification', label: 'Manual Verification', icon: CheckCircle, badge: stats?.pendingVerificationCount || 0, badgeColor: 'bg-amber-500' },
            { id: 'sources', label: 'Source Management', icon: Server, badge: sources.length },
            { id: 'users', label: 'User Management', icon: Users, badge: users.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      tab.badgeColor ? `${tab.badgeColor} text-white` : isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STATISTICS & SYSTEM HEALTH */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">ผู้ใช้งานในระบบทั้งหมด</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUsers.toLocaleString() || '1,420'} คน</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> PRO Member: {stats?.usersByTier?.PRO || 450} คน
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">ประกาศรับสมัคร Active</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.activeJobsCount || 48} ตำแหน่ง</p>
                <p className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> รอการยืนยัน: {stats?.pendingVerificationCount || 0} รายการ
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">AI Extractions Success</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.aiExtractionsTotal || 890} ครั้ง</p>
                <p className="text-[11px] text-purple-600 font-bold mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Accuracy: {stats?.aiAccuracyRate || 98.4}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">Crawler System Health</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.crawlerUptime || 99.9}% Uptime</p>
                <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Failed Jobs: {stats?.failedJobsCount || 0} รายการ
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Ministry Breakdown & Daily Crawl Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ministry Job Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                สัดส่วนจำแนกตำแหน่งงานตามกระทรวง / หน่วยงานหลัก
              </h3>
              <div className="space-y-3">
                {stats?.jobsByMinistry?.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{m.ministry}</span>
                      <span className="text-slate-900 font-bold">{m.count} ประกาศ</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (m.count / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Crawl History Trend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                ปริมาณการสืบค้นและสกัดข้อมูลย้อนหลัง 7 วัน (Daily Crawled Trend)
              </h3>
              <div className="space-y-3">
                {stats?.dailyCrawlHistory?.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-14 font-bold text-slate-600">{d.date}</span>
                    <div className="flex-1 flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div className="bg-blue-600 h-2" style={{ width: `${(d.extractedCount / d.crawledCount) * 100}%` }} />
                        <div className="bg-rose-500 h-2" style={{ width: `${(d.failedCount / d.crawledCount) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{d.crawledCount} สกัดได้ ({d.extractedCount})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRAWLER MONITOR */}
      {activeTab === 'crawler' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Crawler Live Worker Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  ระบบเฝ้าระวัง Worker Engine & Task Queue Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สถานะการทำงานของ Background Scrapers, Memory Consumption, และ Task Execution Registry
                </p>
              </div>

              <button
                onClick={fetchCrawlerQueue}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                อัปเดตสแนปชอต
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500">Worker Status</p>
                <p className="text-base font-black text-emerald-600 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {crawlerQueueState?.workerRunning ? 'RUNNING (ACTIVE)' : 'IDLE / READY'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500">Pending Tasks in Queue</p>
                <p className="text-base font-black text-slate-900 mt-1">
                  {crawlerQueueState?.queueLength || 0} แหล่งข้อมูลรอสืบค้น
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500">Finished Execution Count</p>
                <p className="text-base font-black text-blue-600 mt-1">
                  {crawlerQueueState?.completedHistoryCount || 0} รายการ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXTRACTION LOGS */}
      {activeTab === 'extraction-logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                ประวัติการสกัดข้อมูลประกาศด้วย Gemini AI Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึก Token Usage, Latency (ms), Confidence Score, และสถานะการแปลงเนื้อหา PDF/HTML
              </p>
            </div>

            <button
              onClick={fetchExtractionLogs}
              disabled={loadingLogs}
              className="text-xs text-purple-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              รีเฟรช Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">Log ID / Timestamp</th>
                  <th className="p-3">โมเดล AI</th>
                  <th className="p-3">ประเภทข้อมูล</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">ระยะเวลา</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {extractionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-800">
                      <div>{log.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{new Date(log.extractedAt || log.timestamp || Date.now()).toLocaleString('th-TH')}</div>
                    </td>
                    <td className="p-3 font-medium">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-semibold text-[10px]">
                        {log.modelUsed || 'gemini-2.5-flash'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{log.sourceType || 'PDF_DOCUMENT'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {log.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{log.latencyMs || 840} ms</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> ดู JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FAILED JOBS */}
      {activeTab === 'failed-jobs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                รายการสกัดข้อมูลที่เกิดข้อผิดพลาด (Failed Extraction Jobs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ประกาศรับสมัครงานที่ติดปัญหาการถอดรหัส PDF, สแกนไม่พบฟิลด์, หรือเปลี่ยนโครงสร้าง HTML
              </p>
            </div>

            <button
              onClick={fetchFailedJobs}
              disabled={loadingFailed}
              className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFailed ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>

          {failedJobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">ไม่มีรายการล้มเหลวในขณะนี้</p>
              <p className="text-xs text-slate-500">ระบบ Crawler และ Gemini AI ทำงานเรียบร้อยแบบ 100%</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedJobs.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                        {item.errorType}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{item.sourceName}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title} ({item.agencyName})</h4>
                    <p className="text-xs text-rose-700 font-medium">{item.errorMessage}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ล้มเหลวเมื่อ: {new Date(item.failedAt).toLocaleString('th-TH')} • ลองแล้ว {item.attempts} ครั้ง
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRetryFailedJob(item.id)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      ลองประมวลผลซ้ำ (Retry)
                    </button>
                    <button
                      onClick={() => handleDismissFailedJob(item.id)}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      ละเว้น (Dismiss)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MANUAL VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500" />
                คิวตรวจสอบความถูกต้องประกาศก่อนเผยแพร่ (Manual Verification Queue)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบความถูกต้องของอัตราเงินเดือน, วุฒิการศึกษา, และกำหนดวันสอบ ก่อนนำขึ้นแสดงในระบบค้นหาหลัก
              </p>
            </div>

            <button
              onClick={fetchVerificationQueue}
              disabled={loadingQueue}
              className="text-xs text-amber-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">ไม่มีรายการค้างในคิวตรวจสอบ</p>
              <p className="text-xs text-slate-500">ประกาศรับสมัครงานทั้งหมดได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้ว</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verificationQueue.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200/50 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          Confidence Score: {item.confidenceScore}%
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{item.sourceName}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                      <p className="text-xs font-bold text-blue-700">{item.agencyName} • {item.ministry}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingJob(item)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        แก้ไขข้อมูล
                      </button>
                      <button
                        onClick={() => handleApproveJob(item.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        อนุมัติ & เผยแพร่
                      </button>
                      <button
                        onClick={() => handleRejectJob(item.id)}
                        className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        ปฏิเสธ
                      </button>
                    </div>
                  </div>

                  {/* Flagged Reason Box */}
                  <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>สาเหตุที่ต้องตรวจสอบ:</strong> {item.flaggedReason}</span>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 font-semibold block">อัตราเงินเดือน</span>
                      <span className="font-bold text-slate-800">{(item.salaryMin ?? 0).toLocaleString()} - {(item.salaryMax ?? 0).toLocaleString()} บาท</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">จำนวนอัตรา</span>
                      <span className="font-bold text-slate-800">{item.vacanciesCount ?? 1} อัตรา</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">วุฒิที่ต้องการ</span>
                      <span className="font-bold text-slate-800">
                        {Array.isArray(item.degreeRequired) ? item.degreeRequired.join(', ') : (item.degreeRequired || 'ปริญญาตรี')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">ปิดรับสมัคร</span>
                      <span className="font-bold text-rose-600">{new Date(item.deadline).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SOURCE MANAGEMENT */}
      {activeTab === 'sources' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                จัดการแหล่งข้อมูลสืบค้นและเว็บไซต์หน่วยงานราชการ (Source Management)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เพิ่ม ปรับเปลี่ยนสถานะ หรือปรับความถี่การสืบค้นข้อมูลจากพอร์ทัลภาครัฐ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddSourceModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                เพิ่มแหล่งข้อมูลใหม่
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ชื่อหน่วยงาน / Portal</th>
                  <th className="p-3">ประเภท & กระทรวง</th>
                  <th className="p-3">ความถี่</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{src.name}</div>
                      <a href={src.baseUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                        {src.baseUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                        {src.sourceType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{src.crawlFrequency}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleSourceActive(src.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          src.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {src.isActive ? '🟢 เปิดใช้งาน' : '⚪ ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                        title="ลบแหล่งข้อมูล"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                การจัดการผู้ใช้งานและสิทธิ์เข้าถึง (RBAC User Management)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดบทบาท (USER, AGENCY, ADMIN), ปรับระดับสมาชิก (SaaS Tier), และควบคุมสถานะบัญชี
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรืออีเมล..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">ทุกบทบาท (ALL Roles)</option>
                <option value="USER">ผู้สมัครสอบ (USER)</option>
                <option value="AGENCY">เจ้าหน้าที่หน่วยงาน (AGENCY)</option>
                <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ชื่อ - นามสกุล / อีเมล</th>
                  <th className="p-3">สังกัด / หน่วยงาน</th>
                  <th className="p-3">บทบาท (RBAC Role)</th>
                  <th className="p-3">ระดับสมาชิก</th>
                  <th className="p-3">สถานะบัญชี</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-600">{u.agencyName}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                        className={`px-2 py-1 rounded font-bold text-[10px] focus:outline-none ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'AGENCY' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="USER">USER (ผู้สมัคร)</option>
                        <option value="AGENCY">AGENCY (เจ้าหน้าที่)</option>
                        <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.tier}
                        onChange={(e) => handleChangeUserTier(u.id, e.target.value)}
                        className="px-2 py-1 rounded bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 focus:outline-none"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="PRO_MAX_ENTERPRISE">PRO MAX ENTERPRISE</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleChangeUserStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? '🟢 ใช้งานปกติ' : '🔴 ถูกระงับ'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                        title="ลบบัญชีผู้ใช้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VERIFICATION JOB */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                แก้ไขข้อมูลประกาศรับสมัครก่อนเผยแพร่
              </h3>
              <button onClick={() => setEditingJob(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อตำแหน่งงาน</label>
                <input
                  type="text"
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เงินเดือนเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    value={editingJob.salaryMin}
                    onChange={(e) => setEditingJob({ ...editingJob, salaryMin: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">จำนวนอัตราที่รับ</label>
                  <input
                    type="number"
                    value={editingJob.vacanciesCount}
                    onChange={(e) => setEditingJob({ ...editingJob, vacanciesCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">รายละเอียดคุณสมบัติเพิ่มเติม</label>
                <textarea
                  rows={3}
                  value={editingJob.requirementsText}
                  onChange={(e) => setEditingJob({ ...editingJob, requirementsText: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingJob(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEditedJob}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SOURCE */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                เพิ่มแหล่งข้อมูลสืบค้นราชการใหม่
              </h3>
              <button onClick={() => setIsAddSourceModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อหน่วยงาน / เว็บไซต์</label>
                <input
                  type="text"
                  placeholder="เช่น กรมทางหลวงชนบท"
                  value={newSourceData.name}
                  onChange={(e) => setNewSourceData({ ...newSourceData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL เว็บไซต์หลัก</label>
                <input
                  type="text"
                  placeholder="https://drr.job.thai.com"
                  value={newSourceData.baseUrl}
                  onChange={(e) => setNewSourceData({ ...newSourceData, baseUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">สังกัดกระทรวง</label>
                  <input
                    type="text"
                    value={newSourceData.ministry}
                    onChange={(e) => setNewSourceData({ ...newSourceData, ministry: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ความถี่ในการสืบค้น</label>
                  <select
                    value={newSourceData.crawlFrequency}
                    onChange={(e) => setNewSourceData({ ...newSourceData, crawlFrequency: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                  >
                    <option value="HOURLY">ทุกๆ 1 ชั่วโมง</option>
                    <option value="EVERY_6_HOURS">ทุกๆ 6 ชั่วโมง</option>
                    <option value="DAILY">วันละ 1 ครั้ง (Daily)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddSourceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateSource}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                เพิ่มแหล่งข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EXTRACTION LOG JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-800 space-y-4 font-mono text-xs animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Log Details JSON: {selectedLog.id}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-800 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-emerald-300 max-h-96">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl font-sans"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
