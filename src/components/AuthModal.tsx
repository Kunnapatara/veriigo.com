import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsAdminDirectly } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('kunnapatara@gmail.com');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminDirect = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginAsAdminDirectly();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ Admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!firstName || !lastName) {
          setErrorMsg('กรุณากรอกชื่อและนามสกุล');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, firstName, lastName);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-2xl mb-2 shadow-lg shadow-blue-500/30">
            V
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {isRegister ? 'สร้างบัญชี VERIIGO' : 'เข้าสู่ระบบ VERIIGO'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            แพลตฟอร์มวิเคราะห์คุณสมบัติและสอบบรรจุรับราชการด้วย AI
          </p>
        </div>

        {/* Admin Direct 1-Click Login Highlight */}
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              บัญชี Admin ระบบ (kunnapatara@gmail.com)
            </span>
            <span className="text-[10px] font-extrabold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              Full Access
            </span>
          </div>
          <p className="text-[11px] text-amber-800/90 leading-tight mb-2">
            ตั้งค่าสิทธิ์ผู้บริหารระบบ (ADMIN) เข้าถึงได้ทุกฟังก์ชัน
          </p>
          <button
            type="button"
            onClick={handleAdminDirect}
            disabled={loading}
            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            เข้าสู่ระบบ Admin ทันที (kunnapatara@gmail.com)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Login */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-sm mb-4 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          เข้าสู่ระบบด้วย Google Account
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold uppercase">
            หรือใช้อีเมล
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ชื่อจริง (ภาษาไทย)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="สมชาย"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  นามสกุล
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="รักชาติ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              อีเมล (Email Address)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kunnapatara@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all mt-2 cursor-pointer"
          >
            {loading ? 'กำลังประมวลผล...' : isRegister ? 'ลงทะเบียนใช้งาน' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            {isRegister
              ? 'มีบัญชีใช้งานอยู่แล้ว? เข้าสู่ระบบ'
              : 'ยังไม่มีบัญชีใช้งาน? ลงทะเบียนใหม่'}
          </button>
        </div>

        <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>ข้อมูลของท่านได้รับการคุ้มครองตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
        </div>
      </div>
    </div>
  );
};
