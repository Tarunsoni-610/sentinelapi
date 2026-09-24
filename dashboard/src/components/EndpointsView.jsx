import React from 'react';
import { useApp } from '../context/AppContext';
import { Code2, Lock, Unlock, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-[18px] text-[#252c3a] tracking-tight">
          API Endpoint Inventory ({endpoints.length})
        </h2>
        <p className="text-[11px] text-ink-muted">
          All endpoints discovered from the OpenAPI contract specification and assessed for security controls.
        </p>
      </div>

      <div className="bg-white border border-line rounded-lg divide-y divide-[#f0f1f3] shadow-2xs overflow-hidden">
        {endpoints.map((ep, idx) => {
          const isProtected = Array.isArray(ep.security) && ep.security.length > 0;
          return (
            <div key={idx} className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'GET'
                        ? 'bg-[#edf5fa] text-[#337ab7]'
                        : 'bg-[#edf8f2] text-[#3e9b72]'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-[12px] font-mono font-bold text-[#333a48]">{ep.path}</code>
                </div>
                <p className="text-[11px] text-[#737b88]">{ep.summary}</p>
              </div>

              <div>
                {isProtected ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#6659e8] bg-[#f0efff] px-2 py-1 rounded">
                    <Lock className="h-3 w-3" />
                    <span>bearerAuth</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[#8991a0] bg-[#f7f8fa] px-2 py-1 rounded">
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
