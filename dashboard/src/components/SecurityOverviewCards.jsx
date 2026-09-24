import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, TrendingUp, Code2, Server, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export function SecurityOverviewCards({ onOpenReport, onOpenTelemetry }) {
  const { activeScan, scannerStatus, sandboxStatus } = useApp();

  const stats = activeScan?.stats || {};
  const findings = activeScan?.findings || [];
  const totalEndpoints = stats.totalEndpoints || 6;
  const vulnerableCount = stats.vulnerableCount ?? 4;
  const verifiedCount = stats.verifiedFixedCount ?? 0;
  const score = stats.securityScore ?? 35;

  const critCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'CRITICAL').length || 2;
  const highCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'HIGH').length || 1;
  const medCount = findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'MEDIUM').length || 1;

  const formatNum = (n) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div className="space-y-6 mb-8">
      {/* SECTION 1: POSTURE & TRIAGE (2 PLACARDS) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-bold text-[13px] text-[#252c3a] tracking-tight uppercase tracking-wider text-[11px] text-ink-muted">
            1. Posture & Risk Metrics
          </h3>
          <button
            onClick={onOpenReport}
            className="text-[11px] text-[#7166d9] hover:underline font-semibold"
          >
            Detailed report ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLACARD 1: RISK SCORE */}
          <div className="bg-white border border-line rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-[#9ba1ad] uppercase tracking-wider block">
                  Security Posture Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-bold text-[32px] text-[#2a303e] tracking-tight">
                    {score}
                  </span>
                  <span className="text-[13px] text-[#9da3ae] font-normal">/ 100</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ml-2 ${
                      score >= 80
                        ? 'bg-[#edf8f2] text-[#3e9b72]'
                        : score >= 50
                        ? 'bg-[#fff8eb] text-[#c18934]'
                        : 'bg-[#fff0ef] text-[#cf6666]'
                    }`}
                  >
                    {score >= 80 ? 'Good posture' : score >= 50 ? 'Moderate risk' : 'Needs attention'}
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#fff8eb] text-amber flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            {/* Meter Bar */}
            <div className="my-3">
              <div className="w-full h-1.5 bg-[#f2eee7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e4a447] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(10, score)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-[#8991a0] flex items-center justify-between">
              <span>
                {verifiedCount > 0 ? (
                  <span className="text-[#3e9b72] font-semibold">+{verifiedCount * 15} pts from verified patches</span>
                ) : (
                  'Requires authorization fixes'
                )}
              </span>
              <span className="font-mono text-[10px] text-ink-muted">OWASP API1-API5</span>
            </div>
          </div>

          {/* PLACARD 2: OPEN FINDINGS */}
          <div className="bg-white border border-line rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-[#9ba1ad] uppercase tracking-wider block">
                  Vulnerability Triage
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-bold text-[32px] text-[#2a303e] tracking-tight">
                    {formatNum(vulnerableCount)}
                  </span>
                  <span className="text-[11px] text-[#9298a5]">Active issues</span>
                  {verifiedCount > 0 && (
                    <span className="text-[10px] font-semibold bg-[#edf8f2] text-[#3e9b72] px-2 py-0.5 rounded ml-2">
                      ↓ {verifiedCount} verified fixed
                    </span>
                  )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#fff2f0] text-coral flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>

            {/* Severity Badges */}
            <div className="flex items-center gap-2 my-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-[#fff0ef] text-coral px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e06464]" />
                <span>{critCount} Critical</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#fff4eb] text-[#c78043] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e79b53]" />
                <span>{highCount} High</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#fff8e8] text-[#b58d3d] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e9be54]" />
                <span>{medCount} Medium</span>
              </span>
            </div>

            <div className="text-[11px] text-[#8991a0] flex items-center justify-between pt-1 border-t border-line/60">
              <span>Automated stateful probe</span>
              <button
                onClick={onOpenReport}
                className="text-violet hover:underline font-semibold text-[11px] flex items-center gap-0.5"
              >
                <span>Triage issues</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ATTACK SURFACE & DAEMON (2 PLACARDS) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-bold text-[13px] text-[#252c3a] tracking-tight uppercase tracking-wider text-[11px] text-ink-muted">
            2. Attack Surface & Engine Health
          </h3>
          <button
            onClick={onOpenTelemetry}
            className="text-[11px] text-[#7166d9] hover:underline font-semibold"
          >
            Live daemon logs ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLACARD 1: ENDPOINT INVENTORY */}
          <div className="bg-white border border-line rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-[#9ba1ad] uppercase tracking-wider block">
                  Assessed Endpoints
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-bold text-[28px] text-[#2a303e] tracking-tight">
                    {totalEndpoints}
                  </span>
                  <span className="text-[11px] text-[#53a581] font-medium">+3 this week</span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#f2f0ff] text-violet flex items-center justify-center flex-shrink-0">
                <Code2 className="h-4 w-4" />
              </div>
            </div>

            <div className="text-[11px] text-[#6f7784] mt-2 flex items-center justify-between border-t border-line/60 pt-2.5">
              <span>Target: <b className="text-ink font-semibold">Sentinel Sandbox</b></span>
              <span className="font-mono text-[10px] text-ink-muted">127.0.0.1:4000</span>
            </div>
          </div>

          {/* PLACARD 2: ENGINE TELEMETRY */}
          <div className="bg-white border border-line rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-[#9ba1ad] uppercase tracking-wider block">
                  Scanner & Control Plane
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#3caf7d] animate-pulse" />
                  <span className="font-display font-bold text-[16px] text-[#2a303e]">
                    Daemon Active
                  </span>
                  <span className="text-[10px] font-mono bg-[#edf8f2] text-[#3e9b72] px-1.5 py-0.5 rounded ml-1">
                    Port 5000
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#edf8f2] text-[#47a67d] flex items-center justify-center flex-shrink-0">
                <Server className="h-4 w-4" />
              </div>
            </div>

            <div className="text-[11px] text-[#6f7784] mt-2 flex items-center justify-between border-t border-line/60 pt-2.5">
              <span className="flex items-center gap-1 text-[#48a47c] font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>Last scan: {activeScan ? '0.3s' : '48s'} runtime</span>
              </span>
              <button
                onClick={onOpenTelemetry}
                className="text-violet hover:underline text-[11px] font-semibold"
              >
                View logs →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
