import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Search, Filter, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

export function FindingsView({ onSelectFinding }) {
  const { activeScan } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const findings = activeScan?.findings || [];

  const filtered = findings.filter((f) => {
    if (filterSeverity === 'CRITICAL' && f.severity !== 'CRITICAL') return false;
    if (filterSeverity === 'HIGH' && f.severity !== 'HIGH') return false;
    if (filterSeverity === 'MEDIUM' && f.severity !== 'MEDIUM') return false;
    if (filterSeverity === 'VULNERABLE' && f.status !== 'VULNERABLE') return false;
    if (filterSeverity === 'FIX_VERIFIED' && f.status !== 'FIX_VERIFIED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.title?.toLowerCase().includes(q) ||
        f.path?.toLowerCase().includes(q) ||
        f.owaspId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[22px] text-white tracking-tight">
            All API Security Findings ({findings.length})
          </h2>
          <p className="text-[12px] text-ink-muted">
            Detailed vulnerability assessment breakdown and OWASP API compliance posture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="pl-8 pr-3.5 py-1.5 text-[11px] rounded-xl bg-[#12141a] border border-[#1f212a] text-white placeholder-ink-subtle focus:outline-none focus:border-[#43f283]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-[#12141a] p-1 rounded-xl border border-[#1f212a] text-[10px]">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'VULNERABLE', 'FIX_VERIFIED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterSeverity(tab)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSeverity === tab
                    ? 'bg-[#43f283]/15 text-[#43f283] font-semibold border border-[#43f283]/30'
                    : 'text-ink-muted hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings Table / Card List */}
      <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl divide-y divide-[#1c1e28] shadow-card overflow-hidden">
        {filtered.map((finding) => {
          const isFixed = finding.status === 'FIX_VERIFIED';
          return (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161822] cursor-pointer transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                        : finding.severity === 'HIGH'
                        ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30'
                        : 'bg-[#cbd5e1]/10 text-[#cbd5e1] border-[#cbd5e1]/20'
                    }`}
                  >
                    {finding.severity}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isFixed
                        ? 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/30 shadow-[0_0_8px_rgba(67,242,131,0.2)]'
                        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                    }`}
                  >
                    {isFixed ? 'FIX VERIFIED' : 'VULNERABLE'}
                  </span>

                  <span className="text-[10px] font-mono text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/20 px-2 py-0.5 rounded">
                    {finding.owaspId}
                  </span>

                  <code className="text-[10px] font-mono bg-[#1a1c26] text-[#cbd5e1] border border-[#2b2e3e] px-2 py-0.5 rounded">
                    {finding.method} {finding.path}
                  </code>
                </div>

                <h3 className="font-display font-bold text-[14px] text-white">
                  {finding.title}
                </h3>
                <p className="text-[11px] text-ink-muted line-clamp-1">{finding.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="h-8 px-3.5 rounded-lg bg-[#1a1d26] hover:bg-[#232734] border border-[#272b3a] text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors">
                  <span>Inspect</span>
                  <ArrowRight className="h-3 w-3 text-[#43f283]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
