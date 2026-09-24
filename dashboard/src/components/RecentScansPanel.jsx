import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, MoreHorizontal, Terminal, Activity, ArrowRight } from 'lucide-react';

export function RecentScansPanel({ onOpenTelemetry }) {
  const { activeScan, isScanning, liveLogs } = useApp();

  const mockScans = [
    {
      id: 'scan_prod',
      name: 'Sentinel Sandbox Target',
      type: 'OpenAPI 3.0.3 spec',
      endpoints: activeScan?.stats?.totalEndpoints || 6,
      time: activeScan ? 'Just now' : '2h ago',
      duration: activeScan ? '0.3s' : '48s',
      status: 'success',
    },
    {
      id: 'scan_staging',
      name: 'Staging Auth & Orders',
      type: 'OpenAPI 3.0 spec',
      endpoints: 4,
      time: 'Yesterday',
      duration: '32s',
      status: 'success',
    },
  ];

  return (
    <div className="bg-white border border-line rounded-lg p-[16px_16px_0] flex flex-col shadow-2xs">
      {/* Head */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-[14px] text-[#252c3a] tracking-tight">
            Recent scans
          </h2>
          <p className="text-[10px] text-ink-muted">Latest activity across your APIs</p>
        </div>

        <div className="flex items-center gap-2">
          {liveLogs.length > 0 && (
            <button
              onClick={onOpenTelemetry}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f0efff] text-[#6558e8] font-semibold flex items-center gap-1 hover:bg-[#e6e3ff] transition-colors"
            >
              <Terminal className="h-3 w-3" />
              <span>Logs</span>
            </button>
          )}
          <MoreHorizontal className="h-4 w-4 text-[#9da3ad] cursor-pointer hover:text-ink" />
        </div>
      </div>

      {/* Scans List */}
      <div className="mt-3.5 divide-y divide-[#f0f1f3]">
        {mockScans.map((scan) => (
          <div key={scan.id} className="min-h-[59px] py-2.5 flex items-center gap-2.5">
            {/* Status Icon */}
            <div className="w-[22px] h-[22px] rounded-full bg-[#edf8f2] text-[#3e9b72] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              <Check className="h-3 w-3" />
            </div>

            {/* Scan Info */}
            <div className="flex-1 min-w-0">
              <b className="text-[10px] font-semibold text-[#515866] block truncate">
                {scan.name}
              </b>
              <small className="text-[9px] text-[#a1a6b0] block mt-0.5">
                {scan.type} · {scan.endpoints} endpoints
              </small>
            </div>

            {/* Time */}
            <div className="text-right flex-shrink-0">
              <b className="text-[10px] font-semibold text-[#515866] block">
                {scan.time}
              </b>
              <small className="text-[9px] text-[#a1a6b0] block mt-0.5">
                {scan.duration}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <button
        onClick={onOpenTelemetry}
        className="w-full h-[38px] border-t border-[#f0f1f3] text-[#7268d9] text-[10px] font-semibold hover:underline flex items-center justify-between px-1 mt-auto"
      >
        <span>View live telemetry & audit trace</span>
        <span>→</span>
      </button>
    </div>
  );
}
