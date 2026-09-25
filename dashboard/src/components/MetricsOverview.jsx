import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, CheckCircle2, AlertTriangle, Flame, ShieldCheck } from 'lucide-react';

export function MetricsOverview() {
  const { activeScan } = useApp();

  if (!activeScan) return null;

  const { stats, findings, specInfo } = activeScan;
  const score = stats.securityScore ?? 0;
  const totalFindings = findings.length;
  const verifiedCount = stats.verifiedFixedCount || 0;
  const vulnerableCount = stats.vulnerableCount || 0;

  // Score styling
  let scoreColor = 'text-rose-400';
  let scoreBg = 'from-rose-500/20 to-rose-500/5';
  let scoreBorder = 'border-rose-500/30';
  let scoreLabel = 'High Risk API';

  if (score >= 80) {
    scoreColor = 'text-emerald-400';
    scoreBg = 'from-emerald-500/20 to-emerald-500/5';
    scoreBorder = 'border-emerald-500/30';
    scoreLabel = 'Secure Posture';
  } else if (score >= 50) {
    scoreColor = 'text-amber-400';
    scoreBg = 'from-amber-500/20 to-amber-500/5';
    scoreBorder = 'border-amber-500/30';
    scoreLabel = 'Moderate Risk';
  }

  const fixProgressPercent = totalFindings > 0 ? Math.round((verifiedCount / totalFindings) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Security Score */}
      <div
        className={`rounded-2xl border ${scoreBorder} bg-gradient-to-br ${scoreBg} p-5 backdrop-blur-md relative overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security Posture Score
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-4xl font-extrabold ${scoreColor} tracking-tight`}>{score}</span>
              <span className="text-sm font-medium text-slate-500">/ 100</span>
            </div>
            <p className="text-xs font-medium text-slate-300 mt-1">{scoreLabel}</p>
          </div>
          <div className="h-14 w-14 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            <span className={`text-sm font-bold ${scoreColor}`}>{score}%</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Vulnerabilities Detected */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Vulnerabilities
          </span>
          <Flame className="h-4 w-4 text-rose-400" />
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight">{vulnerableCount}</div>
        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
            {stats.severityCounts?.critical || 0} Critical
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
            {stats.severityCounts?.high || 0} High
          </span>
          <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-semibold">
            {stats.severityCounts?.medium || 0} Med
          </span>
        </div>
      </div>

      {/* Metric 3: Fix Verification Progress */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Fix Verification Rate
          </span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
          {verifiedCount} <span className="text-sm font-normal text-slate-400">/ {totalFindings}</span>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${fixProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>{fixProgressPercent}% Patches Verified</span>
            <span>{vulnerableCount} Remaining</span>
          </div>
        </div>
      </div>

      {/* Metric 4: API Attack Surface */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Endpoints Assessed
          </span>
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight">
          {specInfo?.specVersion ? stats.totalEndpoints : 6}
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>{specInfo?.title || 'Sandbox Target'}</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
            v{specInfo?.version || '1.0.0'}
          </span>
        </div>
      </div>
    </div>
  );
}
