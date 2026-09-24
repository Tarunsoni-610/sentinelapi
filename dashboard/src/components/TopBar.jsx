import React from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, RotateCcw, Activity, Server, Key } from 'lucide-react';

export function TopBar({ currentTab, onOpenNewScan }) {
  const { sandboxStatus, scannerStatus, resetSandbox, setIsApiKeyModalOpen } = useApp();

  const tabLabels = {
    overview: 'Overview',
    findings: 'Findings',
    endpoints: 'Endpoints',
    history: 'Scan history',
  };

  return (
    <header className="h-[58px] bg-[#0a0b0e]/80 backdrop-blur-md border-b border-[#1f212a] px-8 sm:px-11 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-[11px] text-ink-muted">
        <span>Workspace</span>
        <span className="text-[#323542]">/</span>
        <b className="text-white font-semibold">{tabLabels[currentTab] || 'Overview'}</b>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Reset Sandbox */}
        <button
          onClick={resetSandbox}
          title="Reset sandbox state and revert applied patches"
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-ink-muted hover:text-white bg-[#13151c] hover:bg-[#1a1c24] border border-[#1f212a] rounded-lg shadow-inner transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#fbbf24]" />
          <span className="hidden sm:inline">Reset Sandbox</span>
        </button>

        {/* Sandbox Environment Pill */}
        <div className="flex items-center gap-1.5 bg-[#43f283]/10 text-[#43f283] border border-[#43f283]/20 rounded-full px-3 py-1 text-[10px] font-semibold shadow-[0_0_12px_rgba(67,242,131,0.15)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#43f283] animate-pulse" />
          <span>Sandbox environment</span>
          {sandboxStatus.appliedPatches?.length > 0 && (
            <span className="text-[#fbbf24] font-bold ml-0.5">
              ({sandboxStatus.appliedPatches.length} Patched)
            </span>
          )}
        </div>

        {/* Help Center / Keys */}
        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-white transition-colors"
        >
          <span className="w-4 h-4 rounded-full border border-[#2e313d] flex items-center justify-center text-[10px] font-semibold text-white">
            ?
          </span>
          <span className="hidden sm:inline">Help & Keys</span>
        </button>
      </div>
    </header>
  );
}
