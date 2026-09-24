import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export function LiveLogsTerminal() {
  const { liveLogs, isScanning } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isCollapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, isCollapsed]);

  if (liveLogs.length === 0 && !isScanning) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center space-x-1.5 ml-2 text-slate-400 font-mono font-medium">
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sentinel Live Probe Telemetry</span>
            {isScanning && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold animate-pulse">
                STREAMING
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title={isCollapsed ? 'Expand Terminal' : 'Collapse Terminal'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {!isCollapsed && (
        <div className="p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1 bg-slate-950/90 selection:bg-indigo-500 selection:text-white">
          {liveLogs.map((log, index) => {
            let color = 'text-slate-300';
            if (log.includes('⚠️') || log.includes('VULNERABILITY') || log.includes('CRITICAL')) {
              color = 'text-rose-400 font-semibold';
            } else if (log.includes('✅') || log.includes('FIX_VERIFIED') || log.includes('Passed')) {
              color = 'text-emerald-400 font-semibold';
            } else if (log.includes('[BOLA Engine]') || log.includes('[Auth Engine]') || log.includes('[Data Exposure Engine]') || log.includes('[Rate Limit Engine]')) {
              color = 'text-indigo-400';
            } else if (log.includes('Initializing') || log.includes('Starting')) {
              color = 'text-sky-300';
            }

            return (
              <div key={index} className={`leading-relaxed ${color}`}>
                {log}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
