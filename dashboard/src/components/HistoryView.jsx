import React from 'react';
import { useApp } from '../context/AppContext';
import { History, Check, Play, Terminal } from 'lucide-react';

export function HistoryView({ onOpenNewScan, onOpenTelemetry }) {
  const { activeScan } = useApp();

  const historyItems = [
    {
      id: 'scan_1',
      target: 'http://localhost:4000 (Sentinel Sandbox Target)',
      time: activeScan ? 'Just now' : '2 hours ago',
      findings: activeScan?.stats?.vulnerableCount ?? 4,
      score: activeScan?.stats?.securityScore ?? 35,
      status: 'Completed',
    },
    {
      id: 'scan_2',
      target: 'http://127.0.0.1:4000 (Staging Environment)',
      time: 'Yesterday at 10:42 am',
      findings: 4,
      score: 35,
      status: 'Completed',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[22px] text-white tracking-tight">
            Security Scan History
          </h2>
          <p className="text-[12px] text-ink-muted">
            Audit logs and historical DAST runs across your API targets.
          </p>
        </div>

        <button
          onClick={onOpenNewScan}
          className="h-9 px-4 bg-[#43f283] hover:bg-[#32e073] text-[#0a0b0e] font-bold text-[11px] rounded-xl shadow-[0_0_15px_rgba(67,242,131,0.25)] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>New scan</span>
        </button>
      </div>

      <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl divide-y divide-[#1c1e28] shadow-card overflow-hidden">
        {historyItems.map((item) => (
          <div key={item.id} className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#43f283]/15 text-[#43f283] border border-[#43f283]/30 flex items-center justify-center text-[10px] font-bold">
                  <Check className="h-3 w-3" />
                </span>
                <b className="font-display font-bold text-[13px] text-white">{item.target}</b>
              </div>
              <p className="text-[11px] text-ink-muted pl-7.5 font-mono">{item.time}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[12px] font-bold text-[#f43f5e] block">{item.findings} Open Issues</span>
                <small className="text-[10px] text-ink-muted font-mono">Score: {item.score}/100</small>
              </div>

              <button
                onClick={onOpenTelemetry}
                className="h-8 px-3 rounded-lg bg-[#1a1c24] border border-[#262835] text-[11px] font-mono text-white hover:bg-[#222533] flex items-center gap-1.5"
              >
                <Terminal className="h-3.5 w-3.5 text-[#43f283]" />
                <span>Logs</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
