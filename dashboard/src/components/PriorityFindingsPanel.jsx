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
    <div className="bg-white border border-line rounded-xl p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-line">
        <div>
          <h3 className="font-display font-bold text-[15px] text-[#252c3a] tracking-tight">
            Priority Security Findings ({findings.length})
          </h3>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Ranked by exploitability and business risk. Click any issue to view AI patches or verify fixes.
          </p>
        </div>

        <button
          onClick={onNavigateFindings}
          className="text-[11px] text-[#7166d9] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
        >
          <span>All findings inventory</span>
          <span>→</span>
        </button>
      </div>

      {/* Findings Rows */}
      <div className="divide-y divide-[#f0f1f3]">
        {findings.map((finding) => {
          const isFixed = finding.status === 'FIX_VERIFIED';
          const isBusy = verifyingId === finding.id;

          let sevBadge = 'bg-[#fff0ef] text-coral border-[#ffdcd8]';
          if (finding.severity === 'HIGH') {
            sevBadge = 'bg-[#fff4eb] text-amber border-[#fbebd2]';
          } else if (finding.severity === 'MEDIUM') {
            sevBadge = 'bg-[#fff8e8] text-[#b58d3d] border-[#fbf3d5]';
          }

          return (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer hover:bg-[#fafafc] -mx-4 px-4 rounded-lg transition-colors"
            >
              {/* Left Column: Finding Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Severity Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sevBadge}`}>
                    {finding.severity}
                  </span>

                  {/* Status */}
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isFixed
                        ? 'bg-[#edf8f2] text-[#3e9b72] border-[#cbeada]'
                        : 'bg-[#fff0ef] text-coral border-[#ffdcd8]'
                    }`}
                  >
                    {isFixed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-[#3e9b72]" />
                        <span>FIX VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                        <span>VULNERABLE</span>
                      </>
                    )}
                  </span>

                  {/* Route & OWASP */}
                  <code className="text-[10px] font-mono bg-[#f3f4f6] text-[#636c7c] px-2 py-0.5 rounded">
                    <span className="font-bold text-violet">{finding.method}</span> {finding.path}
                  </code>

                  <span className="text-[9px] font-semibold text-[#7166d9] bg-[#f0efff] px-1.5 py-0.5 rounded">
                    {finding.owaspId}
                  </span>
                </div>

                <h4 className="font-display font-bold text-[13px] text-[#2d3340] group-hover:text-violet transition-colors">
                  {finding.title}
                </h4>

                <p className="text-[11px] text-[#697280] leading-relaxed line-clamp-2">
                  {finding.description}
                </p>
              </div>

              {/* Right Column: Quick Action Controls */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line/60">
                {!isFixed && (
                  <button
                    onClick={(e) => handleQuickVerify(e, finding)}
                    disabled={isBusy}
                    title="Apply sandbox patch and run targeted verification re-test"
                    className="h-8 px-3 rounded-md bg-[#edf8f2] hover:bg-[#ddf2e5] text-[#3e9b72] border border-[#cbeada] text-[10px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3 text-[#3e9b72]" />
                    <span>{isBusy ? 'Verifying...' : 'Verify Fix'}</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectFinding(finding)}
                  className="h-8 px-3.5 rounded-md bg-[#f0efff] hover:bg-[#e4e1ff] text-violet text-[10px] font-semibold transition-all flex items-center gap-1"
                >
                  <span>Inspect & Diff</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="pt-4 mt-2 border-t border-line flex items-center justify-between text-[11px] text-[#8991a0]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-coral" />
          <span>{findings.filter((f) => f.status === 'VULNERABLE').length} open vulnerabilities require developer action</span>
        </span>
        <span className="font-mono text-[10px] text-ink-muted">Sentinel Stateful DAST</span>
      </div>
    </div>
  );
}
