import { GoogleGenAI } from '@google/genai';
import { getAgentPersona } from './agentPersonas.js';

// High-fidelity fallback heuristic diffs and explanations
const FALLBACK_REMEDIATIONS = {
  'bola-orders': {
    explanation:
      'The route handler retrieves orders solely by looking up the ID in storage without checking if `order.userId === req.user.id`. Any logged-in user can access any other customer\'s order simply by enumerating sequential integer IDs (IDOR/BOLA).',
    remediationSummary:
      'Add an explicit authorization check after retrieving the order object: compare the stored `order.userId` with the authenticated session/token user ID (`req.user.id`). If they mismatch, reject the request with HTTP 403 Forbidden.',
    diff: `--- a/src/routes/orders.js
+++ b/src/routes/orders.js
@@ -32,7 +32,9 @@
 function getOrder(req, res) {
   const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));
   if (!order) return res.status(404).json({ error: 'order_not_found' });
+  if (order.userId !== req.user.id) {
+    return res.status(403).json({ error: 'forbidden' });
+  }
   return res.json(order);
 }`,
    fixedCode: `function getOrder(req, res) {
  const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  return res.json(order);
}`,
    securityStandard: 'OWASP API Security Top 10: API1:2023 - Broken Object Level Authorization',
  },

  'excessive-exposure-me': {
    explanation:
      'The `/api/users/me` endpoint returns `req.user` directly from the database record. This exposes internal and sensitive attributes including password hashes, SSN, secret API keys, and staff administrative notes to the client application.',
    remediationSummary:
      'Implement an explicit Data Transfer Object (DTO) projection / allow-list in the route handler. Destructure only the public profile fields (`id`, `email`, `name`, `role`) and return only those properties in the JSON response.',
    diff: `--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -6,4 +6,6 @@
-function getMeVulnerable(req, res) {
-  res.json(req.user);
+function getMe(req, res) {
+  const { id, email, name, role } = req.user;
+  res.json({ id, email, name, role });
 }`,
    fixedCode: `function getMe(req, res) {
  const { id, email, name, role } = req.user;
  res.json({ id, email, name, role });
}`,
    securityStandard: 'OWASP API Security Top 10: API3:2023 - Broken Object Property Level Authorization',
  },

  'missing-auth-admin-stats': {
    explanation:
      'While the OpenAPI spec documents bearer authentication requirement on `/api/admin/stats`, the Express route lacked the `authenticate` and `requireAdmin` middleware guards. Consequently, unauthenticated public requests received full platform statistics and user listings.',
    remediationSummary:
      'Attach standard authentication and role-based access control middleware to the route definition. Verify the Bearer token and confirm that `req.user.role === "admin"` before allowing execution of the handler.',
    diff: `--- a/src/routes/admin.js
+++ b/src/routes/admin.js
@@ -8,4 +8,4 @@
-router.get('/stats', (_req, res) => {
+router.get('/stats', authenticate, requireAdmin, (_req, res) => {
   res.json({
     totalUsers: store.users.length,
     totalOrders: store.orders.length,`,
    fixedCode: `router.get('/stats', authenticate, requireAdmin, (_req, res) => {
  res.json({
    totalUsers: store.users.length,
    totalOrders: store.orders.length,
    totalInvoices: store.invoices.length,
    users: store.users.map((u) => ({ id: u.id, email: u.email, role: u.role })),
  });
});`,
    securityStandard: 'OWASP API Security Top 10: API2:2023 - Broken Authentication / API5:2023 - Broken Function Level Authorization',
  },

  'login-rate-limit': {
    explanation:
      'The `/api/auth/login` endpoint does not enforce rate limiting. An attacker can execute automated credential stuffing and brute-force password guessing dictionaries against user accounts without restriction.',
    remediationSummary:
      'Apply rate-limiting middleware to `/api/auth/login` allowing a maximum of 10 login requests per client IP within a 10-second window. Issue HTTP 429 Too Many Requests with a `Retry-After` header when the threshold is exceeded.',
    diff: `--- a/src/routes/auth.js
+++ b/src/routes/auth.js
@@ -8,4 +8,9 @@
+const loginLimiter = rateLimiter({
+  name: 'login',
+  windowMs: 10_000,
+  max: 10,
+});
+
-router.post('/login', (req, res) => {
+router.post('/login', loginLimiter, (req, res) => {
   const { email, password } = req.body || {};`,
    fixedCode: `const loginLimiter = rateLimiter({
  name: 'login',
  windowMs: 10_000,
  max: 10,
});

router.post('/login', loginLimiter, (req, res) => {
  // authentication logic
});`,
    securityStandard: 'OWASP API Security Top 10: API4:2023 - Unrestricted Resource Consumption',
  },
};

