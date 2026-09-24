'use strict';
const router = require('express').Router();
const store = require('../store');
const { authenticate, requireAdmin } = require('../middleware');

// VULNERABILITY (authentication misconfiguration): the OpenAPI spec says bearerAuth is required,
// but the implementation forgot the middleware -> unauthenticated callers get admin data.
// FIX (patch "missing-auth-admin-stats"): authenticate + require the admin role.
function guard(req, res, next) {
  if (!store.patches.has('missing-auth-admin-stats')) return next();
  authenticate(req, res, () => requireAdmin(req, res, next));
}

router.get('/stats', guard, (_req, res) => {
  res.json({
    totalUsers: store.users.length,
    totalOrders: store.orders.length,
    totalInvoices: store.invoices.length,
    users: store.users.map((u) => ({ id: u.id, email: u.email, role: u.role })),
  });
});

module.exports = router;
