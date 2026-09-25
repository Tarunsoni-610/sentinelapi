import React from 'react';
import { useApp } from '../context/AppContext';
import { Code2, Lock, Unlock } from 'lucide-react';

export function EndpointsView() {
  const { activeScan } = useApp();

  const endpoints = activeScan?.endpoints || [
    { method: 'POST', path: '/api/auth/login', summary: 'Exchange credentials for a bearer token', security: [] },
    { method: 'GET', path: '/api/users/me', summary: 'Get the caller\'s own profile', security: [{ bearerAuth: [] }] },
    { method: 'POST', path: '/api/orders', summary: 'Create an order owned by caller', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/orders', summary: 'List the caller\'s own orders', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/orders/{id}', summary: 'Get one order (owner only)', security: [{ bearerAuth: [] }] },
    { method: 'POST', path: '/api/invoices', summary: 'Create an invoice owned by caller', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/invoices/{id}', summary: 'Get one invoice (owner only)', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/admin/stats', summary: 'Admin-only platform statistics', security: [{ bearerAuth: [] }] },
    { method: 'GET', path: '/api/products', summary: 'Public product catalogue (rate limited)', security: [] },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-[22px] text-white tracking-tight">
          API Endpoint Inventory ({endpoints.length})
        </h2>
        <p className="text-[12px] text-ink-muted">
          All endpoints discovered from the OpenAPI contract specification and assessed for security controls.
        </p>
      </div>

      <div className="bg-[#12141a] border border-[#1f212a] rounded-2xl divide-y divide-[#1c1e28] shadow-card overflow-hidden">
        {endpoints.map((ep, idx) => {
          const isProtected = Array.isArray(ep.security) && ep.security.length > 0;
          return (
            <div key={idx} className="p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      ep.method === 'GET'
                        ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20'
                        : 'bg-[#43f283]/10 text-[#43f283] border-[#43f283]/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-[13px] font-mono font-bold text-white">{ep.path}</code>
                </div>
                <p className="text-[11px] text-ink-muted">{ep.summary}</p>
              </div>

              <div>
                {isProtected ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/25 px-2.5 py-1 rounded-full">
                    <Lock className="h-3 w-3" />
                    <span>bearerAuth</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted bg-[#181a24] border border-[#222533] px-2.5 py-1 rounded-full">
                    <Unlock className="h-3 w-3" />
                    <span>Public</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