/**
 * Generates AI-powered remediation diffs using Google Gemini.
 */
export async function generateRemediation(finding, options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Principal Application Security Architect. Analyze this API security finding and generate a precise remediation response in strict JSON format.

Vulnerability Information:
- Title: ${finding.title}
- OWASP Category: ${finding.category || finding.owaspCategory || finding.owaspId}
- Severity: ${finding.severity}
- Endpoint: ${finding.method} ${finding.path}
- Description: ${finding.description || ''}
- Evidence: ${JSON.stringify(finding.evidence || {}, null, 2)}
- Code Context: ${finding.codeContext?.codeSnippet || 'N/A'}

Respond strictly with valid JSON with these exact keys:
{
  "explanation": "Clear explanation of the vulnerability and why it occurs",
  "remediationSummary": "Step-by-step guidance on how to remediate the vulnerability",
  "diff": "Standard unified git diff format (--- a/... +++ b/...) showing the code fix",
  "fixedCode": "Full corrected code snippet for the route handler",
  "securityStandard": "Applicable OWASP / NIST / CWE guidelines"
}`;

      const response = await ai.models.generateContent({
        model: options.model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text);
      return {
        provider: 'gemini',
        aiGenerated: true,
        ...parsed,
      };
    } catch (_err) {
      // Fallback if API key fails or network error occurs
    }
  }

  // Fallback to deterministic precomputed patch if matched or generate heuristic diff
  const patchKey = finding.patchId || (finding.id || '').replace('finding_', '');
  const fallback = FALLBACK_REMEDIATIONS[patchKey];

  if (fallback) {
    return {
      provider: 'heuristic_template',
      aiGenerated: false,
      ...fallback,
    };
  }

  return {
    provider: 'heuristic_template',
    aiGenerated: false,
    explanation: finding.description || `Vulnerability identified at ${finding.method} ${finding.path}.`,
    remediationSummary: `Apply strict input validation, authentication verification, and access controls on ${finding.method} ${finding.path}.`,
    diff: `--- a/routes/api.js\n+++ b/routes/api.js\n@@ -1,4 +1,6 @@\n+// Enforce authorization check for ${finding.method} ${finding.path}\n+if (!req.user || req.user.role !== 'admin') {\n+  return res.status(403).json({ error: 'forbidden' });\n+}`,
    fixedCode: `// Fixed implementation for ${finding.method} ${finding.path}`,
    securityStandard: finding.owaspCategory || 'OWASP API Security Top 10',
  };
}

/**
 * Executes a conversational turn with a customized Sentinel Security Agent.
 *
 * @param {object} params
 * @param {string} params.message - The user's input prompt
 * @param {string} [params.agentId] - 'owasp_auditor' | 'secure_integrator' | 'remediation_copilot' | 'pentester'
 * @param {object} [params.context] - Workspace, OpenAPI spec, and finding context
 * @param {Array} [params.history] - Array of { role: 'user' | 'model', text: string }
 * @param {string} [params.apiKey] - Google Gemini API Key
 * @param {string} [params.model] - Model name (default: gemini-2.5-flash)
 */
