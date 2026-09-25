import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSpec } from './specParser.js';
import { generateRemediation } from './llmClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads knowledge base and skills documentation.
 */
export function loadRulesAndKnowledge() {
  const possibleKnowledgePaths = [
    path.resolve(__dirname, 'rules/knowledge.md'),
    path.resolve(__dirname, '../knowledge.md'),
    path.resolve(process.cwd(), 'cli/src/rules/knowledge.md'),
    path.resolve(process.cwd(), 'knowledge.md'),
  ];

  const possibleSkillPaths = [
    path.resolve(__dirname, 'rules/skills.md'),
    path.resolve(__dirname, '../skills.md'),
    path.resolve(process.cwd(), 'cli/src/rules/skills.md'),
    path.resolve(process.cwd(), 'skills.md'),
  ];

  let knowledge = '';
  let skills = '';

  for (const p of possibleKnowledgePaths) {
    if (fs.existsSync(p)) {
      knowledge = fs.readFileSync(p, 'utf8');
      break;
    }
  }

  for (const p of possibleSkillPaths) {
    if (fs.existsSync(p)) {
      skills = fs.readFileSync(p, 'utf8');
      break;
    }
  }

  return { knowledge, skills };
}

/**
 * Executes stateful HTTP probe request with timeout and error handling.
 */
