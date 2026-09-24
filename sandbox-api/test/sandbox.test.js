'use strict';
// Phase-1 smoke tests. Run in-process by default, or against a live server: BASE_URL=http://localhost:4000 npm test
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let server;
let base;

async function api(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, headers: res.headers, json, text };
}

async function login(who) {
  const r = await api('POST', '/api/auth/login', { body: { email: `${who}@sandbox.local`, password: `${who}123` } });
  assert.equal(r.status, 200, `login ${who}`);
  return r.json.token;
}
const patch = (id, action = 'apply') => api('POST', `/__sandbox/patches/${id}/${action}`);

before(async () => {
  if (process.env.BASE_URL) { base = process.env.BASE_URL.replace(/\/$/, ''); return; }
  const app = require('../src/app');
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { if (server) { server.closeAllConnections(); server.close(); } });
beforeEach(async () => { await api('POST', '/__sandbox/reset'); });

test('health, sandbox header, and OpenAPI spec are served', async () => {
  const h = await api('GET', '/healthz');
  assert.equal(h.status, 200);
  assert.equal(h.headers.get('x-sentinelapi-sandbox'), 'true');
  const spec = await api('GET', '/openapi.yaml');
  assert.equal(spec.status, 200);
  assert.match(spec.text, /openapi: 3\.0\.3/);
});

test('auth: valid login returns token, bad password gives 401, protected route needs token', async () => {
  assert.ok(await login('alice'));
  const bad = await api('POST', '/api/auth/login', { body: { email: 'alice@sandbox.local', password: 'nope' } });
  assert.equal(bad.status, 401);
  assert.equal((await api('GET', '/api/orders')).status, 401);
});

test('BOLA: Bob can read Alice\'s order (vulnerable) -> 403 after patch, Alice keeps access', async () => {
  const alice = await login('alice');
  const bob = await login('bob');
  const created = await api('POST', '/api/orders', { token: alice, body: { item: 'Standing Desk', quantity: 1, shippingAddress: '221B Baker Street' } });
  assert.equal(created.status, 201);
  const id = created.json.id;

  assert.equal((await api('GET', `/api/orders/${id}`, { token: alice })).status, 200);
  const leak = await api('GET', `/api/orders/${id}`, { token: bob });
  assert.equal(leak.status, 200, 'VULNERABLE: Bob should be able to read Alice\'s order');
  assert.equal(leak.json.shippingAddress, '221B Baker Street');
  assert.equal(leak.json.userId, 1001);

  await patch('bola-orders');
  assert.equal((await api('GET', `/api/orders/${id}`, { token: bob })).status, 403, 'FIXED: Bob is denied');
  assert.equal((await api('GET', `/api/orders/${id}`, { token: alice })).status, 200, 'owner still allowed');

  await patch('bola-orders', 'revert');
  assert.equal((await api('GET', `/api/orders/${id}`, { token: bob })).status, 200, 'revert restores vulnerability');
});

test('list orders only returns the caller\'s own orders', async () => {
  const alice = await login('alice');
  const bob = await login('bob');
  await api('POST', '/api/orders', { token: alice, body: { item: 'A', quantity: 1 } });
  await api('POST', '/api/orders', { token: bob, body: { item: 'B', quantity: 2 } });
  const mine = await api('GET', '/api/orders', { token: bob });
  assert.equal(mine.json.length, 1);
  assert.equal(mine.json[0].item, 'B');
});

test('excessive data exposure: /users/me leaks sensitive fields -> allow-list after patch', async () => {
  const alice = await login('alice');
  const before = (await api('GET', '/api/users/me', { token: alice })).json;
  for (const f of ['passwordHash', 'ssn', 'apiKey', 'internalNotes']) assert.ok(f in before, `leaks ${f}`);
  await patch('excessive-exposure-me');
  const after = (await api('GET', '/api/users/me', { token: alice })).json;
  assert.deepEqual(Object.keys(after).sort(), ['email', 'id', 'name', 'role']);
});

test('auth misconfiguration: /admin/stats open without token -> 401/403 after patch', async () => {
  assert.equal((await api('GET', '/api/admin/stats')).status, 200, 'VULNERABLE: no token needed');
  await patch('missing-auth-admin-stats');
  assert.equal((await api('GET', '/api/admin/stats')).status, 401);
  assert.equal((await api('GET', '/api/admin/stats', { token: await login('bob') })).status, 403);
  assert.equal((await api('GET', '/api/admin/stats', { token: await login('admin') })).status, 200);
});

test('rate limiting: login unlimited (vulnerable) -> 429 after patch', async () => {
  const hit = () => api('POST', '/api/auth/login', { body: { email: 'alice@sandbox.local', password: 'wrong' } });
  for (let i = 0; i < 25; i++) assert.notEqual((await hit()).status, 429, 'no limit while vulnerable');
  await patch('login-rate-limit');
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await hit()).status);
  assert.ok(codes.slice(0, 10).every((c) => c === 401), 'first 10 attempts processed');
  assert.deepEqual(codes.slice(10), [429, 429]);
});

test('CONTROLS: /products is rate limited and /invoices/{id} is owner-only (must not be flagged)', async () => {
  const codes = [];
  for (let i = 0; i < 24; i++) codes.push((await api('GET', '/api/products')).status);
  assert.equal(codes.filter((c) => c === 200).length, 20);
  assert.equal(codes.filter((c) => c === 429).length, 4);

  const alice = await login('alice');
  const bob = await login('bob');
  const inv = await api('POST', '/api/invoices', { token: alice, body: { amount: 49.99, description: 'test' } });
  assert.equal(inv.status, 201);
  assert.equal((await api('GET', `/api/invoices/${inv.json.id}`, { token: alice })).status, 200);
  assert.equal((await api('GET', `/api/invoices/${inv.json.id}`, { token: bob })).status, 404);
});

test('sandbox control: unknown patch 404, reset clears state and patches', async () => {
  assert.equal((await patch('nope')).status, 404);
  await patch('bola-orders');
  const r = await api('POST', '/__sandbox/reset');
  assert.deepEqual(r.json.appliedPatches, []);
});
