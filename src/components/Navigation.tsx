import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Kanban,
  Calendar,
  User,
  LogIn,
  LogOut,
  Server,
  Cpu,
  Download,
  BrainCircuit,
  ShieldCheck,
  Shield,
  Bell,
  CreditCard,
  TestTube,
  Cloud,
  Globe,
  Activity,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfileDrawer?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenProfileDrawer,
}) => {
  const { currentUser, profile, role, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'หน้าหลัก User Dashboard', icon: LayoutDashboard, badge: 'Sprint 10' },
    { id: 'career-intelligence', label: 'VERIIGO Career Intelligence', icon: Sparkles, badge: 'PRO 299 THB' },
    { id: 'jobs', label: 'ค้นหาตำแหน่งงานราชการ', icon: Briefcase, badge: 'Sprint 9' },
    { id: 'checker', label: 'ตรวจสอบคุณสมบัติ (ก.พ.)', icon: CheckCircle2 },
    { id: 'ai-center', label: 'AI Intelligence Center', icon: Sparkles, badge: 'AI Flagship' },
    { id: 'tracker', label: 'ติดตามการสมัคร (Tracker)', icon: Kanban },
    { id: 'calendar', label: 'ปฏิทินสอบ & กิจกรรม', icon: Calendar },
    { id: 'coverage', label: 'National Coverage Engine', icon: Globe, badge: 'Phase 1–6' },
    { id: 'data-governance', label: 'National Data Governance', icon: Building2, badge: 'Gov Architect' },
    { id: 'operations', label: 'SRE Operations & Scheduler', icon: Activity, badge: 'Phase 1-6 SRE' },
    { id: 'audit', label: 'รายงานการตรวจสอบระบบ (Audit)', icon: ShieldCheck, badge: 'Verification' },
    { id: 'sources', label: 'ทะเบียนแหล่งข้อมูลสืบค้น', icon: Server, badge: 'Sprint 4' },
    { id: 'crawler', label: 'เครื่องมือสืบค้น Crawler', icon: Cpu, badge: 'Sprint 5' },
    { id: 'downloader', label: 'เครื่องมือดาวน์โหลดเอกสาร', icon: Download, badge: 'Sprint 6' },
    { id: 'extractor', label: 'Gemini AI Extraction Pipeline', icon: BrainCircuit, badge: 'Sprint 7' },
    { id: 'validator', label: 'ระบบตรวจสอบความถูกต้อง', icon: ShieldCheck, badge: 'Sprint 8' },
    { id: 'profile', label: 'ประวัติ & วุฒิการศึกษา', icon: User },
    { id: 'notifications', label: 'บริการแจ้งเตือน (Notifications)', icon: Bell, badge: 'Sprint 12' },
    { id: 'subscription', label: 'แพ็กเกจ & การชำระเงิน', icon: CreditCard, badge: 'Sprint 13' },
    { id: 'tests', label: 'ระบบทดสอบ (QA & Testing)', icon: TestTube, badge: 'Sprint 14' },
    { id: 'deployment', label: 'DevOps & การติดตั้งระบบ', icon: Cloud, badge: 'Sprint 15' },
    { id: 'admin-portal', label: 'ศูนย์การจัดการระบบ (RBAC Admin)', icon: Shield, badge: 'Sprint 11' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (1024px+) - Dark Glassmorphism Enterprise Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0B1220]/90 backdrop-blur-2xl text-slate-200 min-h-screen border-r border-white/10 fixed left-0 top-0 z-30 shadow-2xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30 border border-blue-400/40">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">VERIIGO</span>
                <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Gov Job Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            ระบบงานหลัก (Core Modules)
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full shadow-[0_0_12px_#60A5FA]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Auth Section at Bottom */}
        <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {currentUser ? (
            <div className="space-y-2">
              <button
                onClick={onOpenProfileDrawer}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300 text-xs shrink-0 shadow-inner">
                  {profile?.firstName?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-100 truncate">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <span className="text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded-full">
                      {role}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ยืนยันสิทธิ์ ก.พ.
                  </p>
                </div>
              </button>

              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ (Logout)
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B1220]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 z-40 flex items-center justify-around text-slate-400 shadow-2xl">
        {[
          { id: 'dashboard', label: 'หน้าหลัก', icon: LayoutDashboard },
          { id: 'jobs', label: 'ค้นหาการสมัคร', icon: Briefcase },
          { id: 'ai-center', label: 'AI Center', icon: Sparkles },
          { id: 'tracker', label: 'ติดตามผล', icon: Kanban },
          { id: 'profile', label: 'โปรไฟล์', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] transition-all cursor-pointer ${
                isActive ? 'text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20' : 'hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

