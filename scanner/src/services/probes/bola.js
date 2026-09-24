'use strict';
const { sendRequest, login, buildCurl } = require('./client');

/**
 * Probes for Broken Object Level Authorization (BOLA / IDOR) - OWASP API1:2023.
 * Tests resource isolation across different authenticated tenant users.
 */
async function probeBola(targetUrl, _endpoints = []) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const logs = [];
  const findings = [];
  const controls = [];

  logs.push(`[BOLA Engine] Authenticating Alice (User A) and Bob (User B)...`);
  let alice, bob;
  try {
    alice = await login(cleanUrl, 'alice');
    bob = await login(cleanUrl, 'bob');
    logs.push(`[BOLA Engine] Authenticated Alice (${alice.user.id}) and Bob (${bob.user.id}).`);
  } catch (err) {
    logs.push(`[BOLA Engine] Failed to authenticate test users: ${err.message}`);
    return { findings, controls, logs };
  }

  // --- Probe 1: Target Endpoint: Orders (/api/orders/{id}) ---
  logs.push(`[BOLA Engine] Creating test order as Alice...`);
  const createOrderRes = await sendRequest(cleanUrl, '/api/orders', {
    method: 'POST',
    token: alice.token,
    body: {
      item: 'Standing Desk (Executive Series)',
      quantity: 1,
      shippingAddress: '221B Baker Street, London',
    },
  });

  if (createOrderRes.status === 201 && createOrderRes.data?.id) {
    const orderId = createOrderRes.data.id;
    logs.push(`[BOLA Engine] Alice created Order #${orderId}. Verifying Alice can access it...`);

    const aliceReadRes = await sendRequest(cleanUrl, `/api/orders/${orderId}`, {
      method: 'GET',
      token: alice.token,
    });

    logs.push(`[BOLA Engine] Alice read status: ${aliceReadRes.status}`);

    // Unauthorized cross-tenant read attempt: Bob accesses Alice's order
    logs.push(`[BOLA Engine] Probing authorization boundary: Bob attempting to read Alice's Order #${orderId}...`);
    const bobReadRes = await sendRequest(cleanUrl, `/api/orders/${orderId}`, {
      method: 'GET',
      token: bob.token,
    });

    const unauthorizedUrl = `${cleanUrl}/api/orders/${orderId}`;
    const curlPoc = buildCurl(unauthorizedUrl, {
      method: 'GET',
      token: bob.token,
    });

    if (bobReadRes.status === 200 && bobReadRes.data?.userId === alice.user.id) {
      logs.push(`[BOLA Engine] ⚠️ VULNERABILITY CONFIRMED: Bob received 200 OK and read Alice's order data!`);
      findings.push({
        id: 'finding_bola_orders',
        patchId: 'bola-orders',
        title: 'Broken Object Level Authorization (BOLA / IDOR) on Orders Endpoint',
        category: 'API1:2023 - Broken Object Level Authorization',
        owaspId: 'API1:2023',
        cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key',
        severity: 'CRITICAL',
        status: 'VULNERABLE',
        path: '/api/orders/{id}',
        method: 'GET',
        description:
          'The endpoint retrieves orders by ID from request parameters without verifying whether the authenticated caller owns or is authorized to access the requested resource. Authenticated user Bob was able to inspect Alice\'s private order details, including shipping address and item details.',
        businessImpact:
          'Critical data breach enabling horizontal privilege escalation, mass exfiltration of customer purchase history, PII, and physical delivery addresses.',
        evidence: {
          request: {
            method: 'GET',
            url: unauthorizedUrl,
            headers: { Authorization: `Bearer ${bob.token.slice(0, 10)}... (Bob's Token)` },
          },
          response: {
            status: bobReadRes.status,
            statusText: bobReadRes.statusText,
            headers: bobReadRes.headers,
            body: bobReadRes.data,
          },
          ownerId: alice.user.id,
          attackerId: bob.user.id,
          resourceId: orderId,
        },
        curlPoc,
        codeContext: {
          file: 'src/routes/orders.js',
          vulnerableFunction: 'getOrderVulnerable',
          codeSnippet: `function getOrderVulnerable(req, res) {\n  const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));\n  if (!order) return res.status(404).json({ error: 'order_not_found' });\n  return res.json(order);\n}`,
        },
      });
    } else if (bobReadRes.status === 403 || bobReadRes.status === 404) {
      logs.push(`[BOLA Engine] ✅ Order endpoint returned ${bobReadRes.status} to unauthorized caller. Access control enforced.`);
      findings.push({
        id: 'finding_bola_orders',
        patchId: 'bola-orders',
        title: 'Broken Object Level Authorization (BOLA / IDOR) on Orders Endpoint',
        category: 'API1:2023 - Broken Object Level Authorization',
        owaspId: 'API1:2023',
        cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key',
        severity: 'CRITICAL',
        status: 'FIX_VERIFIED',
        path: '/api/orders/{id}',
        method: 'GET',
        description: 'Resource ownership validation is properly enforced. Cross-tenant access is blocked with 403 Forbidden.',
        businessImpact: 'Protected against unauthorized cross-user data access.',
        evidence: {
          request: { method: 'GET', url: unauthorizedUrl },
          response: { status: bobReadRes.status, body: bobReadRes.data },
        },
        curlPoc,
      });
    }
  }

  // --- Probe 2: Control Endpoint: Invoices (/api/invoices/{id}) ---
  logs.push(`[BOLA Engine] Running Control Check: Creating test invoice as Alice to check /api/invoices/{id}...`);
  const createInvRes = await sendRequest(cleanUrl, '/api/invoices', {
    method: 'POST',
    token: alice.token,
    body: { amount: 199.99, description: 'Sentinel Annual Subscription' },
  });

  if (createInvRes.status === 201 && createInvRes.data?.id) {
    const invId = createInvRes.data.id;
    const bobInvRes = await sendRequest(cleanUrl, `/api/invoices/${invId}`, {
      method: 'GET',
      token: bob.token,
    });

    if (bobInvRes.status === 404 || bobInvRes.status === 403) {
      logs.push(`[BOLA Engine] ✅ Control Passed: /api/invoices/${invId} correctly denied Bob with ${bobInvRes.status}.`);
      controls.push({
        name: 'Invoice Ownership Isolation',
        path: '/api/invoices/{id}',
        method: 'GET',
        status: 'PASSED',
        details: `Non-owner access properly denied with HTTP ${bobInvRes.status}. No false positive triggered.`,
      });
    }
  }

  return { findings, controls, logs };
}

module.exports = {
  probeBola,
};
