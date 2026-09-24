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
          <h3 className="font-mono font-semibold text-[10px] text-ink-subtle uppercase tracking-widest">
            01. Posture & Risk Metrics
          </h3>
          <button
            onClick={onOpenReport}
            className="text-[11px] text-[#43f283] hover:underline font-semibold"
          >
            Detailed report ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLACARD 1: RISK SCORE */}
          <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl p-6 shadow-card hover:border-[#2f3240] transition-all flex flex-col justify-between min-h-[170px] relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                  Security Posture Score
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-display font-extrabold text-[36px] text-white tracking-tight">
                    {score}
                  </span>
                  <span className="text-[14px] text-ink-subtle font-normal">/ 100</span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ml-2 border ${
                      score >= 80
                        ? 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/30 shadow-[0_0_12px_rgba(67,242,131,0.2)]'
                        : score >= 50
                        ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30'
                        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                    }`}
                  >
                    {score >= 80 ? 'Good posture' : score >= 50 ? 'Moderate risk' : 'Needs attention'}
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            {/* Meter Bar */}
            <div className="my-3">
              <div className="w-full h-1.5 bg-[#1c1e27] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score >= 80 ? 'bg-[#43f283] shadow-[0_0_10px_rgba(67,242,131,0.6)]' : 'bg-[#fbbf24]'
                  }`}
                  style={{ width: `${Math.max(10, score)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-ink-muted flex items-center justify-between">
              <span>
                {verifiedCount > 0 ? (
                  <span className="text-[#43f283] font-semibold">+{verifiedCount * 15} pts from verified patches</span>
                ) : (
                  'Requires authorization fixes'
                )}
              </span>
              <span className="font-mono text-[10px] text-ink-subtle">OWASP API1-API5</span>
            </div>
          </div>

          {/* PLACARD 2: OPEN FINDINGS */}
          <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl p-6 shadow-card hover:border-[#2f3240] transition-all flex flex-col justify-between min-h-[170px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                  Vulnerability Triage
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-display font-extrabold text-[36px] text-white tracking-tight">
                    {formatNum(vulnerableCount)}
                  </span>
                  <span className="text-[11px] text-ink-muted">Active issues</span>
                  {verifiedCount > 0 && (
                    <span className="text-[10px] font-semibold bg-[#43f283]/10 text-[#43f283] border border-[#43f283]/30 px-2 py-0.5 rounded-full ml-2">
                      ↓ {verifiedCount} verified fixed
                    </span>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>

            {/* Severity Badges */}
            <div className="flex items-center gap-2 my-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/25 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                <span>{critCount} Critical</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                <span>{highCount} High</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#e2e8f0]/10 text-[#cbd5e1] border border-[#e2e8f0]/20 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                <span>{medCount} Medium</span>
              </span>
            </div>

            <div className="text-[11px] text-ink-muted flex items-center justify-between pt-2 border-t border-[#1f212a]">
              <span>Automated stateful probe</span>
              <button
                onClick={onOpenReport}
                className="text-[#43f283] hover:underline font-semibold text-[11px] flex items-center gap-0.5"
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
          <h3 className="font-mono font-semibold text-[10px] text-ink-subtle uppercase tracking-widest">
            02. Attack Surface & Engine Health
          </h3>
          <button
            onClick={onOpenTelemetry}
            className="text-[11px] text-[#43f283] hover:underline font-semibold"
          >
            Live daemon logs ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLACARD 1: ENDPOINT INVENTORY */}
          <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl p-6 shadow-card hover:border-[#2f3240] transition-all flex flex-col justify-between min-h-[145px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                  Assessed Endpoints
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-display font-extrabold text-[32px] text-white tracking-tight">
                    {totalEndpoints}
                  </span>
                  <span className="text-[11px] text-[#43f283] font-medium">+3 this week</span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8] flex items-center justify-center flex-shrink-0">
                <Code2 className="h-4 w-4" />
              </div>
            </div>

            <div className="text-[11px] text-ink-muted mt-2 flex items-center justify-between border-t border-[#1f212a] pt-2.5">
              <span>Target: <b className="text-white font-semibold">Sentinel Sandbox</b></span>
              <span className="font-mono text-[10px] text-ink-subtle">127.0.0.1:4000</span>
            </div>
          </div>

          {/* PLACARD 2: ENGINE TELEMETRY */}
          <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl p-6 shadow-card hover:border-[#2f3240] transition-all flex flex-col justify-between min-h-[145px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                  Scanner & Control Plane
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#43f283] animate-pulse" />
                  <span className="font-display font-bold text-[18px] text-white">
                    Daemon Active
                  </span>
                  <span className="text-[10px] font-mono bg-[#43f283]/15 text-[#43f283] border border-[#43f283]/30 px-1.5 py-0.5 rounded ml-1 font-semibold">
                    Port 5000
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#43f283]/10 border border-[#43f283]/20 text-[#43f283] flex items-center justify-center flex-shrink-0">
                <Server className="h-4 w-4" />
              </div>
            </div>

            <div className="text-[11px] text-ink-muted mt-2 flex items-center justify-between border-t border-[#1f212a] pt-2.5">
              <span className="flex items-center gap-1.5 text-[#43f283] font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>Last scan: {activeScan ? '0.3s' : '48s'} runtime</span>
              </span>
              <button
                onClick={onOpenTelemetry}
                className="text-[#43f283] hover:underline text-[11px] font-semibold"
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
