'use strict';
const { sendRequest, login, buildCurl } = require('./client');

/**
 * Probes for Missing Authentication & Broken Function Level Authorization - OWASP API2:2023 & API5:2023.
 * Identifies endpoints defined as protected in OpenAPI that lack enforcement in code.
 */
async function probeMissingAuth(targetUrl, openApiDoc = null) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const logs = [];
  const findings = [];
  const controls = [];

  logs.push(`[Auth Engine] Inspecting protected routes and /api/admin/stats...`);

  // Target Endpoint: /api/admin/stats
  const statsUrl = `${cleanUrl}/api/admin/stats`;
  const noAuthRes = await sendRequest(cleanUrl, '/api/admin/stats', {
    method: 'GET',
  });

  const curlPoc = buildCurl(statsUrl, {
    method: 'GET',
  });

  logs.push(`[Auth Engine] Unauthenticated GET /api/admin/stats status: ${noAuthRes.status}`);

  if (noAuthRes.status === 200 && noAuthRes.data && (noAuthRes.data.totalUsers !== undefined || noAuthRes.data.users)) {
    logs.push(`[Auth Engine] ⚠️ VULNERABILITY CONFIRMED: Admin stats endpoint returned 200 OK without any authentication token!`);

    findings.push({
      id: 'finding_missing_auth_admin_stats',
      patchId: 'missing-auth-admin-stats',
      title: 'Missing Authentication & Broken Function Level Authorization on Admin Analytics',
      category: 'API2:2023 - Broken Authentication / API5:2023 - Broken Function Level Authorization',
      owaspId: 'API2:2023',
      cwe: 'CWE-306: Missing Authentication for Critical Function',
      severity: 'CRITICAL',
      status: 'VULNERABLE',
      path: '/api/admin/stats',
      method: 'GET',
      description:
        'The OpenAPI contract specifies security scheme "bearerAuth" for /api/admin/stats, but the route handler fails to attach authentication middleware. Any unauthenticated anonymous internet user can query platform-wide metrics and user directories.',
      businessImpact:
        'Complete exposure of operational data, internal user IDs, email addresses, and admin privilege mapping to unauthorized actors.',
      evidence: {
        request: {
          method: 'GET',
          url: statsUrl,
          headers: {},
        },
        response: {
          status: noAuthRes.status,
          headers: noAuthRes.headers,
          body: noAuthRes.data,
        },
      },
      curlPoc,
      codeContext: {
        file: 'src/routes/admin.js',
        vulnerableFunction: 'guard',
        codeSnippet: `function guard(req, res, next) {\n  if (!store.patches.has('missing-auth-admin-stats')) return next();\n  authenticate(req, res, () => requireAdmin(req, res, next));\n}`,
      },
    });
  } else if (noAuthRes.status === 401) {
    logs.push(`[Auth Engine] Unauthenticated call denied with 401. Testing role restriction with regular user token...`);
    let bob;
    try {
      bob = await login(cleanUrl, 'bob');
    } catch (_e) {
      // ignore
    }

    let bobRes = { status: 0 };
    if (bob) {
      bobRes = await sendRequest(cleanUrl, '/api/admin/stats', {
        method: 'GET',
        token: bob.token,
      });
      logs.push(`[Auth Engine] Regular user (Bob) calling admin stats returned ${bobRes.status}`);
    }

    if (bobRes.status === 403) {
      logs.push(`[Auth Engine] ✅ Admin route strictly enforces authentication (401) and admin role authorization (403).`);
      findings.push({
        id: 'finding_missing_auth_admin_stats',
        patchId: 'missing-auth-admin-stats',
        title: 'Missing Authentication & Broken Function Level Authorization on Admin Analytics',
        category: 'API2:2023 - Broken Authentication',
        owaspId: 'API2:2023',
        cwe: 'CWE-306: Missing Authentication for Critical Function',
        severity: 'CRITICAL',
        status: 'FIX_VERIFIED',
        path: '/api/admin/stats',
        method: 'GET',
        description: 'Authentication and admin role verification are both properly enforced.',
        businessImpact: 'Protected against unauthenticated access and horizontal/vertical role escalation.',
        evidence: {
          request: { method: 'GET', url: statsUrl },
          response: { status: noAuthRes.status, body: noAuthRes.data },
        },
        curlPoc,
      });
    }
  }

  return { findings, controls, logs };
}

module.exports = {
  probeMissingAuth,
};
