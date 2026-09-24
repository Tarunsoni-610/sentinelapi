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
import { Plus, Terminal, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0b0e] text-[#f4f4f6] font-sans flex antialiased selection:bg-[#43f283] selection:text-[#0a0b0e]">
      {/* 1. Left Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* 2. Main Canvas */}
      <div className="ml-[236px] flex-1 flex flex-col min-h-screen bg-[#0a0b0e]">
        {/* Topbar */}
        <TopBar
          currentTab={currentTab}
          onOpenNewScan={() => setIsScanModalOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 max-w-[1040px] w-full mx-auto px-6 sm:px-10 py-10 space-y-9">
          {/* Centered Page Heading & Action CTA */}
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#43f283] uppercase bg-[#43f283]/10 border border-[#43f283]/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(67,242,131,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43f283] animate-pulse" />
              <span>Continuous API Security Posture</span>
            </div>

            {/* Centered Heading */}
            <h1 className="font-display font-extrabold text-[32px] sm:text-[38px] text-white tracking-tight leading-tight flex items-center justify-center gap-3">
              <span>Good morning, Alex</span>
              <span className="text-[#43f283] text-[26px]">✳</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[13px] text-ink-muted leading-relaxed max-w-lg mx-auto font-sans">
              Autonomous vulnerability monitoring, stateful authorization boundary probing, and automated patch triage across your API surface.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="h-[40px] bg-[#43f283] hover:bg-[#32e073] text-[#0a0b0e] font-bold text-[12px] rounded-xl px-5 shadow-[0_0_20px_rgba(67,242,131,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3] text-[#0a0b0e]" />
                <span>Run New Scan</span>
              </button>

              <button
                onClick={() => setIsTelemetryModalOpen(true)}
                className="h-[40px] bg-[#13151c] hover:bg-[#1a1c24] text-white border border-[#1f212a] font-semibold text-[11px] rounded-xl px-4 shadow-inner hover:border-[#2e313f] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5 text-[#43f283]" />
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
        <footer className="border-t border-[#1f212a] py-6 px-8 sm:px-11 text-[11px] text-ink-muted flex items-center justify-between">
          <span>SentinelAPI • Autonomous API Security & AI Defense</span>
          <span className="font-mono text-[10px] text-ink-subtle">Sandbox :4000 • Scanner :5000 • Dashboard :5173</span>
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
