import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  ArrowRight,
  Zap,
  Sparkles,
  Terminal,
} from 'lucide-react';

export function FindingsList() {
  const { activeScan, setSelectedFinding, verifyFix } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'VULNERABLE' | 'FIX_VERIFIED'
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  const findings = activeScan?.findings || [];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Filter by tab
      if (filterSeverity === 'CRITICAL' && f.severity !== 'CRITICAL') return false;
      if (filterSeverity === 'HIGH' && f.severity !== 'HIGH') return false;
      if (filterSeverity === 'MEDIUM' && f.severity !== 'MEDIUM') return false;
      if (filterSeverity === 'VULNERABLE' && f.status !== 'VULNERABLE') return false;
      if (filterSeverity === 'FIX_VERIFIED' && f.status !== 'FIX_VERIFIED') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          f.title?.toLowerCase().includes(q) ||
          f.path?.toLowerCase().includes(q) ||
          f.owaspId?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [findings, filterSeverity, searchQuery]);

  const handleQuickVerify = async (e, finding) => {
    e.stopPropagation();
    setVerifyingId(finding.id);
    try {
      await verifyFix(finding.patchId, true);
    } finally {
      setVerifyingId(null);
    }
  };

  if (!activeScan) return null;

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Security Findings ({findings.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings, routes, CVEs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CRITICAL', label: 'Critical' },
              { id: 'HIGH', label: 'High' },
              { id: 'MEDIUM', label: 'Medium' },
              { id: 'VULNERABLE', label: 'Open' },
              { id: 'FIX_VERIFIED', label: 'Verified' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterSeverity(id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSeverity === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings Cards */}
      {filteredFindings.length === 0 ? (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-white">No matching findings.</p>
          <p className="text-xs text-slate-400">All filtered items have passed or no query matches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredFindings.map((finding) => {
            const isFixed = finding.status === 'FIX_VERIFIED';
            const isBusy = verifyingId === finding.id;

            return (
              <div
                key={finding.id}
                onClick={() => setSelectedFinding(finding)}
                className={`group rounded-2xl border transition-all cursor-pointer p-5 backdrop-blur-md relative overflow-hidden ${
                  isFixed
                    ? 'bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 shadow-lg'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Finding Main Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity */}
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : finding.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        }`}
                      >
                        {finding.severity}
                      </span>

                      {/* Status */}
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md flex items-center gap-1 ${
                          isFixed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isFixed ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>FIX VERIFIED</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>VULNERABLE</span>
                          </>
                        )}
                      </span>

                      {/* Method + Path */}
                      <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                        <span className="text-indigo-400 font-bold">{finding.method}</span> {finding.path}
                      </span>

                      {/* OWASP */}
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {finding.owaspId}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {finding.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {finding.description}
                    </p>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {!isFixed && (
                      <button
                        onClick={(e) => handleQuickVerify(e, finding)}
                        disabled={isBusy}
                        title="Apply sandbox patch and run targeted verification re-test"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isBusy ? 'Testing...' : 'Verify Fix'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedFinding(finding)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
