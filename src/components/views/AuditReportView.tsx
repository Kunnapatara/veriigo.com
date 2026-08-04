import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Settings,
  Compass,
  BarChart3,
  Target,
  RefreshCw,
  Database,
  FileCheck,
  Building2,
  Globe,
} from 'lucide-react';

export const AuditReportView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<any>(null);

  const fetchAuditReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/report').then((r) => r.json());
      if (res.success) setReport(res);
    } catch (err) {
      console.error('Failed to load audit report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditReport();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5" />
            Phase 6 Real Audit Report & Verification Matrix
          </div>
          <button
            onClick={fetchAuditReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            คำนวณรายงานล่าสุด
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          รายงานการตรวจสอบความพร้อมและสถานะระบบจริง (Production Launch Audit Report)
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl">
          โปรเจกต์ VERIIGO ใช้องค์ความรู้การวัดผลจริงจากฐานข้อมูล Live Firestore DB โดยหลีกเลี่ยงการอ้างตัวเลขลอยๆ
          และจัดหมวดหมู่อย่างตรงไปตรงมาตาม Implementation Status Framework
        </p>

        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">แหล่งข้อมูลใน Firestore DB</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {report.metrics.totalSourcesInDatabase} แหล่งข้อมูล
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">ประกาศงานใน Firestore DB</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {report.metrics.totalJobsInDatabase} ประกาศ
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">คะแนนความครอบคลุมคำนวณจริง</div>
              <div className="text-2xl font-bold text-cyan-300 mt-1">
                {report.metrics.overallCoverageScorePercentage}%
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">รายการใน Discovery Queue</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {report.metrics.pendingDiscoveryCandidates} รายการ
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Matrix by 5 Framework Statuses */}
      {report && (
        <div className="space-y-6">
          {/* Status 1: IMPLEMENTED */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-lg">1. IMPLEMENTED (พัฒนาเสร็จสมบูรณ์ พร้อมซอร์สโค้ดและ DB)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {report.auditMatrix.IMPLEMENTED.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status 2: CONFIGURED */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-5 h-5 text-cyan-600" />
              <h2 className="font-bold text-slate-900 text-lg">2. CONFIGURED (ตั้งค่าระบบและสภาพแวดล้อมเรียบร้อย)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {report.auditMatrix.CONFIGURED.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-cyan-50/50 p-3 rounded-lg border border-cyan-100">
                  <Settings className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status 3: DESIGNED */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-lg">3. DESIGNED (ออกแบบสถาปัตยกรรมไว้)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {report.auditMatrix.DESIGNED.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status 4: MEASURED */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-lg">4. MEASURED (ค่าที่คำนวณสถิติจากฐานข้อมูลจริง)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {report.auditMatrix.MEASURED.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  <BarChart3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status 5: TARGET */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-lg">5. TARGET (เป้าหมาย KPI ระยะยาว)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {report.auditMatrix.TARGET.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                  <Target className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
