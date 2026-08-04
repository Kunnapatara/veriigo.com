import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Target,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Award,
  MessageSquare,
  FileText,
  Table,
  Send,
  Download,
  Bot,
  User as UserIcon,
  RotateCcw,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AIMatchRing } from '../AIMatchRing';
import { JobListing } from '../../types';

interface AICenterViewProps {
  initialJob?: JobListing | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AICenterView: React.FC<AICenterViewProps> = ({ initialJob }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'ROADMAP' | 'CHAT' | 'OCR' | 'RESUME'>('ROADMAP');

  // Career Roadmap State
  const [selectedPosition, setSelectedPosition] = useState<string>(
    initialJob?.title || 'นักวิเคราะห์นโยบายและแผนปฏิบัติการ'
  );
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<{
    targetLevelIn5Years?: string;
    recommendedAgencies?: string[];
    milestones?: { phase: string; focus: string; actions: string[] }[];
    topCertificationsToGain?: string[];
  } | null>(null);

  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'สวัสดีครับ! ผมคือ VERIIGO AI ผู้ช่วยวางแผนสอบและแนะนำงานราชการไทย ยินดีให้คำปรึกษาเรื่อง ก.พ. ภาค ก/ข/ค วุฒิที่ ก.พ. รับรอง และแนวข้อสอบ สามารถพิมพ์คำถามได้เลยครับ',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Advanced OCR Table State
  const [ocrFileName, setOcrFileName] = useState('announcement-2026.pdf');
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Resume Builder State
  const [resumeName, setResumeName] = useState(`${profile?.firstName || 'สมชาย'} ${profile?.lastName || 'รับราชการ'}`);
  const [resumeDegree, setResumeDegree] = useState('ปริญญาตรี วิทยาศาสตรบัณฑิต (เทคโนโลยีสารสนเทศ)');
  const [resumeOcsc, setResumeOcsc] = useState('สอบผ่าน ก.พ. ภาค ก (ระดับปริญญาตรี) แล้ว');
  const [resumeExp, setResumeExp] = useState('มีประสบการณ์วิเคราะห์และบริหารโครงการซอฟต์แวร์ภาครัฐ 2 ปี');
  const [resumeSkills, setResumeSkills] = useState('ภาษาอังกฤษ B2, SQL Database, การร่างหนังสือราชการ');
  const [generatedResumeHtml, setGeneratedResumeHtml] = useState<string | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  const handleGenerateRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const res = await fetch('/api/ai/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.success) {
        setRoadmap(data.data);
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages([...newHistory, aiMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleRunOcr = async () => {
    setIsOcrLoading(true);
    try {
      const res = await fetch('/api/ocr/advanced-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: ocrFileName }),
      });
      const data = await res.json();
      if (data.success) {
        setOcrResult(data);
      }
    } catch (err) {
      console.error('OCR parse error:', err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    setIsGeneratingResume(true);
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: resumeName,
          degree: resumeDegree,
          ocscStatus: resumeOcsc,
          experience: resumeExp,
          skills: resumeSkills,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedResumeHtml(data.htmlContent);
      }
    } catch (err) {
      console.error('Resume error:', err);
    } finally {
      setIsGeneratingResume(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold rounded-full w-fit mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          VERIIGO AI Career Intelligence Center (Gemini Powered)
        </div>
        <h2 className="text-2xl font-black">ศูนย์วิเคราะห์ AI และบริการช่วยสอบงานราชการ</h2>
        <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
          รวมเครื่องมือปัญญาประดิษฐ์ครบวงจร: AI Chatbot ให้คำปรึกษาการสอบ ก.พ., Advanced OCR สกัดตารางในประกาศรับสมัคร, แผนที่อาชีพ 5 ปี และเครื่องมือสร้าง Resume แบบฟอร์มมาตรฐาน ก.พ.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          onClick={() => setActiveTab('ROADMAP')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ROADMAP'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-4 h-4" />
          แผนผังอาชีพ 5 ปี & Qualification Matcher
        </button>

        <button
          onClick={() => setActiveTab('CHAT')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'CHAT'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          VERIIGO AI Chatbot (ผู้ช่วยสอบ ก.พ.)
        </button>

        <button
          onClick={() => setActiveTab('OCR')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'OCR'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Table className="w-4 h-4 text-indigo-400" />
          Advanced OCR (สกัดตารางประกาศราชการ)
        </button>

        <button
          onClick={() => setActiveTab('RESUME')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'RESUME'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          สร้าง Resume แบบฟอร์มมาตรฐาน ก.พ.
        </button>
      </div>

      {/* TAB 1: ROADMAP */}
      {activeTab === 'ROADMAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="veriigo-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  การประเมินความพร้อมตำแหน่งเป้าหมาย
                </h3>
                <span className="text-[11px] text-blue-300 font-semibold bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  ตำแหน่งปัจจุบันที่เลือก
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200">เลือกตำแหน่งงานราชการที่ต้องการวิเคราะห์</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="นักวิเคราะห์นโยบายและแผนปฏิบัติการ" className="bg-slate-900 text-slate-100">นักวิเคราะห์นโยบายและแผนปฏิบัติการ (สำนักงานปลัดกระทรวงมหาดไทย)</option>
                  <option value="นักวิชาการคอมพิวเตอร์ปฏิบัติการ" className="bg-slate-900 text-slate-100">นักวิชาการคอมพิวเตอร์ปฏิบัติการ (กรมสรรพากร)</option>
                  <option value="นักจัดการงานทั่วไปปฏิบัติการ" className="bg-slate-900 text-slate-100">นักจัดการงานทั่วไปปฏิบัติการ (สำนักงาน ก.พ.)</option>
                  <option value="นักการทูตปฏิบัติการ" className="bg-slate-900 text-slate-100">นักการทูตปฏิบัติการ (กระทรวงการต่างประเทศ)</option>
                  <option value="นิติกรปฏิบัติการ" className="bg-slate-900 text-slate-100">นิติกรปฏิบัติการ (กรมศุลกากร)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <AIMatchRing score={88} size="md" showLabel={false} />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">AI Match Score</span>
                    <p className="text-lg font-black text-slate-100">88% (ตรงมาก)</p>
                  </div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">สถานะ ภาค ก.</span>
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน ปริญญาตรี แล้ว
                  </p>
                  <p className="text-[11px] text-slate-400">ตรงตามหลักเกณฑ์ ก.พ.</p>
                </div>

                <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">เวลาเตรียมสอบแนะนำ</span>
                  <p className="text-xs font-bold text-blue-300">30 วัน (สอบ ภาค ข.)</p>
                  <p className="text-[11px] text-slate-400">ทบทวนข้อสอบเก่า 3 ย้อนหลัง</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  จุดเด่นและสิ่งที่ต้องเติมเต็ม (Qualification Matrix)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> คุณสมบัติที่คุณมีอยู่แล้ว (Passed)
                    </span>
                    <ul className="text-xs text-slate-200 space-y-1 list-disc list-inside">
                      <li>ปริญญาตรี รัฐประศาสนศาสตร์ (ผ่านการรับรองจาก ก.พ.)</li>
                      <li>สอบผ่านความรู้ความสามารถทั่วไป (ภาค ก.) แล้ว</li>
                      <li>มีทักษะการบริหารโครงการและการวิเคราะห์ข้อมูลภาครัฐ</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> สิ่งที่ควรเสริมก่อนวันสอบ (To Improve)
                    </span>
                    <ul className="text-xs text-slate-200 space-y-1 list-disc list-inside">
                      <li>ศึกษา พรบ. ระเบียบบริหารราชการแผ่นดิน พ.ศ. 2534</li>
                      <li>ทบทวนยุทธศาสตร์ชาติ 20 ปี และแผนพัฒนาเศรษฐกิจฯ ฉบับที่ 13</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="veriigo-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                <Compass className="w-5 h-5 text-indigo-400" />
                <span>แผนที่เส้นทางความก้าวหน้า 5 ปี</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                จำลองเส้นทางการเติบโตจากข้าราชการแรกบรรจุ (ระดับปฏิบัติการ) สู่ระดับชำนาญการ/ผู้อำนวยการ
              </p>

              {roadmap ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-indigo-300 block">ตำแหน่งเป้าหมาย 5 ปี:</span>
                    <strong className="text-indigo-200 text-sm block">
                      {roadmap.targetLevelIn5Years || 'นักวิเคราะห์นโยบายและแผนชำนาญการ'}
                    </strong>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">หมุดหมายสำคัญ (Milestones):</span>
                    {roadmap.milestones?.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-blue-400 block">{m.phase}</span>
                        <p className="text-slate-300 text-[11px]">{m.focus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateRoadmap}
                  disabled={loadingRoadmap}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingRoadmap ? 'กำลังประมวลผลแผนผัง 5 ปี...' : 'สร้างแผนผังอาชีพ 5 ปีด้วย AI'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CHATBOT WITH MEMORY */}
      {activeTab === 'CHAT' && (
        <div className="veriigo-card rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col h-[520px]">
          <div className="p-3.5 bg-slate-900/95 border-b border-white/10 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100">VERIIGO AI Job & Exam Advisor</h3>
                <p className="text-[10px] text-slate-400">ระบบสนทนาความจำต่อเนื่อง (Gemini Flash Memory Engine)</p>
              </div>
            </div>

            <button
              onClick={() => setChatMessages([])}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ล้าง
            </button>
          </div>

          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-950/60 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-2xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3 rounded-2xl shadow-xs space-y-1 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Bot className="w-4 h-4 text-emerald-400 animate-bounce" />
                VERIIGO AI กำลังประมวลผลคำตอบ...
              </div>
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="p-3 bg-slate-900/95 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="พิมพ์คำถามเกี่ยวกับการสอบ ก.พ., วุฒิการศึกษา, หรือตำแหน่งงาน..."
              className="flex-1 text-xs bg-slate-950 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isChatSending || !chatInput.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> ส่ง
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ADVANCED OCR */}
      {activeTab === 'OCR' && (
        <div className="space-y-6">
          <div className="veriigo-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-400" />
                เครื่องมือ Advanced OCR & Table Layout Recognition (เอกสารราชการ)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini Vision OCR
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={ocrFileName}
                onChange={(e) => setOcrFileName(e.target.value)}
                placeholder="ระบุชื่อไฟล์ประกาศรับสมัคร เช่น announcement-2026.pdf"
                className="flex-1 text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleRunOcr}
                disabled={isOcrLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isOcrLoading ? 'กำลังสแกน...' : 'สแกนวิเคราะห์ตาราง PDF ด้วย OCR'}
              </button>
            </div>

            {ocrResult && (
              <div className="space-y-4 pt-3 border-t border-white/10">
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-indigo-200 block">{ocrResult.layoutAnalysis.heading}</span>
                    <span className="text-slate-300">วิเคราะห์สำเร็จ {ocrResult.pagesAnalyzed} หน้า | ความแม่นยำ {(ocrResult.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] w-fit">
                    พบตารางข้อมูล {ocrResult.layoutAnalysis.tablesDetectedCount} ตาราง
                  </span>
                </div>

                <div className="border border-white/10 rounded-xl overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 font-bold text-slate-200 border-b border-white/10">
                      <tr>
                        {ocrResult.layoutAnalysis.tables[0].columns.map((col: string, i: number) => (
                          <th key={i} className="p-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ocrResult.layoutAnalysis.tables[0].rows.map((row: string[], idx: number) => (
                        <tr key={idx} className="hover:bg-white/5">
                          {row.map((cell: string, ci: number) => (
                            <td key={ci} className="p-3 text-slate-300">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RESUME BUILDER */}
      {activeTab === 'RESUME' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="veriigo-card p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm border-b border-white/10 pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              กรอกข้อมูลแบบประวัติบุคคล (แบบฟอร์มมาตรฐาน ก.พ.)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">ระดับวุฒิการศึกษา</label>
                <input
                  type="text"
                  value={resumeDegree}
                  onChange={(e) => setResumeDegree(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">สถานะสอบ ก.พ. ภาค ก.</label>
                <input
                  type="text"
                  value={resumeOcsc}
                  onChange={(e) => setResumeOcsc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">ประสบการณ์ทำงานที่เกี่ยวข้อง</label>
                <textarea
                  value={resumeExp}
                  onChange={(e) => setResumeExp(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerateResume}
                disabled={isGeneratingResume}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isGeneratingResume ? 'กำลังสร้างแบบฟอร์ม Resume ก.พ. ...' : 'สร้างแบบฟอร์ม Resume มาตรฐาน ก.พ.'}
              </button>
            </div>
          </div>

          <div className="veriigo-card p-5 shadow-md flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-bold text-sm text-slate-100">ตัวอย่างเอกสารแบบฟอร์ม Resume ก.พ.</h3>
              {generatedResumeHtml && (
                <a
                  href={`data:text/html;charset=utf-8,${encodeURIComponent(generatedResumeHtml)}`}
                  download="ocsc-resume.html"
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลด HTML
                </a>
              )}
            </div>

            <div className="flex-1 bg-white text-slate-900 p-4 rounded-xl overflow-y-auto text-xs font-serif min-h-[300px]">
              {generatedResumeHtml ? (
                <div dangerouslySetInnerHTML={{ __html: generatedResumeHtml }} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                  <FileText className="w-10 h-10 stroke-1" />
                  <p>กดปุ่ม "สร้างแบบฟอร์ม Resume มาตรฐาน ก.พ." เพื่อแสดงตัวอย่างเอกสาร</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

