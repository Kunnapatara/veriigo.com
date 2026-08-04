import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Sparkles, MapPin, DollarSign, Cpu } from 'lucide-react';

// Sample enterprise analytics dataset for VERIIGO
const dailyJobsData = [
  { day: 'จันทร์', jobs: 42, crawlers: 120 },
  { day: 'อังคาร', jobs: 68, crawlers: 185 },
  { day: 'พุธ', jobs: 95, crawlers: 240 },
  { day: 'พฤหัสฯ', jobs: 110, crawlers: 310 },
  { day: 'ศุกร์', jobs: 84, crawlers: 290 },
  { day: 'เสาร์', jobs: 35, crawlers: 90 },
  { day: 'อาทิตย์', jobs: 28, crawlers: 75 },
];

const agencyData = [
  { agency: 'ก.พ. / กลาง', count: 180, color: '#3B82F6' },
  { agency: 'สรรพากร', count: 125, color: '#60A5FA' },
  { agency: 'ศุลกากร', count: 98, color: '#22C55E' },
  { agency: 'มหาดไทย', count: 142, color: '#F59E0B' },
  { agency: 'สาธารณสุข', count: 210, color: '#A855F7' },
];

const provinceData = [
  { name: 'กรุงเทพฯ', value: 420, color: '#3B82F6' },
  { name: 'นนทบุรี', value: 180, color: '#22C55E' },
  { name: 'ปทุมธานี', value: 120, color: '#F59E0B' },
  { name: 'เชียงใหม่', value: 95, color: '#A855F7' },
  { name: 'ต่างจังหวัดอื่นๆ', value: 310, color: '#64748B' },
];

const salaryDistData = [
  { range: '15,000 - 18,000', count: 320 },
  { range: '18,000 - 25,000', count: 480 },
  { range: '25,000 - 35,000', count: 210 },
  { range: '35,000 - 50,000+', count: 85 },
];

const careerHealthTrend = [
  { month: 'ม.ค.', score: 62, accuracy: 88 },
  { month: 'ก.พ.', score: 68, accuracy: 90 },
  { month: 'มี.ค.', score: 75, accuracy: 92 },
  { month: 'เม.ย.', score: 82, accuracy: 94 },
  { month: 'พ.ค.', score: 88, accuracy: 96 },
  { month: 'มิ.ย.', score: 92, accuracy: 98 },
];

const searchActivityData = [
  { time: '08:00', searches: 420 },
  { time: '10:00', searches: 980 },
  { time: '12:00', searches: 1450 },
  { time: '14:00', searches: 1200 },
  { time: '16:00', searches: 1680 },
  { time: '18:00', searches: 1100 },
  { time: '20:00', searches: 850 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827]/95 border border-white/15 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-semibold" style={{ color: entry.color || '#3B82F6' }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardAnalyticsCharts: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Grid Row 1: Daily New Jobs & Applications by Agency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Daily New Jobs (AreaChart) */}
        <div className="veriigo-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">ประกาศงานใหม่รายวัน (Daily New Jobs)</h3>
                <p className="text-[11px] text-slate-400">การตรวจพบตำแหน่งงานราชการสัปดาห์นี้</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              +24% สัปดาห์นี้
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyJobsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="jobs" name="ตำแหน่งงานใหม่" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#jobsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Applications by Agency (BarChart) */}
        <div className="veriigo-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">ตำแหน่งงานแยกตามส่วนราชการ (Applications by Agency)</h3>
                <p className="text-[11px] text-slate-400">หน่วยงานเปิดรับสูงสุด 5 อันดับแรก</p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="agency" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="จำนวนอัตรา" radius={[8, 8, 0, 0]}>
                  {agencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Career Health Trend & Salary Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Career Health Trend & AI Accuracy (LineChart) */}
        <div className="veriigo-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">แนวโน้มความพร้อมสอบ & AI Recommendation Accuracy</h3>
                <p className="text-[11px] text-slate-400">การพัฒนาโปรไฟล์สอบและความแม่นยำ AI</p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={careerHealthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[50, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Career Health Score" stroke="#A855F7" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" name="AI Match Accuracy (%)" stroke="#22C55E" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Salary Distribution (Histogram BarChart) */}
        <div className="veriigo-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">การกระจายตัวของฐานเงินเดือน (Salary Distribution)</h3>
                <p className="text-[11px] text-slate-400">ช่วงเงินเดือนข้าราชการ/พนักงานราชการ (บาท/เดือน)</p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="range" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="จำนวนตำแหน่ง" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
