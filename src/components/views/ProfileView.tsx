import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Award,
  ShieldCheck,
  Lock,
  Plus,
  Save,
  CheckCircle,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfileView: React.FC = () => {
  const { profile, updateProfileData } = useAuth();
  const [firstName, setFirstName] = useState(profile?.firstName || 'สมชาย');
  const [lastName, setLastName] = useState(profile?.lastName || 'การดี');
  const [skillsStr, setSkillsStr] = useState((profile?.skills || []).join(', '));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSkills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
    await updateProfileData({
      firstName,
      lastName,
      skills: updatedSkills,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="veriigo-card p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-blue-400 shadow-xl">
            {firstName?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{firstName} {lastName}</h2>
            <p className="text-xs text-slate-300">{profile?.email || 'user@example.com'}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> ยืนยันสิทธิ์ ก.พ. เรียบร้อย
            </span>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center min-w-[160px]">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Career Readiness</span>
          <span className="text-2xl font-black text-emerald-400 block">{profile?.careerReadinessScore || 82}/100</span>
          <span className="text-[10px] text-slate-400">ระดับพร้อมสอบ ภาค ข.</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> บันทึกข้อมูลประวัติการศึกษาเรียบร้อยแล้ว
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="veriigo-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-blue-600" /> ข้อมูลทั่วไป (Personal Identity)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อจริง (ภาษาไทย)</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold">
              <Lock className="w-4 h-4 text-slate-400" /> เลขประจำตัวประชาชน 13 หลัก (AES-256 Encrypted)
            </span>
            <span className="font-mono font-bold text-slate-800">1-1037-XXXXX-92-1</span>
          </div>
        </div>

        {/* OCSC Paper Record */}
        <div className="veriigo-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Award className="w-4 h-4 text-blue-600" /> ประวัติการสอบผ่าน ภาค ก. ของสำนักงาน ก.พ.
          </h3>

          <div className="space-y-3">
            {(profile?.ocscExams || []).map((exam, idx) => (
              <div key={idx} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{exam.paperName}</span>
                  <span className="text-slate-600">สถานะ: <strong className="text-emerald-700">{exam.status}</strong> (คะแนนสอบ: {exam.score} คะแนน)</span>
                </div>
                <span className="font-mono text-slate-500 font-semibold">ปีที่ผ่าน: {exam.passedYear}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Education Records */}
        <div className="veriigo-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <GraduationCap className="w-4 h-4 text-blue-600" /> วุฒิการศึกษาที่สำเร็จการศึกษา (Education History)
          </h3>

          <div className="space-y-3">
            {(profile?.education || []).map((edu, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{edu.degree} สาขา{edu.fieldOfStudy}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                    ก.พ. รับรองแล้ว
                  </span>
                </div>
                <p className="text-slate-600">{edu.institution} • เกรดเฉลี่ย {edu.gpa} (จบปี {edu.graduationYear})</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="veriigo-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
            ทักษะและความสามารถพิเศษ (ระบุคั่นด้วยเครื่องหมายจุลภาค ,)
          </h3>
          <input
            type="text"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงข้อมูลโปรไฟล์
        </button>
      </form>
    </div>
  );
};
