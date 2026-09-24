import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BannerHero } from './components/BannerHero';
import { SecurityOverviewCards } from './components/SecurityOverviewCards';
import { PriorityFindingsPanel } from './components/PriorityFindingsPanel';
import { RecentScansPanel } from './components/RecentScansPanel';
import { FindingsView } from './components/FindingsView';
import { EndpointsView } from './components/EndpointsView';
import { HistoryView } from './components/HistoryView';
import { FindingDrawer } from './components/FindingDrawer';
import { ScanModal } from './components/ScanModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SpecViewerModal } from './components/SpecViewerModal';
import { LiveTelemetryModal } from './components/LiveTelemetryModal';
import { Sparkles, Plus } from 'lucide-react';

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
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-8 sm:px-11 py-9">
          {/* Page Heading & New Scan CTA */}
          <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-ink-subtle uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3caf7d]" />
                <span>API Security Posture</span>
              </div>

              {/* Title with sparkle */}
              <h1 className="font-display font-bold text-[27px] text-ink-heading tracking-[-0.8px] leading-tight flex items-center gap-2">
                <span>Good morning, Alex</span>
                <span className="text-violet text-[20px]">✳</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[12px] text-ink-muted mt-1">
                Here's what's happening across your API surface.
              </p>
            </div>

            {/* + New Scan Button */}
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="h-[38px] bg-violet hover:bg-violet-hover text-white font-semibold text-[11px] rounded-[6px] px-4 shadow-[0_3px_8px_rgba(101,88,232,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New scan</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <div className="space-y-0">
              {/* Banner Hero Card */}
              <BannerHero onTriggerScan={() => setIsScanModalOpen(true)} />

              {/* Security Overview 4 Cards */}
              <SecurityOverviewCards
                onOpenReport={() => setCurrentTab('findings')}
              />

              {/* 2-Column Grid: Priority Findings (Left) & Recent Scans (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] gap-3.5">
                <PriorityFindingsPanel
                  onSelectFinding={(f) => setSelectedFinding(f)}
                  onNavigateFindings={() => setCurrentTab('findings')}
                />
                <RecentScansPanel
                  onOpenTelemetry={() => setIsTelemetryModalOpen(true)}
                />
              </div>
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
        <footer className="border-t border-line py-5 px-8 sm:px-11 text-[10px] text-ink-muted flex items-center justify-between">
          <span>SentinelAPI • Offensive API Security & Autonomous Remediation</span>
          <span className="font-mono text-[9px]">Sandbox :4000 • Scanner :5000 • Dashboard :5173</span>
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
