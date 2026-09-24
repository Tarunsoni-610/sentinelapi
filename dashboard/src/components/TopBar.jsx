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
    <header className="h-[58px] bg-white/90 backdrop-blur-md border-b border-line px-8 sm:px-11 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-[11px] text-[#a0a6b1]">
        <span>Workspace</span>
        <span className="text-[#d0d3d9]">/</span>
        <b className="text-[#525b69] font-semibold">{tabLabels[currentTab] || 'Overview'}</b>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Reset Sandbox */}
        <button
          onClick={resetSandbox}
          title="Reset sandbox state and revert applied patches"
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#677080] hover:text-ink bg-white hover:bg-slate-50 border border-line rounded-md shadow-2xs transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber" />
          <span className="hidden sm:inline">Reset Sandbox</span>
        </button>

        {/* Sandbox Environment Pill */}
        <div className="flex items-center gap-1.5 bg-[#f1f8f5] text-[#418a69] border border-[#e4f1eb] rounded-full px-2.5 py-1 text-[10px] font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3caf7d] animate-pulse" />
          <span>Sandbox environment</span>
          {sandboxStatus.appliedPatches?.length > 0 && (
            <span className="text-[#c18934] font-bold ml-0.5">
              ({sandboxStatus.appliedPatches.length} Patched)
            </span>
          )}
        </div>

        {/* Help Center / Keys */}
        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex items-center gap-1 text-[11px] text-[#737b89] hover:text-ink transition-colors"
        >
          <span className="w-4 h-4 rounded-full border border-[#b7bdc6] flex items-center justify-center text-[10px] font-semibold">
            ?
          </span>
          <span className="hidden sm:inline">Help & Keys</span>
        </button>
      </div>
    </header>
  );
}
