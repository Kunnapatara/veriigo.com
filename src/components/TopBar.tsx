import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, Sparkles, UserCheck, ShieldAlert, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  activeTab: string;
  onOpenAuthModal: () => void;
  onOpenProfileDrawer?: () => void;
  onSearchChange?: (val: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenAuthModal,
  onOpenProfileDrawer,
  onSearchChange,
}) => {
  const { currentUser, profile, role } = useAuth();
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const titles: Record<string, string> = {
    dashboard: 'แผงควบคุมผู้ใช้งานและสิทธิ์สมาชิก (User Dashboard - Sprint 10)',
    jobs: 'ระบบค้นหาตำแหน่งงานราชการและวิเคราะห์คุณสมบัติ (Job Search System - Sprint 9)',
    checker: 'ระบบตรวจสอบคุณสมบัติผู้สมัครรับราชการ (OCSC Eligibility Verification)',
    'ai-center': 'ศูนย์ปัญญาประดิษฐ์วิเคราะห์เส้นทางอาชีพ (AI Career Intelligence Center)',
    tracker: 'ระบบติดตามสถานะการสมัครสอบและผลสอบ (Application Tracker)',
    calendar: 'ปฏิทินวันสอบและกำหนดการสำคัญ (Government Exam Calendar)',
    sources: 'ทะเบียนแหล่งข้อมูลสืบค้นงานราชการ (Government Source Registry)',
    crawler: 'เครื่องมือสืบค้นข้อมูล Crawler Engine (Multi-Source Crawler)',
    downloader: 'เครื่องมือดาวน์โหลดและสแกนความปลอดภัยเอกสาร (Document Download Engine)',
    extractor: 'ระบบสกัดข้อมูลประกาศรับสมัครงานด้วย Gemini AI Pipeline (Gemini Extraction Engine)',
    validator: 'ระบบตรวจสอบความถูกต้องและคุณภาพประกาศงานราชการ (Job Quality & Audit Engine)',
    profile: 'ข้อมูลประวัติ ประวัติการศึกษา และผลการสอบ ก.พ. (User Qualification Profile)',
    notifications: 'บริการแจ้งเตือนและระบบส่งข่าวสารอัตโนมัติ (Notification & Alert Engine - Sprint 12)',
    subscription: 'แพ็กเกจสมาชิก ระบบการชำระเงิน และการควบคุมสิทธิ์ (Subscription & Billing - Sprint 13)',
    tests: 'ระบบทดสอบและประเมินคุณภาพซอฟต์แวร์อัตโนมัติ (Automated Testing & QA - Sprint 14)',
    deployment: 'ศูนย์ควบคุมการติดตั้งใช้งานและความมั่นคงปลอดภัย (DevOps & Production Infrastructure - Sprint 15)',
    'admin-portal': 'ศูนย์การจัดการระบบและการตรวจสอบการทางาน (RBAC Admin Portal - Sprint 11)',
  };

  const notifications = [
    {
      id: '1',
      title: 'แจ้งเตือนสอบ ภาค ข.',
      message: 'นักวิเคราะห์นโยบายและแผน - สอบพรุ่งนี้ เวลา 09:00 น. ศูนย์สอบธรรมศาสตร์',
      time: '10 นาทีที่แล้ว',
      urgent: true,
    },
    {
      id: '2',
      title: 'ตำแหน่งงานใหม่ตรงสเปก',
      message: 'กรมสรรพากร เปิดรับนักวิชาการคอมพิวเตอร์ 25 อัตรา (ตรงกับวุฒิคุณ 92%)',
      time: '2 ชั่วโมงที่แล้ว',
      urgent: false,
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0B1220]/90 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
      {/* Page Title & Search */}
      <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0 max-w-3xl">
        <div className="hidden md:block shrink-0">
          <h1 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight truncate">
            {titles[activeTab] || 'VERIIGO Intelligence'}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            ระบบสืบค้นและวิเคราะห์ความพร้อมรับราชการด้วย AI
          </p>
        </div>

        {/* Global Search Input with Glow Effect */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearch}
            placeholder="ค้นหาตำแหน่งงาน..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-[11px] sm:text-xs bg-white/[0.05] hover:bg-white/[0.08] focus:bg-slate-900/90 border border-white/12 rounded-xl outline-none text-slate-100 placeholder-slate-400 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner truncate"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Health Badge */}
        <div className="hidden md:flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full text-[11px] font-semibold text-blue-300 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>RAG Engine 2.5 Active</span>
        </div>

        {/* Notification Bell with Pulse */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="การแจ้งเตือน"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0B1220] animate-pulse"></span>
          </button>

          {/* Notification Dropdown Drawer */}
          <AnimatePresence>
            {showNotifDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold text-slate-100">การแจ้งเตือนล่าสุด</h4>
                  <span className="text-[10px] text-blue-400 font-semibold cursor-pointer hover:underline">อ่านทั้งหมด</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs ${
                        n.urgent
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                          : 'bg-white/[0.04] border-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold flex items-center gap-1.5">
                          {n.urgent && <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Auth status or login button */}
        {currentUser ? (
          <button
            onClick={onOpenProfileDrawer}
            className="flex items-center gap-2.5 border-l border-white/10 pl-3.5 hover:opacity-90 transition-opacity text-left cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-slate-100">
                  {profile?.firstName} {profile?.lastName}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {role}
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                <UserCheck className="w-3 h-3" /> ผ่าน ภาค ก. แล้ว
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-lg ring-2 ring-blue-500/30 group-hover:ring-blue-400 transition-all">
              {profile?.firstName?.[0] || 'U'}
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    </header>
  );
};

