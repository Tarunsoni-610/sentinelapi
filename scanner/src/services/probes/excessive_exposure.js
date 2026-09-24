'use strict';
const { sendRequest, login, buildCurl } = require('./client');

const SENSITIVE_KEYWORDS = [
  'password',
  'hash',
  'secret',
  'ssn',
  'apikey',
  'token',
  'private',
  'internal',
  'creditcard',
  'cvv',
  'salt',
];

function classifySensitivity(key) {
  const lower = key.toLowerCase();
  if (lower.includes('password') || lower.includes('hash') || lower.includes('salt')) return 'Authentication Credential';
  if (lower.includes('ssn') || lower.includes('social')) return 'National Identification / PII';
  if (lower.includes('apikey') || lower.includes('secret') || lower.includes('token')) return 'API Key / Secret';
  if (lower.includes('note') || lower.includes('internal')) return 'Internal Sensitive Metadata';
  return 'Undeclared Object Field';
}

/**
 * Probes for Excessive Data Exposure / Broken Object Property Level Auth - OWASP API3:2023.
 * Compares OpenAPI contract schema properties against actual payload attributes.
 */
async function probeExcessiveExposure(targetUrl, openApiDoc = null) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const logs = [];
  const findings = [];
  const controls = [];

  logs.push(`[Data Exposure Engine] Authenticating Alice to inspect /api/users/me...`);
  let alice;
  try {
    alice = await login(cleanUrl, 'alice');
  } catch (err) {
    logs.push(`[Data Exposure Engine] Auth failed: ${err.message}`);
    return { findings, controls, logs };
  }

  const meUrl = `${cleanUrl}/api/users/me`;
  const res = await sendRequest(cleanUrl, '/api/users/me', {
    method: 'GET',
    token: alice.token,
  });

  const curlPoc = buildCurl(meUrl, {
    method: 'GET',
    token: alice.token,
  });

  if (res.status === 200 && res.data && typeof res.data === 'object') {
    // Look up declared properties in OpenAPI schema for UserProfile
    const userProfileSchema = openApiDoc?.components?.schemas?.UserProfile?.properties || {
      id: { type: 'integer' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
    };

    const declaredKeys = new Set(Object.keys(userProfileSchema));
    const receivedKeys = Object.keys(res.data);
    const leakedKeys = receivedKeys.filter((k) => !declaredKeys.has(k));

    logs.push(`[Data Exposure Engine] Contract expected keys: [${[...declaredKeys].join(', ')}]`);
    logs.push(`[Data Exposure Engine] Response received keys: [${receivedKeys.join(', ')}]`);

    const leakedFieldDetails = leakedKeys.map((key) => ({
      field: key,
      valueSample: typeof res.data[key] === 'string' && res.data[key].length > 20
        ? res.data[key].slice(0, 12) + '...'
        : res.data[key],
      classification: classifySensitivity(key),
      isHighRisk: SENSITIVE_KEYWORDS.some((kw) => key.toLowerCase().includes(kw)),
    }));

    if (leakedKeys.length > 0) {
      logs.push(`[Data Exposure Engine] ⚠️ VULNERABILITY CONFIRMED: ${leakedKeys.length} sensitive undeclared fields leaked!`);
      findings.push({
        id: 'finding_excessive_exposure_me',
        patchId: 'excessive-exposure-me',
        title: 'Excessive Data Exposure & Sensitive PII Leakage in Profile Endpoint',
        category: 'API3:2023 - Broken Object Property Level Authorization',
        owaspId: 'API3:2023',
        cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
        severity: 'HIGH',
        status: 'VULNERABLE',
        path: '/api/users/me',
        method: 'GET',
        description:
          'The endpoint returns entire database user model records directly to the client without applying an allow-list projection. Leaked properties include hashed credentials (passwordHash), Social Security Numbers (ssn), live API credentials (apiKey), and private staff annotations (internalNotes).',
        businessImpact:
          'Severe compliance violations (GDPR, HIPAA, PCI-DSS) and immediate compromise of internal developer/system API keys and cryptographic password hashes.',
        evidence: {
          request: {
            method: 'GET',
            url: meUrl,
            headers: { Authorization: `Bearer ${alice.token.slice(0, 10)}...` },
          },
          response: {
            status: res.status,
            headers: res.headers,
            body: res.data,
          },
          declaredSchemaKeys: [...declaredKeys],
          leakedFields: leakedFieldDetails,
        },
        curlPoc,
        codeContext: {
          file: 'src/routes/users.js',
          vulnerableFunction: 'getMeVulnerable',
          codeSnippet: `function getMeVulnerable(req, res) {\n  res.json(req.user);\n}`,
        },
      });
    } else {
      logs.push(`[Data Exposure Engine] ✅ Clean payload received. Strict field allow-list enforced.`);
      findings.push({
        id: 'finding_excessive_exposure_me',
        patchId: 'excessive-exposure-me',
        title: 'Excessive Data Exposure & Sensitive PII Leakage in Profile Endpoint',
        category: 'API3:2023 - Broken Object Property Level Authorization',
        owaspId: 'API3:2023',
        cwe: 'CWE-200: Exposure of Sensitive Information',
        severity: 'HIGH',
        status: 'FIX_VERIFIED',
        path: '/api/users/me',
        method: 'GET',
        description: 'Endpoint adheres strictly to OpenAPI UserProfile schema with no excess sensitive fields.',
        businessImpact: 'Protected against sensitive data leakage.',
        evidence: {
          request: { method: 'GET', url: meUrl },
          response: { status: res.status, body: res.data },
          declaredSchemaKeys: [...declaredKeys],
          leakedFields: [],
        },
        curlPoc,
      });
    }
  }

  return { findings, controls, logs };
}

module.exports = {
  probeExcessiveExposure,
};
