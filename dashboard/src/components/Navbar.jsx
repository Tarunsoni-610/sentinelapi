import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Key, Moon, Sun, RotateCcw, Server, Activity, FileCode } from 'lucide-react';

export function Navbar() {
  const {
    theme,
    toggleTheme,
    apiKeys,
    setIsApiKeyModalOpen,
    setIsSpecModalOpen,
    resetSandbox,
    scannerStatus,
    sandboxStatus,
  } = useApp();

  const hasApiKey = Boolean(apiKeys.geminiApiKey || apiKeys.openaiApiKey);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SentinelAPI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0 DAST
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Stateful API Vulnerability Scanner & AI Remediation
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Scanner Service */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Scanner :5000</span>
            <span
              className={`h-2 w-2 rounded-full ${
                scannerStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>

          {/* Sandbox Target */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Activity className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Sandbox :4000</span>
            <span
              className={`h-2 w-2 rounded-full ${
                sandboxStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {sandboxStatus.appliedPatches?.length > 0 && (
              <span className="text-[10px] font-bold text-amber-400 ml-1">
                ({sandboxStatus.appliedPatches.length} Patches)
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Reset Sandbox */}
          <button
            onClick={resetSandbox}
            title="Reset sandbox database & revert all patches"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>

          {/* OpenAPI Contract */}
          <button
            onClick={() => setIsSpecModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
          >
            <FileCode className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">API Spec</span>
          </button>

          {/* AI Settings Modal */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              hasApiKey
                ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
                : 'text-slate-300 bg-slate-900 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">LLM Keys</span>
            {hasApiKey && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
