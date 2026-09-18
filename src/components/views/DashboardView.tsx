import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Briefcase,
  Bookmark,
  Search,
  Bell,
  User,
  Crown,
  CheckCircle,
  Clock,
  Building2,
  Calendar as CalendarIcon,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  Trash2,
  ExternalLink,
  Zap,
  ArrowUpRight,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Award,
  Layers,
  GraduationCap,
  Target,
  FileText,
  Activity,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AIMatchRing } from '../AIMatchRing';
import { JobListing, SavedJobItem, RecentSearchItem, NotificationItem, UserSubscription } from '../../types';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { DashboardSkeleton } from '../common/Skeleton';
import { DashboardAnalyticsCharts } from '../dashboard/DashboardAnalyticsCharts';

interface DashboardViewProps {
  onNavigate: (tab: string, params?: any) => void;
  onSelectJob: (job: JobListing) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectJob,
}) => {
  const { profile } = useAuth();

  // Data states
  const [recommendedJobs, setRecommendedJobs] = useState<JobListing[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  const [loading, setLoading] = useState(true);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Fetch all user dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [jobsRes, savedRes, searchRes, notifRes, subRes] = await Promise.all([
        fetch('/api/jobs?limit=5'),
        fetch('/api/user/saved-jobs'),
        fetch('/api/user/recent-searches'),
        fetch('/api/user/notifications'),
        fetch('/api/user/subscription'),
      ]);

      const [jobsData, savedData, searchData, notifData, subData] = await Promise.all([
        jobsRes.json(),
        savedRes.json(),
        searchRes.json(),
        notifRes.json(),
        subRes.json(),
      ]);

      if (jobsData.success) setRecommendedJobs(jobsData.data || []);
      if (savedData.success) setSavedJobs(savedData.data || []);
      if (searchData.success) setRecentSearches(searchData.data || []);
      if (notifData.success) setNotifications(notifData.data || []);
      if (subData.success) setSubscription(subData.data || null);
    } catch (err) {
      console.error('Error fetching User Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Remove saved job
  const handleRemoveSavedJob = async (savedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/user/saved-jobs/${savedId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedJobs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to remove saved job:', err);
    }
  };

  // Clear recent searches
  const handleClearSearches = async () => {
    try {
      const res = await fetch('/api/user/recent-searches', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setRecentSearches([]);
    } catch (err) {
      console.error('Failed to clear searches:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkNotifsRead = async () => {
    try {
      const res = await fetch('/api/user/notifications/all/read', { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  // Upgrade Plan
  const handleUpgradePlan = async (tier: 'PRO' | 'PRO_MAX_ENTERPRISE') => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/user/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setShowUpgradeModal(false);
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;
  const readinessScore = profile?.careerReadinessScore || 85;
  const filteredNotifs = (notifications || []).filter((n) => (notifFilter === 'UNREAD' ? !n.isRead : true));

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Task 9: Upgrade Dashboard Hero Section */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900/90 via-[#111827]/95 to-[#0B1220]/90 border border-white/12 p-6 lg:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Enterprise Intelligence Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">VERIIGO v2.5 Active</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              ยินดีต้อนรับ, <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">{profile?.firstName || 'สมชาย'} {profile?.lastName || 'การดี'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              ภาพรวมแดชบอร์ดส่วนบุคคล: ติดตามตำแหน่งงานที่บันทึกไว้ (<AnimatedCounter value={(savedJobs || []).length} />), 
              การวิเคราะห์ความพร้อม AI, ประกาศวันสอบ และสิทธิ์ใช้งานระดับ{' '}
              <strong className="text-amber-300 font-bold">{subscription?.planName || 'SaaS Pro Candidate'}</strong>
            </p>

            {/* Profile Badges & Quick Highlights */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-white/[0.06] border border-white/12 px-3.5 py-1.5 rounded-xl text-slate-200 flex items-center gap-2 font-medium backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> สอบผ่าน ภาค ก. ระดับ 3 (ป.ตรี)
              </span>
              <span className="bg-white/[0.06] border border-white/12 px-3.5 py-1.5 rounded-xl text-slate-200 flex items-center gap-2 font-medium backdrop-blur-md">
                <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" /> วุฒิ{profile?.education?.[0]?.degree || 'ปริญญาตรี'} ({profile?.education?.[0]?.fieldOfStudy || 'รัฐประศาสนศาสตร์'})
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2 font-bold animate-pulse backdrop-blur-md">
                  <Bell className="w-3.5 h-3.5 text-rose-400" /> มีการแจ้งเตือนใหม่ <AnimatedCounter value={unreadCount} /> รายการ
                </span>
              )}
            </div>

            {/* Quick Actions Buttons */}
            <div className="pt-3 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('jobs')}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                ค้นหาตำแหน่งงานทันที
              </button>
              <button
                onClick={() => onNavigate('checker')}
                className="px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 border border-white/15 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                เช็กสิทธิ์สอบ ก.พ.
              </button>
            </div>
          </div>

          {/* AI Career Readiness Metric Box */}
          <div className="bg-white/[0.06] border border-white/15 p-6 rounded-2xl flex items-center gap-6 shadow-2xl min-w-[300px] w-full lg:w-auto backdrop-blur-2xl">
            <AIMatchRing score={readinessScore} size="lg" showLabel={false} />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                Career Health Index
              </span>
              <h3 className="text-3xl font-black text-white mt-1">
                <AnimatedCounter value={readinessScore} suffix=" / 100" />
              </h3>
              <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> พร้อมสมัครสอบ ภาค ข.
              </p>
              <button
                onClick={() => onNavigate('profile')}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                จัดการโปรไฟล์ & วุฒิการศึกษา <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Task 5: Animated KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Career Readiness */}
        <motion.div whileHover={{ y: -3, scale: 1.015 }} className="veriigo-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Career Health</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              <AnimatedCounter value={readinessScore} suffix=" %" />
            </h3>
            <p className="text-[11px] text-emerald-400 font-semibold">ระดับความพร้อมสูงกว่าเฉลี่ย 18%</p>
          </div>
        </motion.div>

        {/* KPI 2: Saved Jobs */}
        <motion.div whileHover={{ y: -3, scale: 1.015 }} className="veriigo-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Jobs</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              <AnimatedCounter value={(savedJobs || []).length} suffix=" ตำแหน่ง" />
            </h3>
            <p className="text-[11px] text-slate-400">บันทึกไว้สำหรับยื่นสมัคร</p>
          </div>
        </motion.div>

        {/* KPI 3: AI Match Confidence */}
        <motion.div whileHover={{ y: -3, scale: 1.015 }} className="veriigo-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Confidence</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              <AnimatedCounter value={96} suffix=" %" />
            </h3>
            <p className="text-[11px] text-slate-400">วิเคราะห์ตามกฎระเบียบ ก.พ.</p>
          </div>
        </motion.div>

        {/* KPI 4: Monthly Quota Usage */}
        <motion.div whileHover={{ y: -3, scale: 1.015 }} className="veriigo-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Quota Used</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              <AnimatedCounter value={subscription?.quotaUsed || 42} suffix={` / ${subscription?.quotaLimit || 500}`} />
            </h3>
            <p className="text-[11px] text-purple-300 font-semibold">ประมวลผลไปแล้ว 8.4% ของโควตา</p>
          </div>
        </motion.div>
      </div>

      {/* 3. Subscription Status & Quick SaaS Plan Widget */}
      <div className="veriigo-card p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/10">
            <Crown className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-sm text-slate-100">
                {subscription?.planName || 'VERIIGO SaaS Pro Candidate'}
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                สถานะ: Active (เปิดใช้งาน)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              วันหมดอายุสมาชิก: <strong className="text-slate-100 font-bold">31 ธ.ค. 2026</strong> (ต่ออายุอัตโนมัติ) • สิทธิ์โควตา AI ประมวลผลคงเหลือ{' '}
              <strong className="text-blue-400 font-bold">
                <AnimatedCounter value={(subscription?.quotaLimit || 500) - (subscription?.quotaUsed || 42)} /> / {subscription?.quotaLimit || 500} ครั้ง
              </strong>
            </p>

            <div className="w-full max-w-md bg-white/10 rounded-full h-2 mt-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, ((subscription?.quotaUsed || 42) / (subscription?.quotaLimit || 500)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUpgradeModal(true)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-black text-amber-400 border border-amber-500/40 font-bold text-xs rounded-xl transition-all shadow-xl flex items-center gap-2 shrink-0 self-end md:self-center cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          จัดการสิทธิ์สมาชิก / อัปเกรดแผน
        </button>
      </div>

      {/* 4. Task 6: Enterprise Analytics Recharts Section */}
      <DashboardAnalyticsCharts />

      {/* 5. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Saved Jobs & Recommended Jobs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section A: Saved Jobs (งานที่บันทึกไว้) */}
          <div className="veriigo-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-base text-slate-100">
                  ตำแหน่งงานที่บันทึกไว้ (Saved Jobs) ({(savedJobs || []).length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ค้นหาเพิ่ม <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(savedJobs || []).length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-white/[0.03] rounded-2xl border border-dashed border-white/10 p-6">
                <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">ยังไม่มีตำแหน่งงานที่บันทึกไว้</p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  ไปที่หน้าค้นหาตำแหน่งงาน
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                          {item.job?.ministry || 'กระทรวง'}
                        </span>
                        <h3 className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors">
                          {item.job?.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{item.job?.agencyName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                        <span>💰 {item.job?.salaryMin?.toLocaleString()} - {item.job?.salaryMax?.toLocaleString()} บ.</span>
                        <span>•</span>
                        <span>👥 {item.job?.vacanciesCount} อัตรา</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">
                          📅 ปิด {item.job?.deadline ? new Date(item.job.deadline).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-slate-400 italic bg-black/30 p-2 rounded-xl border border-white/10 mt-1">
                          "บันทึก: {item.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          onSelectJob(item.job);
                          onNavigate('jobs');
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        ดูประกาศ
                      </button>
                      <button
                        onClick={(e) => handleRemoveSavedJob(item.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="ลบออกจากรายการบันทึก"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Recommended Jobs (ตำแหน่งงานแนะนำเฉพาะบุคคล - AI Matched) */}
          <div className="veriigo-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-extrabold text-base text-slate-100 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  ตำแหน่งงานแนะนำเฉพาะบุคคล (AI Recommended Jobs)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  คัดสรรโดยพิจารณาจากวุฒิการศึกษาและสถานะการสอบผ่าน ภาค ก. ก.พ. ของคุณ
                </p>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recommendedJobs.slice(0, 4).map((job, idx) => {
                const matchScore = idx === 0 ? 95 : idx === 1 ? 88 : idx === 2 ? 82 : 75;
                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors">
                            {job.title}
                          </span>
                          <span className="text-[10px] bg-white/10 text-slate-300 font-semibold px-2.5 py-0.5 rounded-full border border-white/15">
                            {job.positionType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{job.agencyName}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span>เงินเดือน: {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()} บ.</span>
                          <span>•</span>
                          <span>สถานที่: {job.province ? `จังหวัด${job.province}` : job.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <AIMatchRing score={matchScore} size="sm" showLabel={false} />
                      <button
                        onClick={() => {
                          onSelectJob(job);
                          onNavigate('ai-center');
                        }}
                        className="px-3.5 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        วิเคราะห์ AI Match
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Recent Searches & Notifications Feed & Profile Summary */}
        <div className="space-y-6">

          {/* Section C: Recent Searches */}
          <div className="veriigo-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-100">ประวัติการค้นหาล่าสุด</h3>
              </div>
              {(recentSearches || []).length > 0 && (
                <button
                  onClick={handleClearSearches}
                  className="text-[11px] text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  ล้างประวัติ
                </button>
              )}
            </div>

            {(recentSearches || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">ยังไม่มีประวัติการค้นหา</p>
            ) : (
              <div className="space-y-2">
                {(recentSearches || []).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('jobs', { keyword: item.queryText })}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-blue-300 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                        "{item.queryText}"
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.filterSummary}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30 shrink-0">
                      พบ {item.resultCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section D: Notifications */}
          <div className="veriigo-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-100">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkNotifsRead}
                className="text-[11px] text-blue-400 hover:underline font-bold cursor-pointer"
              >
                อ่านทั้งหมด
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setNotifFilter('ALL')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  notifFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setNotifFilter('UNREAD')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  notifFilter === 'UNREAD'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                ยังไม่อ่าน ({unreadCount})
              </button>
            </div>

            {/* Notification Feed Items */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredNotifs.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">ไม่มีรายการแจ้งเตือน</p>
              ) : (
                filteredNotifs.map((notif) => {
                  const isUrgent = notif.type === 'URGENT';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => notif.link && onNavigate(notif.link)}
                      className={`p-3.5 rounded-2xl border transition-all text-xs cursor-pointer ${
                        !notif.isRead
                          ? 'bg-blue-500/10 border-blue-500/30 text-slate-100 font-medium'
                          : 'bg-white/[0.02] border-white/10 text-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-bold ${isUrgent ? 'text-rose-300' : 'text-slate-100'}`}>
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1 shadow-sm"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-slate-500 block mt-1.5 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section E: Profile Summary Card */}
          <div className="veriigo-card p-6 space-y-4 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">ข้อมูลการยืนยันตัวตน</h3>
              </div>
              <button
                onClick={() => onNavigate('profile')}
                className="text-[11px] text-blue-400 hover:underline font-bold cursor-pointer"
              >
                แก้ไข
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ชื่อ-นามสกุล:</span>
                <span className="font-bold text-slate-100">{profile?.firstName || 'สมชาย'} {profile?.lastName || 'การดี'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สถานะ ก.พ. ภาค ก.:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน (ระดับ 3 ป.ตรี)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สาขาวิชาเอก:</span>
                <span className="font-bold text-slate-100">{profile?.education?.[0]?.fieldOfStudy || 'รัฐประศาสนศาสตร์'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สถาบันการศึกษา:</span>
                <span className="font-bold text-slate-100">{profile?.education?.[0]?.institution || 'จุฬาลงกรณ์มหาวิทยาลัย'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Upgrade Subscription Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111827] rounded-[24px] max-w-lg w-full p-6 space-y-6 border border-white/15 shadow-2xl relative text-white"
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-white">จัดการสิทธิ์สมาชิก VERIIGO SaaS</h3>
                <p className="text-xs text-slate-400">
                  เลือกแพ็กเกจที่เหมาะสมกับการเตรียมสอบรับราชการไทยของคุณ
                </p>
              </div>

              <div className="space-y-3">
                {/* Pro Plan */}
                <div
                  onClick={() => handleUpgradePlan('PRO')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    subscription?.tier === 'PRO'
                      ? 'border-blue-500 bg-blue-500/15'
                      : 'border-white/10 bg-white/[0.03] hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">VERIIGO SaaS Pro Candidate</h4>
                      <p className="text-xs text-slate-400">สำหรับผู้เตรียมสอบเดี่ยว 500 โควตา AI / เดือน</p>
                    </div>
                    <span className="font-black text-base text-blue-400">฿299 / เดือน</span>
                  </div>
                </div>

                {/* Pro Max Plan */}
                <div
                  onClick={() => handleUpgradePlan('PRO_MAX_ENTERPRISE')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    subscription?.tier === 'PRO_MAX_ENTERPRISE'
                      ? 'border-amber-500 bg-amber-500/15'
                      : 'border-white/10 bg-white/[0.03] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        VERIIGO PRO MAX Enterprise <Crown className="w-4 h-4 text-amber-400" />
                      </h4>
                      <p className="text-xs text-slate-400">โควตา 5,000 AI + สืบค้น Crawler + แจ้งเตือน SMS/LINE ด่วน</p>
                    </div>
                    <span className="font-black text-base text-amber-400">฿699 / เดือน</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
