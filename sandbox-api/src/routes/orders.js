'use strict';
const router = require('express').Router();
const store = require('../store');
const { authenticate, parseIntParam } = require('../middleware');

// Create an order owned by the caller.
router.post('/', authenticate, (req, res) => {
  const { item, quantity, shippingAddress } = req.body || {};
  if (typeof item !== 'string' || !item.trim() || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'bad_request' });
  }
  const order = {
    id: store.nextOrderId++,
    userId: req.user.id,
    item: item.trim(),
    quantity,
    shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.orders.push(order);
  res.status(201).json(order);
});

// List only the caller's own orders (this one is correct).
router.get('/', authenticate, (req, res) => {
  res.json(store.orders.filter((o) => o.userId === req.user.id));
});

// VULNERABLE (intentional) - Broken Object Level Authorization (BOLA / IDOR):
// any authenticated user can read any order by guessing / enumerating its ID.
function getOrderVulnerable(req, res) {
  const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  return res.json(order);
}

// FIXED (patch "bola-orders"): verify the order belongs to the authenticated caller.
function getOrderFixed(req, res) {
  const order = store.orders.find((o) => o.id === parseIntParam(req.params.id));
  if (!order) return res.status(404).json({ error: 'order_not_found' });
  if (order.userId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  return res.json(order);
}

router.get('/:id', authenticate, (req, res) =>
  (store.patches.has('bola-orders') ? getOrderFixed : getOrderVulnerable)(req, res));

module.exports = router;
