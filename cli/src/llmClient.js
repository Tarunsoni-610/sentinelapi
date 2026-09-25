import { GoogleGenAI } from '@google/genai';

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
 *
 * @param {object} finding - The vulnerability finding object
 * @param {object} [options] - Options with apiKey and model
 * @returns {Promise<object>}
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
    } catch (err) {
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