async function sendProbeRequest(baseUrl, routePath, { method = 'GET', token = null, headers = {}, body = null, timeout = 6000 } = {}) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}${routePath.startsWith('/') ? routePath : '/' + routePath}`;

  const reqHeaders = { ...headers };
  if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

  let bodyStr;
  if (body !== null && body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
    bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: bodyStr,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: 'Connection Error',
      headers: {},
      data: null,
      rawText: '',
      durationMs: Date.now() - startTime,
      error: err.message,
      url,
      method,
    };
  }

  const durationMs = Date.now() - startTime;
  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch (_e) {
    // raw text response
  }

  const resHeaders = {};
  for (const [k, v] of res.headers.entries()) {
    resHeaders[k.toLowerCase()] = v;
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    data,
    rawText,
    durationMs,
    url,
    method,
  };
}

/**
 * Authenticates a sandbox persona and returns token.
 */
async function authenticatePersona(baseUrl, who = 'alice', password = null) {
  const email = `${who}@sandbox.local`;
  const pwd = password || `${who}123`;

  const res = await sendProbeRequest(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: { email, password: pwd },
  });

  if (res.status === 200 && res.data?.token) {
    return {
      token: res.data.token,
      user: res.data.user,
      email,
    };
  }

  throw new Error(`Authentication failed for ${email} (status ${res.status}): ${res.rawText}`);
}

/**
 * Calculates security posture score (0-100).
 */
function calculateSecurityScore(findings) {
  let score = 100;
  for (const f of findings) {
    if (f.status === 'VULNERABLE') {
      if (f.severity === 'CRITICAL') score -= 30;
      else if (f.severity === 'HIGH') score -= 20;
      else if (f.severity === 'MEDIUM') score -= 10;
      else if (f.severity === 'LOW') score -= 5;
    }
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Main Orchestrator: Ingests rules, parses spec, runs OWASP Top 10 checks, and enriches with AI.
 */
export async function runAuditOrchestration({
  targetUrl = 'http://localhost:4000',
  specPathOrUrl = './sandbox-api/openapi.yaml',
  modules = ['bola', 'broken_auth', 'excessive_data_exposure', 'rate_limiting'],
  apiKey = null,
  enrichWithAi = true,
  onProgress = () => {},
}) {
  const startedAt = new Date().toISOString();
  const logs = [];

  // 1. Load Rules & Knowledge
  onProgress('Loading OWASP security rules and reasoning skills...');
  const { knowledge, skills } = loadRulesAndKnowledge();
  logs.push(`Loaded rules from knowledge base (${knowledge ? 'knowledge.md' : 'built-in'}) and skills.md.`);

  // 2. Parse OpenAPI Specification with SwaggerParser
  onProgress(`Parsing OpenAPI contract (${specPathOrUrl})...`);
  const specResult = await parseSpec(specPathOrUrl);
  logs.push(`Parsed spec "${specResult.info.title}" v${specResult.info.version} with ${specResult.endpoints.length} endpoints.`);

  const findings = [];
  const controls = [];
  const selectedModules = new Set(modules.map((m) => m.toLowerCase().replace(/-/g, '_')));

  // 3. Execute OWASP Security Checks

  // --- CHECK 1: BOLA / IDOR (API1:2023) ---
  if (selectedModules.has('bola') || selectedModules.has('all')) {
    onProgress('Executing Module: BOLA / IDOR (API1:2023)...');
    try {
      const alice = await authenticatePersona(targetUrl, 'alice');
      const bob = await authenticatePersona(targetUrl, 'bob');

      // Alice creates an order
      const createRes = await sendProbeRequest(targetUrl, '/api/orders', {
        method: 'POST',
        token: alice.token,
        body: { item: 'Standing Desk Pro', quantity: 1, shippingAddress: '221B Baker St' },
      });

      const orderId = createRes.data?.id || 1002;

      // Bob attempts to access Alice's order
      const bobAccessRes = await sendProbeRequest(targetUrl, `/api/orders/${orderId}`, {
        method: 'GET',
        token: bob.token,
      });

      if (bobAccessRes.status === 200 && bobAccessRes.data?.id === orderId) {
        findings.push({
          id: 'finding_bola_orders',
          patchId: 'bola-orders',
          title: 'Broken Object Level Authorization (BOLA / IDOR) in Order Retrieval',
          category: 'API1:2023 - Broken Object Level Authorization',
          owaspCategory: 'API1:2023',
          owaspId: 'API1:2023',
          severity: 'CRITICAL',
          status: 'VULNERABLE',
          path: '/api/orders/{id}',
          method: 'GET',
          description: 'The endpoint retrieves orders by ID without verifying that the requesting user owns the record. An attacker can access other customers\' orders by enumerating IDs.',
          businessImpact: 'Unauthorized exposure of customer PII, order contents, and shipping addresses across tenant boundaries.',
          evidence: {
            authenticatedUser: 'bob@sandbox.local (ID: 1002)',
            targetResourceOwner: 'alice@sandbox.local (ID: 1001)',
            targetOrderId: orderId,
            responseStatus: bobAccessRes.status,
            receivedPayload: bobAccessRes.data,
          },
          curlPoc: `curl -i -X GET "${targetUrl.replace(/\/+$/, '')}/api/orders/${orderId}" \\\n  -H "Authorization: Bearer ${bob.token}"`,
          codeContext: {
            file: 'src/routes/orders.js',
            vulnerableFunction: 'getOrder',
            codeSnippet: `function getOrder(req, res) {\n  const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));\n  if (!order) return res.status(404).json({ error: 'order_not_found' });\n  return res.json(order);\n}`,
          },
        });
      }

      // Control check on /api/invoices/{id}
      const invCreate = await sendProbeRequest(targetUrl, '/api/invoices', {
        method: 'POST',
        token: alice.token,
        body: { amount: 99.99, description: 'Consulting services' },
      });
      const invoiceId = invCreate.data?.id || 5002;
      const bobInvRes = await sendProbeRequest(targetUrl, `/api/invoices/${invoiceId}`, {
        method: 'GET',
        token: bob.token,
      });

      if (bobInvRes.status === 404 || bobInvRes.status === 403) {
        controls.push({
          name: 'Invoice Ownership Isolation',
          path: '/api/invoices/{id}',
          method: 'GET',
          status: 'PASSED',
          details: `Non-owner access properly denied with HTTP ${bobInvRes.status}. No false positive.`,
        });
      }
    } catch (err) {
      logs.push(`[BOLA Check Error]: ${err.message}`);
    }
  }

  // --- CHECK 2: Excessive Data Exposure (API3:2023) ---
  if (selectedModules.has('excessive_data_exposure') || selectedModules.has('excessive_exposure') || selectedModules.has('all')) {
    onProgress('Executing Module: Excessive Data Exposure (API3:2023)...');
    try {
      const alice = await authenticatePersona(targetUrl, 'alice');
      const meRes = await sendProbeRequest(targetUrl, '/api/users/me', {
        method: 'GET',
        token: alice.token,
      });

      if (meRes.status === 200 && meRes.data) {
        const receivedKeys = Object.keys(meRes.data);
        const sensitiveLeakedKeys = ['passwordHash', 'ssn', 'apiKey', 'internalNotes'].filter((k) => receivedKeys.includes(k));

        if (sensitiveLeakedKeys.length > 0) {
          findings.push({
            id: 'finding_excessive_exposure_me',
            patchId: 'excessive-exposure-me',
            title: 'Excessive Data Exposure & Sensitive PII Leakage in User Profile',
            category: 'API3:2023 - Broken Object Property Level Authorization',
            owaspCategory: 'API3:2023',
            owaspId: 'API3:2023',
            severity: 'HIGH',
            status: 'VULNERABLE',
            path: '/api/users/me',
            method: 'GET',
            description: 'The endpoint returns internal database attributes directly to the client without DTO projection filtering, leaking password hashes, SSNs, and internal staff notes.',
            businessImpact: 'Severe credential and identity compromise; breach of data privacy compliance (GDPR, PCI-DSS, HIPAA).',
            evidence: {
              expectedProperties: ['id', 'email', 'name', 'role'],
              leakedSensitiveFields: sensitiveLeakedKeys,
              leakedValuesSample: {
                passwordHash: meRes.data.passwordHash ? '***[REDACTED_HASH]***' : undefined,
                ssn: meRes.data.ssn,
                apiKey: meRes.data.apiKey ? '***[REDACTED_KEY]***' : undefined,
              },
            },
            curlPoc: `curl -i -X GET "${targetUrl.replace(/\/+$/, '')}/api/users/me" \\\n  -H "Authorization: Bearer ${alice.token}"`,
            codeContext: {
              file: 'src/routes/users.js',
              vulnerableFunction: 'getMe',
              codeSnippet: `function getMeVulnerable(req, res) {\n  res.json(req.user);\n}`,
            },
          });
        }
      }
    } catch (err) {
      logs.push(`[Data Exposure Check Error]: ${err.message}`);
    }
  }

  // --- CHECK 3: Broken Authentication & Missing RBAC (API2:2023 / API5:2023) ---
  if (selectedModules.has('broken_auth') || selectedModules.has('missing_auth') || selectedModules.has('all')) {
    onProgress('Executing Module: Broken Authentication (API2:2023)...');
    try {
      // Unauthenticated access to admin stats
      const adminRes = await sendProbeRequest(targetUrl, '/api/admin/stats', {
        method: 'GET',
      });

      if (adminRes.status === 200 && adminRes.data?.totalUsers !== undefined) {
        findings.push({
          id: 'finding_missing_auth_admin_stats',
          patchId: 'missing-auth-admin-stats',
          title: 'Missing Authentication & Broken Function Authorization on Admin Telemetry',
          category: 'API2:2023 - Broken Authentication / API5:2023 - Broken Function Level Authorization',
          owaspCategory: 'API2:2023',
          owaspId: 'API2:2023',
          severity: 'CRITICAL',
          status: 'VULNERABLE',
          path: '/api/admin/stats',
          method: 'GET',
          description: 'The admin statistics endpoint lacks authentication and RBAC guards, exposing sensitive platform metrics and user directories to unauthenticated public requests.',
          businessImpact: 'Reconnaissance and total system telemetry disclosure to unauthenticated external actors.',
          evidence: {
            request: { method: 'GET', url: `${targetUrl}/api/admin/stats`, headersSent: {} },
            responseStatus: adminRes.status,
            receivedData: adminRes.data,
          },
          curlPoc: `curl -i -X GET "${targetUrl.replace(/\/+$/, '')}/api/admin/stats"`,
          codeContext: {
            file: 'src/routes/admin.js',
            vulnerableFunction: 'router.get("/stats")',
            codeSnippet: `router.get('/stats', (_req, res) => {\n  res.json({\n    totalUsers: store.users.length,\n    totalOrders: store.orders.length,\n  });\n});`,
          },
        });
      }
    } catch (err) {
      logs.push(`[Auth Check Error]: ${err.message}`);
    }
  }

  // --- CHECK 4: Unrestricted Resource Consumption / Rate Limiting (API4:2023) ---
  if (selectedModules.has('rate_limiting') || selectedModules.has('rate_limit') || selectedModules.has('all')) {
    onProgress('Executing Module: Rate Limiting & Resource Consumption (API4:2023)...');
    try {
      const burstAttempts = 15;
      const promises = [];
      for (let i = 0; i < burstAttempts; i++) {
        promises.push(
          sendProbeRequest(targetUrl, '/api/auth/login', {
            method: 'POST',
            body: { email: 'alice@sandbox.local', password: `brute_force_guess_${i}` },
          })
        );
      }

      const results = await Promise.all(promises);
      const throttledCount = results.filter((r) => r.status === 429).length;

      if (throttledCount === 0) {
        findings.push({
          id: 'finding_login_rate_limit',
          patchId: 'login-rate-limit',
          title: 'Missing Rate Limiting on Authentication Endpoint (Credential Stuffing Risk)',
          category: 'API4:2023 - Unrestricted Resource Consumption',
          owaspCategory: 'API4:2023',
          owaspId: 'API4:2023',
          severity: 'MEDIUM',
          status: 'VULNERABLE',
          path: '/api/auth/login',
          method: 'POST',
          description: 'The login endpoint does not impose rate limiting or request throttling. An attacker can execute automated high-velocity credential stuffing or password spraying.',
          businessImpact: 'Susceptible to user account takeover and denial of service through heavy CPU password hashing calculations.',
          evidence: {
            burstSize: burstAttempts,
            receivedStatusCodes: results.map((r) => r.status),
            throttledCount,
          },
          curlPoc: `curl -i -X POST "${targetUrl.replace(/\/+$/, '')}/api/auth/login" \\\n  -H "Content-Type: application/json" \\\n  --data '{"email":"alice@sandbox.local","password":"attacker_guess"}'`,
          codeContext: {
            file: 'src/routes/auth.js',
            vulnerableFunction: 'loginLimiter',
            codeSnippet: `router.post('/login', (req, res) => {\n  const { email, password } = req.body || {};\n  // unthrottled authentication\n});`,
          },
        });
      }

      // Control check on /api/products (which should be rate limited)
      const prodPromises = [];
      for (let i = 0; i < 25; i++) {
        prodPromises.push(sendProbeRequest(targetUrl, '/api/products'));
      }
      const prodResults = await Promise.all(prodPromises);
      const prodThrottled = prodResults.filter((r) => r.status === 429).length;

      if (prodThrottled > 0) {
        controls.push({
          name: 'Product Catalog Rate Limiter',
          path: '/api/products',
          method: 'GET',
          status: 'PASSED',
          details: `Public endpoint correctly returns 429 after threshold. No false positive.`,
        });
      }
    } catch (err) {
      logs.push(`[Rate Limit Check Error]: ${err.message}`);
    }
  }

  // 4. Enrich findings with AI Remediation Diffs (Gemini)
  if (enrichWithAi && findings.length > 0) {
    onProgress('Synthesizing context-aware AI remediation diffs with Gemini...');
    for (const finding of findings) {
      try {
        const remediation = await generateRemediation(finding, { apiKey });
        finding.remediation = remediation;
        finding.patchDiff = remediation.diff;
      } catch (err) {
        logs.push(`[AI Remediation Error]: ${err.message}`);
      }
    }
  }

  const completedAt = new Date().toISOString();
  const vulnerableCount = findings.filter((f) => f.status === 'VULNERABLE').length;
  const securityScore = calculateSecurityScore(findings);

  return {
    id: `audit_${Date.now()}`,
    targetUrl,
    specInfo: specResult.info,
    endpointsCount: specResult.endpoints.length,
    startedAt,
    completedAt,
    status: 'completed',
    stats: {
      totalEndpoints: specResult.endpoints.length,
      vulnerableCount,
      verifiedFixedCount: 0,
      controlsPassedCount: controls.length,
      securityScore,
    },
    findings,
    controls,
    logs,
  };
}
