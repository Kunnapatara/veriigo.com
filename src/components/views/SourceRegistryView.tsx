import React, { useEffect, useState } from 'react';
import {
  Server,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Play,
  Activity,
  Zap,
  Building,
  ShieldCheck,
  Code,
  FileText,
  Sliders,
  Check,
  X,
  Radio,
  BarChart2,
  Lock,
  Globe,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  RecruitmentSourceDoc,
  SourceCategory,
  SourcePriority,
  SourceHealthStatus,
  SourceType,
  CrawlFrequency,
  CrawlerSelectorConfig,
  AgencyMetadata,
} from '../../types/firestore';
import { RecruitmentSourceRepository } from '../../lib/firebase/repositories';
import { RecruitmentSourceSchema } from '../../lib/firebase/schemas';

const CATEGORY_MAP: Record<SourceCategory, { label: string; bg: string }> = {
  CENTRAL_MINISTRY: { label: 'กระทรวงหลัก', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  DEPARTMENT: { label: 'กรม / รัฐวิสาหกิจ', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  STATE_ENTERPRISE: { label: 'รัฐวิสาหกิจ', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  LOCAL_GOVT: { label: 'องค์กรปกครองส่วนท้องถิ่น', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  INDEPENDENT_AGENCY: { label: 'องค์กรอิสระ', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  EDUCATIONAL_INSTITUTE: { label: 'สถาบันการศึกษาภาครัฐ', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
};

const PRIORITY_MAP: Record<SourcePriority, { label: string; color: string }> = {
  CRITICAL: { label: 'CRITICAL (วิกฤต)', color: 'bg-rose-500 text-white' },
  HIGH: { label: 'HIGH (สูง)', color: 'bg-amber-500 text-white' },
  MEDIUM: { label: 'MEDIUM (ปานกลาง)', color: 'bg-blue-500 text-white' },
  LOW: { label: 'LOW (ทั่วไป)', color: 'bg-slate-500 text-white' },
};

const HEALTH_MAP: Record<SourceHealthStatus, { label: string; badge: string; icon: React.ElementType }> = {
  HEALTHY: { label: 'ปกติ (Healthy)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  DEGRADED: { label: 'ล่าช้า (Degraded)', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  OFFLINE: { label: 'ขัดข้อง (Offline)', badge: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  MAINTENANCE: { label: 'ปิดปรับปรุง', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Settings },
};

export const SourceRegistryView: React.FC = () => {
  const { role, getIdToken } = useAuth();
  const [sources, setSources] = useState<RecruitmentSourceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<RecruitmentSourceDoc | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'schedule' | 'agency' | 'selectors'>('basic');

  // Inspection Drawer
  const [inspectingSource, setInspectingSource] = useState<RecruitmentSourceDoc | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RecruitmentSourceDoc>>({
    name: '',
    baseUrl: '',
    scrapeTargetUrl: '',
    sourceType: 'GOVT_PORTAL',
    category: 'DEPARTMENT',
    priority: 'HIGH',
    healthStatus: 'HEALTHY',
    crawlFrequency: 'DAILY',
    cronExpression: '0 2 * * *',
    isActive: true,
    agencyMetadata: {
      ministry: '',
      department: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      rateLimitPerMin: 60,
    },
    selectors: {
      jobListContainerSelector: '',
      titleSelector: '',
      linkSelector: '',
      pdfLinkSelector: '',
      deadlineSelector: '',
      requiresJsRendering: false,
      autoExtractPdf: true,
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ type, msg });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Load Sources from Firestore Repository or REST Fallback
  const loadSources = async () => {
    setLoading(true);
    try {
      const repoSources = await RecruitmentSourceRepository.getAll();
      if (repoSources && repoSources.length > 0) {
        setSources(repoSources);
      } else {
        // REST Fallback from server initialization
        const res = await fetch('/api/sources');
        const json = await res.json();
        if (json.success && json.data) {
          setSources(json.data);
          // Seed to Firestore
          for (const s of json.data) {
            await RecruitmentSourceRepository.upsert(s).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Failed loading sources:', err);
      showNotice('ไม่สามารถโหลดข้อมูลแหล่งที่มาได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // Filter Logic
  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.agencyMetadata?.ministry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.agencyMetadata?.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesPriority = selectedPriority === 'ALL' || s.priority === selectedPriority;
    const matchesHealth = selectedHealth === 'ALL' || s.healthStatus === selectedHealth;
    const matchesActive =
      activeFilter === 'ALL' || (activeFilter === 'ACTIVE' && s.isActive) || (activeFilter === 'INACTIVE' && !s.isActive);

    return matchesSearch && matchesCategory && matchesPriority && matchesHealth && matchesActive;
  });

  // Calculate System Stats
  const totalSources = sources.length;
  const activeSources = sources.filter((s) => s.isActive).length;
  const healthyCount = sources.filter((s) => s.healthStatus === 'HEALTHY').length;
  const healthyPercent = totalSources > 0 ? Math.round((healthyCount / totalSources) * 100) : 100;
  const avgLatency =
    sources.length > 0
      ? Math.round(sources.reduce((acc, s) => acc + (s.lastLatencyMs || 150), 0) / sources.length)
      : 0;

  // Open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingSource(null);
    setFormData({
      id: `src-${Date.now()}`,
      name: '',
      baseUrl: 'https://',
      scrapeTargetUrl: 'https://',
      sourceType: 'GOVT_PORTAL',
      category: 'DEPARTMENT',
      priority: 'HIGH',
      healthStatus: 'HEALTHY',
      crawlFrequency: 'DAILY',
      cronExpression: '0 2 * * *',
      isActive: true,
      agencyMetadata: {
        ministry: '',
        department: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        rateLimitPerMin: 60,
      },
      selectors: {
        jobListContainerSelector: 'table tbody tr',
        titleSelector: 'td a',
        linkSelector: 'td a',
        pdfLinkSelector: 'a[href$=".pdf"]',
        deadlineSelector: 'td.deadline',
        requiresJsRendering: false,
        autoExtractPdf: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setFormErrors({});
    setValidationResult(null);
    setActiveModalTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (src: RecruitmentSourceDoc) => {
    setEditingSource(src);
    setFormData({ ...src });
    setFormErrors({});
    setValidationResult(null);
    setActiveModalTab('basic');
    setIsModalOpen(true);
  };

  // Test URL Validation on Server
  const handleTestUrlConnection = async () => {
    const targetUrl = formData.scrapeTargetUrl || formData.baseUrl;
    if (!targetUrl || targetUrl === 'https://') {
      setFormErrors((prev) => ({ ...prev, scrapeTargetUrl: 'กรุณาระบุ URL ที่ต้องการทดสอบ' }));
      return;
    }

    setValidatingUrl(true);
    setValidationResult(null);
    try {
      const res = await fetch('/api/sources/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          healthStatus: data.healthStatus as SourceHealthStatus,
          lastLatencyMs: data.latencyMs,
          lastResponseCode: data.statusCode,
        }));
      }
    } catch (err) {
      console.error('Validation test failed:', err);
    } finally {
      setValidatingUrl(false);
    }
  };

  // Save Source to Firestore
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const recordToSave: RecruitmentSourceDoc = {
      id: formData.id || `src-${Date.now()}`,
      name: formData.name || '',
      baseUrl: formData.baseUrl || '',
      scrapeTargetUrl: formData.scrapeTargetUrl || formData.baseUrl || '',
      sourceType: formData.sourceType || 'GOVT_PORTAL',
      category: formData.category || 'DEPARTMENT',
      priority: formData.priority || 'HIGH',
      healthStatus: formData.healthStatus || 'HEALTHY',
      crawlFrequency: formData.crawlFrequency || 'DAILY',
      cronExpression: formData.cronExpression || '0 2 * * *',
      isActive: formData.isActive ?? true,
      lastLatencyMs: formData.lastLatencyMs || 150,
      lastResponseCode: formData.lastResponseCode || 200,
      agencyMetadata: formData.agencyMetadata,
      selectors: formData.selectors,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Zod Runtime Validation
    const validation = RecruitmentSourceSchema.safeParse(recordToSave);
    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        formattedErrors[path] = issue.message;
      });
      setFormErrors(formattedErrors);
      showNotice('กรุณาตรวจสอบข้อมูลในแบบฟอร์มให้ถูกต้อง', 'error');
      return;
    }

    try {
      await RecruitmentSourceRepository.upsert(recordToSave);
      showNotice(`บันทึกข้อมูลแหล่งสืบค้น "${recordToSave.name}" สำเร็จแล้ว`);
      setIsModalOpen(false);
      loadSources();
    } catch (err) {
      console.error('Error saving source:', err);
      showNotice('เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าสู่ Firestore', 'error');
    }
  };

  // Delete Source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแหล่งสืบค้น "${name}" ออกจากระบบ?`)) return;

    try {
      await RecruitmentSourceRepository.delete(id);
      showNotice(`ลบแหล่งสืบค้น "${name}" สำเร็จแล้ว`);
      loadSources();
    } catch (err) {
      console.error('Error deleting source:', err);
      showNotice('ไม่สามารถลบแหล่งสืบค้นได้', 'error');
    }
  };

  // Trigger Manual Crawl
  const handleTriggerCrawl = async (src: RecruitmentSourceDoc) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/sources/${src.id}/trigger-crawl`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`ส่งคำสั่ง Manual Crawl สำหรับ ${src.name} เข้าสู่ Queue สำเร็จ`);
        // Update local status timestamp
        await RecruitmentSourceRepository.updateHealth(src.id, src.healthStatus, src.lastLatencyMs, 200);
        loadSources();
      }
    } catch (err) {
      console.error('Crawl dispatch failed:', err);
      showNotice('ไม่สามารถส่งคำสั่ง Crawl ได้', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Toast */}
      {actionNotice && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 transition-all border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
              : 'bg-rose-900 text-rose-200 border-rose-700'
          }`}
        >
          {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-2">
              <Server className="w-4 h-4 text-blue-400" />
              Sprint 4 Engine • Government Source Registry
            </div>
            <h1 className="text-2xl font-black text-white">ทะเบียนแหล่งข้อมูลสืบค้นงานราชการ</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ศูนย์รวมการลงทะเบียนแหล่งข้อมูลรับสมัครงาน (Scraper Registry), การตรวจสอบสถานะการเชื่อมต่อ (Health Check), กำหนดการสืบค้นอัตโนมัติ (Cron Scheduling) และการตั้งค่า Selectors สำหรับระบบ Crawler ในอนาคต
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSources}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              เพิ่มแหล่งสืบค้นใหม่ (Add Source)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold">แหล่งข้อมูลทั้งหมดในระบบ</p>
            <p className="text-lg font-black text-slate-800">{totalSources} แหล่งสืบค้น</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold">สถานะระบบพร้อมใช้งาน (Healthy)</p>
            <p className="text-lg font-black text-slate-800">{healthyPercent}% ({healthyCount}/{totalSources})</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold">ความเร็วตอบสนองเฉลี่ย (Latency)</p>
            <p className="text-lg font-black text-slate-800">{avgLatency} ms</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold">ฟีดที่เปิดสืบค้น (Active Feed)</p>
            <p className="text-lg font-black text-slate-800">{activeSources} ฟีดกำลังทำงาน</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแหล่งสืบค้น, กระทรวง, กรม หรือ URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">ทุกหมวดหมู่หน่วยงาน</option>
              {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">ทุกลำดับความสำคัญ</option>
              {Object.entries(PRIORITY_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">ทุกสถานะ Health</option>
              {Object.entries(HEALTH_MAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveFilter('INACTIVE')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === 'INACTIVE' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Source Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3.5">ชื่อแหล่งสืบค้น / กระทรวง</th>
                <th className="p-3.5">ประเภท & หมวดหมู่</th>
                <th className="p-3.5">Priority & Schedule</th>
                <th className="p-3.5">Health Status</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSources.map((src) => {
                const HealthIcon = HEALTH_MAP[src.healthStatus]?.icon || CheckCircle2;
                const healthInfo = HEALTH_MAP[src.healthStatus] || HEALTH_MAP.HEALTHY;
                const categoryInfo = CATEGORY_MAP[src.category] || CATEGORY_MAP.DEPARTMENT;
                const priorityInfo = PRIORITY_MAP[src.priority] || PRIORITY_MAP.HIGH;

                return (
                  <tr key={src.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Ministry */}
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{src.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {src.agencyMetadata?.ministry || 'หน่วยงานภาครัฐ'} • {src.agencyMetadata?.department || '-'}
                      </div>
                      <a
                        href={src.scrapeTargetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                      >
                        <Globe className="w-3 h-3 text-slate-400" />
                        {src.scrapeTargetUrl.replace('https://', '').slice(0, 32)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>

                    {/* Source Type & Category */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {src.sourceType}
                        </span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryInfo.bg}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority & Schedule */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${priorityInfo.color}`}>
                          {src.priority}
                        </span>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {src.crawlFrequency}
                        </div>
                      </div>
                    </td>

                    {/* Health Status */}
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${healthInfo.badge}`}>
                        <HealthIcon className="w-3.5 h-3.5" />
                        {healthInfo.label}
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-700">
                      {src.lastLatencyMs ? `${src.lastLatencyMs} ms` : '150 ms'}
                    </td>

                    {/* Active Status */}
                    <td className="p-3.5">
                      {src.isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded font-bold text-[10px]">
                          OFFLINE
                        </span>
                      )}
                    </td>

                    {/* Action Controls */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTriggerCrawl(src)}
                          title="สั่งการ Crawlers ประมวลผลทันที"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setInspectingSource(src)}
                          title="ดูการตั้งค่า Selector & Metadata"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(src)}
                          title="แก้ไขการตั้งค่า"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSource(src.id, src.name)}
                          title="ลบแหล่งสืบค้น"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSources.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    ไม่พบข้อมูลแหล่งสืบค้นตรงตามเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingSource ? 'แก้ไขการตั้งค่าแหล่งสืบค้น' : 'เพิ่มแหล่งข้อมูลสืบค้นใหม่ (Add Government Source)'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('basic')}
                className={`pb-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'basic'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. ข้อมูลทั่วไป (Basic)
              </button>
              <button
                onClick={() => setActiveModalTab('schedule')}
                className={`pb-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'schedule'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Scheduling & Priority
              </button>
              <button
                onClick={() => setActiveModalTab('agency')}
                className={`pb-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'agency'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Agency Metadata
              </button>
              <button
                onClick={() => setActiveModalTab('selectors')}
                className={`pb-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'selectors'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Crawler Selectors
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSource} className="p-6 space-y-4 text-xs">
              {/* TAB 1: BASIC INFO */}
              {activeModalTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ชื่อแหล่งสืบค้น (Source Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สำนักงาน ก.พ. (OCSC Job Portal)"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        URL เว็บไซต์หลัก (Base URL) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://job.ocsc.go.th"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        URL หน้าสืบค้นงาน (Scrape Target URL) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://job.ocsc.go.th/Main/GOVExam.aspx"
                        value={formData.scrapeTargetUrl}
                        onChange={(e) => setFormData((prev) => ({ ...prev, scrapeTargetUrl: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ประเภทแหล่งข้อมูล (Source Type)</label>
                      <select
                        value={formData.sourceType}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sourceType: e.target.value as SourceType }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="GOVT_PORTAL">GOVT_PORTAL (พอร์ทัลกลาง)</option>
                        <option value="AGENCY_WEBSITE">AGENCY_WEBSITE (เว็บหน่วยงาน)</option>
                        <option value="RSS_FEED">RSS_FEED (ฟีด RSS)</option>
                        <option value="PDF_ANNOUNCEMENT">PDF_ANNOUNCEMENT (ประกาศ PDF)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">หมวดหมู่หน่วยงาน (Category)</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as SourceCategory }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* URL Health Validator Box */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        ทดสอบการเชื่อมต่อ URL (Live Health Ping)
                      </span>
                      <button
                        type="button"
                        onClick={handleTestUrlConnection}
                        disabled={validatingUrl}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                      >
                        <RefreshCw className={`w-3 h-3 ${validatingUrl ? 'animate-spin' : ''}`} />
                        ทดสอบสัญญาณ URL
                      </button>
                    </div>

                    {validationResult && (
                      <div className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono border border-slate-800 space-y-1">
                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Status: {validationResult.statusCode} ({validationResult.statusText})</span>
                        </div>
                        <div className="text-slate-300">Latency: {validationResult.latencyMs} ms • Content-Type: {validationResult.contentType}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULING & PRIORITY */}
              {activeModalTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ระดับความสำคัญการสืบค้น (Priority)</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as SourcePriority }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="CRITICAL">CRITICAL (วิกฤต - ทุกชั่วโมง)</option>
                        <option value="HIGH">HIGH (สูง - วันละหลายครั้ง)</option>
                        <option value="MEDIUM">MEDIUM (ปานกลาง - วันละ 1 ครั้ง)</option>
                        <option value="LOW">LOW (ทั่วไป - สัปดาห์ละครั้ง)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ความถี่ในการสืบค้น (Crawl Frequency)</label>
                      <select
                        value={formData.crawlFrequency}
                        onChange={(e) => setFormData((prev) => ({ ...prev, crawlFrequency: e.target.value as CrawlFrequency }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="HOURLY">HOURLY (ทุกชั่วโมง)</option>
                        <option value="EVERY_6_HOURS">EVERY_6_HOURS (ทุก 6 ชั่วโมง)</option>
                        <option value="EVERY_12_HOURS">EVERY_12_HOURS (ทุก 12 ชั่วโมง)</option>
                        <option value="DAILY">DAILY (วันละ 1 ครั้ง)</option>
                        <option value="WEEKLY">WEEKLY (สัปดาห์ละ 1 ครั้ง)</option>
                        <option value="CUSTOM_CRON">CUSTOM_CRON (กำหนด Cron เอง)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cron Schedule Expression</label>
                    <input
                      type="text"
                      placeholder="0 */6 * * *"
                      value={formData.cronExpression}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">รูปแบบมาตรฐาน 5 ฟิลด์ (Minute, Hour, Day of Month, Month, Day of Week)</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">สถานะเปิดใช้งานฟีดสืบค้น (Active Status)</p>
                      <p className="text-[11px] text-slate-500">หากปิดการใช้งาน ระบบ Background Crawler จะข้ามการดึงข้อมูลจากแหล่งนี้</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: AGENCY METADATA */}
              {activeModalTab === 'agency' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ชื่อกระทรวง (Ministry)</label>
                      <input
                        type="text"
                        placeholder="กระทรวงมหาดไทย"
                        value={formData.agencyMetadata?.ministry || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            agencyMetadata: { ...(prev.agencyMetadata || {}), ministry: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">กรม / กอง (Department)</label>
                      <input
                        type="text"
                        placeholder="สำนักงานปลัดกระทรวงมหาดไทย"
                        value={formData.agencyMetadata?.department || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            agencyMetadata: { ...(prev.agencyMetadata || {}), department: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ผู้ประสานงาน (Contact Person)</label>
                      <input
                        type="text"
                        placeholder="ศูนย์บริการข้อมูลเจ้าหน้าที่"
                        value={formData.agencyMetadata?.contactPerson || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            agencyMetadata: { ...(prev.agencyMetadata || {}), contactPerson: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">อีเมลติดต่อ (Contact Email)</label>
                      <input
                        type="email"
                        placeholder="contact@agency.go.th"
                        value={formData.agencyMetadata?.contactEmail || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            agencyMetadata: { ...(prev.agencyMetadata || {}), contactEmail: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rate Limit (คำขอสูงสุดต่อนาที)</label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      value={formData.agencyMetadata?.rateLimitPerMin || 60}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          agencyMetadata: { ...(prev.agencyMetadata || {}), rateLimitPerMin: Number(e.target.value) },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CRAWLER SELECTORS */}
              {activeModalTab === 'selectors' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                    <Code className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>การตั้งค่า CSS/XPath Selectors สำหรับรองรับการขยายระบบ Crawler อัตโนมัติในอนาคต</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">List Container Selector</label>
                      <input
                        type="text"
                        placeholder="table#gvExamList tbody tr"
                        value={formData.selectors?.jobListContainerSelector || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), jobListContainerSelector: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Title Selector</label>
                      <input
                        type="text"
                        placeholder="td.title a"
                        value={formData.selectors?.titleSelector || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), titleSelector: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PDF Link Selector</label>
                      <input
                        type="text"
                        placeholder="a.pdf-link"
                        value={formData.selectors?.pdfLinkSelector || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), pdfLinkSelector: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Deadline Selector</label>
                      <input
                        type="text"
                        placeholder="td.deadline"
                        value={formData.selectors?.deadlineSelector || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), deadlineSelector: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectors?.requiresJsRendering || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), requiresJsRendering: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>ต้องประมวลผล JavaScript (Headless Browser)</span>
                    </label>

                    <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectors?.autoExtractPdf ?? true}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            selectors: { ...(prev.selectors || {}), autoExtractPdf: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>ถอดรหัสประกาศ PDF อัตโนมัติด้วย AI OCR</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  บันทึกข้อมูลแหล่งสืบค้น
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspector Drawer */}
      {inspectingSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 text-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto border-l border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Crawler Selector Inspector
              </h3>
              <button onClick={() => setInspectingSource(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold">ชื่อแหล่งสืบค้น:</p>
                <p className="font-bold text-white text-sm">{inspectingSource.name}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold">Target URL:</p>
                <p className="font-mono text-blue-300 break-all">{inspectingSource.scrapeTargetUrl}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                <p className="text-amber-400 font-bold">// Registered Selectors:</p>
                <p><span className="text-slate-500">container:</span> {inspectingSource.selectors?.jobListContainerSelector || 'n/a'}</p>
                <p><span className="text-slate-500">title:</span> {inspectingSource.selectors?.titleSelector || 'n/a'}</p>
                <p><span className="text-slate-500">link:</span> {inspectingSource.selectors?.linkSelector || 'n/a'}</p>
                <p><span className="text-slate-500">pdf:</span> {inspectingSource.selectors?.pdfLinkSelector || 'n/a'}</p>
                <p><span className="text-slate-500">jsRendering:</span> {inspectingSource.selectors?.requiresJsRendering ? 'true' : 'false'}</p>
                <p><span className="text-slate-500">autoExtractPdf:</span> {inspectingSource.selectors?.autoExtractPdf ? 'true' : 'false'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                <p className="text-emerald-400 font-bold">// Agency Metadata:</p>
                <p><span className="text-slate-500">ministry:</span> {inspectingSource.agencyMetadata?.ministry || 'n/a'}</p>
                <p><span className="text-slate-500">department:</span> {inspectingSource.agencyMetadata?.department || 'n/a'}</p>
                <p><span className="text-slate-500">contactPerson:</span> {inspectingSource.agencyMetadata?.contactPerson || 'n/a'}</p>
                <p><span className="text-slate-500">email:</span> {inspectingSource.agencyMetadata?.contactEmail || 'n/a'}</p>
                <p><span className="text-slate-500">rateLimit:</span> {inspectingSource.agencyMetadata?.rateLimitPerMin || 60} req/min</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
