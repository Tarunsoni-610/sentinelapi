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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[18px] text-[#252c3a] tracking-tight">
            All API Security Findings ({findings.length})
          </h2>
          <p className="text-[11px] text-ink-muted">
            Detailed vulnerability assessment breakdown and OWASP API compliance posture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#9ba1ad] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="pl-8 pr-3 py-1.5 text-[11px] rounded-md bg-white border border-line text-ink focus:outline-none focus:border-violet"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-white p-0.5 rounded-md border border-line text-[10px]">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'VULNERABLE', 'FIX_VERIFIED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterSeverity(tab)}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  filterSeverity === tab
                    ? 'bg-[#f0efff] text-violet font-semibold'
                    : 'text-[#737b88] hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings Table / Card List */}
      <div className="bg-white border border-line rounded-lg divide-y divide-[#f0f1f3] shadow-2xs overflow-hidden">
        {filtered.map((finding) => {
          const isFixed = finding.status === 'FIX_VERIFIED';
          return (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fafafc] cursor-pointer transition-colors"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-[#fff0ef] text-coral'
                        : finding.severity === 'HIGH'
                        ? 'bg-[#fff4eb] text-amber'
                        : 'bg-[#fff8e8] text-[#b58d3d]'
                    }`}
                  >
                    {finding.severity}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      isFixed ? 'bg-[#edf8f2] text-[#3e9b72]' : 'bg-[#fff0ef] text-coral'
                    }`}
                  >
                    {isFixed ? 'FIX VERIFIED' : 'VULNERABLE'}
                  </span>

                  <span className="text-[10px] font-mono text-[#7166d9] bg-[#f0efff] px-1.5 py-0.5 rounded">
                    {finding.owaspId}
                  </span>

                  <code className="text-[10px] font-mono bg-[#f3f4f6] text-[#777f8e] px-1.5 py-0.5 rounded">
                    {finding.method} {finding.path}
                  </code>
                </div>

                <h3 className="font-display font-bold text-[13px] text-[#333a48]">
                  {finding.title}
                </h3>
                <p className="text-[11px] text-[#737b88] line-clamp-1">{finding.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="h-7 px-3 rounded-[5px] bg-[#f0efff] text-violet text-[10px] font-semibold flex items-center gap-1 hover:bg-[#e4e1ff] transition-colors">
                  <span>Inspect</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
