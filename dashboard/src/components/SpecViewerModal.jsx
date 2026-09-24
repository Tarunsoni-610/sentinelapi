import React from 'react';
import { useApp } from '../context/AppContext';
import { FileCode, X, Lock, Unlock, Tag } from 'lucide-react';

export function SpecViewerModal() {
  const { isSpecModalOpen, setIsSpecModalOpen, activeScan } = useApp();

  if (!isSpecModalOpen) return null;

  const specInfo = activeScan?.specInfo || { title: 'SentinelAPI Sandbox Spec', version: '1.0.0' };
  const endpoints = activeScan?.endpoints || [
    { method: 'POST', path: '/api/auth/login', summary: 'Exchange credentials for a bearer token', security: [] },
    { method: 'GET', path: '/api/users/me', summary: 'Get the caller\'s own profile', security: [{ bearerAuth: [] }] },
    { method: 'POST', path: '/api/orders', summary: 'Create an order owned by caller', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/orders', summary: 'List the caller\'s own orders', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/orders/{id}', summary: 'Get one order (owner only)', security: [{ bearerAuth: [] }] },
    { method: 'POST', path: '/api/invoices', summary: 'Create an invoice owned by caller', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/invoices/{id}', summary: 'Get one invoice (owner only)', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/admin/stats', summary: 'Admin-only platform statistics', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/products', summary: 'Public product catalogue', security: [] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileCode className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">OpenAPI Contract Definition</h3>
              <p className="text-xs text-slate-400">
                {specInfo.title} (v{specInfo.version}) • {endpoints.length} Endpoints
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSpecModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {endpoints.map((ep, idx) => {
            const hasSecurity = Array.isArray(ep.security) && ep.security.length > 0;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        ep.method === 'GET'
                          ? 'bg-sky-500/20 text-sky-400'
                          : ep.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">{ep.path}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{ep.summary || 'No description provided.'}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {hasSecurity ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px]">
                      <Lock className="h-3 w-3" />
                      <span>bearerAuth</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                      <Unlock className="h-3 w-3" />
                      <span>Public</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={() => setIsSpecModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
