import React, { useState } from 'react';
import { Copy, Check, FileCode2 } from 'lucide-react';

export function CodeDiffViewer({ diff, fileName = 'remediation.patch' }) {
  const [copied, setCopied] = useState(false);

  if (!diff) {
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 font-mono">
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
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <FileCode2 className="h-4 w-4 text-indigo-400" />
          <span>{fileName}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-sans"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Content */}
      <div className="p-3 font-mono text-xs overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
        {lines.map((line, idx) => {
          let lineStyle = 'text-slate-300';
          let bgStyle = '';

          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineStyle = 'text-emerald-400 font-medium';
            bgStyle = 'bg-emerald-950/40 border-l-2 border-emerald-500 pl-2 -ml-2';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineStyle = 'text-rose-400 font-medium';
            bgStyle = 'bg-rose-950/40 border-l-2 border-rose-500 pl-2 -ml-2';
          } else if (line.startsWith('@@')) {
            lineStyle = 'text-cyan-400 font-semibold';
            bgStyle = 'bg-cyan-950/20 py-0.5';
          } else if (line.startsWith('---') || line.startsWith('+++')) {
            lineStyle = 'text-slate-500 font-bold';
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
