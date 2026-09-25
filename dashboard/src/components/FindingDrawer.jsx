import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CodeDiffViewer } from './CodeDiffViewer';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  FileCode,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function FindingDrawer({ finding, onClose }) {
  const { verifyFix, regenerateRemediation } = useApp();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'evidence' | 'remediation' | 'verify'
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!finding) return null;

  const isFixed = finding.status === 'FIX_VERIFIED';

  const handleCopyCurl = () => {
    if (!finding.curlPoc) return;
    navigator.clipboard.writeText(finding.curlPoc);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleApplyAndVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyFix(finding.patchId, true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevertAndVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyFix(finding.patchId, false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateAI = async () => {
    setIsRegenerating(true);
    try {
      await regenerateRemediation(finding);
    } finally {
      setIsRegenerating(false);
    }
  };

  let sevStyle = 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30';
  if (finding.severity === 'HIGH') {
    sevStyle = 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30';
  } else if (finding.severity === 'MEDIUM') {
    sevStyle = 'bg-[#cbd5e1]/10 text-[#cbd5e1] border-[#cbd5e1]/20';
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-all">
      <div className="w-full max-w-[560px] h-full bg-[#0e1015] border-l border-[#1f212a] shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#1f212a]">
          <div className="flex justify-between items-center text-[9px] font-mono tracking-wider text-ink-muted uppercase">
            <span>Vulnerability Report</span>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-white text-xl leading-none p-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="font-display font-bold text-[20px] text-white tracking-tight mt-3 mb-2 leading-snug">
            {finding.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${sevStyle}`}>
              {finding.severity}
            </span>

            <span
              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isFixed
                  ? 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/30 shadow-[0_0_8px_rgba(67,242,131,0.2)]'
                  : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
              }`}
            >
              {isFixed ? <CheckCircle2 className="h-3 w-3 text-[#43f283]" /> : '!'}
              <span>{isFixed ? 'FIX VERIFIED (SECURE)' : 'VULNERABLE'}</span>
            </span>

            <span className="text-[9px] font-semibold text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/25 px-2 py-0.5 rounded">
              {finding.owaspId}
            </span>
          </div>

          <div className="mt-3 font-mono text-[10px] text-ink-muted flex items-center gap-1.5">
            <code className="bg-[#14161f] text-[#cbd5e1] border border-[#222533] px-2 py-1 rounded">
              {finding.method} {finding.path}
            </code>
            <span className="text-[#323542]">·</span>
            <span className="font-sans text-[11px] text-ink-muted">Sentinel Sandbox Target</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1f212a] bg-[#12141a] px-6">
          {[
            { id: 'overview', label: 'Overview', icon: ShieldAlert },
            { id: 'evidence', label: 'cURL PoC', icon: Terminal },
            { id: 'remediation', label: 'AI Diff & Fix', icon: Sparkles },
            { id: 'verify', label: 'Verification Loop', icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 py-3 px-3 text-[11px] font-semibold border-b-2 transition-all ${
                activeTab === id
                  ? 'border-[#43f283] text-[#43f283] bg-[#0e1015]'
                  : 'border-transparent text-ink-muted hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-display font-bold text-white uppercase tracking-wider">
                  Description & Attack Surface
                </h3>
                <p className="text-[12px] text-ink-muted leading-relaxed bg-[#13151c] p-4 rounded-xl border border-[#1f212a]">
                  {finding.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[11px] font-display font-bold text-[#f43f5e] uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#f43f5e]" />
                  Business Impact
                </h3>
                <p className="text-[12px] text-[#fca5a5] leading-relaxed bg-[#f43f5e]/10 p-4 rounded-xl border border-[#f43f5e]/25">
                  {finding.businessImpact}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#13151c] border border-[#1f212a]">
                  <span className="text-[9px] font-mono text-ink-subtle uppercase block">Category</span>
                  <b className="text-[11px] text-[#818cf8] mt-0.5 block">{finding.category}</b>
                </div>
                <div className="p-3.5 rounded-xl bg-[#13151c] border border-[#1f212a]">
                  <span className="text-[9px] font-mono text-ink-subtle uppercase block">CWE</span>
                  <b className="text-[11px] text-white mt-0.5 block font-mono">{finding.cwe}</b>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE & CURL */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-display font-bold text-white uppercase tracking-wider">
                    Reproducible cURL PoC
                  </h3>
                  <button
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#43f283] hover:underline"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="h-3 w-3 text-[#43f283]" />
                        <span className="text-[#43f283]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#08090b] text-[#cbd5e1] border border-[#1f212a] rounded-xl p-4 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre shadow-inner">
                  {finding.curlPoc || 'cURL PoC not available.'}
                </div>
              </div>

              {finding.evidence?.leakedFields?.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-display font-bold text-[#f43f5e] uppercase tracking-wider">
                    Leaked Sensitive Properties
                  </h3>
                  <div className="border border-[#1f212a] rounded-xl overflow-hidden bg-[#13151c]">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#0e1015] border-b border-[#1f212a] text-[9px] font-mono text-ink-subtle uppercase">
                        <tr>
                          <th className="py-2.5 px-3.5">Field</th>
                          <th className="py-2.5 px-3.5">Type</th>
                          <th className="py-2.5 px-3.5">Sample</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f212a]">
                        {finding.evidence.leakedFields.map((field, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-[#f43f5e]">{field.field}</td>
                            <td className="py-2.5 px-3.5 text-ink-muted">{field.classification}</td>
                            <td className="py-2.5 px-3.5 font-mono text-ink-subtle">{String(field.valueSample)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMEDIATION & DIFF */}
          {activeTab === 'remediation' && (
            <div className="space-y-4">
              {/* Guidance Box */}
              <div className="bg-[#818cf8]/10 border border-[#818cf8]/25 p-4 rounded-xl text-[#c7d2fe] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[11px] text-[#818cf8] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#818cf8]" />
                    AI Remediation Guidance
                  </span>

                  <button
                    onClick={handleRegenerateAI}
                    disabled={isRegenerating}
                    className="text-[10px] font-semibold text-[#43f283] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#e0e7ff] leading-relaxed">
                  {finding.remediation?.explanation ||
                    'Add object ownership checks or field allow-lists to isolate data.'}
                </p>

                <div className="text-[10px] text-white font-semibold border-t border-[#818cf8]/20 pt-2">
                  Action: {finding.remediation?.remediationSummary}
                </div>
              </div>

              {/* Code Diff */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-display font-bold text-white uppercase tracking-wider">
                  Unified Patch Diff
                </h3>
                <CodeDiffViewer
                  diff={finding.remediation?.diff}
                  fileName={finding.codeContext?.file || 'src/routes/handler.js'}
                />
              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION */}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              <div className="border border-[#1f212a] rounded-xl p-5 bg-[#13151c] space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#fbbf24]" />
                  <h3 className="font-display font-bold text-[13px] text-white">
                    Real-time Sandbox Control Plane
                  </h3>
                </div>

                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Apply this patch directly into the live sandbox API in memory and run an automated probe to verify that the vulnerability resolves.
                </p>

                {/* Status Box */}
                <div className="p-3.5 bg-[#0e1015] border border-[#1f212a] rounded-lg flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted">Verification Status:</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isFixed
                        ? 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/30 shadow-[0_0_8px_rgba(67,242,131,0.2)]'
                        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                    }`}
                  >
                    {isFixed ? 'FIX VERIFIED (SECURE)' : 'VULNERABLE (UNPATCHED)'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    onClick={handleRevertAndVerify}
                    disabled={isVerifying}
                    className="h-8 px-3.5 rounded-lg bg-[#1a1c24] border border-[#262835] text-white font-semibold text-[10px] hover:bg-[#222533] transition-all disabled:opacity-50"
                  >
                    {isVerifying ? 'Testing...' : 'Revert Patch'}
                  </button>

                  <button
                    onClick={handleApplyAndVerify}
                    disabled={isVerifying}
                    className="h-8 px-4 rounded-lg bg-[#43f283] hover:bg-[#32e073] text-[#0a0b0e] font-bold text-[10px] transition-all shadow-[0_0_15px_rgba(67,242,131,0.3)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{isVerifying ? 'Applying & Probing...' : 'Apply Patch & Re-test'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#1f212a] bg-[#0e1015] flex items-center justify-between text-[10px]">
          <span className="font-mono text-ink-muted">
            Patch ID: <b className="text-[#43f283] font-semibold">{finding.patchId}</b>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-[#13151c] border border-[#1f212a] rounded-md text-white font-semibold hover:bg-[#1a1c24]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
