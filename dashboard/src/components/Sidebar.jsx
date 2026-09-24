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
  ExternalLink,
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab }) {
  const { activeScan, setIsApiKeyModalOpen, setIsSpecModalOpen } = useApp();

  const findingsCount = activeScan?.findings?.filter((f) => f.status === 'VULNERABLE')?.length ?? 4;

  return (
    <aside className="fixed inset-y-0 left-0 w-[236px] bg-white border-r border-line p-[22px_14px_14px] flex flex-col z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5">
        <div className="w-7 h-7 text-violet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <span className="font-display font-extrabold text-[21px] tracking-[-0.8px] text-[#232939]">
          sentinel<span className="text-violet">.</span>
        </span>
      </div>

      {/* Workspace Switcher */}
      <div className="h-[52px] border border-line rounded-lg my-6 p-2 flex items-center gap-2.5 bg-white shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
        <div className="h-8 w-8 rounded-[7px] bg-[#f1efff] text-violet font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
          N
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <b className="text-[12px] font-bold text-ink leading-tight truncate">Northstar</b>
          <small className="text-[10px] text-ink-muted leading-tight">Workspace</small>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[#9298a5] mr-1" />
      </div>

      {/* Workspace Nav Section */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[9px] font-mono font-semibold tracking-wider text-ink-subtle uppercase">
          Workspace
        </div>

        <nav className="space-y-0.5">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium transition-all ${
              currentTab === 'overview'
                ? 'bg-[#f3f2ff] text-[#584ed2] font-semibold'
                : 'text-[#737b88] hover:bg-[#fafafc] hover:text-ink'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${currentTab === 'overview' ? 'text-violet' : 'text-[#9098a6]'}`} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('findings')}
            className={`w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium transition-all ${
              currentTab === 'findings'
                ? 'bg-[#f3f2ff] text-[#584ed2] font-semibold'
                : 'text-[#737b88] hover:bg-[#fafafc] hover:text-ink'
            }`}
          >
            <ShieldAlert className={`h-4 w-4 ${currentTab === 'findings' ? 'text-violet' : 'text-[#9098a6]'}`} />
            <span>Findings</span>
            <span className="ml-auto text-[10px] font-mono font-medium text-[#7770d7] bg-[#e8e6ff] rounded-full px-2 py-0.5">
              {findingsCount}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('endpoints')}
            className={`w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium transition-all ${
              currentTab === 'endpoints'
                ? 'bg-[#f3f2ff] text-[#584ed2] font-semibold'
                : 'text-[#737b88] hover:bg-[#fafafc] hover:text-ink'
            }`}
          >
            <Code2 className={`h-4 w-4 ${currentTab === 'endpoints' ? 'text-violet' : 'text-[#9098a6]'}`} />
            <span>Endpoints</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-[#f3f2ff] text-[#584ed2] font-semibold'
                : 'text-[#737b88] hover:bg-[#fafafc] hover:text-ink'
            }`}
          >
            <History className={`h-4 w-4 ${currentTab === 'history' ? 'text-violet' : 'text-[#9098a6]'}`} />
            <span>Scan history</span>
          </button>
        </nav>
      </div>

      {/* Tools Nav Section */}
      <div className="mt-7 space-y-1">
        <div className="px-3 pb-2 text-[9px] font-mono font-semibold tracking-wider text-ink-subtle uppercase">
          Tools
        </div>

        <nav className="space-y-0.5">
          <button
            onClick={() => setIsSpecModalOpen(true)}
            className="w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium text-[#737b88] hover:bg-[#fafafc] hover:text-ink transition-all"
          >
            <FileCode className="h-4 w-4 text-[#9098a6]" />
            <span>Import API spec</span>
          </button>

          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="w-full h-[36px] flex items-center gap-3 px-3 rounded-md text-[12px] font-medium text-[#737b88] hover:bg-[#fafafc] hover:text-ink transition-all"
          >
            <Settings className="h-4 w-4 text-[#9098a6]" />
            <span>Settings & LLM</span>
          </button>
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="mt-auto space-y-3.5">
        {/* Plan Credits Card */}
        <div className="bg-[#f8f8fd] border border-[#ececf4] rounded-lg p-3">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#959baa] tracking-wider uppercase">
            <span>Scan Credits</span>
            <Sparkles className="h-3 w-3 text-violet" />
          </div>

          <div className="my-2.5 flex items-baseline gap-1.5">
            <b className="font-display font-bold text-[19px] text-ink">12</b>
            <span className="text-[10px] text-[#9399a6]">/ 20 this month</span>
          </div>

          <div className="h-1 w-full bg-[#e4e4f0] rounded-full overflow-hidden">
            <div className="h-full bg-violet rounded-full" style={{ width: '60%' }} />
          </div>

          <button
            onClick={() => setCurrentTab('history')}
            className="block mt-2.5 text-[10px] font-semibold text-[#6258d4] hover:underline"
          >
            View plans ↗
          </button>
        </div>

        {/* Profile */}
        <div className="pt-3 border-t border-line flex items-center gap-2.5 px-1">
          <div className="w-[30px] h-[30px] rounded-full bg-[#f8e8db] text-[#9c6244] text-[10px] font-bold flex items-center justify-center">
            AM
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <b className="text-[11px] font-bold text-ink leading-tight truncate">Alex Morgan</b>
            <small className="text-[9px] text-ink-muted leading-tight">Security engineer</small>
          </div>
          <MoreHorizontal className="h-4 w-4 text-[#a2a7b0] cursor-pointer hover:text-ink" />
        </div>
      </div>
    </aside>
  );
}
