import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Code2,
  History,
  FileCode,
  Settings,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab }) {
  const { activeScan, setIsApiKeyModalOpen, setIsSpecModalOpen } = useApp();

  const findingsCount = activeScan?.findings?.filter((f) => f.status === 'VULNERABLE')?.length ?? 4;

  return (
    <aside className="fixed inset-y-0 left-0 w-[236px] bg-[#0e1015] border-r border-[#1f212a] p-[22px_14px_14px] flex flex-col z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5">
        <div className="w-7 h-7 text-[#43f283]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <span className="font-display font-extrabold text-[22px] tracking-[-0.8px] text-white">
          sentinel<span className="text-[#43f283]">.</span>
        </span>
      </div>

      {/* Workspace Switcher */}
      <div className="h-[52px] border border-[#1f212a] rounded-xl my-6 p-2 flex items-center gap-2.5 bg-[#13151c] hover:border-[#2f3240] transition-colors cursor-pointer shadow-inner">
        <div className="h-8 w-8 rounded-[8px] bg-[#43f283]/15 text-[#43f283] font-display font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#43f283]/20">
          N
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <b className="text-[12px] font-bold text-white leading-tight truncate font-sans">Northstar</b>
          <small className="text-[10px] text-ink-muted leading-tight">Workspace</small>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[#5c5e6b] mr-1" />
      </div>

      {/* Workspace Nav Section */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[9px] font-mono font-semibold tracking-wider text-ink-subtle uppercase">
          Workspace
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium transition-all ${
              currentTab === 'overview'
                ? 'bg-[#43f283]/10 text-[#43f283] font-semibold border border-[#43f283]/20 shadow-[0_0_15px_rgba(67,242,131,0.08)]'
                : 'text-ink-muted hover:bg-[#13151c] hover:text-white'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${currentTab === 'overview' ? 'text-[#43f283]' : 'text-ink-subtle'}`} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('findings')}
            className={`w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium transition-all ${
              currentTab === 'findings'
                ? 'bg-[#43f283]/10 text-[#43f283] font-semibold border border-[#43f283]/20 shadow-[0_0_15px_rgba(67,242,131,0.08)]'
                : 'text-ink-muted hover:bg-[#13151c] hover:text-white'
            }`}
          >
            <ShieldAlert className={`h-4 w-4 ${currentTab === 'findings' ? 'text-[#43f283]' : 'text-ink-subtle'}`} />
            <span>Findings</span>
            <span className="ml-auto text-[10px] font-mono font-semibold text-[#f43f5e] bg-[#f43f5e]/15 border border-[#f43f5e]/30 rounded-full px-2 py-0.5">
              {findingsCount}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('endpoints')}
            className={`w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium transition-all ${
              currentTab === 'endpoints'
                ? 'bg-[#43f283]/10 text-[#43f283] font-semibold border border-[#43f283]/20 shadow-[0_0_15px_rgba(67,242,131,0.08)]'
                : 'text-ink-muted hover:bg-[#13151c] hover:text-white'
            }`}
          >
            <Code2 className={`h-4 w-4 ${currentTab === 'endpoints' ? 'text-[#43f283]' : 'text-ink-subtle'}`} />
            <span>Endpoints</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-[#43f283]/10 text-[#43f283] font-semibold border border-[#43f283]/20 shadow-[0_0_15px_rgba(67,242,131,0.08)]'
                : 'text-ink-muted hover:bg-[#13151c] hover:text-white'
            }`}
          >
            <History className={`h-4 w-4 ${currentTab === 'history' ? 'text-[#43f283]' : 'text-ink-subtle'}`} />
            <span>Scan history</span>
          </button>
        </nav>
      </div>

      {/* Tools Nav Section */}
      <div className="mt-7 space-y-1">
        <div className="px-3 pb-2 text-[9px] font-mono font-semibold tracking-wider text-ink-subtle uppercase">
          Tools
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setIsSpecModalOpen(true)}
            className="w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium text-ink-muted hover:bg-[#13151c] hover:text-white transition-all"
          >
            <FileCode className="h-4 w-4 text-ink-subtle" />
            <span>Import API spec</span>
          </button>

          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-[12px] font-medium text-ink-muted hover:bg-[#13151c] hover:text-white transition-all"
          >
            <Settings className="h-4 w-4 text-ink-subtle" />
            <span>Settings & LLM</span>
          </button>
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="mt-auto space-y-3.5">
        {/* Plan Credits Card */}
        <div className="bg-[#13151c] border border-[#1f212a] rounded-xl p-3.5 shadow-card">
          <div className="flex justify-between items-center text-[9px] font-mono text-ink-muted tracking-wider uppercase">
            <span>Scan Credits</span>
            <Sparkles className="h-3 w-3 text-[#43f283]" />
          </div>

          <div className="my-2.5 flex items-baseline gap-1.5">
            <b className="font-display font-bold text-[20px] text-white">12</b>
            <span className="text-[10px] text-ink-muted">/ 20 this month</span>
          </div>

          <div className="h-1.5 w-full bg-[#1e2028] rounded-full overflow-hidden">
            <div className="h-full bg-[#43f283] rounded-full shadow-[0_0_8px_rgba(67,242,131,0.5)]" style={{ width: '60%' }} />
          </div>

          <button
            onClick={() => setCurrentTab('history')}
            className="block mt-2.5 text-[10px] font-semibold text-[#43f283] hover:underline"
          >
            View plans ↗
          </button>
        </div>

        {/* Profile */}
        <div className="pt-3 border-t border-[#1f212a] flex items-center gap-2.5 px-1">
          <div className="w-[30px] h-[30px] rounded-full bg-[#181a24] border border-[#2b2e3c] text-[#43f283] text-[10px] font-bold flex items-center justify-center font-mono">
            AM
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <b className="text-[11px] font-bold text-white leading-tight truncate">Alex Morgan</b>
            <small className="text-[9px] text-ink-muted leading-tight">Security engineer</small>
          </div>
          <MoreHorizontal className="h-4 w-4 text-ink-subtle cursor-pointer hover:text-white" />
        </div>
      </div>
    </aside>
  );
}
