// API Service for communicating with SentinelAPI Scanner & Sandbox
const SCANNER_BASE_URL = import.meta.env.VITE_SCANNER_URL || '';

/**
 * Retrieves API key configuration from localStorage.
 */
export function getApiKeys() {
  try {
    return {
      geminiApiKey: localStorage.getItem('sentinel_gemini_api_key') || '',
      openaiApiKey: localStorage.getItem('sentinel_openai_api_key') || '',
      preferredProvider: localStorage.getItem('sentinel_llm_provider') || 'gemini',
    };
  } catch (_e) {
    return { geminiApiKey: '', openaiApiKey: '', preferredProvider: 'gemini' };
  }
}

/**
 * Saves API key configuration to localStorage.
 */
export function saveApiKeys({ geminiApiKey, openaiApiKey, preferredProvider }) {
  try {
    if (geminiApiKey !== undefined) localStorage.setItem('sentinel_gemini_api_key', geminiApiKey);
    if (openaiApiKey !== undefined) localStorage.setItem('sentinel_openai_api_key', openaiApiKey);
    if (preferredProvider !== undefined) localStorage.setItem('sentinel_llm_provider', preferredProvider);
  } catch (_e) {
    // ignore
  }
}

/**
 * Generic request wrapper with auth headers.
 */
async function fetchJson(path, options = {}) {
  const keys = getApiKeys();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (keys.geminiApiKey) headers['x-gemini-api-key'] = keys.geminiApiKey;
  if (keys.openaiApiKey) headers['x-openai-api-key'] = keys.openaiApiKey;
  if (keys.preferredProvider) headers['x-llm-provider'] = keys.preferredProvider;

  const url = `${SCANNER_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch (_e) {
    // not json
  }

  if (!response.ok) {
    throw new Error(json?.error || `HTTP ${response.status}: ${rawText || response.statusText}`);
  }

  return json;
}

export const api = {
  // Scanner Health
  getHealth: () => fetchJson('/healthz'),

  // Run full security scan
  startScan: ({ targetUrl, rawSpec, modules, enrichWithAi = true }) =>
    fetchJson('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ targetUrl, rawSpec, modules, enrichWithAi }),
    }),

  // Inspect OpenAPI spec contract
  inspectSpec: ({ targetUrl, rawSpec }) =>
    fetchJson('/api/scan/spec', {
      method: 'POST',
      body: JSON.stringify({ targetUrl, rawSpec }),
    }),

  // Get specific scan results
  getScan: (id) => fetchJson(`/api/scans/${id}`),

  // List past scans
  listScans: () => fetchJson('/api/scans'),

  // Generate / Regenerate AI Remediation Diff
  generateRemediation: (finding, provider = null, apiKey = null) => {
    const customHeaders = {};
    if (apiKey) {
      if (provider === 'openai') customHeaders['x-openai-api-key'] = apiKey;
      else customHeaders['x-gemini-api-key'] = apiKey;
    }
    if (provider) customHeaders['x-llm-provider'] = provider;

    return fetchJson('/api/remediate', {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify({ finding, provider, apiKey }),
    });
  },

  // Targeted verification probe & patch application
  verifyFix: ({ targetUrl, patchId, applyPatch }) =>
    fetchJson('/api/verify', {
      method: 'POST',
      body: JSON.stringify({ targetUrl, patchId, applyPatch }),
    }),

  // Sandbox proxy controls
  getSandboxInfo: (targetUrl) => fetchJson(`/api/sandbox/info?targetUrl=${encodeURIComponent(targetUrl)}`),
  resetSandbox: (targetUrl) =>
    fetchJson('/api/sandbox/reset', {
      method: 'POST',
      body: JSON.stringify({ targetUrl }),
    }),
  toggleSandboxPatch: (targetUrl, patchId, apply = true) =>
    fetchJson('/api/sandbox/patch', {
      method: 'POST',
      body: JSON.stringify({ targetUrl, patchId, apply }),
    }),
};
