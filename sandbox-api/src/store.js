'use strict';
// In-memory data store for the sandbox. Everything resets via POST /__sandbox/reset.
const crypto = require('crypto');

const sha256 = (s) => 'sha256$' + crypto.createHash('sha256').update(s).digest('hex');

// Patches the scanner can "apply" to prove a fix works (fix -> re-test -> verified).
const PATCH_CATALOG = {
  'bola-orders': 'GET /api/orders/{id} enforces order ownership (403 for non-owners)',
  'excessive-exposure-me': 'GET /api/users/me returns only id, email, name, role',
  'missing-auth-admin-stats': 'GET /api/admin/stats requires a valid admin bearer token',
  'login-rate-limit': 'POST /api/auth/login limited to 10 requests / 10s per client (429 + Retry-After)',
};

function seedUsers() {
  return [
    { id: 1000, email: 'admin@sandbox.local', name: 'Sandbox Admin', role: 'admin',
      passwordHash: sha256('admin123'), ssn: '900-00-0000', apiKey: 'sk_live_sbx_admin_7f3a91c2', internalNotes: 'Ops account' },
    { id: 1001, email: 'alice@sandbox.local', name: 'Alice (User A)', role: 'user',
      passwordHash: sha256('alice123'), ssn: '900-11-1111', apiKey: 'sk_live_sbx_alice_1b2c3d4e', internalNotes: 'Premium customer' },
    { id: 1002, email: 'bob@sandbox.local', name: 'Bob (User B)', role: 'user',
      passwordHash: sha256('bob123'), ssn: '900-22-2222', apiKey: 'sk_live_sbx_bob_9z8y7x6w', internalNotes: 'Flagged for review' },
  ];
}

const store = {
  users: [],
  orders: [],
  invoices: [],
  tokens: new Map(),   // token -> userId
  rate: new Map(),     // bucket -> { count, resetAt }
  patches: new Set(),  // applied patch ids
  nextOrderId: 1001,
  nextInvoiceId: 5001,
  PATCH_CATALOG,
  sha256,
  reset() {
    this.users = seedUsers();
    this.orders = [];
    this.invoices = [];
    this.tokens = new Map();
    this.rate = new Map();
    this.patches = new Set();
    this.nextOrderId = 1001;
    this.nextInvoiceId = 5001;
  },
};

store.reset();
module.exports = store;
