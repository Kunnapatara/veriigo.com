import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  UserCheck,
  Target,
  TrendingUp,
  AlertTriangle,
  Bell,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Briefcase,
  GraduationCap,
  MapPin,
  Award,
  Zap,
  Star,
  ShieldCheck,
  Lock,
  ArrowRight,
  Edit3,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { JobListing } from '../../types/index';
import {
  UserCareerProfile,
  JobMatchBreakdown,
  ApplicationOpportunityIntelligence,
  SmartJobAlert,
  AICareerAssistantResponse,
  ScoreComponent,
} from '../../types/career-intelligence';
import {
  getDefaultUserCareerProfile,
  calculateJobMatchScore,
  calculateApplicationOpportunity,
  generateSmartAlerts,
  evaluateCareerAssistantQuery,
} from '../../lib/career-intelligence/intelligence-engine';

export const PremiumDashboardView: React.FC = () => {
  const [profile, setProfile] = useState<UserCareerProfile>(getDefaultUserCareerProfile());
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'recommended' | 'deadline' | 'opportunities'>('matches');
  
  // Interactive Modals / Drawers
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAssistantModal, setShowAssistantModal] = useState<boolean>(false);
  const [showMatchDetailModal, setShowMatchDetailModal] = useState<boolean>(false);
  const [activeMatchBreakdown, setActiveMatchBreakdown] = useState<JobMatchBreakdown | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<ApplicationOpportunityIntelligence | null>(null);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState<string>('ตำแหน่งนี้ต้องใช้ผลการสอบ ภาค ก. ก.พ. หรือไม่? และฉันสามารถสมัครได้ทันทีไหม?');
  const [aiResponse, setAiResponse] = useState<AICareerAssistantResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Profile Edit State
  const [editDegree, setEditDegree] = useState<string>(profile.education.degree);
  const [editMajor, setEditMajor] = useState<string>(profile.education.major);
  const [editUniversity, setEditUniversity] = useState<string>(profile.education.university);
  const [editExperience, setEditExperience] = useState<number>(profile.eligibility.experienceYears);
  const [editOcscStatus, setEditOcscStatus] = useState<string>(profile.eligibility.ocscExamStatus);
  const [editProvinces, setEditProvinces] = useState<string>(profile.preferences.preferredProvinces.join(', '));

  // Load jobs and initialize calculation
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/jobs');
        const json = await res.json();
        if (json.success && json.jobs) {
          setJobs(json.jobs);
          if (json.jobs.length > 0) {
            setSelectedJob(json.jobs[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load jobs for premium dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveProfile = () => {
    const updated: UserCareerProfile = {
      ...profile,
      education: {
        ...profile.education,
        degree: editDegree,
        major: editMajor,
        university: editUniversity,
      },
      eligibility: {
        ...profile.eligibility,
        experienceYears: Number(editExperience),
        ocscExamStatus: editOcscStatus as any,
      },
      preferences: {
        ...profile.preferences,
        preferredProvinces: editProvinces.split(',').map((p) => p.trim()).filter(Boolean),
      },
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    setShowProfileModal(false);

    // Sync backend
    fetch('/api/career/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: updated }),
    }).catch(console.error);
  };

  const handleAskAssistant = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/career/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          jobId: selectedJob?.id,
          question: aiQuestion,
        }),
      });
      const json = await res.json();
      if (json.success && json.response) {
        setAiResponse(json.response);
      } else {
        const fallback = evaluateCareerAssistantQuery(profile, selectedJob || undefined, aiQuestion);
        setAiResponse(fallback);
      }
    } catch (err) {
      const fallback = evaluateCareerAssistantQuery(profile, selectedJob || undefined, aiQuestion);
      setAiResponse(fallback);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Pre-calculate matches and opportunities for all loaded jobs
  const jobEvaluations = jobs.map((job) => {
    const match = calculateJobMatchScore(profile, job);
    const opp = calculateApplicationOpportunity(profile, job, match);
    return { job, match, opp };
  });

  const sortedByMatch = [...jobEvaluations].sort((a, b) => b.match.overallMatchScore - a.match.overallMatchScore);
  const highOpportunityJobs = [...jobEvaluations].filter((e) => e.opp.opportunityLevel === 'HIGH');
  const deadlineRiskJobs = [...jobEvaluations].filter((e) => e.opp.daysRemaining <= 7 && e.match.overallMatchScore >= 70);
  const smartAlerts = generateSmartAlerts(profile, jobs);

  const openMatchDetail = (job: JobListing, match: JobMatchBreakdown, opp: ApplicationOpportunityIntelligence) => {
    setSelectedJob(job);
    setActiveMatchBreakdown(match);
    setActiveOpportunity(opp);
    setShowMatchDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Value Proposition Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                VERIIGO PREMIUM INTELLIGENCE
              </span>
              <span className="text-xs text-indigo-300 font-mono">Personalized Match Engine v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ระบบวิเคราะห์โอกาสสอบบรรจุข้าราชการส่วนบุคคล (Career Intelligence)
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              วิเคราะห์ความสอดคล้องของวุฒิการศึกษา สาขาวิชา ผลสอบ ภาค ก. ก.พ. และสถานที่ปฏิบัติงาน เพื่อเพิ่มโอกาสสอบบรรจุรับราชการล่วงหน้า โดยมุ่งเน้นการแจ้งเตือนตำแหน่งตรงสเปกและลดโอกาสพลาดกำหนดการปิดรับสมัคร
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white text-sm font-medium rounded-xl border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              แก้ไขโปรไฟล์ส่วนบุคคล
            </button>
            <button
              onClick={() => {
                setShowAssistantModal(true);
                handleAskAssistant();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              ถาม AI Career Assistant
            </button>
          </div>
        </div>

        {/* User Profile Summary Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">วุฒิ & สาขาวิชา</div>
              <div className="text-xs font-bold text-white truncate max-w-[140px]">{profile.education.degree} ({profile.education.major})</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">สถานะสอบ ภาค ก. ก.พ.</div>
              <div className="text-xs font-bold text-emerald-400">{profile.eligibility.ocscExamStatus} (พร้อมยื่น)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">พื้นที่ปฏิบัติงานเป้าหมาย</div>
              <div className="text-xs font-bold text-white truncate max-w-[140px]">{profile.preferences.preferredProvinces.join(', ')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">ประสบการณ์ทำงาน</div>
              <div className="text-xs font-bold text-white">{profile.eligibility.experienceYears} ปี (ตรงเกณฑ์)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Alerts Feed Widget */}
      {smartAlerts.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              การแจ้งเตือนสเปกพิเศษเฉพาะคุณ (Personal Smart Alerts)
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full font-mono font-bold">
                {smartAlerts.length} รายการ
              </span>
            </h3>
            <span className="text-xs text-slate-400">อัปเดตแบบ Real-time ตามโปรไฟล์</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartAlerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                onClick={() => {
                  const target = jobs.find((j) => j.id === alt.jobId);
                  if (target) {
                    const match = calculateJobMatchScore(profile, target);
                    const opp = calculateApplicationOpportunity(profile, target, match);
                    openMatchDetail(target, match, opp);
                  }
                }}
                className="bg-slate-800/60 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3.5 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[11px] font-bold rounded border border-amber-400/20">
                    {alt.triggerBadgeText}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">ความน่าเชื่อถือ {alt.sourceTrustScore} Pts</span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300 line-clamp-1 transition-colors">
                  {alt.jobTitle}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{alt.agencyName}</span>
                  <span className="text-emerald-400 font-mono font-bold">ตรงสเปก {alt.matchScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matches'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Target className="w-4 h-4" />
          อันดับความสอดคล้องส่วนบุคคล (My Matches)
          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-mono">
            {sortedByMatch.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recommended')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'recommended'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          โอกาสสำเร็จสูง (High Opportunity)
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-mono">
            {highOpportunityJobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('deadline')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'deadline'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-400" />
          เฝ้าระวังวันปิดรับสมัคร (Deadline Risk)
          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs rounded-full font-mono">
            {deadlineRiskJobs.length}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Cards List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {(activeTab === 'matches' ? sortedByMatch : activeTab === 'recommended' ? highOpportunityJobs : deadlineRiskJobs).map(
            ({ job, match, opp }) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold">
                        {job.ministry || job.agencyName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                        {job.positionType}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                      {job.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-emerald-400">{match.overallMatchScore}%</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Match Score</div>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Key Match Rationale & Opportunity Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 space-y-1">
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      เหตุผลความสอดคล้องหลัก
                    </div>
                    <ul className="text-slate-300 space-y-1 pl-4 list-disc text-[11px]">
                      {match.keyMatchReasons.slice(0, 2).map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 space-y-1">
                    <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      ดัชนีโอกาสสำเร็จ (Opportunity Score)
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px] mt-1">
                      <span>ระดับโอกาส: <strong className="text-amber-400">{opp.opportunityLevel}</strong></span>
                      <span>ปิดรับใน: <strong className="text-rose-400">{opp.daysRemaining} วัน</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-400">อัตราว่าง: {opp.vacanciesCount} อัตรา ({opp.competitionRiskText})</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400 font-mono">
                    เงินเดือน {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()} บาท
                  </span>
                  <button
                    onClick={() => openMatchDetail(job, match, opp)}
                    className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    ดูคำอธิบายสูตร Match Score & รายละเอียด
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          )}
        </div>

        {/* Right Column: Monetization Value Comparison & Career Progress (1 col) */}
        <div className="space-y-6">
          {/* Subscription Value Card */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                VERIIGO PREMIUM 299 THB/เดือน
              </span>
              <span className="text-xs text-slate-400 font-mono">PRO SUITE</span>
            </div>

            <h3 className="text-base font-bold text-white">
              ทำไมคุณถึงควรใช้ VERIIGO Premium?
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">ระบบ Match Score ส่วนบุคคล:</strong> คำนวณความสอดคล้องวุฒิ/สาขา/ภาค ก. แบบแจกลายละเอียดโปร่งใส
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Smart Alert ไม่พลาดวันสมัคร:</strong> แจ้งเตือนผ่านอีเมล/ระบบเมื่อมีงานตรงสเปกมากกว่า 85% ปิดรับสมัครใน 7 วัน
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">AI Career Assistant วิเคราะห์เงื่อนไข:</strong> ตรวจสอบสเปกประกาศสอบแทนคุณ พร้อมแนะนำขั้นตอนเตรียมตัว
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="text-amber-400 font-semibold">เปรียบเทียบข้อแตกต่าง:</div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Free Edition:</span>
                <span className="text-slate-300">ดูรายชื่อตำแหน่งทั่วไป + ค้นหาพื้นฐาน</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Premium Edition:</span>
                <span className="text-emerald-400 font-bold">วิเคราะห์ความสอดคล้อง + แจ้งเตือน + AI</span>
              </div>
            </div>
          </div>

          {/* User Qualification Score Overview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              ดัชนีความพร้อมรับราชการ (Career Readiness)
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold font-mono text-indigo-400">92 / 100</div>
                <div className="text-xs text-slate-400">ความพร้อมสอบบรรจุระดับสูง</div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
                ผ่าน ภาค ก. แล้ว
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>วุฒิการศึกษาได้รับอนุมัติ:</span>
                <span className="text-emerald-400 font-bold">100%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>หนังสือรับรอง ภาค ก. ก.พ.:</span>
                <span className="text-emerald-400 font-bold">LEVEL_3 (พร้อมยื่น)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ความพร้อมภาษาอังกฤษ/ใบรับรอง:</span>
                <span className="text-indigo-400 font-bold">TOEIC 785 (ดีเยี่ยม)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: EXPLAINABLE MATCH SCORE & OPPORTUNITY DETAIL */}
      <AnimatePresence>
        {showMatchDetailModal && activeMatchBreakdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">EXPLAINABLE MATCH SCORE ENGINE</span>
                  <h2 className="text-xl font-bold text-white">{activeMatchBreakdown.jobTitle}</h2>
                  <p className="text-xs text-slate-400">{activeMatchBreakdown.agencyName}</p>
                </div>
                <button
                  onClick={() => setShowMatchDetailModal(false)}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Overall Score Header */}
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-300 font-semibold">คะแนนความสอดคล้องส่วนบุคคลรวม</div>
                  <div className="text-3xl font-bold font-mono text-emerald-400">
                    {activeMatchBreakdown.overallMatchScore}%
                  </div>
                </div>
                <div className="text-right text-xs text-slate-300 max-w-[200px]">
                  คำนวณจากสูตรเปิดเผย 6 องค์ประกอบย่อยตามหลักเกณฑ์ ก.พ.
                </div>
              </div>

              {/* Components Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">รายละเอียดสูตรการคำนวณ (Formula Component Breakdown)</h3>

                <div className="space-y-2">
                  {Object.entries(activeMatchBreakdown.components).map(([key, val]) => {
                    const comp = val as ScoreComponent;
                    return (
                      <div key={key} className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white uppercase">{key} COMPONENT</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {comp.score} / {comp.maxScore} Pts
                          </span>
                        </div>
                        <div className="text-slate-300">{comp.explanation}</div>
                        <div className="text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-1">
                          หลักฐานอ้างอิง: {comp.evidence}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application Opportunity Section */}
              {activeOpportunity && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    การวิเคราะห์โอกาสและระดับการแข่งขัน (Application Success Intelligence)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>ระดับโอกาส: <strong className="text-amber-400">{activeOpportunity.opportunityLevel}</strong></div>
                    <div>อัตราแข่งขัน: <strong className="text-blue-400">{activeOpportunity.competitionLevel}</strong></div>
                  </div>
                  <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                    {activeOpportunity.rationale.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
                {activeMatchBreakdown.evidenceSource}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: USER PROFILE EDITOR */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  แก้ไขโปรไฟล์ความพร้อมทางอาชีพ (Career Profile)
                </h2>
                <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">วุฒิการศึกษา</label>
                  <input
                    type="text"
                    value={editDegree}
                    onChange={(e) => setEditDegree(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">สาขาวิชา</label>
                  <input
                    type="text"
                    value={editMajor}
                    onChange={(e) => setEditMajor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">สถานะสอบผ่าน ภาค ก. ก.พ.</label>
                  <select
                    value={editOcscStatus}
                    onChange={(e) => setEditOcscStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="PASSED_LEVEL_3">ผ่าน ภาค ก. ปริญญาตรี (LEVEL_3)</option>
                    <option value="PASSED_LEVEL_4">ผ่าน ภาค ก. ปริญญาโท (LEVEL_4)</option>
                    <option value="PENDING">รอผลการสอบ</option>
                    <option value="NOT_TAKEN">ยังไม่ได้สอบ</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">ประสบการณ์ทำงาน (ปี)</label>
                  <input
                    type="number"
                    value={editExperience}
                    onChange={(e) => setEditExperience(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">จังหวัดที่ต้องการปฏิบัติงาน (คั่นด้วยจุลภาค)</label>
                  <input
                    type="text"
                    value={editProvinces}
                    onChange={(e) => setEditProvinces(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs"
                >
                  บันทึกโปรไฟล์ส่วนบุคคล
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: VERIIGO CAREER AI ASSISTANT */}
      <AnimatePresence>
        {showAssistantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  VERIIGO Career AI Assistant
                </h2>
                <button onClick={() => setShowAssistantModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">คำถามที่ต้องการให้ AI วิเคราะห์:</label>
                  <textarea
                    rows={3}
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleAskAssistant}
                  disabled={isAiLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium text-xs rounded-xl shadow flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  {isAiLoading ? 'กำลังวิเคราะห์คุณสมบัติ...' : 'ประมวลผลคำแนะนำทางอาชีพ'}
                </button>

                {aiResponse && (
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <span className="font-bold text-white">ผลการวิเคราะห์คุณสมบัติ:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        aiResponse.eligibleToApply === 'YES'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        สถานะ: {aiResponse.eligibleToApply === 'YES' ? 'สามารถสมัครได้ทันที' : 'มีเงื่อนไขต้องตรวจสอบ'}
                      </span>
                    </div>

                    <p className="text-slate-300">{aiResponse.reasoningSummary}</p>

                    <div>
                      <div className="font-bold text-emerald-400 mb-1">✓ คุณสมบัติที่ผ่านเกณฑ์:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                        {aiResponse.satisfiedRequirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    {aiResponse.missingRequirements.length > 0 && (
                      <div>
                        <div className="font-bold text-rose-400 mb-1">✗ สิ่งที่ยังขาดหรือต้องตรวจสอบ:</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                          {aiResponse.missingRequirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-blue-400 mb-1">💡 ข้อแนะนำขั้นตอนเตรียมตัว:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                        {aiResponse.recommendedActions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 flex justify-between font-mono">
                      <span>อ้างอิง: {aiResponse.evidenceSource}</span>
                      <span>Confidence: {aiResponse.confidenceScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
