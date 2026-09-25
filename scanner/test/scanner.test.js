'use strict';
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let sandboxServer;
let scannerServer;
let sandboxBase;
let scannerBase;

before(async () => {
  // Start sandbox API
  const sandboxApp = require('../../sandbox-api/src/app');
  await new Promise((r) => {
    sandboxServer = sandboxApp.listen(0, '127.0.0.1', r);
  });
  sandboxBase = `http://127.0.0.1:${sandboxServer.address().port}`;

  // Start scanner API
  const scannerApp = require('../src/app');
  await new Promise((r) => {
    scannerServer = scannerApp.listen(0, '127.0.0.1', r);
  });
  scannerBase = `http://127.0.0.1:${scannerServer.address().port}`;
});

after(() => {
  if (scannerServer) scannerServer.close();
  if (sandboxServer) sandboxServer.close();
});

beforeEach(async () => {
  await fetch(`${sandboxBase}/__sandbox/reset`, { method: 'POST' });
});

test('Scanner health endpoint returns OK', async () => {
  const res = await fetch(`${scannerBase}/healthz`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.service, 'sentinelapi-scanner');
});

test('Scanner rejects untrusted target hosts outside whitelist', async () => {
  const res = await fetch(`${scannerBase}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: 'http://malicious-external-target.com' }),
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /ALLOWED_TARGETS/i);
});

test('End-to-end scanner runs stateful vulnerability detection against sandbox API', async () => {
  const res = await fetch(`${scannerBase}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: sandboxBase }),
  });

  assert.equal(res.status, 200);
  const scan = await res.json();

  assert.ok(scan.id);
  assert.equal(scan.stats.vulnerableCount, 4, 'Expected 4 active vulnerabilities in vulnerable sandbox');
  assert.ok(scan.stats.securityScore < 50, 'Score should reflect critical vulnerabilities');

  // Verify BOLA finding
  const bola = scan.findings.find((f) => f.patchId === 'bola-orders');
  assert.ok(bola);
  assert.equal(bola.severity, 'CRITICAL');
  assert.equal(bola.status, 'VULNERABLE');
  assert.ok(bola.curlPoc.includes('curl'));
  assert.ok(bola.remediation.diff.includes('userId'));

  // Verify Excessive Data Exposure finding
  const exposure = scan.findings.find((f) => f.patchId === 'excessive-exposure-me');
  assert.ok(exposure);
  assert.equal(exposure.severity, 'HIGH');
  assert.equal(exposure.status, 'VULNERABLE');
  const leakedNames = exposure.evidence.leakedFields.map((f) => f.field);
  assert.ok(leakedNames.includes('passwordHash'));
  assert.ok(leakedNames.includes('ssn'));
  assert.ok(leakedNames.includes('apiKey'));

  // Verify Missing Auth finding
  const auth = scan.findings.find((f) => f.patchId === 'missing-auth-admin-stats');
  assert.ok(auth);
  assert.equal(auth.severity, 'CRITICAL');
  assert.equal(auth.status, 'VULNERABLE');

  // Verify Rate Limit finding
  const rate = scan.findings.find((f) => f.patchId === 'login-rate-limit');
  assert.ok(rate);
  assert.equal(rate.severity, 'MEDIUM');
  assert.equal(rate.status, 'VULNERABLE');

  // Verify Controls Passed
  assert.ok(scan.controls.some((c) => c.path === '/api/invoices/{id}'));
  assert.ok(scan.controls.some((c) => c.path === '/api/products'));
});

test('Remediation endpoint generates high-fidelity unified diff and explanation', async () => {
  const finding = {
    id: 'finding_bola_orders',
    patchId: 'bola-orders',
    title: 'Broken Object Level Authorization (BOLA / IDOR)',
    category: 'API1:2023 - Broken Object Level Authorization',
    owaspId: 'API1:2023',
    cwe: 'CWE-639',
    severity: 'CRITICAL',
    path: '/api/orders/{id}',
    method: 'GET',
    description: 'BOLA on orders endpoint',
  };

  const res = await fetch(`${scannerBase}/api/remediate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finding }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.diff);
  assert.ok(json.explanation);
  assert.ok(json.remediationSummary);
  assert.ok(json.diff.includes('--- a/src/routes/orders.js'));
});

test('Verification endpoint proves patch resolution (VULNERABLE -> FIX_VERIFIED -> VULNERABLE)', async () => {
  // 1. Verify initially vulnerable
  const initialRes = await fetch(`${scannerBase}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: sandboxBase, patchId: 'bola-orders', applyPatch: false }),
  });
  assert.equal(initialRes.status, 200);
  const initial = await initialRes.json();
  assert.equal(initial.isFixed, false);
  assert.equal(initial.status, 'VULNERABLE');

  // 2. Apply patch and verify it flips to FIX_VERIFIED
  const fixedRes = await fetch(`${scannerBase}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: sandboxBase, patchId: 'bola-orders', applyPatch: true }),
  });
  assert.equal(fixedRes.status, 200);
  const fixed = await fixedRes.json();
  assert.equal(fixed.isFixed, true);
  assert.equal(fixed.status, 'FIX_VERIFIED');

  // 3. Revert patch and verify status returns to VULNERABLE
  const revertRes = await fetch(`${scannerBase}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: sandboxBase, patchId: 'bola-orders', applyPatch: false }),
  });
  assert.equal(revertRes.status, 200);
  const reverted = await revertRes.json();
  assert.equal(reverted.isFixed, false);
  assert.equal(reverted.status, 'VULNERABLE');
});
