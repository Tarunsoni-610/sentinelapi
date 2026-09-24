'use strict';
const { loadConfig } = require('./config');

/**
 * HTTP request helper for CLI.
 */
async function request(baseUrl, path, options = {}) {
  const config = loadConfig();
  const cleanBase = (baseUrl || config.scannerUrl).replace(/\/+$/, '');
  const url = `${cleanBase}${path.startsWith('/') ? path : '/' + path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (config.geminiApiKey) headers['x-gemini-api-key'] = config.geminiApiKey;
  if (config.openaiApiKey) headers['x-openai-api-key'] = config.openaiApiKey;
  if (config.llmProvider) headers['x-llm-provider'] = config.llmProvider;

  let res;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeout || 15000),
    });
  } catch (err) {
    throw new Error(`Connection error to ${url}: ${err.message}`);
  }

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_e) {
    // raw text
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}: ${text || res.statusText}`);
  }

  return data;
}

const apiClient = {
  // Scanner Health
  getScannerHealth: (scannerUrl) => request(scannerUrl, '/healthz'),

  // Run Security Scan
  runScan: ({ scannerUrl, targetUrl, rawSpec, modules, apiKey, provider }) => {
    const customHeaders = {};
    if (apiKey) {
      if (provider === 'openai') customHeaders['x-openai-api-key'] = apiKey;
      else customHeaders['x-gemini-api-key'] = apiKey;
    }
    if (provider) customHeaders['x-llm-provider'] = provider;

    return request(scannerUrl, '/api/scan', {
      method: 'POST',
      headers: customHeaders,
      body: { targetUrl, rawSpec, modules, enrichWithAi: true },
      timeout: 30000,
    });
  },

  // Get Scan by ID
  getScan: (scannerUrl, id) => request(scannerUrl, `/api/scans/${id}`),

  // Targeted Fix Verification Probe
  verifyFix: ({ scannerUrl, targetUrl, patchId, applyPatch }) =>
    request(scannerUrl, '/api/verify', {
      method: 'POST',
      body: { targetUrl, patchId, applyPatch },
    }),

  // AI Remediation Regeneration
  generateRemediation: ({ scannerUrl, finding, apiKey, provider }) => {
    const customHeaders = {};
    if (apiKey) {
      if (provider === 'openai') customHeaders['x-openai-api-key'] = apiKey;
      else customHeaders['x-gemini-api-key'] = apiKey;
    }
    if (provider) customHeaders['x-llm-provider'] = provider;

    return request(scannerUrl, '/api/remediate', {
      method: 'POST',
      headers: customHeaders,
      body: { finding, apiKey, provider },
    });
  },

  // Sandbox Info & Patch Control
  getSandboxInfo: (scannerUrl, targetUrl) =>
    request(scannerUrl, `/api/sandbox/info?targetUrl=${encodeURIComponent(targetUrl)}`),

  toggleSandboxPatch: (scannerUrl, targetUrl, patchId, apply = true) =>
    request(scannerUrl, '/api/sandbox/patch', {
      method: 'POST',
      body: { targetUrl, patchId, apply },
    }),

  resetSandbox: (scannerUrl, targetUrl) =>
    request(scannerUrl, '/api/sandbox/reset', {
      method: 'POST',
      body: { targetUrl },
    }),
};

module.exports = apiClient;
