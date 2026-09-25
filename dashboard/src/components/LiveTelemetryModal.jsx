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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-[700px] bg-[#0c0d12] rounded-2xl shadow-2xl border border-[#1f212a] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Title bar */}
        <div className="px-5 py-3 bg-[#12141a] border-b border-[#1f212a] flex items-center justify-between text-xs text-ink-muted font-mono">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#f43f5e]" />
              <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
              <div className="w-3 h-3 rounded-full bg-[#43f283]" />
            </div>
            <span className="text-white font-semibold ml-2">sentinel-scanner-daemon</span>
            {isScanning && (
              <span className="px-2 py-0.5 bg-[#43f283]/15 text-[#43f283] border border-[#43f283]/30 rounded-full text-[10px] font-bold animate-pulse">
                PROBING
              </span>
            )}
          </div>

          <button onClick={onClose} className="text-ink-muted hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Terminal logs */}
        <div className="p-5 font-mono text-[11px] overflow-y-auto space-y-1.5 flex-1 bg-[#090a0d] leading-relaxed text-[#cbd5e1] selection:bg-[#43f283] selection:text-[#090a0d]">
          {liveLogs.map((log, idx) => {
            let color = 'text-[#cbd5e1]';
            if (log.includes('⚠️') || log.includes('VULNERABILITY') || log.includes('CRITICAL')) {
              color = 'text-[#f43f5e] font-semibold';
            } else if (log.includes('✅') || log.includes('FIX_VERIFIED') || log.includes('Passed')) {
              color = 'text-[#43f283] font-semibold';
            } else if (log.includes('[BOLA Engine]') || log.includes('[Auth Engine]') || log.includes('[Data Exposure Engine]') || log.includes('[Rate Limit Engine]')) {
              color = 'text-[#818cf8]';
            }

            return (
              <div key={idx} className={color}>
                {log}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3.5 bg-[#12141a] border-t border-[#1f212a] text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a1c24] text-white hover:bg-[#232734] rounded-lg text-[11px] font-mono font-semibold"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
