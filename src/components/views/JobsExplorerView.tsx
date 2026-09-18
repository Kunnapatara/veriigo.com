import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  X,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Zap,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  Database,
  DollarSign,
  GraduationCap,
  Briefcase,
  BookOpen,
  Clock,
  Tag,
  Check,
  RotateCcw,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { JobListing, AIMatchAnalysis, OCSCLevel } from '../../types';
import { AIMatchRing } from '../AIMatchRing';
import { useAuth } from '../../context/AuthContext';

interface JobsExplorerViewProps {
  selectedJobFromDash?: JobListing | null;
  onNavigateToAI: (job: JobListing) => void;
}

const PROVINCE_OPTIONS = [
  'ทุกจังหวัด (All Provinces)',
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'เชียงใหม่',
  'ขอนแก่น',
  'สงขลา',
  'ชลบุรี',
  'สุราษฎร์ธานี',
  'นครราชสีมา'
];

const AGENCY_OPTIONS = [
  'ทุกหน่วยงาน (All Agencies)',
  'สำนักงานปลัดกระทรวงมหาดไทย',
  'กรมสรรพากร',
  'สำนักงาน ก.พ.',
  'กรมศุลกากร',
  'กรมทางหลวง',
  'กรมควบคุมโรค',
  'กรมบัญชีกลาง',
  'กรมชลประทาน',
  'กรมการปกครอง',
  'การไฟฟ้าส่วนภูมิภาค',
  'กรมวิชาการเกษตร'
];

const DEGREE_OPTIONS = [
  'ทุกระดับการศึกษา (All Degrees)',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
  'ปวส.',
  'ปวช.'
];

const MAJOR_OPTIONS = [
  'ทุกสาขาวิชา (All Majors)',
  'รัฐประศาสนศาสตร์',
  'วิศวกรรมคอมพิวเตอร์',
  'วิศวกรรมโยธา',
  'การบัญชี',
  'นิติศาสตร์',
  'สาธารณสุขศาสตร์',
  'ภาษาอังกฤษ',
  'เกษตรศาสตร์',
  'บริหารธุรกิจ',
  'วิทยาการคอมพิวเตอร์'
];

const EMPLOYMENT_TYPE_OPTIONS = [
  'ทุกประเภทการจ้างงาน (All Types)',
  'ข้าราชการพลเรือนสามัญ',
  'พนักงานราชการ',
  'ลูกจ้างชั่วคราว',
  'พนักงานจ้างเหมาบริการ',
  'พนักงานรัฐวิสาหกิจ'
];

