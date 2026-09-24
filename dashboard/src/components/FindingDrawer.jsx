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
  Lock,
} from 'lucide-react';

export function FindingDrawer({ finding, onClose }) {
  const { verifyFix, regenerateRemediation, apiKeys } = useApp();
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

  let sevStyle = 'bg-[#fff0ef] text-[#cf6666] border-[#ffdcd8]';
  if (finding.severity === 'HIGH') {
    sevStyle = 'bg-[#fff4eb] text-[#c78043] border-[#fbebd2]';
  } else if (finding.severity === 'MEDIUM') {
    sevStyle = 'bg-[#fff8e8] text-[#b58d3d] border-[#fbf3d5]';
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#202537]/35 backdrop-blur-[2px] transition-all">
      <div className="w-full max-w-[560px] h-full bg-white shadow-[-15px_0_45px_rgba(32,37,55,0.15)] flex flex-col overflow-hidden animate-slide-left">
        {/* Drawer Header */}
        <div className="p-6 border-b border-line">
          <div className="flex justify-between items-center text-[9px] font-mono tracking-wider text-[#9ba1ad] uppercase">
            <span>Vulnerability Report</span>
            <button
              onClick={onClose}
              className="text-[#9ba1ad] hover:text-ink text-xl leading-none p-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="font-display font-bold text-[20px] text-[#252c3a] tracking-tight mt-3 mb-2 leading-snug">
            {finding.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${sevStyle}`}>
              {finding.severity}
            </span>

            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                isFixed
                  ? 'bg-[#edf8f2] text-[#3e9b72] border-[#cbeada]'
                  : 'bg-[#fff0ef] text-[#cf6666] border-[#ffdcd8]'
              }`}
            >
              {isFixed ? <CheckCircle2 className="h-3 w-3 text-[#3e9b72]" /> : '!'}
              <span>{isFixed ? 'FIX VERIFIED (SECURE)' : 'VULNERABLE'}</span>
            </span>

            <span className="text-[9px] font-semibold text-[#7166d9] bg-[#f0efff] border border-[#e8e5ff] px-2 py-0.5 rounded">
              {finding.owaspId}
            </span>
          </div>

          <div className="mt-3 font-mono text-[10px] text-[#8a919e] flex items-center gap-1.5">
            <code className="bg-[#f3f4f6] text-[#636c7c] px-2 py-1 rounded">
              {finding.method} {finding.path}
            </code>
            <span className="text-[#c8cbd1]">·</span>
            <span className="font-sans text-[11px] text-[#697280]">Sentinel Sandbox API</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-[#fafafc] px-6">
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
                  ? 'border-violet text-violet bg-white'
                  : 'border-transparent text-[#7a8290] hover:text-ink'
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
                <h3 className="text-[11px] font-display font-bold text-ink uppercase tracking-wider">
                  Description & Attack Surface
                </h3>
                <p className="text-[12px] text-[#697280] leading-relaxed bg-[#f8f8fa] p-3.5 rounded-lg border border-line">
                  {finding.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[11px] font-display font-bold text-coral uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-coral" />
                  Business Impact
                </h3>
                <p className="text-[12px] text-[#844e4e] leading-relaxed bg-[#fff7f6] p-3.5 rounded-lg border border-[#fde8e6]">
                  {finding.businessImpact}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#f8f8fa] border border-line">
                  <span className="text-[9px] font-mono text-ink-muted uppercase block">Category</span>
                  <b className="text-[11px] text-[#584ed2] mt-0.5 block">{finding.category}</b>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f8fa] border border-line">
                  <span className="text-[9px] font-mono text-ink-muted uppercase block">CWE</span>
                  <b className="text-[11px] text-[#434a58] mt-0.5 block font-mono">{finding.cwe}</b>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE & CURL */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-display font-bold text-ink uppercase tracking-wider">
                    Reproducible cURL PoC
                  </h3>
                  <button
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#6258d4] hover:underline"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="h-3 w-3 text-[#3e9b72]" />
                        <span className="text-[#3e9b72]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#222838] text-[#dce1ec] rounded-lg p-3.5 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre shadow-inner">
                  {finding.curlPoc || 'cURL PoC not available.'}
                </div>
              </div>

              {finding.evidence?.leakedFields?.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-display font-bold text-coral uppercase tracking-wider">
                    Leaked Sensitive Properties
                  </h3>
                  <div className="border border-line rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#f8f8fa] border-b border-line text-[9px] font-mono text-ink-muted uppercase">
                        <tr>
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Sample</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f1f4]">
                        {finding.evidence.leakedFields.map((field, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-coral">{field.field}</td>
                            <td className="py-2 px-3 text-[#697280]">{field.classification}</td>
                            <td className="py-2 px-3 font-mono text-ink-muted">{String(field.valueSample)}</td>
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
              <div className="bg-[#f4f2ff] border border-[#e8e5ff] p-3.5 rounded-lg text-[#7166d9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[11px] text-[#584ed2] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet" />
                    AI Remediation Guidance
                  </span>

                  <button
                    onClick={handleRegenerateAI}
                    disabled={isRegenerating}
                    className="text-[10px] font-semibold text-violet hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#5d54b8] leading-relaxed">
                  {finding.remediation?.explanation ||
                    'Add object ownership checks or field allow-lists to isolate data.'}
                </p>

                <div className="text-[10px] text-[#4d449e] font-semibold border-t border-[#e2deff] pt-1.5">
                  Action: {finding.remediation?.remediationSummary}
                </div>
              </div>

              {/* Code Diff */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-display font-bold text-ink uppercase tracking-wider">
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
              <div className="border border-line rounded-lg p-4 bg-[#fbfbff] space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber" />
                  <h3 className="font-display font-bold text-[12px] text-[#252c3a]">
                    Real-time Sandbox Control Plane
                  </h3>
                </div>

                <p className="text-[11px] text-[#737b88] leading-relaxed">
                  Apply this patch directly into the live sandbox API in memory and run an automated probe to verify that the vulnerability resolves.
                </p>

                {/* Status Box */}
                <div className="p-3 bg-white border border-line rounded-md flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted">Verification Status:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isFixed
                        ? 'bg-[#edf8f2] text-[#3e9b72]'
                        : 'bg-[#fff0ef] text-[#cf6666]'
                    }`}
                  >
                    {isFixed ? 'FIX VERIFIED (SECURE)' : 'VULNERABLE (UNPATCHED)'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={handleRevertAndVerify}
                    disabled={isVerifying}
                    className="h-8 px-3 rounded-[5px] bg-white border border-line text-[#697280] font-semibold text-[10px] hover:bg-[#fafafc] transition-all disabled:opacity-50"
                  >
                    {isVerifying ? 'Testing...' : 'Revert Patch'}
                  </button>

                  <button
                    onClick={handleApplyAndVerify}
                    disabled={isVerifying}
                    className="h-8 px-4 rounded-[5px] bg-violet hover:bg-violet-hover text-white font-semibold text-[10px] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
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
        <div className="p-4 border-t border-line bg-[#fbfbff] flex items-center justify-between text-[10px]">
          <span className="font-mono text-ink-muted">
            Patch: <b className="text-violet font-semibold">{finding.patchId}</b>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-line rounded-[5px] text-[#697280] font-semibold hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
