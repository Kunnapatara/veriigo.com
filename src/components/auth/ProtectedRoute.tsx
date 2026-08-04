import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, LogIn, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/firestore';
import { AuthModal } from '../AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
  description?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['USER', 'AGENCY', 'ADMIN'],
  title = 'ต้องการการเข้าสู่ระบบเพื่อใช้งานส่วนนี้',
  description = 'กรุณาเข้าสู่ระบบด้วยบัญชี VERIIGO หรือ Google Account เพื่อสิทธิ์ในการเข้าถึงข้อมูล',
}) => {
  const { currentUser, role, loading, switchRole } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white/60 rounded-2xl border border-slate-200/80 shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน (Verifying Token & Role)...</p>
        <p className="text-xs text-slate-400 mt-1">VERIIGO Security & Authentication Engine</p>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg backdrop-blur-md">
            <Lock className="w-7 h-7 text-blue-300" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">{description}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              สิทธิประโยชน์การลงทะเบียนใช้งาน VERIIGO:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>ระบบวิเคราะห์ความสอดคล้องคุณสมบัติรายตำแหน่งด้วย AI</li>
              <li>ติดตามสถานะการสมัครสอบและแจ้งเตือนกำหนดการสอบ</li>
              <li>บันทึกประกาศรับสมัครงานราชการที่สนใจ</li>
              <li>รับสิทธิ์ทดสอบสิทธิพิเศษระดับ Agency / Admin</li>
            </ul>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบด้วย Google / อีเมล
          </button>
        </div>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  // 3. Role-based authorization check
  const isAuthorized = allowedRoles.includes(role);

  if (!isAuthorized) {
    const handleTestRoleSwitch = async (targetRole: UserRole) => {
      setIsSwitching(true);
      try {
        await switchRole(targetRole);
      } finally {
        setIsSwitching(false);
      }
    };

    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 p-6 text-white text-center">
          <div className="w-14 h-14 bg-rose-500/20 border border-rose-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShieldAlert className="w-7 h-7 text-rose-300" />
          </div>
          <h3 className="text-lg font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้ (403 Forbidden)</h3>
          <p className="text-xs text-rose-200 mt-1">
            ส่วนนี้ต้องการบทบาทสิทธิ์ใช้งานระดับ{' '}
            <span className="font-extrabold underline">{allowedRoles.join(' หรือ ')}</span>
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold">บทบาทปัจจุบันของคุณ:</span>
              <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-extrabold rounded text-[11px]">
                {role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">บทบาทที่ต้องการ:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded text-[11px]">
                {allowedRoles.join(', ')}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              เปลี่ยนบทบาทเพื่อทดสอบสิทธิ์ (Sandbox Testing):
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              คุณสามารถสลับบทบาทบัญชีผู้ใช้เป็น ADMIN หรือ AGENCY เพื่อทดสอบระบบจัดการศูนย์ข้อมูลได้ทันที
            </p>

            <div className="grid grid-cols-2 gap-2">
              {allowedRoles.map((r: UserRole) => (
                <button
                  key={r}
                  disabled={isSwitching}
                  onClick={() => handleTestRoleSwitch(r)}
                  className="py-2 px-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center justify-between transition-all"
                >
                  <span>สลับเป็นสิทธิ์ {r}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized children render
  return <>{children}</>;
};