export const JobsExplorerView: React.FC<JobsExplorerViewProps> = ({
  selectedJobFromDash,
  onNavigateToAI,
}) => {
  const { profile } = useAuth();

  // Data state
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [apiTotal, setApiTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'EXPRESS_API' | 'REALTIME_FIRESTORE'>('EXPRESS_API');
  const [firestoreSynced, setFirestoreSynced] = useState(false);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [firestoreCount, setFirestoreCount] = useState(0);

  // Filter States (Sprint 9 Requirements)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [selectedOcsc, setSelectedOcsc] = useState('');
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
  const [closingFilter, setClosingFilter] = useState<string>('ALL');

  // Sorting and Pagination State
  const [sortBy, setSortBy] = useState<string>('deadline_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Advanced Filter Drawer Toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Selected job modal & AI analysis state
  const [modalJob, setModalJob] = useState<JobListing | null>(selectedJobFromDash || null);
  const [aiAnalysis, setAiAnalysis] = useState<AIMatchAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 1. Fetch via Express API
  const fetchExpressJobs = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('keyword', searchTerm);
      if (selectedProvince && !selectedProvince.includes('ทุกจังหวัด')) queryParams.append('province', selectedProvince);
      if (selectedAgency && !selectedAgency.includes('ทุกหน่วยงาน')) queryParams.append('agency', selectedAgency);
      if (selectedDegree && !selectedDegree.includes('ทุกระดับการศึกษา')) queryParams.append('degree', selectedDegree);
      if (selectedMajor && !selectedMajor.includes('ทุกสาขาวิชา')) queryParams.append('major', selectedMajor);
      if (selectedEmploymentType && !selectedEmploymentType.includes('ทุกประเภทการจ้างงาน')) queryParams.append('positionType', selectedEmploymentType);
      if (selectedOcsc) queryParams.append('ocscLevel', selectedOcsc);
      if (minSalaryFilter > 0) queryParams.append('minSalary', String(minSalaryFilter));
      if (closingFilter !== 'ALL') queryParams.append('closingDateRange', closingFilter);
      queryParams.append('sortBy', sortBy);
      queryParams.append('limit', '10000');

      const res = await fetch(`/api/jobs?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
        setApiTotal(data.total || (data.data ? data.data.length : 0));
      } else {
        setDbError(data.message || 'DATABASE UNAVAILABLE');
      }
    } catch (err: any) {
      console.error('Error fetching jobs via API:', err);
      setDbError('DATABASE UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  };

  // 2. Setup Realtime Firestore Listener or Fetch Express API based on DataSource
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (dataSource === 'REALTIME_FIRESTORE') {
      setLoading(true);
      try {
        const jobsRef = collection(db, 'job_announcements');
        unsubscribe = onSnapshot(
          jobsRef,
          (snapshot) => {
            const fetchedList: JobListing[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as JobListing;
              fetchedList.push({ ...data, id: docSnap.id });
            });
            setJobs(fetchedList);
            setFirestoreCount(fetchedList.length);
            setLoading(false);
          },
          (error) => {
            console.error('Firestore onSnapshot listener error:', error);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Failed to setup Firestore realtime listener:', err);
        setLoading(false);
      }
    } else {
      fetchExpressJobs();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dataSource, sortBy]);

  // Handle manual seed/sync mock data into Firestore
  const handleSeedFirestore = async () => {
    setSyncingFirestore(true);
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      const mockList: JobListing[] = json.allMockData || json.data || [];

      for (const jobItem of mockList) {
        await setDoc(doc(db, 'job_announcements', jobItem.id), jobItem, { merge: true });
      }

      setFirestoreSynced(true);
      setFirestoreCount(mockList.length);
      setTimeout(() => setFirestoreSynced(false), 4000);
    } catch (err) {
      console.error('Error seeding Firestore job_announcements:', err);
    } finally {
      setSyncingFirestore(false);
    }
  };

  // Client-side filtering logic for seamless dynamic filtering across both API & Firestore sources
  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (j) =>
          (j.title || '').toLowerCase().includes(q) ||
          (j.agencyName || '').toLowerCase().includes(q) ||
          (j.ministry || '').toLowerCase().includes(q) ||
          (j.location || '').toLowerCase().includes(q) ||
          (j.province && j.province.toLowerCase().includes(q)) ||
          (j.requirementsText || '').toLowerCase().includes(q) ||
          (Array.isArray(j.tags) && j.tags.some((t) => t.toLowerCase().includes(q))) ||
          (Array.isArray(j.majorsAllowed) && j.majorsAllowed.some((m) => m.toLowerCase().includes(q)))
      );
    }

    // Province filter
    if (selectedProvince && !selectedProvince.includes('ทุกจังหวัด')) {
      const p = selectedProvince.toLowerCase();
      result = result.filter(
        (j) =>
          (j.province && j.province.toLowerCase().includes(p)) ||
          (j.location || '').toLowerCase().includes(p)
      );
    }

    // Agency filter
    if (selectedAgency && !selectedAgency.includes('ทุกหน่วยงาน')) {
      const a = selectedAgency.toLowerCase();
      result = result.filter(
        (j) =>
          (j.agencyName || '').toLowerCase().includes(a) ||
          (j.ministry || '').toLowerCase().includes(a)
      );
    }

    // Degree filter
    if (selectedDegree && !selectedDegree.includes('ทุกระดับการศึกษา')) {
      const d = selectedDegree.toLowerCase();
      result = result.filter((j) =>
        Array.isArray(j.degreeRequired) && j.degreeRequired.some((deg) => deg.toLowerCase().includes(d))
      );
    }

    // Major filter
    if (selectedMajor && !selectedMajor.includes('ทุกสาขาวิชา')) {
      const m = selectedMajor.toLowerCase();
      result = result.filter((j) =>
        Array.isArray(j.majorsAllowed)
          ? j.majorsAllowed.some((maj) => maj.toLowerCase().includes(m) || maj === 'ทุกสาขาวิชา')
          : true
      );
    }

    // Employment type filter
    if (selectedEmploymentType && !selectedEmploymentType.includes('ทุกประเภทการจ้างงาน')) {
      result = result.filter((j) => j.positionType === selectedEmploymentType);
    }

    // OCSC Level filter
    if (selectedOcsc) {
      result = result.filter((j) => j.ocscLevelRequired === selectedOcsc);
    }

    // Min Salary filter
    if (minSalaryFilter > 0) {
      result = result.filter((j) => j.salaryMax >= minSalaryFilter);
    }

    // Closing Date Filter
    if (closingFilter !== 'ALL') {
      const now = new Date();
      if (closingFilter === 'CLOSING_SOON_7') {
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        result = result.filter((j) => {
          const deadline = new Date(j.deadline);
          return deadline >= now && deadline <= in7Days;
        });
      } else if (closingFilter === 'CLOSING_SOON_30') {
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        result = result.filter((j) => {
          const deadline = new Date(j.deadline);
          return deadline >= now && deadline <= in30Days;
        });
      } else if (closingFilter === 'ACTIVE_ONLY') {
        result = result.filter((j) => new Date(j.deadline) >= now);
      } else if (closingFilter === 'EXPIRED') {
        result = result.filter((j) => new Date(j.deadline) < now);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'deadline_asc') {
        return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
      } else if (sortBy === 'deadline_desc') {
        return new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime();
      } else if (sortBy === 'salary_desc') {
        return (b.salaryMax || 0) - (a.salaryMax || 0);
      } else if (sortBy === 'salary_asc') {
        return (a.salaryMin || 0) - (b.salaryMin || 0);
      } else if (sortBy === 'created_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '', 'th');
      } else if (sortBy === 'vacancies_desc') {
        return (b.vacanciesCount || 0) - (a.vacanciesCount || 0);
      }
      return 0;
    });

    return result;
  }, [
    jobs,
    searchTerm,
    selectedProvince,
    selectedAgency,
    selectedDegree,
    selectedMajor,
    selectedEmploymentType,
    selectedOcsc,
    minSalaryFilter,
    closingFilter,
    sortBy,
  ]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedProvince,
    selectedAgency,
    selectedDegree,
    selectedMajor,
    selectedEmploymentType,
    selectedOcsc,
    minSalaryFilter,
    closingFilter,
    sortBy,
  ]);

  // Pagination Math
  const totalItems = processedJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPaginatedJobs = processedJobs.slice(startIndex, startIndex + itemsPerPage);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedProvince && !selectedProvince.includes('ทุกจังหวัด')) count++;
    if (selectedAgency && !selectedAgency.includes('ทุกหน่วยงาน')) count++;
    if (selectedDegree && !selectedDegree.includes('ทุกระดับการศึกษา')) count++;
    if (selectedMajor && !selectedMajor.includes('ทุกสาขาวิชา')) count++;
    if (selectedEmploymentType && !selectedEmploymentType.includes('ทุกประเภทการจ้างงาน')) count++;
    if (selectedOcsc) count++;
    if (minSalaryFilter > 0) count++;
    if (closingFilter !== 'ALL') count++;
    return count;
  }, [
    searchTerm,
    selectedProvince,
    selectedAgency,
    selectedDegree,
    selectedMajor,
    selectedEmploymentType,
    selectedOcsc,
    minSalaryFilter,
    closingFilter,
  ]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedProvince('');
    setSelectedAgency('');
    setSelectedDegree('');
    setSelectedMajor('');
    setSelectedEmploymentType('');
    setSelectedOcsc('');
    setMinSalaryFilter(0);
    setClosingFilter('ALL');
  };

  const handleRunAiAnalysis = async (job: JobListing) => {
    setAnalyzing(true);
    setAiAnalysis(null);

    try {
      const userProfile = profile || {
        userId: 'demo-user',
        firstName: 'สมชาย',
        lastName: 'การดี',
        role: 'USER',
        education: [
          {
            degree: 'ปริญญาตรี',
            fieldOfStudy: 'รัฐประศาสนศาสตร์',
            institution: 'จุฬาลงกรณ์มหาวิทยาลัย',
            gpa: 3.45,
            graduationYear: 2023,
            ocscAccredited: true,
          },
        ],
        ocscExams: [
          {
            paperLevel: 'LEVEL_3',
            paperName: 'ภาค ก. ปริญญาตรี',
            status: 'PASSED',
            score: 75,
            passedYear: 2023,
          },
        ],
        skills: ['การวิเคราะห์นโยบาย', 'กฎหมายมหาชน', 'ภาษาอังกฤษเพื่อการสื่อสาร'],
        careerReadinessScore: 85,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, profile: userProfile }),
      });

      const json = await res.json();
      if (json.success) {
        setAiAnalysis(json.data);
      }
    } catch (err) {
      console.error('Failed to analyze AI match:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Search Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-5 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                Sprint 9 Release
              </span>
              <span className="text-xs text-slate-400">Gov Job Search & Filter System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-400" />
              ระบบค้นหาและกรองตำแหน่งงานราชการ
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              รองรับการค้นหาจำแนกตาม จังหวัด, หน่วยงาน, ระดับการศึกษา, สาขาวิชา, ประเภทการจ้าง, เงินเดือน และวันปิดรับสมัคร
            </p>
          </div>

          {/* Realtime Query Source Toggle & Firestore Seed Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
              <button
                onClick={() => setDataSource('EXPRESS_API')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  dataSource === 'EXPRESS_API'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" /> Express API
              </button>

              <button
                onClick={() => setDataSource('REALTIME_FIRESTORE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  dataSource === 'REALTIME_FIRESTORE'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                Realtime Firestore {firestoreCount > 0 && `(${firestoreCount})`}
              </button>
            </div>

            {dataSource === 'REALTIME_FIRESTORE' && (
              <button
                onClick={handleSeedFirestore}
                disabled={syncingFirestore}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                title="ซิงค์/นำเข้าประกาศงานจำลองเข้าสู่คอลเลกชัน job_announcements ใน Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-spin' : ''}`} />
                {syncingFirestore
                  ? 'กำลังซิงค์...'
                  : firestoreSynced
                  ? 'ซิงค์สำเร็จ!'
                  : 'นำข้อมูลเข้า Firestore'}
              </button>
            )}
          </div>
        </div>

        {/* Primary Keyword Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่อตำแหน่ง, หน่วยงาน, ทักษะ, คำสำคัญ หรือข้อความประกาศ..."
              className="w-full pl-10 pr-10 py-3 text-xs bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all shrink-0 w-full sm:w-auto ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            ตัวกรองละเอียด
            {activeFiltersCount > 0 && (
              <span className="bg-white text-blue-700 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Preset Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">ทางลัดการกรอง:</span>
          <button
            onClick={() => setClosingFilter('CLOSING_SOON_7')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              closingFilter === 'CLOSING_SOON_7'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-rose-300 border border-rose-500/30 hover:bg-slate-700'
            }`}
          >
            🔥 ปิดรับสมัครด่วน (ภายใน 7 วัน)
          </button>
          <button
            onClick={() => setSelectedOcsc('LEVEL_3')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              selectedOcsc === 'LEVEL_3'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-blue-300 border border-blue-500/30 hover:bg-slate-700'
            }`}
          >
            🎓 ภาค ก. ปริญญาตรี
          </button>
          <button
            onClick={() => setSelectedEmploymentType('ข้าราชการพลเรือนสามัญ')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              selectedEmploymentType === 'ข้าราชการพลเรือนสามัญ'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700'
            }`}
          >
            💼 ข้าราชการสามัญ
          </button>
          <button
            onClick={() => setSelectedProvince('กรุงเทพมหานคร')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              selectedProvince === 'กรุงเทพมหานคร'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:bg-slate-700'
            }`}
          >
            📍 กรุงเทพมหานคร
          </button>
          <button
            onClick={() => setMinSalaryFilter(18000)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              minSalaryFilter === 18000
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-slate-700'
            }`}
          >
            💵 เงินเดือน 18,000+
          </button>
        </div>
      </div>

      {/* Expanded Multi-Facet Filters Drawer */}
      {showAdvancedFilters && (
        <div className="veriigo-card p-5 space-y-4 border border-blue-500/30 bg-slate-900/90 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              กำหนดตัวกรองหลายมิติ (Multi-Facet Filters)
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Province */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> จังหวัด / พื้นที่ปฏิบัติงาน
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {PROVINCE_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-slate-900 text-slate-100">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Agency / Ministry */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> หน่วยงาน / กระทรวง
              </label>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {AGENCY_OPTIONS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900 text-slate-100">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Education / Degree */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> ระดับการศึกษาที่ต้องการ
              </label>
              <select
                value={selectedDegree}
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-100">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Major / Field of Study */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> สาขาวิชาเอก / เมเจอร์
              </label>
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-100">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Employment Type */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" /> ประเภทการจ้างงาน
              </label>
              <select
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-slate-100">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. OCSC Exam Level */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> ระดับสอบ ภาค ก. ก.พ.
              </label>
              <select
                value={selectedOcsc}
                onChange={(e) => setSelectedOcsc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="" className="bg-slate-900 text-slate-100">ทุกระดับ ภาค ก.</option>
                <option value="LEVEL_3" className="bg-slate-900 text-slate-100">ภาค ก. ระดับ 3 (ปริญญาตรี)</option>
                <option value="LEVEL_4" className="bg-slate-900 text-slate-100">ภาค ก. ระดับ 4 (ปริญญาโท)</option>
                <option value="LEVEL_2" className="bg-slate-900 text-slate-100">ภาค ก. ระดับ 2 (ปวส.)</option>
                <option value="LEVEL_1" className="bg-slate-900 text-slate-100">ภาค ก. ระดับ 1 (ปวช.)</option>
              </select>
            </div>

            {/* 7. Salary Threshold */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" /> เงินเดือนขั้นต่ำ (บาท/เดือน)
              </label>
              <select
                value={minSalaryFilter}
                onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value={0} className="bg-slate-900 text-slate-100">ไม่จำกัดเงินเดือน</option>
                <option value={12000} className="bg-slate-900 text-slate-100">12,000 บาทขึ้นไป</option>
                <option value={15000} className="bg-slate-900 text-slate-100">15,000 บาทขึ้นไป (มาตรฐาน ป.ตรี)</option>
                <option value={18000} className="bg-slate-900 text-slate-100">18,000 บาทขึ้นไป</option>
                <option value={22000} className="bg-slate-900 text-slate-100">22,000 บาทขึ้นไป</option>
                <option value={28000} className="bg-slate-900 text-slate-100">28,000 บาทขึ้นไป</option>
              </select>
            </div>

            {/* 8. Closing Date Filter */}
            <div className="space-y-1">
              <label className="text-label flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> กำหนดวันปิดรับสมัคร
              </label>
              <select
                value={closingFilter}
                onChange={(e) => setClosingFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="ALL" className="bg-slate-900 text-slate-100">ทุกสถานะวันปิดรับสมัคร</option>
                <option value="ACTIVE_ONLY" className="bg-slate-900 text-slate-100">เฉพาะที่ยังเปิดรับสมัครอยู่</option>
                <option value="CLOSING_SOON_7" className="bg-slate-900 text-slate-100">ปิดรับสมัครด่วน (ภายใน 7 วัน)</option>
                <option value="CLOSING_SOON_30" className="bg-slate-900 text-slate-100">ปิดรับสมัครภายใน 30 วัน</option>
                <option value="EXPIRED" className="bg-slate-900 text-slate-100">ปิดรับสมัครแล้ว</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap veriigo-glass-panel p-3 border border-slate-800 text-xs shadow-md">
          <span className="font-bold text-slate-200 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-blue-400" /> ตัวกรองที่เปิดใช้ ({activeFiltersCount}):
          </span>

          {searchTerm && (
            <span className="bg-blue-950/80 text-blue-300 border border-blue-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              คำค้น: "{searchTerm}"
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchTerm('')} />
            </span>
          )}

          {selectedProvince && !selectedProvince.includes('ทุกจังหวัด') && (
            <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              จังหวัด: {selectedProvince}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedProvince('')} />
            </span>
          )}

          {selectedAgency && !selectedAgency.includes('ทุกหน่วยงาน') && (
            <span className="bg-sky-950/80 text-sky-300 border border-sky-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              หน่วยงาน: {selectedAgency}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedAgency('')} />
            </span>
          )}

          {selectedDegree && !selectedDegree.includes('ทุกระดับการศึกษา') && (
            <span className="bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              วุฒิ: {selectedDegree}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedDegree('')} />
            </span>
          )}

          {selectedMajor && !selectedMajor.includes('ทุกสาขาวิชา') && (
            <span className="bg-teal-950/80 text-teal-300 border border-teal-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              สาขา: {selectedMajor}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedMajor('')} />
            </span>
          )}

          {selectedEmploymentType && !selectedEmploymentType.includes('ทุกประเภทการจ้างงาน') && (
            <span className="bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              การจ้าง: {selectedEmploymentType}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedEmploymentType('')} />
            </span>
          )}

          {selectedOcsc && (
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              ภาค ก.: {selectedOcsc}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedOcsc('')} />
            </span>
          )}

          {minSalaryFilter > 0 && (
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              เงินเดือน &ge; {minSalaryFilter.toLocaleString()} บ.
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setMinSalaryFilter(0)} />
            </span>
          )}

          {closingFilter !== 'ALL' && (
            <span className="bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              วันปิด: {closingFilter === 'CLOSING_SOON_7' ? 'ภายใน 7 วัน' : closingFilter === 'CLOSING_SOON_30' ? 'ภายใน 30 วัน' : closingFilter === 'ACTIVE_ONLY' ? 'เปิดรับอยู่' : 'ปิดแล้ว'}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setClosingFilter('ALL')} />
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[11px] text-rose-400 font-bold hover:underline ml-auto"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* Database Error / Quota Exceeded Alert Banner */}
      {dbError && (
        <div className="bg-amber-950/90 border border-amber-600/70 rounded-xl p-4 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg my-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">ไม่สามารถตรวจสอบข้อมูลล่าสุดได้ ({dbError})</p>
              <p className="text-amber-300/80 mt-0.5">ขณะนี้ฐานข้อมูล Firestore อยู่ในสถานะ Quota Exceeded / Resource Exhausted ระบบปฏิเสธการใช้ข้อมูลจำลองตามข้อกำหนด Data Truth</p>
            </div>
          </div>
        </div>
      )}

      {/* Sorting & Result Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 veriigo-glass-panel p-4 rounded-xl border border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">
            {dbError ? (
              <span className="text-amber-400 font-extrabold text-xs sm:text-sm">ไม่สามารถตรวจสอบจำนวนประกาศล่าสุดได้ (DATABASE UNAVAILABLE)</span>
            ) : (
              <>พบทั้งหมด <strong className="text-blue-400 text-sm font-extrabold">{dataSource === 'EXPRESS_API' && activeFiltersCount === 0 ? (apiTotal || processedJobs.length) : processedJobs.length}</strong> ประกาศตำแหน่งงาน</>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-medium">
            แหล่งข้อมูล: {dataSource === 'REALTIME_FIRESTORE' ? '⚡ Firestore Database (Realtime)' : '🚀 Express Server API'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Items per page selector */}
          <div className="flex items-center gap-1 text-slate-300">
            <span>แสดง:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 outline-none font-bold text-slate-100"
            >
              <option value={6} className="bg-slate-900">6 รายการ / หน้า</option>
              <option value={12} className="bg-slate-900">12 รายการ / หน้า</option>
              <option value={24} className="bg-slate-900">24 รายการ / หน้า</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 outline-none font-bold text-slate-100"
            >
              <option value="deadline_asc" className="bg-slate-900">📅 วันปิดรับสมัคร (เร็วสุด - ช้าสุด)</option>
              <option value="deadline_desc" className="bg-slate-900">📅 วันปิดรับสมัคร (ช้าสุด - เร็วสุด)</option>
              <option value="salary_desc" className="bg-slate-900">💰 เงินเดือนสูงสุด (มากไปน้อย)</option>
              <option value="salary_asc" className="bg-slate-900">💰 เงินเดือนเริ่มต้น (น้อยไปมาก)</option>
              <option value="created_desc" className="bg-slate-900">🆕 ประกาศลงใหม่ล่าสุด</option>
              <option value="title_asc" className="bg-slate-900">🔤 ชื่อตำแหน่ง (ก-ฮ)</option>
              <option value="vacancies_desc" className="bg-slate-900">👥 จำนวนอัตราที่เปิดรับ (มากไปน้อย)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Job Cards Grid */}
      {(() => {
        console.log('React State jobs.length:', jobs.length);
        return null;
      })()}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-800/50 animate-pulse rounded-2xl border border-slate-800"></div>
          ))}
        </div>
      ) : processedJobs.length === 0 ? (
        <div className="veriigo-card p-12 text-center space-y-4">
          <Building2 className="w-16 h-16 text-slate-500 mx-auto" />
          <h4 className="text-lg font-bold text-slate-100">ไม่พบประกาศงานที่ตรงตามเงื่อนไขที่กำหนด</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกด "ล้างตัวกรองทั้งหมด" เพื่อเรียกดูตำแหน่งงานทั้งหมดที่มีในระบบ
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            ล้างตัวกรองเพื่อค้นหาใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentPaginatedJobs.map((job, idx) => {
            const isClosingSoon = new Date(job.deadline).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={job.id}
                data-job-card="true"
                className="veriigo-card p-5 space-y-4 hover:border-blue-500/50 hover:shadow-xl transition-all flex flex-col justify-between border border-slate-800 rounded-2xl bg-slate-900/80 relative"
              >
                {isClosingSoon && (
                  <span className="absolute top-3 right-3 bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-400" /> ด่วน! ปิดเร็วๆ นี้
                  </span>
                )}

                <div className="space-y-3">
                  {/* Agency Header - Task 5 Priority: Largest, Bold, High Contrast Agency Title */}
                  <div className="space-y-1.5 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-blue-300 bg-blue-900/50 border border-blue-700/60 px-2.5 py-0.5 rounded-full">
                        {job.ministry}
                      </span>
                    </div>

                    {/* Agency Name */}
                    <h3 className="job-agency-title text-slate-100 font-bold text-base hover:text-blue-400 transition-colors flex items-center gap-1.5 pt-0.5">
                      <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="line-clamp-1">{job.agencyName}</span>
                    </h3>

                    {/* Job Position Title */}
                    <p className="job-position-title text-blue-400 font-semibold text-sm line-clamp-1">
                      {job.title}
                    </p>
                  </div>

                  {/* Province / Location */}
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold text-slate-200 line-clamp-1">
                      {job.province ? `จังหวัด${job.province}` : job.location}
                    </span>
                  </div>

                  {/* Specs Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block font-medium">อัตราเงินเดือน:</span>
                      <strong className="text-emerald-400 font-bold">
                        {(job.salaryMin ?? 0).toLocaleString()} - {(job.salaryMax ?? 0).toLocaleString()} บ.
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">จำนวนอัตรา:</span>
                      <strong className="text-slate-100 font-bold">{job.vacanciesCount ?? 1} อัตรา</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">ระดับการศึกษา:</span>
                      <strong className="text-slate-200 font-semibold">
                        {Array.isArray(job.degreeRequired) ? job.degreeRequired.join(', ') : (job.degreeRequired || 'ปริญญาตรี')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">ประเภทการจ้าง:</span>
                      <strong className="text-slate-200 font-semibold">{job.positionType || 'ข้าราชการพลเรือนสามัญ'}</strong>
                    </div>
                  </div>

                  {/* Tags & Majors Allowed */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {Array.isArray(job.majorsAllowed) && job.majorsAllowed.length > 0 && (
                      <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-md font-bold">
                        🎓 {job.majorsAllowed[0]}
                      </span>
                    )}
                    {Array.isArray(job.tags) && job.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> ปิดรับ {job.deadline ? new Date(job.deadline).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                  </span>

                  <button
                    onClick={() => {
                      setModalJob(job);
                      handleRunAiAnalysis(job);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && processedJobs.length > 0 && (
        <div className="veriigo-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 text-xs bg-slate-900/90">
          <div className="text-slate-300 font-medium">
            แสดงรายการที่ <strong className="text-slate-100 font-bold">{startIndex + 1}</strong> ถึง{' '}
            <strong className="text-slate-100 font-bold">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            จากทั้งหมด <strong className="text-blue-400 font-bold">{totalItems}</strong> รายการ (หน้า{' '}
            {currentPage} จาก {totalPages})
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition-all font-bold"
              title="หน้าถอยหลัง"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition-all font-bold"
              title="หน้าถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Job Detail & AI Analysis Modal */}
      {modalJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative text-slate-100 space-y-5">
            <button
              onClick={() => {
                setModalJob(null);
                setAiAnalysis(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-900/50 border border-blue-700/60 text-blue-400 flex items-center justify-center font-bold text-xl shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-300 bg-blue-900/50 border border-blue-700/60 px-2.5 py-0.5 rounded-full">
                  {modalJob.ministry || 'หน่วยงานภาครัฐ'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 mt-1">{modalJob.title || 'ประกาศรับสมัครงาน'}</h3>
                <p className="text-xs font-semibold text-slate-300">{modalJob.agencyName || ''}</p>
              </div>
            </div>

            {/* Job Details Quick Specs Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block font-medium">อัตราเงินเดือน</span>
                <strong className="text-emerald-400 font-bold">
                  {(modalJob.salaryMin ?? 0).toLocaleString()} - {(modalJob.salaryMax ?? 0).toLocaleString()} บ.
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">จำนวนรับสมัคร</span>
                <strong className="text-slate-100 font-bold">{modalJob.vacanciesCount ?? 1} อัตรา</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ประเภทตำแหน่ง</span>
                <strong className="text-slate-200 font-bold">{modalJob.positionType || 'ข้าราชการพลเรือนสามัญ'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ปิดรับสมัคร</span>
                <strong className="text-rose-400 font-bold">
                  {modalJob.deadline ? new Date(modalJob.deadline).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </strong>
              </div>
            </div>

            {/* Location & Major Details */}
            <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-bold text-slate-200">สถานที่ปฏิบัติงาน:</span>
                <span className="text-slate-300">{modalJob.province ? `จังหวัด${modalJob.province}` : (modalJob.location || 'กรุงเทพมหานคร')}</span>
              </div>
              {Array.isArray(modalJob.majorsAllowed) && modalJob.majorsAllowed.length > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-slate-200">สาขาวิชาเอกที่เปิดรับ:</span>
                  <span className="text-purple-300 font-semibold">{modalJob.majorsAllowed.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Official Requirements Text */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                คุณสมบัติเฉพาะสำหรับตำแหน่งตามประกาศ ก.พ.
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                {modalJob.requirementsText || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม'}
              </p>
            </div>

            {/* AI Gap Analysis Card Section */}
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 rounded-2xl p-5 text-white space-y-4 border border-blue-900/60 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-100">บทวิเคราะห์ AI Qualification Matcher (VERIIGO)</h4>
                </div>
                {aiAnalysis && <AIMatchRing score={aiAnalysis.score || 80} size="sm" showLabel={false} />}
              </div>

              {analyzing ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-blue-200">กำลังประมวลผลเปรียบเทียบวุฒิกับประกาศ ก.พ. ...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3 text-xs">
                  <p className="text-blue-100 bg-blue-950/60 p-3 rounded-xl border border-blue-800/60 leading-relaxed">
                    {aiAnalysis.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> จุดเด่นของคุณสมบัติ
                      </span>
                      <ul className="list-disc list-inside text-emerald-200 text-[11px] space-y-0.5">
                        {(aiAnalysis.qualificationHighlights || []).map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-950/60 border border-amber-800/60 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> ข้อควรเตรียมตัวเพิ่มเติม
                      </span>
                      <ul className="list-disc list-inside text-amber-200 text-[11px] space-y-0.5">
                        {(aiAnalysis.gapPoints || []).map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleRunAiAnalysis(modalJob)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl transition-colors shadow"
                >
                  กดรันการวิเคราะห์ AI Gap Analysis
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={modalJob.applicationUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                ไปยังเว็บสมัครรับราชการอย่างเป็นทางการ <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <button
                onClick={() => {
                  onNavigateToAI(modalJob);
                  setModalJob(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                เปิดใน AI Intelligence Center <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
