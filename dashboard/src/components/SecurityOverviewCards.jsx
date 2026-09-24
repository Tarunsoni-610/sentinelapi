import React from 'react';
import { useApp } from '../context/AppContext';
import { Code2, ShieldAlert, TrendingUp, Clock, ChevronDown, Check } from 'lucide-react';

export function SecurityOverviewCards({ onOpenReport }) {
  const { activeScan } = useApp();

  const stats = activeScan?.stats || {};
  const findings = activeScan?.findings || [];
  const totalEndpoints = stats.totalEndpoints || 6;
  const vulnerableCount = stats.vulnerableCount ?? 4;
  const verifiedCount = stats.verifiedFixedCount ?? 0;
  const score = stats.securityScore ?? 35;

  const critCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'CRITICAL').length || 2;
  const highCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'HIGH').length || 1;
  const medCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'MEDIUM').length || 1;

  // Format single/double digit
  const formatNum = (n) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="space-y-3.5 mb-7">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[14px] text-[#252c3a] tracking-tight">
            Security overview
          </h2>
          <div className="text-[10px] text-ink-muted flex items-center gap-1.5 mt-0.5">
            <span>Last scan {activeScan ? 'just now' : '2 hours ago'}</span>
            <span className="text-[#c8cbd1]">·</span>
            <button
              onClick={onOpenReport}
              className="text-[#7166d9] hover:underline font-semibold"
            >
              View report ↗
            </button>
          </div>
        </div>

        <button className="h-[29px] bg-white border border-line rounded-[5px] px-2.5 text-[10px] font-medium text-[#69717e] flex items-center gap-2 shadow-2xs hover:border-slate-300 transition-colors">
          <span>Last 30 days</span>
          <ChevronDown className="h-3 w-3 text-[#a1a6b0]" />
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: API ENDPOINTS */}
        <div className="h-[142px] bg-white border border-line rounded-lg p-3.5 relative overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#9ba1ad] uppercase tracking-wider">
            <span>API Endpoints</span>
            <div className="w-6 h-6 rounded-md bg-[#f2f0ff] text-violet flex items-center justify-center">
              <Code2 className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-[25px] text-[#2a303e] tracking-tight">
                {totalEndpoints}
              </span>
              <span className="text-[9px] font-medium text-[#53a581]">+3 this week</span>
            </div>
            <div className="text-[10px] text-[#9da3ae] mt-1">
              Across <b className="text-[#6f7784] font-semibold">1 API</b> (Sandbox Target)
            </div>
          </div>

          {/* Mini Sparkline Bars */}
          <div className="h-9 flex items-end gap-1 opacity-80 -mx-3.5 -mb-3.5 px-3.5 pointer-events-none">
            {[40, 65, 30, 85, 50, 95, 70, 100, 80, 90, 60, 100].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-violet rounded-t-xs"
                style={{ height: `${h}%`, opacity: 0.16 }}
              />
            ))}
          </div>
        </div>

        {/* CARD 2: OPEN FINDINGS */}
        <div className="h-[142px] bg-white border border-line rounded-lg p-3.5 relative overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#9ba1ad] uppercase tracking-wider">
            <span>Open Findings</span>
            <div className="w-6 h-6 rounded-md bg-[#fff2f0] text-coral flex items-center justify-center">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-[25px] text-[#2a303e] tracking-tight">
                {formatNum(vulnerableCount)}
              </span>
              {verifiedCount > 0 ? (
                <span className="text-[9px] font-medium text-[#53a581]">↓ {verifiedCount} resolved</span>
              ) : (
                <span className="text-[9px] font-medium text-[#9298a5]">Needs triage</span>
              )}
            </div>
            <div className="text-[10px] text-[#9da3ae] mt-1 flex items-center flex-wrap gap-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e06464]" />
                <b className="text-[#6f7784] font-semibold">{critCount}</b> critical
              </span>
              <span className="text-[#d0d3d9]">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e79b53]" />
                <b className="text-[#6f7784] font-semibold">{highCount}</b> high
              </span>
              <span className="text-[#d0d3d9]">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e9be54]" />
                <b className="text-[#6f7784] font-semibold">{medCount}</b> med
              </span>
            </div>
          </div>

          {/* Mini Sparkline Bars (Coral) */}
          <div className="h-9 flex items-end gap-1 opacity-80 -mx-3.5 -mb-3.5 px-3.5 pointer-events-none">
            {[90, 80, 85, 70, 75, 60, 65, 50, 55, 45, 40, 35].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-coral rounded-t-xs"
                style={{ height: `${h}%`, opacity: 0.16 }}
              />
            ))}
          </div>
        </div>

        {/* CARD 3: RISK SCORE */}
        <div className="h-[142px] bg-white border border-line rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#9ba1ad] uppercase tracking-wider">
            <span>Risk Score</span>
            <div className="w-6 h-6 rounded-md bg-[#fff8eb] text-amber flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-[25px] text-[#2a303e] tracking-tight">
                {score}
              </span>
              <span className="text-[12px] text-[#9da3ae] font-normal">/100</span>
              <span className="text-[9px] font-semibold bg-[#fff6e7] text-[#c18934] px-1.5 py-0.5 rounded ml-auto">
                {score >= 80 ? 'Good posture' : score >= 50 ? 'Moderate risk' : 'Needs attention'}
              </span>
            </div>

            {/* Risk Track Meter */}
            <div className="mt-2.5 w-full h-1 bg-[#f2eee7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e4a447] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, score)}%` }}
              />
            </div>

            <div className="text-[10px] text-[#9da3ae] mt-1.5">
              {verifiedCount > 0 ? (
                <span>Improved <b className="text-[#6f7784] font-semibold">+{verifiedCount * 15} points</b> after patch</span>
              ) : (
                <span>Requires authorization enforcement</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 4: LAST SCAN */}
        <div className="h-[142px] bg-white border border-line rounded-lg p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#9ba1ad] uppercase tracking-wider">
            <span>Last Scan</span>
            <div className="w-6 h-6 rounded-md bg-[#eff9f4] text-[#47a67d] flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[25px] text-[#2a303e] tracking-tight">
                {activeScan ? '1m' : '2h'}
              </span>
              <span className="text-[10px] text-[#9da3ae]">ago</span>
            </div>

            <div className="text-[10px] text-[#48a47c] flex items-center gap-1 mt-0.5 font-medium">
              <Check className="h-3 w-3" />
              <span>Completed in {activeScan ? '0.3s' : '48 seconds'}</span>
            </div>

            <div className="pt-2 border-t border-[#f0f1f3] mt-2 flex justify-between text-[9px] text-[#9ca2ad]">
              <span>Sentinel Sandbox API</span>
              <span>127.0.0.1:4000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
