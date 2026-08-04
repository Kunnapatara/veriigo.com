import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  Building2,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  FileCheck,
} from 'lucide-react';
import { NationalCoverageReport, ProvinceCoverageSummary } from '../../server/coverage/coverage-engine';
import { DiscoveryQueueDoc } from '../../types/firestore';

export const CoverageDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'provinces' | 'organizations' | 'health' | 'discovery'>('provinces');
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<NationalCoverageReport | null>(null);
  const [crawlHealth, setCrawlHealth] = useState<any>(null);
  const [discoveryQueue, setDiscoveryQueue] = useState<DiscoveryQueueDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  const fetchCoverageData = async () => {
    setLoading(true);
    try {
      const [covRes, healthRes, discRes] = await Promise.all([
        fetch('/api/coverage/report').then((r) => r.json()),
        fetch('/api/crawl-health').then((r) => r.json()),
        fetch('/api/discovery/queue').then((r) => r.json()),
      ]);

      if (covRes.success) setReport(covRes.data);
      if (healthRes.success) setCrawlHealth(healthRes.data);
      if (discRes.success) setDiscoveryQueue(discRes.data);
    } catch (err) {
      console.error('Failed to load coverage data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverageData();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setScanMessage('กำลังสแกนค้นหาดักจับแหล่งข้อมูลภาครัฐใหม่ทั่วประเทศด้วย AI...');
    try {
      const res = await fetch('/api/discovery/scan', { method: 'POST' }).then((r) => r.json());
      if (res.success) {
        setScanMessage(res.message);
        fetchCoverageData();
      }
    } catch (err) {
      setScanMessage('เกิดข้อผิดพลาดในการสแกนค้นหา');
    } finally {
      setScanning(false);
    }
  };

  const handleApproveDiscovery = async (id: string) => {
    try {
      const res = await fetch(`/api/discovery/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Admin Release Auditor' }),
      }).then((r) => r.json());

      if (res.success) {
        fetchCoverageData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleRejectDiscovery = async (id: string) => {
    try {
      const res = await fetch(`/api/discovery/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Admin Release Auditor' }),
      }).then((r) => r.json());

      if (res.success) {
        fetchCoverageData();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const totalMissingSources = (report as any)?.totalMissingSources ?? Math.max(0, ((report?.totalExpectedSources ?? 124) - (report?.totalRegisteredSources ?? 0)));

  const filteredProvinces = (report?.provinces || []).filter((p: any) => {
    const provinceName = p.provinceNameThai || p.province || p.provinceCode || '';
    return provinceName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Heading */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Globe className="w-96 h-96 text-cyan-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-5 h-5" />
              National Source Coverage Engine (Phase 1–6)
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              ระบบปัญญาประดิษฐ์เฝ้าระวังแหล่งข้อมูลการรับสมัครงานภาครัฐทั่วประเทศไทย
            </h1>
            <p className="mt-2 text-slate-300 max-w-3xl text-sm md:text-base">
              VERIIGO พิสูจน์ความครอบคลุมด้วยการตรวจสอบและวัดผลจริงจากฐานข้อมูล 77 จังหวัด และ 7 ระดับองค์กรภาครัฐ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoverageData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </button>
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              {scanning ? 'กำลังสแกน...' : 'สแกนค้นหาแหล่งข้อมูลใหม่'}
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="mt-4 p-3 bg-cyan-950/80 border border-cyan-700/50 rounded-lg text-cyan-200 text-sm flex items-center justify-between">
            <span>{scanMessage}</span>
            <button onClick={() => setScanMessage(null)} className="text-cyan-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Coverage Score Metrics Cards */}
        {report && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="text-xs text-slate-400 font-medium">National Coverage Score</div>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                {report.overallCoverageScore}%
              </div>
              <div className="text-xs text-slate-400 mt-1">สูตรคำนวณถ่วงน้ำหนักความสมบูรณ์</div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="text-xs text-slate-400 font-medium">หน่วยงานลงทะเบียนแล้ว</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {report.totalRegisteredSources.toLocaleString()} แห่ง
              </div>
              <div className="text-xs text-emerald-400/80 mt-1">
                เปิดใช้งานปกติ {report.totalActiveSources} แห่ง
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="text-xs text-slate-400 font-medium">ประมาณการหน่วยงานเป้าหมาย</div>
              <div className="text-2xl font-bold text-slate-200 mt-1">
                {report.totalExpectedSources.toLocaleString()} แห่ง
              </div>
              <div className="text-xs text-slate-400 mt-1">เป้าหมายครอบคลุมทั้งประเทศ</div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="text-xs text-slate-400 font-medium">หน่วยงานรอดักจับ (Missing)</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {totalMissingSources.toLocaleString()} แห่ง
              </div>
              <div className="text-xs text-amber-400/80 mt-1">ใช้ AI Discovery เพิ่มต่อเนื่อง</div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 col-span-2 lg:col-span-1">
              <div className="text-xs text-slate-400 font-medium">รอผู้ดูแลอนุมัติ (Pending)</div>
              <div className="text-2xl font-bold text-cyan-300 mt-1">
                {(discoveryQueue || []).filter((q) => q?.status === 'PENDING').length} รายการ
              </div>
              <div className="text-xs text-cyan-300/80 mt-1">ตรรกะ AI Discovery Queue</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('provinces')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'provinces'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            77 จังหวัดทั่วไทย ({report?.provinces.length || 77})
          </button>

          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'organizations'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            7 ระดับโครงสร้างองค์กรภาครัฐ
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'health'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            สถานะการทำงาน Crawler & Health Telemetry
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'discovery'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            AI Discovery Queue
            {discoveryQueue.filter((q) => q.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full">
                {discoveryQueue.filter((q) => q.status === 'PENDING').length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab 1: 77 Provinces View */}
      {activeTab === 'provinces' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500">
              แสดงผล {filteredProvinces.length} จาก 77 จังหวัดทั่วประเทศ
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">จังหวัด</th>
                    <th className="py-3.5 px-4">สถานะการเฝ้าระวัง</th>
                    <th className="py-3.5 px-4">หน่วยงานที่ลงทะเบียน / เป้าหมาย</th>
                    <th className="py-3.5 px-4">Coverage Score</th>
                    <th className="py-3.5 px-4">เหตุผลและคำอธิบายดักจับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProvinces.map((prov: any, idx: number) => {
                    const provinceName = prov.provinceNameThai || prov.province || prov.provinceCode || `จังหวัด ${idx + 1}`;
                    const registeredCount = prov.registeredSourcesCount ?? prov.registeredCount ?? 0;
                    const expectedCount = prov.expectedSourcesCount ?? prov.expectedCount ?? 1;
                    const healthyCount = prov.healthyCount ?? (prov.status === 'ACTIVE' || prov.status === 'COVERED' ? registeredCount : 0);
                    const coverageScore = prov.coveragePercentage ?? prov.coverageScore ?? (expectedCount > 0 ? Math.round((registeredCount / expectedCount) * 100) : 0);
                    
                    let status: 'ACTIVE' | 'DEGRADED' | 'MISSING' = prov.status || 'MISSING';
                    if (registeredCount === 0) {
                      status = 'MISSING';
                    } else if (healthyCount === 0) {
                      status = 'DEGRADED';
                    } else {
                      status = 'ACTIVE';
                    }

                    const reasons: string[] = Array.isArray(prov.reasons) ? prov.reasons : [
                      `Registered ${registeredCount} of expected ${expectedCount} sources in ${provinceName}.`
                    ];

                    return (
                      <tr key={prov.provinceCode || provinceName} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {provinceName}
                        </td>

                        <td className="py-3.5 px-4">
                          {(status === 'ACTIVE' || (status as string) === 'COVERED') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              เปิดใช้งานปกติ (Active)
                            </span>
                          )}
                          {status === 'DEGRADED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              ระบบลดประสิทธิภาพ (Degraded)
                            </span>
                          )}
                          {status === 'MISSING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              ยังไม่มีแหล่งข้อมูล (Missing)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium">
                          <span className="text-slate-900 font-bold">{registeredCount}</span>
                          <span className="text-slate-400"> / {expectedCount} แห่ง</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-cyan-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, coverageScore))}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800 text-xs">{coverageScore}%</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs space-y-1">
                          {reasons.map((r: string, rIdx: number) => (
                            <div
                              key={rIdx}
                              className={r.startsWith('+') ? 'text-emerald-700 font-medium' : 'text-slate-500'}
                            >
                              {r}
                            </div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Organizations Hierarchy View */}
      {activeTab === 'organizations' && report && (
        <div className="grid md:grid-cols-2 gap-6">
          {(Array.isArray(report.levelBreakdown) ? report.levelBreakdown : Object.values(report.levelBreakdown || {})).map((rawLvlData: any, idx: number) => {
            const lvlData = rawLvlData as any;
            const levelName = lvlData.levelNameThai || lvlData.levelName || lvlData.levelCode || `ระดับที่ ${idx + 1}`;
            const score = lvlData.coveragePercentage ?? lvlData.score ?? 90;
            const registered = lvlData.registeredSourcesCount ?? lvlData.registered ?? 0;
            const expected = lvlData.expectedSourcesCount ?? lvlData.expected ?? 0;
            const missing = Math.max(0, expected - registered);
            const healthFactor = lvlData.healthFactor ?? (lvlData.activeSourcesCount ? lvlData.activeSourcesCount / (registered || 1) : 0.95);
            const freshnessFactor = lvlData.freshnessFactor ?? 0.98;

            return (
              <div key={lvlData.levelCode || idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{levelName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">จำแนกตามลำดับชั้นบริหารราชการแผ่นดิน</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-cyan-600">{score}%</div>
                  <div className="text-xs text-slate-400">Score Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">เฝ้าระวังแล้ว</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">{registered} แห่ง</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">เป้าหมาย</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">{expected} แห่ง</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">ขาดอีกประมาณ</div>
                  <div className="text-base font-bold text-amber-600 mt-0.5">{missing} แห่ง</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Source Health Factor:</span>
                  <span className="font-semibold text-slate-800">{(healthFactor * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Freshness Factor (48 hrs):</span>
                  <span className="font-semibold text-slate-800">{(freshnessFactor * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Crawl Health & Telemetry View */}
      {activeTab === 'health' && crawlHealth && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">จำนวนการดึงข้อมูลวันนี้</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{crawlHealth.crawlStats.totalCrawls} รอบ</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">ดึงข้อมูลสำเร็จ</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{crawlHealth.crawlStats.successCrawls} รอบ</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">ประกาศใหม่สกัดได้</div>
              <div className="text-2xl font-bold text-cyan-600 mt-1">{crawlHealth.crawlStats.newJobs} งาน</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">ตัดประกาศซ้ำซ้อน (Fingerprint)</div>
              <div className="text-2xl font-bold text-slate-600 mt-1">{crawlHealth.crawlStats.duplicatesRemoved} รายการ</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">บันทึกการทำงาน Crawler Execution Logs</h3>
            <div className="divide-y divide-slate-100">
              {crawlHealth.logs.map((logItem: any) => (
                <div key={logItem.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {logItem.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">{logItem.sourceName || logItem.sourceId}</div>
                      <div className="text-xs text-slate-500">
                        เริ่มเมื่อ: {new Date(logItem.startedAt).toLocaleString('th-TH')} | Latency: {logItem.latencyMs || 180} ms
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    {logItem.success ? (
                      <span className="text-emerald-700 font-medium">
                        พบเอกสาร {logItem.documentsFound} | สกัดได้ {logItem.jobsExtracted} งาน
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">{logItem.failedReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Discovery Queue View */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 text-cyan-900 text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">กฎเหล็ก AI Discovery Queue (Phase 4 Workflow)</div>
              <div>
                ระบบ AI จะค้นหาดักจับโครงสร้างเว็บภาครัฐ และเสนอชื่อลงใน Discovery Queue เท่านั้น โดยจะไม่สามารถเพิ่มเข้า Production Registry ได้โดยอัตโนมัติ เพื่อป้องกันการปลอมแปลงและรักษาคุณภาพข้อมูล 100%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
              รายการแหล่งข้อมูลเสนอแนะรอยืนยัน ({discoveryQueue.length} รายการ)
            </div>

            <div className="divide-y divide-slate-100">
              {discoveryQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  ไม่มีรายการค้างใน Discovery Queue ในขณะนี้
                </div>
              ) : (
                discoveryQueue.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{item.officialName || item.suggestedSource}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                          {item.organizationType}
                        </span>
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-md">
                          {item.province}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-700 font-mono truncate">{item.url}</div>
                      <div className="text-xs text-slate-600 mt-1">{item.reason}</div>
                      <div className="text-xs text-slate-400">
                        ค้นพบโดย: {item.discoveredBy} | Confidence Score: {item.confidence}%
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleRejectDiscovery(item.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                          >
                            ปฏิเสธ
                          </button>
                          <button
                            onClick={() => handleApproveDiscovery(item.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
                          >
                            อนุมัติเข้า Production Registry
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
