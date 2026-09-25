import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, X, Loader2, Globe, FileCode, CheckSquare, Sparkles } from 'lucide-react';

export function ScanModal({ isOpen, onClose }) {
  const { targetUrl, setTargetUrl, triggerScan, isScanning } = useApp();
  const [selectedModules, setSelectedModules] = useState({
    bola: true,
    excessive_exposure: true,
    missing_auth: true,
    rate_limiting: true,
  });

  if (!isOpen) return null;

  const toggleModule = (key) => {
    setSelectedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartScan = async () => {
    const activeMods = Object.keys(selectedModules).filter((k) => selectedModules[k]);
    try {
      await triggerScan({ modules: activeMods });
      onClose();
    } catch (_e) {
      // handled
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-[#12141a] rounded-2xl shadow-2xl border border-[#1f212a] p-6 relative animate-rise">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-white text-xl leading-none"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-ink-subtle uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43f283] animate-pulse" />
          <span>New Security Assessment</span>
        </div>

        <h2 className="font-display font-bold text-[22px] text-white tracking-tight mt-2 mb-1">
          Run API scan
        </h2>
        <p className="text-[11px] text-ink-muted leading-relaxed mb-5">
          Scan your API endpoints against OWASP API Top 10 vulnerabilities or assess our vulnerable sandbox.
        </p>

        {/* Target URL */}
        <div className="space-y-1.5 mb-4">
          <label className="text-[10px] font-mono font-semibold text-ink-muted uppercase">
            Target Host
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="http://localhost:4000"
            className="w-full rounded-xl bg-[#0a0b0e] border border-[#1f212a] px-3.5 py-2.5 text-[12px] font-mono text-white focus:outline-none focus:border-[#43f283]"
          />
        </div>

        {/* Modules */}
        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-mono font-semibold text-ink-muted uppercase block">
            Test Suites
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bola', label: 'BOLA / IDOR (API1)' },
              { id: 'excessive_exposure', label: 'Data Exposure (API3)' },
              { id: 'missing_auth', label: 'Broken Auth (API2)' },
              { id: 'rate_limiting', label: 'Rate Limiting (API4)' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleModule(id)}
                className={`p-2.5 rounded-xl border text-[11px] font-medium text-left flex items-center gap-2 transition-all ${
                  selectedModules[id]
                    ? 'border-[#43f283]/40 bg-[#43f283]/10 text-[#43f283]'
                    : 'border-[#1f212a] text-ink-muted bg-[#0e1015]'
                }`}
              >
                <CheckSquare className={`h-3.5 w-3.5 ${selectedModules[id] ? 'text-[#43f283]' : 'text-ink-subtle'}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full h-11 rounded-xl bg-[#43f283] hover:bg-[#32e073] text-[#0a0b0e] font-bold text-[12px] shadow-[0_0_20px_rgba(67,242,131,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#0a0b0e]" />
              <span>Scanning API surface...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current text-[#0a0b0e]" />
              <span>Start security scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
