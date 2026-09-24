import React, { useState } from 'react';
import { Copy, Check, FileCode2 } from 'lucide-react';

export function CodeDiffViewer({ diff, fileName = 'remediation.patch' }) {
  const [copied, setCopied] = useState(false);

  if (!diff) {
    return (
      <div className="p-4 rounded-xl bg-[#0a0b0e] border border-[#1f212a] text-xs text-ink-muted font-mono">
        No code diff available.
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = diff.split('\n');

  return (
    <div className="rounded-xl border border-[#1f212a] bg-[#0a0b0e] overflow-hidden shadow-inner">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#12141a] border-b border-[#1f212a] text-xs font-mono">
        <div className="flex items-center space-x-2 text-white">
          <FileCode2 className="h-4 w-4 text-[#43f283]" />
          <span>{fileName}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#1a1c24] hover:bg-[#232733] text-white transition-colors text-[11px] font-sans"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#43f283]" />
              <span className="text-[#43f283] font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-ink-muted" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Content */}
      <div className="p-3 font-mono text-xs overflow-x-auto leading-relaxed max-h-80 overflow-y-auto selection:bg-[#43f283] selection:text-[#0a0b0e]">
        {lines.map((line, idx) => {
          let lineStyle = 'text-[#cbd5e1]';
          let bgStyle = '';

          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineStyle = 'text-[#43f283] font-medium';
            bgStyle = 'bg-[#43f283]/10 border-l-2 border-[#43f283] pl-2 -ml-2';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineStyle = 'text-[#f43f5e] font-medium';
            bgStyle = 'bg-[#f43f5e]/10 border-l-2 border-[#f43f5e] pl-2 -ml-2';
          } else if (line.startsWith('@@')) {
            lineStyle = 'text-[#818cf8] font-semibold';
            bgStyle = 'bg-[#818cf8]/10 py-0.5';
          } else if (line.startsWith('---') || line.startsWith('+++')) {
            lineStyle = 'text-ink-muted font-bold';
          }

          return (
            <div key={idx} className={`${bgStyle} ${lineStyle} whitespace-pre`}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );
}
