import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SecurityOverviewCards } from './components/SecurityOverviewCards';
import { PriorityFindingsPanel } from './components/PriorityFindingsPanel';
import { FindingsView } from './components/FindingsView';
import { EndpointsView } from './components/EndpointsView';
import { HistoryView } from './components/HistoryView';
import { FindingDrawer } from './components/FindingDrawer';
import { ScanModal } from './components/ScanModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SpecViewerModal } from './components/SpecViewerModal';
import { LiveTelemetryModal } from './components/LiveTelemetryModal';
import { Plus, Play, Shield, Sparkles, Terminal } from 'lucide-react';

export function App() {
  const {
    activeScan,
    triggerScan,
    selectedFinding,
    setSelectedFinding,
  } = useApp();

  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'findings' | 'endpoints' | 'history'
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  // Auto-run initial scan on mount against sandbox
  useEffect(() => {
    let mounted = true;
    const initialRun = async () => {
      try {
        if (mounted && !activeScan) {
          await triggerScan();
        }
      } catch (_e) {
        // user can manually trigger
      }
    };
    initialRun();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* 2. Main Canvas */}
      <div className="ml-[236px] flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <TopBar
          currentTab={currentTab}
          onOpenNewScan={() => setIsScanModalOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 max-w-[1040px] w-full mx-auto px-6 sm:px-10 py-10 space-y-9">
          {/* Centered Page Heading & Action CTA */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-ink-subtle uppercase bg-white border border-line px-3 py-1 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3caf7d] animate-pulse" />
              <span>Continuous API Security Posture</span>
            </div>

            {/* Centered Heading */}
            <h1 className="font-display font-bold text-[30px] sm:text-[34px] text-ink-heading tracking-[-1px] leading-tight flex items-center justify-center gap-2.5">
              <span>Good morning, Alex</span>
              <span className="text-violet text-[24px]">✳</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[13px] text-ink-muted leading-relaxed max-w-lg mx-auto">
              Real-time vulnerability monitoring, stateful authorization boundary probing, and automated patch triage across your API surface.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="h-[38px] bg-violet hover:bg-violet-hover text-white font-semibold text-[11px] rounded-lg px-5 shadow-[0_3px_10px_rgba(101,88,232,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Run New Scan</span>
              </button>

              <button
                onClick={() => setIsTelemetryModalOpen(true)}
                className="h-[38px] bg-white hover:bg-slate-50 text-[#555d6b] border border-line font-semibold text-[11px] rounded-lg px-4 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-2"
              >
                <Terminal className="h-3.5 w-3.5 text-violet" />
                <span>Live Audit Logs</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW (Decluttered, 2-Placards per Section) */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              {/* Section 1 & 2: Posture, Findings & Attack Surface (2 Placards Each) */}
              <SecurityOverviewCards
                onOpenReport={() => setCurrentTab('findings')}
                onOpenTelemetry={() => setIsTelemetryModalOpen(true)}
              />

              {/* Section 3: Priority Findings (Clean Full-Width Placard) */}
              <PriorityFindingsPanel
                onSelectFinding={(f) => setSelectedFinding(f)}
                onNavigateFindings={() => setCurrentTab('findings')}
              />
            </div>
          )}

          {/* TAB 2: FINDINGS */}
          {currentTab === 'findings' && (
            <FindingsView
              onSelectFinding={(f) => setSelectedFinding(f)}
            />
          )}

          {/* TAB 3: ENDPOINTS */}
          {currentTab === 'endpoints' && <EndpointsView />}

          {/* TAB 4: SCAN HISTORY */}
          {currentTab === 'history' && (
            <HistoryView
              onOpenNewScan={() => setIsScanModalOpen(true)}
              onOpenTelemetry={() => setIsTelemetryModalOpen(true)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-line py-6 px-8 sm:px-11 text-[11px] text-ink-muted flex items-center justify-between">
          <span>SentinelAPI • Autonomous API Security & AI Defense</span>
          <span className="font-mono text-[10px]">Sandbox :4000 • Scanner :5000 • Dashboard :5173</span>
        </footer>
      </div>

      {/* Slide-in Finding Detail Drawer */}
      {selectedFinding && (
        <FindingDrawer
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}

      {/* Modals */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      <LiveTelemetryModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
      />

      <ApiKeyModal />
      <SpecViewerModal />
    </div>
  );
}

export default App;
