import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, AlertCircle, ArrowRight, CheckCircle2, Zap, Sparkles } from 'lucide-react';

export function PriorityFindingsPanel({ onSelectFinding, onNavigateFindings }) {
  const { activeScan, verifyFix } = useApp();
  const [verifyingId, setVerifyingId] = useState(null);

  const findings = activeScan?.findings || [
    {
      id: 'finding_bola_orders',
      patchId: 'bola-orders',
      title: 'Broken object-level authorization (BOLA / IDOR)',
      path: '/api/orders/{id}',
      method: 'GET',
      severity: 'CRITICAL',
      status: 'VULNERABLE',
      owaspId: 'API1:2023',
      description: 'Authenticated users can enumerate sequential IDs and access private customer orders with shipping addresses.',
    },
    {
      id: 'finding_excessive_exposure_me',
      patchId: 'excessive-exposure-me',
      title: 'Excessive data exposure & PII credential leakage',
      path: '/api/users/me',
      method: 'GET',
      severity: 'HIGH',
      status: 'VULNERABLE',
      owaspId: 'API3:2023',
      description: 'Profile endpoint returns entire raw user model including passwordHash, ssn, and internal API keys.',
    },
    {
      id: 'finding_missing_auth_admin_stats',
      patchId: 'missing-auth-admin-stats',
      title: 'Missing authentication on administrative platform metrics',
      path: '/api/admin/stats',
      method: 'GET',
      severity: 'CRITICAL',
      status: 'VULNERABLE',
      owaspId: 'API2:2023',
      description: 'Admin statistics and user listing is accessible to unauthenticated callers without Bearer token verification.',
    },
    {
      id: 'finding_login_rate_limit',
      patchId: 'login-rate-limit',
      title: 'Unrestricted resource consumption on authentication route',
      path: '/api/auth/login',
      method: 'POST',
      severity: 'MEDIUM',
      status: 'VULNERABLE',
      owaspId: 'API4:2023',
      description: 'Login endpoint lacks IP or velocity throttling, exposing accounts to automated credential stuffing.',
    },
  ];

  const handleQuickVerify = async (e, finding) => {
    e.stopPropagation();
    setVerifyingId(finding.id);
    try {
      await verifyFix(finding.patchId, true);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1f212a]">
        <div>
          <h3 className="font-display font-bold text-[16px] text-white tracking-tight">
            Priority Security Findings ({findings.length})
          </h3>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Ranked by exploitability and business risk. Click any issue to view AI patches or verify fixes.
          </p>
        </div>

        <button
          onClick={onNavigateFindings}
          className="text-[11px] text-[#43f283] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
        >
          <span>All findings inventory</span>
          <span>→</span>
        </button>
      </div>

      {/* Findings Rows */}
      <div className="divide-y divide-[#1c1e28]">
        {findings.map((finding) => {
          const isFixed = finding.status === 'FIX_VERIFIED';
          const isBusy = verifyingId === finding.id;

          let sevBadge = 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30';
          if (finding.severity === 'HIGH') {
            sevBadge = 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30';
          } else if (finding.severity === 'MEDIUM') {
            sevBadge = 'bg-[#cbd5e1]/10 text-[#cbd5e1] border-[#cbd5e1]/20';
          }

          return (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer hover:bg-[#161822] -mx-4 px-4 rounded-xl transition-all"
            >
              {/* Left Column: Finding Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Severity Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${sevBadge}`}>
                    {finding.severity}
                  </span>

                  {/* Status */}
                  <span
                    className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isFixed
                        ? 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/30 shadow-[0_0_8px_rgba(67,242,131,0.2)]'
                        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                    }`}
                  >
                    {isFixed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-[#43f283]" />
                        <span>FIX VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse" />
                        <span>VULNERABLE</span>
                      </>
                    )}
                  </span>

                  {/* Route & OWASP */}
                  <code className="text-[10px] font-mono bg-[#1a1c26] text-[#cbd5e1] border border-[#2b2e3e] px-2 py-0.5 rounded">
                    <span className="font-bold text-[#43f283]">{finding.method}</span> {finding.path}
                  </code>

                  <span className="text-[9px] font-semibold text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/20 px-1.5 py-0.5 rounded">
                    {finding.owaspId}
                  </span>
                </div>

                <h4 className="font-display font-bold text-[14px] text-white group-hover:text-[#43f283] transition-colors">
                  {finding.title}
                </h4>

                <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
                  {finding.description}
                </p>
              </div>

              {/* Right Column: Quick Action Controls */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1f212a]">
                {!isFixed && (
                  <button
                    onClick={(e) => handleQuickVerify(e, finding)}
                    disabled={isBusy}
                    title="Apply sandbox patch and run targeted verification re-test"
                    className="h-8 px-3 rounded-lg bg-[#43f283]/10 hover:bg-[#43f283]/20 text-[#43f283] border border-[#43f283]/30 text-[10px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-inner"
                  >
                    <Zap className="h-3 w-3 text-[#43f283]" />
                    <span>{isBusy ? 'Verifying...' : 'Verify Fix'}</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectFinding(finding)}
                  className="h-8 px-3.5 rounded-lg bg-[#1a1d26] hover:bg-[#232734] border border-[#272b3a] text-white text-[10px] font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>Inspect & Diff</span>
                  <ArrowRight className="h-3 w-3 text-[#43f283]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="pt-4 mt-2 border-t border-[#1f212a] flex items-center justify-between text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
          <span>{findings.filter((f) => f.status === 'VULNERABLE').length} open vulnerabilities require developer action</span>
        </span>
        <span className="font-mono text-[10px] text-ink-subtle">Sentinel Stateful DAST</span>
      </div>
    </div>
  );
}
