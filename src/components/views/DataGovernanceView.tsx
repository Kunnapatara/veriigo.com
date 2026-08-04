import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Database,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Award,
  Globe,
  FileCheck,
  MapPin,
  TrendingUp,
  Layers,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { FullGovernanceAuditResult } from '../../server/governance/data-governance-engine';
import { OFFICIAL_ORGANIZATION_TYPES } from '../../data/government-source-taxonomy';

export const DataGovernanceView: React.FC = () => {
  const [auditData, setAuditData] = useState<FullGovernanceAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'taxonomy' | 'coverage' | 'quality' | 'trust'>('taxonomy');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/governance/audit');
      const json = await res.json();
      if (json.success && json.audit) {
        setAuditData(json.audit);
      }
    } catch (err) {
      console.error('Failed to fetch data governance audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/governance/recalculate', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.audit) {
        setAuditData(json.audit);
      }
    } catch (err) {
      console.error('Failed to recalculate governance audit:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const filteredProvinces = (auditData?.taxonomyCoverage.provinceBreakdown || []).filter((item) => {
    const matchesSearch = item.province.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              STATUS: {auditData?.governanceStatus || 'DATA GOVERNANCE READY'}
            </span>
            <span className="text-xs text-slate-400 font-mono">VERIIGO Governance v2.4</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            ธรรมาภิบาลข้อมูลแหล่งรับสมัครงานภาครัฐ (National Data Governance)
          </h1>
          <p className="text-slate-400 text-sm">
            ระบบบริหารจัดการความน่าเชื่อถือ ตรวจสอบมาตรฐานโดเมนราชการ ความครอบคลุม 77 จังหวัด และประเมิน Trust Score รายหน่วยงาน
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating || isLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'กำลังคำนวณ Audit...' : 'คำนวณ Governance Audit ใหม่'}
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">แหล่งข้อมูลในระบบ</span>
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{auditData?.inventory.totalSources || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">({auditData?.inventory.realCount || 0} Real Active)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Seed: {auditData?.inventory.seedCount || 0}</span>
            <span>Test: {auditData?.inventory.testCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ความครอบคลุมระดับชาติ</span>
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400 font-mono">{auditData?.taxonomyCoverage.overallCoveragePercent || 0}%</span>
            <span className="text-xs text-slate-400 font-mono">({auditData?.taxonomyCoverage.totalRegistered || 0} / {auditData?.taxonomyCoverage.totalNationalExpected || 0})</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/60 pt-2">
            เป้าหมายฐานข้อมูลตามกฎหมาย 1,811 เว็บไซต์
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ระดับความน่าเชื่อถือเฉลี่ย</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400 font-mono">{auditData?.taxonomyCoverage.overallConfidencePercent || 0} / 100</span>
            <span className="text-xs text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded font-medium">PLATINUM</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/60 pt-2">
            คำนวณจาก 4 เสาหลัก (Authority, Freshness, Uptime, Quality)
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ข้อบกพร่องด้านคุณภาพ</span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400 font-mono">{auditData?.qualityEngine.totalQualityIssues || 0}</span>
            <span className="text-xs text-slate-400">รายการที่ต้องเฝ้าระวัง</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/60 pt-2 flex justify-between">
            <span>โดเมนหมดอายุ: {auditData?.qualityEngine.expiredDomains.length || 0}</span>
            <span>ไม่สอดคล้อง: {auditData?.qualityEngine.nonOfficialDomains.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('taxonomy')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'taxonomy'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. อนุกรมวิธานแห่งชาติ (National Taxonomy)
        </button>

        <button
          onClick={() => setActiveSubTab('coverage')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'coverage'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          2. รายงานความครอบคลุม 77 จังหวัด (Province Coverage)
        </button>

        <button
          onClick={() => setActiveSubTab('quality')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'quality'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          3. เครื่องมือตรวจสอบคุณภาพข้อมูล (Data Quality Engine)
        </button>

        <button
          onClick={() => setActiveSubTab('trust')}
          className={`px-4 py-2.5 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'trust'
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          4. ดัชนีความน่าเชื่อถือ (Source Trust Score)
        </button>
      </div>

      {/* TAB 1: NATIONAL TAXONOMY */}
      {activeSubTab === 'taxonomy' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              มาตรฐานประเภทองค์กรภาครัฐและโดเมนตามกฎหมาย (Statutory Government Types)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFICIAL_ORGANIZATION_TYPES.map((org) => (
                <div key={org.code} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{org.titleThai}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-mono rounded">
                      {org.level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{org.titleEnglish}</div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="text-slate-400">โดเมนทางการ:</span>
                    {org.officialDomainSuffixes.map((suff) => (
                      <span key={suff} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-mono">
                        {suff}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{org.statutoryReference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVINCE COVERAGE GOVERNANCE */}
      {activeSubTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อจังหวัด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>ภูมิภาค:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">ทุกภูมิภาค</option>
                <option value="CENTRAL">กรุงเทพฯ / ส่วนกลาง</option>
                <option value="NORTHERN">ภาคเหนือ</option>
                <option value="NORTHEASTERN">ภาคอีสาน</option>
                <option value="SOUTHERN">ภาคใต้</option>
                <option value="EASTERN">ภาคตะวันออก</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5">จังหวัด</th>
                    <th className="px-4 py-3.5">เป้าหมาย (Expected)</th>
                    <th className="px-4 py-3.5">ลงทะเบียนแล้ว</th>
                    <th className="px-4 py-3.5">ใช้งานจริง (Active)</th>
                    <th className="px-4 py-3.5">ยังขาดอีก (Gap)</th>
                    <th className="px-4 py-3.5">Coverage Score</th>
                    <th className="px-4 py-3.5">Confidence Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProvinces.slice(0, 25).map((item) => (
                    <tr key={item.province} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        {item.province}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{item.expected} แห่ง</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{item.registered} แห่ง</td>
                      <td className="px-4 py-3 font-mono text-blue-400">{item.active} แห่ง</td>
                      <td className="px-4 py-3 font-mono text-amber-400">{item.missing} แห่ง</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, item.coverageScore))}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold">{item.coverageScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-mono font-semibold">
                          {item.confidenceScore} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA QUALITY ENGINE */}
      {activeSubTab === 'quality' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                การตรวจสอบแหล่งข้อมูลซ้ำซ้อน (Deduplication Check)
              </h3>
              {auditData?.qualityEngine.duplicateSources.length === 0 ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  ไม่พบรายการแหล่งข้อมูลซ้ำซ้อนในระบบ (0 Duplicate Defects)
                </div>
              ) : (
                <div className="space-y-2">
                  {auditData?.qualityEngine.duplicateSources.map((d, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300">
                      <div><strong className="text-amber-400">พบซ้ำ:</strong> {d.reason}</div>
                      <div className="text-slate-400 font-mono">ID A: {d.sourceIdA} | ID B: {d.sourceIdB}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                การตรวจสอบความถูกต้องของโดเมนราชการ (Domain Legitimacy)
              </h3>
              {auditData?.qualityEngine.nonOfficialDomains.length === 0 ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  ทุกแหล่งข้อมูลที่ลงทะเบียนผ่านการรับรองโดเมนภาครัฐ (.go.th / .ac.th)
                </div>
              ) : (
                <div className="space-y-2">
                  {auditData?.qualityEngine.nonOfficialDomains.map((item) => (
                    <div key={item.sourceId} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                      <div><strong>{item.name}</strong></div>
                      <div className="font-mono text-slate-400">{item.url}</div>
                      <div className="text-rose-400">โดเมนไม่ได้สืบทอดจาก TLD ทางการ: {item.domain}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRUST SCORE LEADERBOARD */}
      {activeSubTab === 'trust' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            ตารางจัดอันดับดัชนีความน่าเชื่อถือแหล่งข้อมูล (Source Trust Score Leaderboard)
          </h2>
          <div className="space-y-3">
            {auditData?.trustScores.map((ts) => (
              <div key={ts.sourceId} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{ts.sourceName}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-mono rounded-full font-semibold">
                      {ts.trustTier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>จังหวัด: {ts.province}</span>
                    <span>•</span>
                    <span>ระดับ: {ts.governmentLevel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Authority</div>
                      <div className="font-mono font-bold text-emerald-400">{ts.pillars.authorityScore}/35</div>
                    </div>
                    <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Freshness</div>
                      <div className="font-mono font-bold text-blue-400">{ts.pillars.freshnessScore}/25</div>
                    </div>
                    <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Uptime</div>
                      <div className="font-mono font-bold text-indigo-400">{ts.pillars.availabilityScore}/20</div>
                    </div>
                    <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Quality</div>
                      <div className="font-mono font-bold text-amber-400">{ts.pillars.documentQualityScore}/20</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-amber-400">{ts.totalTrustScore}</div>
                    <div className="text-[10px] text-slate-400">คะแนนเต็ม 100</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