export async function chatWithAgent(params) {
  const {
    message,
    agentId = 'owasp_auditor',
    context = {},
    history = [],
    apiKey = process.env.GEMINI_API_KEY,
    model = 'gemini-2.5-flash',
  } = params;

  const agent = getAgentPersona(agentId);

  // Build grounded context summary
  let contextBlock = '';
  if (context.workspacePath) {
    contextBlock += `\nLocal Workspace / Cloned Repo: ${context.workspacePath}`;
  }
  if (context.framework) {
    contextBlock += `\nDetected API Framework: ${context.framework}`;
  }
  if (context.specSummary) {
    contextBlock += `\nOpenAPI Schema Summary:\n${context.specSummary}`;
  }
  if (context.activeFindings && context.activeFindings.length > 0) {
    contextBlock += `\nActive Security Findings (${context.activeFindings.length}):\n` +
      context.activeFindings.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.method} ${f.path})`).join('\n');
  }
  if (context.activeFileContent) {
    contextBlock += `\nActive File Content (${context.activeFilePath || 'source'}):\n\`\`\`\n${context.activeFileContent}\n\`\`\``;
  }

  const systemInstruction = `${agent.systemPrompt}\n\nCURRENT REPOSITORY & SCAN CONTEXT:\n${contextBlock || 'No active workspace attached.'}\n\nProvide direct, actionable, and secure advice formatted in clean markdown.`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contents = [];
      // Include past turns
      for (const turn of history.slice(-8)) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
      // Add current user prompt
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      return {
        text: response.text,
        agent,
        provider: 'gemini',
      };
    } catch (_err) {
      // Fall through to local fallback generator
    }
  }

  // Smart local heuristic fallback agent
  const responseText = generateLocalAgentResponse({ message, agent, context });
  return {
    text: responseText,
    agent,
    provider: 'local_heuristic',
  };
}

/**
 * Intelligent local response generator for offline and non-API key sessions.
 */
function generateLocalAgentResponse({ message, agent, context }) {
  const lower = message.toLowerCase();

  if (lower.includes('bola') || lower.includes('idor')) {
    return `### 🛡️ ${agent.name} • BOLA / IDOR Analysis

**Vulnerability Concept**: Broken Object Level Authorization occurs when an endpoint accepts an object ID from client input (e.g. \`/api/orders/:id\`) and accesses database records without asserting that the requesting user owns that object.

**Secure Implementation Example (Express / Node.js)**:
\`\`\`javascript
// 🔒 Secure Object Access Pattern
router.get('/orders/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const order = await db.orders.findById(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Explicit Tenant / Owner Check
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not own this resource.' });
  }

  return res.json(order);
});
\`\`\`
`;
  }

  if (lower.includes('auth') || lower.includes('jwt') || lower.includes('token') || lower.includes('login')) {
    return `### 🔒 ${agent.name} • Authentication & Token Hardening

**Security Recommendation**:
1. **Never store JWTs in \`localStorage\`** in frontend apps due to XSS theft risks. Use **\`/HttpOnly; Secure; SameSite=Strict\`** cookies.
2. **Implement short-lived Access Tokens** (15 mins) paired with rotating Refresh Tokens stored securely in the database.
3. **Verify algorithm explicitly** on verification to prevent \`alg: none\` bypasses:

\`\`\`javascript
import jwt from 'jsonwebtoken';

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'sentinel.internal',
  });
}
\`\`\`
`;
  }

  if (lower.includes('rate') || lower.includes('limit') || lower.includes('brute')) {
    return `### ⏱️ ${agent.name} • Rate Limiting & Resource Protection

**Recommendation**: Protect sensitive routes (\`/api/auth/login\`, \`/api/auth/register\`, \`/api/orders\`) using sliding window rate limiting.

\`\`\`javascript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please retry after 15 minutes.' }
});
\`\`\`
`;
  }

  if (lower.includes('diff') || lower.includes('patch') || lower.includes('fix')) {
    return `### 🛠️ ${agent.name} • Unified Remediation Diff

\`\`\`diff
--- a/src/routes/api.js
+++ b/src/routes/api.js
@@ -14,6 +14,9 @@
 router.get('/resource/:id', authenticate, async (req, res) => {
   const item = await store.getItem(req.params.id);
   if (!item) return res.status(404).json({ error: 'not_found' });
+  if (item.tenantId !== req.user.tenantId) {
+    return res.status(403).json({ error: 'forbidden' });
+  }
   res.json(item);
 });
\`\`\`
`;
  }

  return `### 🤖 ${agent.name}

I am active and monitoring your local workspace${context.workspacePath ? ` at \`${context.workspacePath}\`` : ''}.

**Capabilities you can invoke**:
- Ask me to audit specific routes (e.g. \`"Audit my user controller for excessive data exposure"\`)
- Request secure API client integration code with HMAC signing, token refresh, or Zod validation
- Ask for reproducible cURL exploit PoCs to verify your sandbox endpoints
- Type \`/spec <path>\` to load your OpenAPI schema into context
- Type \`/file <path>\` to read and inspect a local source file
- Type \`/scan\` to execute live OWASP Top 10 security probes
`;
}
