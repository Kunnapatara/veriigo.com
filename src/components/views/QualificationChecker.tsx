import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Sparkles,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const QualificationChecker: React.FC = () => {
  const { profile } = useAuth();

  // Wizard state
  const [degreeLevel, setDegreeLevel] = useState('ปริญญาตรี');
  const [fieldOfStudy, setFieldOfStudy] = useState('รัฐประศาสนศาสตร์');
  const [gpa, setGpa] = useState('3.25');
  const [hasPassedOcsc, setHasPassedOcsc] = useState('YES');
  const [ocscPaper, setOcscPaper] = useState('LEVEL_3');

  const [result, setResult] = useState<{
    status: 'ELIGIBLE' | 'PARTIAL' | 'NOT_ELIGIBLE';
    title: string;
    description: string;
    matchedPositions: string[];
    nextSteps: string[];
  } | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPassedOcsc === 'YES') {
      setResult({
        status: 'ELIGIBLE',
        title: 'คุณสมบัติครบถ้วนตามหลักเกณฑ์ ก.พ.',
        description: `วุฒิ ${degreeLevel} สาขา ${fieldOfStudy} พร้อมผลสอบผ่าน ภาค ก. ระดับ ${ocscPaper} ของคุณ สามารถใช้สมัครสอบแข่งขันเพื่อบรรจุเข้ารับราชการ (ภาค ข.) ได้ทันที`,
        matchedPositions: [
          'นักวิเคราะห์นโยบายและแผนปฏิบัติการ (ทุกกระทรวง)',
          'นักจัดการงานทั่วไปปฏิบัติการ (ทุกกระทรวง)',
          'นักวิชาการตรวจสอบภายในปฏิบัติการ',
        ],
        nextSteps: [
          'ค้นหาประกาศรับสมัครสอบ ภาค ข. ที่กำลังเปิดรับสมัครใน VERIIGO Jobs Explorer',
          'เตรียมเอกสารประกอบการสมัคร เช่น สำเนาหนังสือรับรอง ภาค ก. และสำเนาปริญญาบัตร',
        ],
      });
    } else {
      setResult({
        status: 'PARTIAL',
        title: 'ต้องสมัครสอบ ภาค ก. ของสำนักงาน ก.พ. ก่อน',
        description: `วุฒิ ${degreeLevel} สาขา ${fieldOfStudy} ของคุณตรงตามมาตรฐานวุฒิ ก.พ. แต่ต้องสมัครและสอบผ่านการวัดความรู้ความสามารถทั่วไป (ภาค ก.) ก่อนจึงจะสามารถสมัครสอบ ภาค ข. ได้`,
        matchedPositions: [
          'สามารถสมัครสอบ ภาค ก. e-Exam หรือ Paper & Pencil ประจำปีของ ก.พ. ได้',
        ],
        nextSteps: [
          'ติดตามวันเปิดรับสมัครสอบ ภาค ก. ประจำปี ในส่วนปฏิทินของ VERIIGO',
          'ฝึกทำแบบทดสอบวิชาความรู้ความสามารถทั่วไป ภาษาไทย ภาษาอังกฤษ และกฎหมายข้าราชการ',
        ],
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="veriigo-card p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold">ระบบตรวจสอบคุณสมบัติผู้สมัครรับราชการ (OCSC Checker)</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ตรวจสอบความตรงกันของวุฒิการศึกษาตามการรับรองของสำนักงาน ก.พ. และตรวจสอบสิทธิ์การสมัครสอบ ภาค ข. และ ภาค ค.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wizard Form (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleCheck} className="veriigo-card p-6 space-y-4 border border-slate-800 bg-slate-900/80">
            <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
              ระบุข้อมูลการศึกษาและสิทธิ์สอบ ก.พ.
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  ระดับการศึกษา (Degree Level)
                </label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ปริญญาตรี" className="bg-slate-900">ปริญญาตรี (Bachelor's Degree)</option>
                  <option value="ปริญญาโท" className="bg-slate-900">ปริญญาโท (Master's Degree)</option>
                  <option value="ปวส." className="bg-slate-900">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  สาขาวิชาหลัก (Field of Study)
                </label>
                <select
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="รัฐประศาสนศาสตร์" className="bg-slate-900">รัฐประศาสนศาสตร์ / บริหารรัฐกิจ</option>
                  <option value="นิติศาสตร์" className="bg-slate-900">นิติศาสตร์</option>
                  <option value="เศรษฐศาสตร์" className="bg-slate-900">เศรษฐศาสตร์</option>
                  <option value="วิทยาการคอมพิวเตอร์" className="bg-slate-900">วิทยาการคอมพิวเตอร์ / IT</option>
                  <option value="บัญชีและการเงิน" className="bg-slate-900">บัญชีและการเงิน</option>
                  <option value="บริหารธุรกิจ" className="bg-slate-900">บริหารธุรกิจ / การจัดการ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                สถานะการสอบผ่าน ภาค ก. ของสำนักงาน ก.พ.
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasPassedOcsc('YES')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    hasPassedOcsc === 'YES'
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> สอบผ่าน ภาค ก. แล้ว
                </button>
                <button
                  type="button"
                  onClick={() => setHasPassedOcsc('NO')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    hasPassedOcsc === 'NO'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" /> ยังไม่เคยสอบ / ยังไม่ผ่าน
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              ตรวจสอบผลการประเมินทันที
            </button>
          </form>

          {/* Result Card */}
          {result && (
            <div
              className={`veriigo-card p-6 space-y-4 border-l-4 rounded-2xl border border-slate-800 ${
                result.status === 'ELIGIBLE'
                  ? 'border-l-emerald-500 bg-emerald-950/30'
                  : 'border-l-amber-500 bg-amber-950/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.status === 'ELIGIBLE' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-extrabold text-slate-100 text-base">{result.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{result.description}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200 block">
                  ตำแหน่งที่วุฒิของคุณสมัครได้ทันที:
                </span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {result.matchedPositions.map((pos, idx) => (
                    <li key={idx}>{pos}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200 block">ขั้นตอนที่แนะนำถัดไป:</span>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {result.nextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div className="space-y-4">
          <div className="veriigo-card p-5 space-y-3 border border-slate-800 bg-slate-900/80">
            <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              ข้อควรรู้เกี่ยวกรรมสิทธิ์ ก.พ.
            </h4>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                • <strong className="text-slate-100">หนังสือรับรองผลสอบผ่าน ภาค ก.</strong> ไม่มีวันหมดอายุ สามารถใช้ได้ตลอดชีพ
              </p>
              <p>
                • วุฒิการศึกษาที่นำมาใช้สมัครต้องเป็นวุฒิที่ได้รับการรับรองจาก ก.พ. (สามารถตรวจรับรองวุฒิได้จากฐานข้อมูล OCSC)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
