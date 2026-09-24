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

export function FindingDetailModal({ finding, onClose }) {
  const { verifyFix, regenerateRemediation, apiKeys } = useApp();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'evidence' | 'remediation' | 'verify'
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  if (!finding) return null;

  const isFixed = finding.status === 'FIX_VERIFIED';

  const handleCopyCurl = () => {
    if (!finding.curlPoc) return;
    navigator.clipboard.writeText(finding.curlPoc);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyEvidence = () => {
    navigator.clipboard.writeText(JSON.stringify(finding.evidence, null, 2));
    setCopiedEvidence(true);
    setTimeout(() => setCopiedEvidence(false), 2000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="space-y-1.5 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              {/* Severity Pill */}
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                  finding.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : finding.severity === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                }`}
              >
                {finding.severity}
              </span>

              {/* Status Pill */}
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md flex items-center gap-1.5 ${
                  isFixed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isFixed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>FIX VERIFIED (SECURE)</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span>VULNERABLE</span>
                  </>
                )}
              </span>

              {/* Endpoint Pill */}
              <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-md bg-slate-800 text-slate-300">
                <span className="text-indigo-400 font-bold">{finding.method}</span> {finding.path}
              </span>

              {/* OWASP Pill */}
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {finding.owaspId}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">{finding.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          {[
            { id: 'overview', label: 'Vulnerability Overview', icon: ShieldAlert },
            { id: 'evidence', label: 'Evidence & cURL PoC', icon: Terminal },
            { id: 'remediation', label: 'AI Remediation & Diff', icon: Sparkles },
            { id: 'verify', label: 'Interactive Fix Verification', icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Exploitation & Vulnerability Details
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  {finding.description}
                </p>
              </div>

              {/* Business Impact */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Business Impact & Risk
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-rose-950/20 p-4 rounded-xl border border-rose-900/30">
                  {finding.businessImpact}
                </p>
              </div>

              {/* Standards Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                    OWASP Top 10 API Security
                  </span>
                  <p className="text-sm font-bold text-indigo-300">{finding.category}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                    Common Weakness Enumeration
                  </span>
                  <p className="text-sm font-bold text-slate-200 font-mono">{finding.cwe}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE & CURL POC */}
          {activeTab === 'evidence' && (
            <div className="space-y-6 animate-fade-in">
              {/* Reproducible cURL PoC */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    Reproducible cURL PoC Command
                  </h3>
                  <button
                    onClick={handleCopyCurl}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                  {finding.curlPoc || 'cURL PoC not generated.'}
                </div>
              </div>

              {/* Excessive Data Exposure Field Breakdown if available */}
              {finding.evidence?.leakedFields?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-400" />
                    Leaked Sensitive Properties Breakdown ({finding.evidence.leakedFields.length} detected)
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Leaked Key</th>
                          <th className="py-2.5 px-4">Classification</th>
                          <th className="py-2.5 px-4">Sample Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {finding.evidence.leakedFields.map((field, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-4 text-rose-400 font-bold">{field.field}</td>
                            <td className="py-2.5 px-4 text-amber-300 font-sans text-xs">{field.classification}</td>
                            <td className="py-2.5 px-4 text-slate-400">{String(field.valueSample)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Full JSON Evidence Inspector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-slate-400" />
                    Raw Evidence Telemetry
                  </h3>
                  <button
                    onClick={handleCopyEvidence}
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
                  >
                    {copiedEvidence ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedEvidence ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto overflow-x-auto">
                  <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI REMEDIATION & DIFF */}
          {activeTab === 'remediation' && (
            <div className="space-y-6 animate-fade-in">
              {/* AI Explanation & Guidance */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      {finding.remediation?.aiGenerated ? 'AI Security Guidance' : 'Production Remediation Guidance'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                      {finding.remediation?.provider || 'Gemini'}
                    </span>
                  </div>

                  <button
                    onClick={handleRegenerateAI}
                    disabled={isRegenerating}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>{isRegenerating ? 'Generating...' : 'Regenerate with AI'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {finding.remediation?.explanation ||
                    'Analyze and enforce proper object authorization and access validation on this endpoint.'}
                </p>

                <div className="pt-2 border-t border-indigo-900/40 text-xs text-indigo-200">
                  <span className="font-semibold text-white">Recommended Action: </span>
                  {finding.remediation?.remediationSummary}
                </div>
              </div>

              {/* Code Diff Viewer */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Unified Code Patch (Diff)
                </h3>
                <CodeDiffViewer
                  diff={finding.remediation?.diff}
                  fileName={finding.codeContext?.file || 'src/routes/handler.js'}
                />
              </div>

              {/* Full Corrected Snippet */}
              {finding.remediation?.fixedCode && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Corrected Implementation Reference
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                    {finding.remediation.fixedCode}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIVE FIX VERIFICATION */}
          {activeTab === 'verify' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Live Sandbox Control Plane & Fix Verification
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  SentinelAPI features a bidirectional sandbox control loop. You can dynamically apply the security
                  fix to the sandbox container in memory, trigger a live targeted re-test, and verify that the
                  vulnerability flips from <span className="text-rose-400 font-bold">VULNERABLE</span> to{' '}
                  <span className="text-emerald-400 font-bold">FIX VERIFIED (SECURE)</span>.
                </p>

                {/* State Transition Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Vulnerable Behavior */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-rose-400">Baseline (Vulnerable)</span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• Status: <span className="text-rose-400 font-mono font-bold">200 OK</span> (Bypassed)</li>
                      <li>• Data Isolation: Broken / Leaked</li>
                      <li>• State: Fails OWASP compliance</li>
                    </ul>
                  </div>

                  {/* Fixed Behavior */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-emerald-400">Patched (Verified)</span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• Status: <span className="text-emerald-400 font-mono font-bold">403 Forbidden / 429</span></li>
                      <li>• Data Isolation: Enforced</li>
                      <li>• State: Fully Compliant</li>
                    </ul>
                  </div>
                </div>

                {/* Interactive Action Trigger */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Current Status:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isFixed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isFixed ? 'FIX VERIFIED' : 'VULNERABLE'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Revert Button */}
                    <button
                      onClick={handleRevertAndVerify}
                      disabled={isVerifying}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all disabled:opacity-50"
                    >
                      {isVerifying ? 'Testing...' : 'Revert Patch & Re-test'}
                    </button>

                    {/* Apply & Verify Button */}
                    <button
                      onClick={handleApplyAndVerify}
                      disabled={isVerifying}
                      className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isVerifying ? 'Applying & Probing...' : 'Apply Patch & Re-test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/80 text-xs">
          <span className="text-slate-400 font-mono">
            Patch ID: <span className="text-indigo-400 font-bold">{finding.patchId}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
