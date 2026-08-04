import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Shield,
  Database,
  Server,
  Play,
  Terminal,
  FileText,
  Cpu,
} from 'lucide-react';
import { SchedulerExecutionLogDoc } from '../../types/firestore';

interface SchedulerStatusData {
  active: boolean;
  schedulerMode: string;
  totalExecutions: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTimeMs: number;
  lastSuccessfulRun: string;
  sourcesChecked: number;
  cronSchedule: string;
  cloudSchedulerTriggerUrl: string;
}

export const OperationsDashboardView: React.FC = () => {
  const [statusData, setStatusData] = useState<SchedulerStatusData | null>(null);
  const [logs, setLogs] = useState<SchedulerExecutionLogDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/scheduler/status'),
        fetch('/api/scheduler/logs'),
      ]);

      const statusJson = await statusRes.json();
      const logsJson = await logsRes.json();

      if (statusJson.success) {
        setStatusData(statusJson.schedulerStatus);
      }
      if (logsJson.success) {
        setLogs(logsJson.logs);
      }
    } catch (err) {
      console.error('Error fetching operations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerJob = async (jobEndpoint: string, jobName: string) => {
    setTriggeringJob(jobName);
    setActionMessage(null);
    try {
      const res = await fetch(jobEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scheduler-secret': 'veriigo-scheduler-secret-2026',
        },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`SUCCESS: Triggered ${jobName} successfully.`);
      } else {
        setActionMessage(`FAILED: ${data.error || 'Execution failed'}`);
      }
      await fetchData();
    } catch (err: any) {
      setActionMessage(`ERROR: ${err.message}`);
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleRunFailureTest = async (testType: string) => {
    setTriggeringJob(`Test: ${testType}`);
    setActionMessage(null);
    try {
      const res = await fetch('/api/scheduler/test-failure-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scheduler-secret': 'veriigo-scheduler-secret-2026',
        },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setActionMessage(`TEST EXECUTED: ${data.result || data.message}`);
      await fetchData();
    } catch (err: any) {
      setActionMessage(`TEST ERROR: ${err.message}`);
    } finally {
      setTriggeringJob(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0F172A]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">SRE Operations & Scheduler Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE PRODUCTION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live telemetry, Cloud Scheduler audit execution logs, and automated failure recovery controls
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Stats</span>
        </button>
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-800/90 border border-blue-500/30 text-slate-200 text-xs font-mono flex items-center gap-2"
        >
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>{actionMessage}</span>
        </motion.div>
      )}

      {/* SRE Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A]/80 p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Scheduler Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400 font-mono">ACTIVE</span>
            <span className="text-[10px] text-slate-400">GCP Cloud Scheduler</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono truncate">
            {statusData?.cronSchedule || '0 0 * * *'}
          </p>
        </div>

        <div className="bg-[#0F172A]/80 p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 font-mono">Last Successful Run</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-white font-mono block truncate">
              {statusData?.lastSuccessfulRun ? new Date(statusData.lastSuccessfulRun).toLocaleString('th-TH') : 'Checking...'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Total Runs: {statusData?.totalExecutions || 0}
            </span>
          </div>
        </div>

        <div className="bg-[#0F172A]/80 p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Failed Runs Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {statusData?.failedRuns || 0}
            </span>
            <span className="text-xs text-slate-400">
              / {statusData?.totalExecutions || 0} executions
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2">
            Success Rate: {statusData?.totalExecutions ? Math.round((statusData.successfulRuns / statusData.totalExecutions) * 100) : 100}%
          </p>
        </div>

        <div className="bg-[#0F172A]/80 p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Execution Time</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {statusData?.avgExecutionTimeMs || 85} ms
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Sources Monitored: {statusData?.sourcesChecked || 8}
          </p>
        </div>
      </div>

      {/* Manual SRE Controls Panel */}
      <div className="bg-[#0F172A]/80 p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Server className="w-4 h-4 text-blue-400" />
          <span>Automated Job Triggers & Failure Tests</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleTriggerJob('/api/scheduler/coverage-recalculate', 'Job 1: Coverage Recalculation')}
            disabled={Boolean(triggeringJob)}
            className="flex items-center justify-center gap-2 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Job 1: Coverage Recalculation</span>
          </button>

          <button
            onClick={() => handleTriggerJob('/api/scheduler/source-discovery', 'Job 2: Source Discovery Scan')}
            disabled={Boolean(triggeringJob)}
            className="flex items-center justify-center gap-2 p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Job 2: Source Discovery</span>
          </button>

          <button
            onClick={() => handleTriggerJob('/api/scheduler/crawler-health', 'Job 3: Crawler Health Monitoring')}
            disabled={Boolean(triggeringJob)}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Job 3: Crawler Health</span>
          </button>
        </div>

        {/* Phase 5 Controlled Failure Tests */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold">Failure Recovery Tests:</span>
          <button
            onClick={() => handleRunFailureTest('UNAVAILABLE_SOURCE')}
            disabled={Boolean(triggeringJob)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Test 1: Source Offline
          </button>
          <button
            onClick={() => handleRunFailureTest('COVERAGE_CALCULATION_FAILURE')}
            disabled={Boolean(triggeringJob)}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Test 2: Coverage Failure
          </button>
          <button
            onClick={() => handleRunFailureTest('DUPLICATE_DOCUMENT')}
            disabled={Boolean(triggeringJob)}
            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Test 3: Dupe Ingestion SHA256
          </button>
        </div>
      </div>

      {/* Scheduler Execution Audit Logs Table (Firestore Data) */}
      <div className="bg-[#0F172A]/80 p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Firestore DB: scheduler_execution_logs</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Records: {logs.length}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono bg-slate-900/50 rounded-xl border border-white/5">
            No execution logs found in Firestore. Trigger a scheduled job above to generate audit logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider bg-white/[0.02]">
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Job Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Trigger Source</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Started At</th>
                  <th className="p-3">Error / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-300 text-[11px] font-bold">{log.id}</td>
                    <td className="p-3 text-white font-semibold">{log.jobName}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{log.triggerSource}</td>
                    <td className="p-3 text-purple-400">{log.durationMs} ms</td>
                    <td className="p-3 text-slate-300">{log.recordsProcessed}</td>
                    <td className="p-3 text-slate-400 text-[10px]">
                      {new Date(log.startedAt).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3 text-slate-400 text-[10px] max-w-xs truncate">
                      {log.errorMessage || 'Clean execution'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
