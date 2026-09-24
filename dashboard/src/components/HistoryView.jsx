import React from 'react';
import { useApp } from '../context/AppContext';
import { History, Check, Play, Terminal } from 'lucide-react';

export function HistoryView({ onOpenNewScan, onOpenTelemetry }) {
  const { activeScan } = useApp();

  const historyItems = [
    {
      id: 'scan_1',
      target: 'http://localhost:4000 (Sentinel Sandbox)',
      time: activeScan ? 'Just now' : '2 hours ago',
      findings: activeScan?.stats?.vulnerableCount ?? 4,
      score: activeScan?.stats?.securityScore ?? 35,
      status: 'Completed',
    },
    {
      id: 'scan_2',
      target: 'http://127.0.0.1:4000 (Staging Sandbox)',
      time: 'Yesterday at 10:42 am',
      findings: 4,
      score: 35,
      status: 'Completed',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-[18px] text-[#252c3a] tracking-tight">
            Security Scan History
          </h2>
          <p className="text-[11px] text-ink-muted">
            Audit logs and historical DAST runs across your API targets.
          </p>
        </div>

        <button
          onClick={onOpenNewScan}
          className="h-8 px-3.5 bg-violet hover:bg-violet-hover text-white font-semibold text-[11px] rounded-md shadow-sm transition-all flex items-center gap-1.5"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>New scan</span>
        </button>
      </div>

      <div className="bg-white border border-line rounded-lg divide-y divide-[#f0f1f3] shadow-2xs overflow-hidden">
        {historyItems.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#edf8f2] text-[#3e9b72] flex items-center justify-center text-[10px] font-bold">
                  <Check className="h-3 w-3" />
                </span>
                <b className="font-display font-bold text-[12px] text-[#333a48]">{item.target}</b>
              </div>
              <p className="text-[10px] text-ink-muted pl-7">{item.time}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] font-bold text-coral block">{item.findings} Open Findings</span>
                <small className="text-[9px] text-ink-muted">Score: {item.score}/100</small>
              </div>

              <button
                onClick={onOpenTelemetry}
                className="h-7 px-2.5 rounded bg-[#f8f8fa] border border-line text-[10px] font-mono text-[#697280] hover:bg-white flex items-center gap-1"
              >
                <Terminal className="h-3 w-3" />
                <span>Logs</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
