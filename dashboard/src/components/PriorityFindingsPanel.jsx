import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, AlertCircle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

export function PriorityFindingsPanel({ onSelectFinding, onNavigateFindings }) {
  const { activeScan, verifyFix } = useApp();

  const findings = activeScan?.findings || [
    {
      id: 'finding_bola_orders',
      patchId: 'bola-orders',
      title: 'Broken object-level authorization',
      path: '/api/orders/{id}',
      method: 'GET',
      severity: 'CRITICAL',
      status: 'VULNERABLE',
      owaspId: 'API1:2023',
      description: 'Any authenticated user can read another customer\'s private order by enumerating IDs.',
    },
    {
      id: 'finding_excessive_exposure_me',
      patchId: 'excessive-exposure-me',
      title: 'Excessive data exposure & PII leakage',
      path: '/api/users/me',
      method: 'GET',
      severity: 'HIGH',
      status: 'VULNERABLE',
      owaspId: 'API3:2023',
      description: 'User profile returns entire DB record including passwordHash, ssn, and internal apiKey.',
    },
    {
      id: 'finding_missing_auth_admin_stats',
      patchId: 'missing-auth-admin-stats',
      title: 'Missing authentication on admin stats',
      path: '/api/admin/stats',
      method: 'GET',
      severity: 'CRITICAL',
      status: 'VULNERABLE',
      owaspId: 'API2:2023',
      description: 'Admin statistics endpoint is publicly exposed without token verification.',
    },
    {
      id: 'finding_login_rate_limit',
      patchId: 'login-rate-limit',
      title: 'Unrestricted resource consumption on login',
      path: '/api/auth/login',
      method: 'POST',
      severity: 'MEDIUM',
      status: 'VULNERABLE',
      owaspId: 'API4:2023',
      description: 'Login endpoint lacks throttling, allowing high-velocity brute-force credential stuffing.',
    },
  ];

  return (
    <div className="bg-white border border-line rounded-lg p-[16px_17px_0] flex flex-col shadow-2xs">
      {/* Head */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-[14px] text-[#252c3a] tracking-tight">
            Priority findings
          </h2>
          <p className="text-[10px] text-ink-muted">Issues that need your attention</p>
        </div>

        <button
          onClick={onNavigateFindings}
          className="text-[10px] text-[#7166d9] hover:underline font-semibold flex items-center gap-1"
        >
          <span>All findings</span>
          <span>→</span>
        </button>
      </div>

      {/* Findings List */}
      <div className="mt-3.5 divide-y divide-[#f0f1f3]">
        {findings.map((finding) => {
          const isFixed = finding.status === 'FIX_VERIFIED';

          let iconBg = 'bg-[#fff0ef] text-[#df6868]';
          let sevStyle = 'bg-[#fff0ef] text-[#cf6666]';
          if (finding.severity === 'HIGH') {
            iconBg = 'bg-[#fff5eb] text-[#dd9250]';
            sevStyle = 'bg-[#fff4eb] text-[#c78043]';
          } else if (finding.severity === 'MEDIUM') {
            iconBg = 'bg-[#fff9e9] text-[#d2a345]';
            sevStyle = 'bg-[#fff8e8] text-[#b58d3d]';
          }

          return (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="min-h-[61px] py-2.5 flex items-center gap-3 group cursor-pointer hover:bg-[#fafafc] -mx-4 px-4 transition-colors"
            >
              {/* Type icon */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  isFixed ? 'bg-[#edf8f2] text-[#3e9b72]' : iconBg
                }`}
              >
                {isFixed ? <CheckCircle2 className="h-3.5 w-3.5 text-[#3e9b72]" /> : '!'}
              </div>

              {/* Main */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-[#434a58] group-hover:text-[#584ed2] transition-colors truncate">
                    {finding.title}
                  </span>
                  {!isFixed ? (
                    <span className="text-[8px] font-mono font-medium text-[#c76e66] bg-[#fff0ee] px-1 py-0.5 rounded">
                      NEW
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono font-semibold text-[#3e9b72] bg-[#edf8f2] px-1 py-0.5 rounded">
                      FIXED
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[9px] text-[#a0a5af] flex items-center gap-1.5 font-mono truncate">
                  <code className="bg-[#f3f4f6] text-[#777f8e] px-1 py-0.5 rounded">
                    {finding.method} {finding.path}
                  </code>
                  <span className="text-[#d2d5da]">·</span>
                  <span className="font-sans text-[10px]">Sentinel Sandbox</span>
                </div>
              </div>

              {/* Severity & Action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                      isFixed ? 'bg-[#edf8f2] text-[#3e9b72]' : sevStyle
                    }`}
                  >
                    {isFixed ? 'Verified' : finding.severity.toLowerCase()}
                  </span>
                  <small className="text-[9px] text-[#a7acb6]">2 hours ago</small>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFinding(finding);
                  }}
                  className="text-[#bdc1c9] group-hover:text-violet p-1 hover:bg-[#f0efff] rounded transition-all"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="h-[38px] border-t border-[#f0f1f3] mt-auto flex items-center justify-between text-[9px] text-[#a0a5af]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e36b6b]" />
          <span>{findings.filter((f) => f.status === 'VULNERABLE').length} critical issues remaining</span>
        </div>
        <button
          onClick={onNavigateFindings}
          className="text-[#7166d9] hover:underline font-semibold"
        >
          View all findings
        </button>
      </div>
    </div>
  );
}
