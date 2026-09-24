'use strict';
// CONTROL endpoint: public, but properly rate limited (20 req / 10s). Must NOT be flagged for rate limiting.
const router = require('express').Router();
const { rateLimiter } = require('../middleware');

const PRODUCTS = [
  { id: 1, name: 'Mechanical Keyboard', price: 79.0 },
  { id: 2, name: 'USB-C Dock', price: 129.5 },
  { id: 3, name: '27" Monitor', price: 249.0 },
];

router.get('/', rateLimiter({ name: 'products', windowMs: 10_000, max: 20 }), (_req, res) => {
  res.json(PRODUCTS);
});

module.exports = router;
