import React, { useState } from 'react';
import {
  Kanban,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../../types';

export const TrackerView: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([
    {
      id: 'app-001',
      userId: 'user-001',
      jobId: 'job-002',
      jobTitle: 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ',
      agencyName: 'กรมสรรพากร',
      status: 'EXAM_SCHEDULED',
      notes: 'ศูนย์สอบมหาวิทยาลัยธรรมศาสตร์ รังสิต อาคารเรียนรวม 1 ห้อง 302',
      appliedAt: '2026-07-06T09:00:00.000Z',
      updatedAt: '2026-07-15T10:00:00.000Z',
    },
    {
      id: 'app-002',
      userId: 'user-001',
      jobId: 'job-001',
      jobTitle: 'นักวิเคราะห์นโยบายและแผนปฏิบัติการ',
      agencyName: 'สำนักงานปลัดกระทรวงมหาดไทย',
      status: 'SUBMITTED',
      notes: 'ยื่นเอกสารการสมัครทางออนไลน์เรียบร้อยแล้ว รอประกาศรายชื่อผู้มีสิทธิ์สอบ ภาค ข.',
      appliedAt: '2026-07-10T14:30:00.000Z',
      updatedAt: '2026-07-10T14:30:00.000Z',
    },
    {
      id: 'app-003',
      userId: 'user-001',
      jobId: 'job-003',
      jobTitle: 'นักจัดการงานทั่วไปปฏิบัติการ',
      agencyName: 'สำนักงาน ก.พ.',
      status: 'DRAFT',
      notes: 'กำลังจัดเตรียมเอกสารการโอนย้ายวุฒิและแนบหนังสือรับรอง ภาค ก.',
      appliedAt: '2026-07-18T11:00:00.000Z',
      updatedAt: '2026-07-18T11:00:00.000Z',
    },
  ]);

  const columns: { status: ApplicationStatus; label: string; color: string }[] = [
    { status: 'DRAFT', label: 'ร่างการสมัคร (Draft)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    { status: 'SUBMITTED', label: 'ยื่นใบสมัครแล้ว (Submitted)', color: 'bg-blue-50 text-blue-700 border-blue-300' },
    { status: 'DOCUMENT_VERIFIED', label: 'ผ่านตรวจเอกสาร', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
    { status: 'EXAM_SCHEDULED', label: 'นัดสอบ ภาค ข.', color: 'bg-purple-50 text-purple-700 border-purple-300' },
    { status: 'INTERVIEWING', label: 'สอบสัมภาษณ์ ภาค ค.', color: 'bg-amber-50 text-amber-700 border-amber-300' },
    { status: 'ACCEPTED', label: 'บรรจุเข้ารับราชการ', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  ];

  const moveStatus = (id: string, currentStatus: ApplicationStatus, direction: 'NEXT' | 'PREV') => {
    const statusOrder: ApplicationStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'DOCUMENT_VERIFIED',
      'EXAM_SCHEDULED',
      'INTERVIEWING',
      'ACCEPTED',
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    let nextIndex = direction === 'NEXT' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < statusOrder.length) {
      const nextStatus = statusOrder[nextIndex];
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: nextStatus, updatedAt: new Date().toISOString() } : app
        )
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Kanban className="w-6 h-6 text-blue-600" />
            ระบบติดตามสถานะการสมัครสอบ (Application Tracker Pipeline)
          </h2>
          <p className="text-xs text-slate-500">
            บริหารจัดการสถานะการยื่นสมัครสอบ กำหนดการสอบ ภาค ข. และสัมภาษณ์ ภาค ค. ของคุณในที่เดียว
          </p>
        </div>

        <button
          onClick={() => {
            const newApp: JobApplication = {
              id: `app-${Date.now()}`,
              userId: 'user-001',
              jobId: 'job-custom',
              jobTitle: 'ตำแหน่งสอบบรรจุเพิ่มเติม',
              agencyName: 'หน่วยงานภาครัฐ',
              status: 'DRAFT',
              notes: 'บันทึกรายการสมัครใหม่',
              appliedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setApplications([newApp, ...applications]);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> บันทึกการสมัครใหม่
        </button>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col.status);
          return (
            <div key={col.status} className="w-72 shrink-0 bg-slate-100/80 p-3 rounded-2xl space-y-3 border border-slate-200">
              <div className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between ${col.color}`}>
                <span>{col.label}</span>
                <span className="w-5 h-5 rounded-full bg-white text-slate-800 flex items-center justify-center text-[10px]">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {colApps.map((app) => (
                  <div key={app.id} className="veriigo-card p-4 space-y-3 relative group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{app.agencyName}</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 leading-snug">
                        {app.jobTitle}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed">
                      {app.notes}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>ยื่นเมื่อ {new Date(app.appliedAt).toLocaleDateString('th-TH')}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStatus(app.id, app.status, 'PREV')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          title="ย้ายถอยหลัง"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStatus(app.id, app.status, 'NEXT')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          title="ย้ายไปขั้นตอนถัดไป"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
