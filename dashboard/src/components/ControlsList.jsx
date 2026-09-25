import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export function ControlsList() {
  const { activeScan } = useApp();

  const controls = activeScan?.controls || [];
  if (controls.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
      <div className="flex items-center space-x-2">
        <ShieldCheck className="h-5 w-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-white tracking-tight">
          Verified Negative Controls ({controls.length} Passed)
        </h3>
      </div>
      <p className="text-xs text-slate-400">
        SentinelAPI verifies safe control endpoints alongside vulnerable targets to ensure zero false positives and validate access control baselines.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {controls.map((control, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3 text-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-200">{control.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {control.method} {control.path}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{control.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
