import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ScanLauncher } from './components/ScanLauncher';
import { MetricsOverview } from './components/MetricsOverview';
import { LiveLogsTerminal } from './components/LiveLogsTerminal';
import { FindingsList } from './components/FindingsList';
import { ControlsList } from './components/ControlsList';
import { FindingDetailModal } from './components/FindingDetailModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SpecViewerModal } from './components/SpecViewerModal';
import { Shield, Sparkles, AlertCircle, ArrowUpRight, Zap, GitPullRequest } from 'lucide-react';

export function App() {
  const {
    activeScan,
    selectedFinding,
    setSelectedFinding,
    triggerScan,
    scannerStatus,
    sandboxStatus,
  } = useApp();

  // Auto-launch initial scan once target is verified
  useEffect(() => {
    let mounted = true;
    const initialCheck = async () => {
      try {
        if (mounted && !activeScan) {
          await triggerScan();
        }
      } catch (_e) {
        // user can manually click scan
      }
    };
    initialCheck();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner Alert if Services are Offline */}
        {!scannerStatus.online && !scannerStatus.checking && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>
                Scanner service (:5000) is currently offline. Start the scanner using{' '}
                <code className="bg-rose-950/60 px-1.5 py-0.5 rounded text-white font-mono">npm start</code> in{' '}
                <code className="bg-rose-950/60 px-1.5 py-0.5 rounded text-white font-mono">scanner/</code>.
              </span>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>API Posture & Automated Triage</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Real-time stateful authorization boundary probing, PII leakage detection, and AI-assisted git patch synthesis.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>LLM Engine: Gemini / OpenAI</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-2">
              <GitPullRequest className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified Patch Loop</span>
            </div>
          </div>
        </div>

        {/* 1. Scan Configuration & Launcher */}
        <ScanLauncher />

        {/* 2. Live Telemetry Terminal */}
        <LiveLogsTerminal />

        {/* 3. Executive Metrics & Security Score */}
        <MetricsOverview />

        {/* 4. Findings Explorer */}
        <FindingsList />

        {/* 5. Verified Controls */}
        <ControlsList />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SentinelAPI • Offensive API Security & Autonomous Defense</p>
          <p className="font-mono text-[11px] text-slate-600">Phase 2 Scanner (:5000) • Phase 3 Dashboard (:5173)</p>
        </div>
      </footer>

      {/* Modals and Drawers */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}

      <ApiKeyModal />
      <SpecViewerModal />
    </div>
  );
}

export default App;
