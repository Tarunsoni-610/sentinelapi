import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Loader2, Globe, ShieldAlert, CheckSquare, Upload, FileText } from 'lucide-react';

export function ScanLauncher() {
  const { targetUrl, setTargetUrl, isScanning, triggerScan } = useApp();
  const [selectedModules, setSelectedModules] = useState({
    bola: true,
    excessive_exposure: true,
    missing_auth: true,
    rate_limiting: true,
  });
  const [specSource, setSpecSource] = useState('autofetch'); // 'autofetch' | 'upload'
  const [uploadedSpecContent, setUploadedSpecContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const toggleModule = (key) => {
    setSelectedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSpecContent(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleLaunchScan = async () => {
    const activeMods = Object.keys(selectedModules).filter((k) => selectedModules[k]);
    if (activeMods.length === 0) {
      alert('Please select at least one security test module.');
      return;
    }

    try {
      await triggerScan({
        customSpec: specSource === 'upload' && uploadedSpecContent ? uploadedSpecContent : null,
        modules: activeMods,
      });
    } catch (_e) {
      // handled in context
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Target URL Input */}
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            Target API Endpoint
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:4000"
              disabled={isScanning}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all code-font"
            />
          </div>
        </div>

        {/* Spec Ingestion Mode */}
        <div className="flex items-end gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSpecSource('autofetch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                specSource === 'autofetch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Auto-fetch /openapi.yaml
            </button>
            <label
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                specSource === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{uploadedFileName ? uploadedFileName : 'Upload Spec'}</span>
              <input
                type="file"
                accept=".yaml,.yml,.json"
                onChange={(e) => {
                  setSpecSource('upload');
                  handleFileUpload(e);
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunchScan}
            disabled={isScanning}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Auditing Target...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current text-white" />
                <span>Run Security Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Module Selection Pills */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
          Enabled Test Suites:
        </span>

        {[
          { key: 'bola', label: 'BOLA / IDOR (API1:2023)' },
          { key: 'excessive_exposure', label: 'Excessive Exposure & PII (API3:2023)' },
          { key: 'missing_auth', label: 'Broken Authentication (API2:2023)' },
          { key: 'rate_limiting', label: 'Rate Limiting / Anti-Brute (API4:2023)' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleModule(key)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center space-x-1.5 ${
              selectedModules[key]
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-medium'
                : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <CheckSquare className={`h-3.5 w-3.5 ${selectedModules[key] ? 'text-indigo-400' : 'text-slate-600'}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
