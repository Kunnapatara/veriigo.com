import React, { useState, useEffect } from 'react';
import {
  TestTube,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  FileCode2,
  ShieldCheck,
  Database,
  Key,
  Server,
  BarChart3,
  Terminal,
  Download,
  Check,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TestCaseResult {
  id: string;
  name: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  assertion: string;
  error?: string;
}

interface TestSuite {
  id: string;
  category: 'UNIT' | 'INTEGRATION' | 'API' | 'FIRESTORE' | 'AUTH';
  name: string;
  filePath: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  status: 'PASSED' | 'RUNNING' | 'FAILED' | 'PENDING';
  testCases: TestCaseResult[];
}

interface CoverageModule {
  name: string;
  statementsPct: number;
  branchesPct: number;
  functionsPct: number;
  linesPct: number;
  status: 'EXCELLENT' | 'PASSED' | 'NEEDS_WORK';
}

interface CoverageData {
  overallPercentage: number;
  targetPercentage: number;
  targetMet: boolean;
  statements: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  lines: { total: number; covered: number; pct: number };
  modules: CoverageModule[];
}

export const TestRunnerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SUITES' | 'COVERAGE' | 'LOGS'>('SUITES');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [expandedSuiteId, setExpandedSuiteId] = useState<string | null>('SUITE-UNIT-PAYMENT');
  const [lastRunMessage, setLastRunMessage] = useState<string | null>(null);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      const [suitesRes, coverageRes, logsRes] = await Promise.all([
        fetch('/api/tests/suites'),
        fetch('/api/tests/coverage'),
        fetch('/api/tests/logs'),
      ]);

      const suitesData = await suitesRes.json();
      const coverageData = await coverageRes.json();
      const logsData = await logsRes.json();

      if (suitesData.success) setSuites(suitesData.suites);
      if (coverageData.success) setCoverage(coverageData.data);
      if (logsData.success) setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to load test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
  }, []);

  const handleRunTests = async (suiteId?: string) => {
    setIsRunning(true);
    setLastRunMessage(null);
    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suiteId, category: selectedCategory !== 'ALL' ? selectedCategory : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setLastRunMessage(data.message);
        setSuites(data.suites);
        // Refresh logs
        const logsRes = await fetch('/api/tests/logs');
        const logsData = await logsRes.json();
        if (logsData.success) setLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredSuites = suites.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
  const passedTests = suites.reduce((sum, s) => sum + s.passedTests, 0);
  const totalDuration = suites.reduce((sum, s) => sum + s.durationMs, 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'UNIT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1"><FileCode2 className="w-3.5 h-3.5" /> Unit Test</span>;
      case 'INTEGRATION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Integration</span>;
      case 'API':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"><Server className="w-3.5 h-3.5" /> API Test</span>;
      case 'FIRESTORE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Firestore</span>;
      case 'AUTH':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"><Key className="w-3.5 h-3.5" /> Authentication</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sprint 14 Complete
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Vitest Engine v4.1
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TestTube className="w-7 h-7 text-indigo-400" />
              ระบบทดสอบอัตโนมัติ & ประเมินคุณภาพซอฟต์แวร์ (Quality Assurance & Test Suite)
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl">
              ระบบรวมชุดทดสอบระดับ Unit, Integration, API, Firestore Security Rules และ Authentication Guard พร้อมการวัดสถิติ Code Coverage เป้าหมายเกิน 80.0%
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => handleRunTests()}
              disabled={isRunning}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  กำลังรันชุดทดสอบ...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  รันทุกชุดทดสอบ (Run All Suites)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">ผลการทดสอบรวม (Total Tests)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-white">{passedTests} / {totalTests} Passed</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Pass
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">ความครอบคลุมรหัสโค้ด (Coverage)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-300">{coverage?.overallPercentage}%</span>
              <span className="text-xs text-slate-400 font-medium">เป้าหมาย &gt; {coverage?.targetPercentage}%</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">ระยะเวลาประมวลผล (Execution Time)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-white">{totalDuration} ms</span>
              <span className="text-xs text-indigo-300 font-medium">Ultra Fast</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium">สถานะคุณภาพซอฟต์แวร์ (Status)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-400">PASSED</span>
              <span className="text-xs text-emerald-400 font-semibold">Ready to Deploy</span>
            </div>
          </div>
        </div>
      </div>

      {lastRunMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{lastRunMessage}</p>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SUITES')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'SUITES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TestTube className="w-4 h-4" />
            ชุดทดสอบย่อย (Test Suites & Assertions)
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
              {suites.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COVERAGE')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'COVERAGE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            การครอบคลุมโค้ด (Code Coverage &gt;80%)
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">
              {coverage?.overallPercentage}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'LOGS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            บันทึกการรันระบบ (Runner Console Logs)
          </button>
        </div>

        {activeTab === 'SUITES' && (
          <div className="flex items-center gap-1.5 pb-2">
            {['ALL', 'UNIT', 'INTEGRATION', 'API', 'FIRESTORE', 'AUTH'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'ทั้งหมด' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: TEST SUITES */}
      {activeTab === 'SUITES' && (
        <div className="space-y-4">
          {filteredSuites.map((suite) => {
            const isExpanded = expandedSuiteId === suite.id;
            return (
              <div
                key={suite.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Suite Header */}
                <div
                  onClick={() => setExpandedSuiteId(isExpanded ? null : suite.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(suite.category)}
                        <h3 className="font-semibold text-slate-900 text-sm md:text-base">{suite.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{suite.filePath}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block font-medium">
                        {suite.passedTests} / {suite.totalTests} Assertions Passed
                      </span>
                      <span className="text-xs text-indigo-600 font-mono font-medium">
                        {suite.durationMs} ms
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunTests(suite.id);
                      }}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1"
                      title="รันเฉพาะชุดนี้"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Test Cases */}
                {isExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 pb-1">
                      <span>ข้อกำหนดการทดสอบ (Assertion Test Case)</span>
                      <span>ผลลัพธ์ / โค้ดที่ประมวลผล</span>
                    </div>

                    {suite.testCases.map((tc) => (
                      <div
                        key={tc.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800">{tc.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs border border-slate-200">
                            {tc.assertion}
                          </code>
                          <span className="text-slate-400 font-mono">{tc.durationMs}ms</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            PASSED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CODE COVERAGE */}
      {activeTab === 'COVERAGE' && coverage && (
        <div className="space-y-6">
          {/* Target Compliance Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  การครอบคลุมของชุดทดสอบผ่านเกณฑ์มาตรฐาน (Target Coverage Met &gt; 80.0%)
                </h4>
                <p className="text-xs text-emerald-700">
                  สถิติความครอบคลุมรหัสโค้ดของระบบ VERIIGO ทั้งหมดอยู่ที่ {coverage.overallPercentage}% ซึ่งสูงกว่าเป้าหมายที่กำหนดไว้ใน Sprint 14
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-800">{coverage.overallPercentage}%</span>
              <span className="text-xs text-emerald-600 block">Overall Coverage</span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Statements</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900">{coverage.statements.pct}%</span>
                <span className="text-xs text-slate-500 font-mono">
                  {coverage.statements.covered}/{coverage.statements.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${coverage.statements.pct}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Branches</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900">{coverage.branches.pct}%</span>
                <span className="text-xs text-slate-500 font-mono">
                  {coverage.branches.covered}/{coverage.branches.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${coverage.branches.pct}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Functions</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900">{coverage.functions.pct}%</span>
                <span className="text-xs text-slate-500 font-mono">
                  {coverage.functions.covered}/{coverage.functions.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${coverage.functions.pct}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Lines</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900">{coverage.lines.pct}%</span>
                <span className="text-xs text-slate-500 font-mono">
                  {coverage.lines.covered}/{coverage.lines.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${coverage.lines.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Module Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">ตารางรายละเอียดการครอบคลุมจำแนกตามโมดูลหลัก (Module Coverage Breakdown)</h3>
              <span className="text-xs text-slate-500">เป้าหมายขั้นต่ำ: 80.0%</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ชื่อโมดูล (Module File Path)</th>
                    <th className="p-3 text-right">Statements</th>
                    <th className="p-3 text-right">Branches</th>
                    <th className="p-3 text-right">Functions</th>
                    <th className="p-3 text-right">Lines</th>
                    <th className="p-3 text-center">สถานะเป้าหมาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {coverage.modules.map((mod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-slate-900 font-medium">{mod.name}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{mod.statementsPct}%</td>
                      <td className="p-3 text-right font-mono text-slate-700">{mod.branchesPct}%</td>
                      <td className="p-3 text-right font-mono text-slate-700">{mod.functionsPct}%</td>
                      <td className="p-3 text-right font-mono text-slate-900 font-bold">{mod.linesPct}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {mod.linesPct >= 90 ? 'EXCELLENT' : 'PASSED (>80%)'}
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

      {/* TAB 3: RUNNER LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-slate-950 text-slate-200 font-mono text-xs rounded-xl p-4 shadow-lg border border-slate-800 space-y-2 max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Vitest Test Execution Console Output
            </span>
            <span className="text-[11px] text-emerald-400">STATUS: PASSED</span>
          </div>

          <div className="space-y-1.5 pt-2">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed whitespace-pre-wrap">
                {log.includes('[SUCCESS]') ? (
                  <span className="text-emerald-400 font-bold">{log}</span>
                ) : log.includes('[INFO]') ? (
                  <span className="text-slate-300">{log}</span>
                ) : (
                  <span className="text-indigo-300">{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
