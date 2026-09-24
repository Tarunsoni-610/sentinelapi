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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202537]/35 backdrop-blur-[2px]">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-[0_18px_60px_rgba(33,40,59,0.2)] border border-line p-6 relative animate-rise">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#a3a8b2] hover:text-ink text-xl leading-none"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-ink-subtle uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3caf7d]" />
          <span>New Security Assessment</span>
        </div>

        <h2 className="font-display font-bold text-[22px] text-[#252c3a] tracking-tight mt-2 mb-1">
          Run API scan
        </h2>
        <p className="text-[11px] text-[#8a919d] leading-relaxed mb-5">
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
            className="w-full rounded-md border border-line px-3 py-2 text-[12px] font-mono text-ink focus:outline-none focus:border-violet"
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
                className={`p-2 rounded-md border text-[11px] font-medium text-left flex items-center gap-1.5 transition-all ${
                  selectedModules[id]
                    ? 'border-violet/40 bg-[#f4f2ff] text-[#584ed2]'
                    : 'border-line text-[#858d9a] bg-white'
                }`}
              >
                <CheckSquare className={`h-3 w-3 ${selectedModules[id] ? 'text-[#6659e8]' : 'text-[#c0c4cc]'}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full h-10 rounded-md bg-[#6659e8] hover:bg-[#5549d4] text-white font-semibold text-[11px] shadow-[0_3px_8px_rgba(101,88,232,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="text-white">Scanning API surface...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current text-white" />
              <span className="text-white">Start security scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
