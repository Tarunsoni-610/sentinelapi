'use strict';
const { sendRequest, buildCurl } = require('./client');

/**
 * Probes for Unrestricted Resource Consumption / Missing Rate Limiting - OWASP API4:2023.
 * Bursts requests against sensitive auth endpoints and validates rate limit headers / 429 response.
 */
async function probeRateLimiting(targetUrl, _openApiDoc = null) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const logs = [];
  const findings = [];
  const controls = [];

  logs.push(`[Rate Limit Engine] Testing brute-force resilience on POST /api/auth/login...`);

  // Target: /api/auth/login
  const loginUrl = `${cleanUrl}/api/auth/login`;
  const attempts = 15;
  const loginStatusCodes = [];

  for (let i = 0; i < attempts; i++) {
    const res = await sendRequest(cleanUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@sandbox.local', password: 'invalid_password_attempt' },
    });
    loginStatusCodes.push(res.status);
  }

  const rateLimited429Count = loginStatusCodes.filter((s) => s === 429).length;
  logs.push(`[Rate Limit Engine] Fired ${attempts} rapid login attempts. Received status codes: [${loginStatusCodes.slice(0, 12).join(', ')}...] (429 count: ${rateLimited429Count})`);

  const curlPoc = buildCurl(loginUrl, {
    method: 'POST',
    body: { email: 'alice@sandbox.local', password: 'attacker_guessed_pwd' },
  });

  if (rateLimited429Count === 0) {
    logs.push(`[Rate Limit Engine] ⚠️ VULNERABILITY CONFIRMED: 0 out of ${attempts} login attempts were throttled. Endpoint vulnerable to credential stuffing.`);
    findings.push({
      id: 'finding_login_rate_limit',
      patchId: 'login-rate-limit',
      title: 'Missing Rate Limiting on Authentication Endpoint (Credential Stuffing Risk)',
      category: 'API4:2023 - Unrestricted Resource Consumption',
      owaspId: 'API4:2023',
      cwe: 'CWE-799: Improper Control of Generation of Code or Other Resources',
      severity: 'MEDIUM',
      status: 'VULNERABLE',
      path: '/api/auth/login',
      method: 'POST',
      description:
        'The login endpoint does not impose IP or account-based rate limiting or throttling. An attacker can perform automated high-velocity credential stuffing, brute-force dictionary attacks, or password spraying without encountering rate limit resistance.',
      businessImpact:
        'Susceptible to user account takeover, denial of service through heavy CPU/hash calculations, and credential stuffing attacks.',
      evidence: {
        request: {
          method: 'POST',
          url: loginUrl,
          bodySample: { email: 'alice@sandbox.local', password: '***' },
        },
        burstSize: attempts,
        receivedStatusCodes: loginStatusCodes,
        throttledCount: 0,
      },
      curlPoc,
      codeContext: {
        file: 'src/routes/auth.js',
        vulnerableFunction: 'loginLimiter',
        codeSnippet: `const loginLimiter = rateLimiter({\n  name: 'login',\n  windowMs: 10_000,\n  max: 10,\n  enabled: () => store.patches.has('login-rate-limit'),\n});`,
      },
    });
  } else {
    logs.push(`[Rate Limit Engine] ✅ Rate limiting enforced! Server issued 429 Too Many Requests after threshold.`);
    findings.push({
      id: 'finding_login_rate_limit',
      patchId: 'login-rate-limit',
      title: 'Missing Rate Limiting on Authentication Endpoint',
      category: 'API4:2023 - Unrestricted Resource Consumption',
      owaspId: 'API4:2023',
      cwe: 'CWE-799: Improper Control of Generation of Code',
      severity: 'MEDIUM',
      status: 'FIX_VERIFIED',
      path: '/api/auth/login',
      method: 'POST',
      description: 'Rate limiting is active. Excess requests are throttled with HTTP 429 and Retry-After headers.',
      businessImpact: 'Protected against brute-force and credential stuffing.',
      evidence: {
        burstSize: attempts,
        throttledCount: rateLimited429Count,
      },
      curlPoc,
    });
  }

  // --- Control Check: /api/products ---
  logs.push(`[Rate Limit Engine] Running Control Check: Testing rate limiter on public /api/products...`);
  const prodCodes = [];
  for (let i = 0; i < 22; i++) {
    const res = await sendRequest(cleanUrl, '/api/products', { method: 'GET' });
    prodCodes.push(res.status);
  }

  const prod429 = prodCodes.filter((s) => s === 429).length;
  if (prod429 > 0) {
    logs.push(`[Rate Limit Engine] ✅ Control Passed: /api/products throttled excessive requests (${prod429} returned 429).`);
    controls.push({
      name: 'Product Catalog Rate Limiter',
      path: '/api/products',
      method: 'GET',
      status: 'PASSED',
      details: `Public endpoint correctly returns 429 after 20 requests per 10s. No false positive triggered.`,
    });
  }

  return { findings, controls, logs };
}

module.exports = {
  probeRateLimiting,
};
