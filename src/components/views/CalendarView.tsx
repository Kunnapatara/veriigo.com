import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const events = [
    {
      id: 'e1',
      date: '2026-09-10',
      title: 'สอบความรู้ความสามารถเฉพาะตำแหน่ง (ภาค ข.) - กรมสรรพากร',
      agency: 'กรมสรรพากร',
      type: 'EXAM_B',
      location: 'มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต (อาคารเรียนรวม 1)',
      time: '09:00 - 12:00 น.',
      urgent: true,
    },
    {
      id: 'e2',
      date: '2026-09-15',
      title: 'ประกาศรายชื่อผู้มีสิทธิ์สอบ ภาค ข. - กระทรวงมหาดไทย',
      agency: 'สำนักงานปลัดกระทรวงมหาดไทย',
      type: 'ANNOUNCEMENT',
      location: 'เว็บไซต์ทางการ https://moi.job.thai.com',
      time: '10:00 น.',
      urgent: false,
    },
    {
      id: 'e3',
      date: '2026-09-28',
      title: 'สอบวัดความเหมาะสมกับตำแหน่ง (ภาค ค. สัมภาษณ์) - สำนักงาน ก.พ.',
      agency: 'สำนักงาน ก.พ.',
      type: 'INTERVIEW',
      location: 'สำนักงาน ก.พ. จังหวัดนนทบุรี',
      time: '13:00 น.',
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            ปฏิทินสอบและกำหนดการสำคัญรับราชการ (Exam Calendar)
          </h2>
          <p className="text-xs text-slate-500">
            ระบบซิงค์กำหนดการสอบ ภาค ข. และสัมภาษณ์ ภาค ค. อัตโนมัติจากประกาศหน่วยงาน
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`veriigo-card p-5 border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              event.urgent ? 'border-l-rose-600 bg-rose-50/20' : 'border-l-blue-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded-xl text-center shrink-0 min-w-[70px]">
                <span className="text-[10px] font-bold uppercase block text-blue-600">
                  {new Date(event.date).toLocaleString('th-TH', { month: 'short' })}
                </span>
                <span className="text-2xl font-black text-slate-900 block leading-none my-0.5">
                  {new Date(event.date).getDate()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {new Date(event.date).getFullYear() + 543}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {event.agency}
                  </span>
                  {event.urgent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" /> สำคัญมาก
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{event.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.location}
                  </span>
                </div>
              </div>
            </div>

            <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-all self-end sm:self-center shrink-0">
              แจ้งเตือนเข้าปฏิทิน
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
