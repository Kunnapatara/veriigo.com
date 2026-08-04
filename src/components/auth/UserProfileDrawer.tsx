import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Shield,
  Key,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Building,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/firestore';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, profile, role, idToken, switchRole, logout, getIdToken } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleCopyToken = () => {
    if (idToken) {
      navigator.clipboard.writeText(idToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      await getIdToken(true);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    setIsSwitchingRole(true);
    try {
      await switchRole(newRole);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const roleDetails: Record<UserRole, { label: string; color: string; icon: React.ElementType; desc: string }> = {
    USER: {
      label: 'ผู้สมัครรับราชการ (Candidate)',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: User,
      desc: 'เข้าถึงระบบค้นหา คัดกรอง และประมวลผลความตรงสเปกด้วย AI',
    },
    AGENCY: {
      label: 'เจ้าหน้าที่หน่วยงาน (Agency)',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Building,
      desc: 'เข้าถึงการจัดการประกาศ แหล่งสืบค้นข้อมูล และแดชบอร์ดหน่วยงาน',
    },
    ADMIN: {
      label: 'ผู้ดูแลระบบสูงสุด (System Admin)',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Crown,
      desc: 'เข้าถึงทุกระบบ การควบคุมสิทธิ์ สถิติทั่วประเทศ และ Audit Logs',
    },
  };

  const ActiveRoleIcon = roleDetails[role]?.icon || Shield;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
              {profile?.firstName?.[0] || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">
                {profile?.firstName} {profile?.lastName}
              </h3>
              <p className="text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Role Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                บทบาทปัจจุบัน (Active Role):
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleDetails[role].color}`}
              >
                <ActiveRoleIcon className="w-3.5 h-3.5" />
                {role}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">{roleDetails[role].label}</p>
            <p className="text-[11px] text-slate-500 leading-snug">{roleDetails[role].desc}</p>
          </div>

          {/* Test Role Switcher */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>ทดสอบสลับบทบาทใช้งาน (Sandbox Role Switcher)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              เลือกสลับสิทธิ์การใช้งานเพื่อทดสอบการทำงานของ Protected Routes และระบบควบคุมการเข้าถึง
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['USER', 'AGENCY', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  disabled={isSwitchingRole || role === r}
                  onClick={() => handleSwitchRole(r)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                    role === r
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-blue-100 border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Session Token Inspector */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                Session Auth Token Status
              </span>
              <button
                onClick={handleRefreshToken}
                disabled={isRefreshingToken}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono break-all text-slate-300 max-h-20 overflow-y-auto">
              {idToken || 'no-active-token'}
            </div>

            <button
              onClick={handleCopyToken}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอก Bearer Token แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>คัดลอก Bearer Token สำหรับทดสอบ API</span>
                </>
              )}
            </button>
          </div>

          {/* Account Details */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-800">ข้อมูลบัญชีและการรับรองคุณสมบัติ</h4>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold">ผ่านการวัดความรู้ทั่วไป ภาค ก. ก.พ.</p>
                <p className="text-[11px] text-emerald-700">ระดับ 3 (ปริญญาตรี) • คะแนน 78/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};
