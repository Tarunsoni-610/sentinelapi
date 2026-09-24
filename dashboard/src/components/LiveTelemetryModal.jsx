import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, X } from 'lucide-react';

export function LiveTelemetryModal({ isOpen, onClose }) {
  const { liveLogs, isScanning } = useApp();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202537]/35 backdrop-blur-[2px]">
      <div className="w-full max-w-[680px] bg-[#0d1117] rounded-xl shadow-[0_18px_60px_rgba(33,40,59,0.25)] border border-[#30363d] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Title bar */}
        <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] font-mono">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[#c9d1d9] font-semibold ml-2">sentinel-scanner-daemon</span>
            {isScanning && (
              <span className="px-1.5 py-0.2 bg-[#388bfd]/20 text-[#58a6ff] rounded text-[10px] animate-pulse">
                PROBING
              </span>
            )}
          </div>

          <button onClick={onClose} className="text-[#8b949e] hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Terminal logs */}
        <div className="p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 flex-1 bg-[#0d1117] leading-relaxed text-[#c9d1d9]">
          {liveLogs.map((log, idx) => {
            let color = 'text-[#c9d1d9]';
            if (log.includes('⚠️') || log.includes('VULNERABILITY') || log.includes('CRITICAL')) {
              color = 'text-[#ff7b72] font-semibold';
            } else if (log.includes('✅') || log.includes('FIX_VERIFIED') || log.includes('Passed')) {
              color = 'text-[#7ee787] font-semibold';
            } else if (log.includes('[BOLA Engine]') || log.includes('[Auth Engine]') || log.includes('[Data Exposure Engine]') || log.includes('[Rate Limit Engine]')) {
              color = 'text-[#79c0ff]';
            }

            return (
              <div key={idx} className={color}>
                {log}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 bg-[#161b22] border-t border-[#30363d] text-right">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] rounded text-[11px] font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
