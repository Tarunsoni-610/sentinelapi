'use strict';
// CONTROL endpoint: correctly secured. The scanner must NOT flag this one (false-positive check).
// Note: it answers 404 (not 403) to non-owners - the scanner must treat both as "access denied".
const router = require('express').Router();
const store = require('../store');
const { authenticate, parseIntParam } = require('../middleware');

router.post('/', authenticate, (req, res) => {
  const { amount, description } = req.body || {};
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'bad_request' });
  const invoice = {
    id: store.nextInvoiceId++,
    userId: req.user.id,
    amount,
    description: typeof description === 'string' ? description : '',
    createdAt: new Date().toISOString(),
  };
  store.invoices.push(invoice);
  res.status(201).json(invoice);
});

router.get('/:id', authenticate, (req, res) => {
  const invoice = store.invoices.find((i) => i.id === parseIntParam(req.params.id));
  if (!invoice || invoice.userId !== req.user.id) return res.status(404).json({ error: 'invoice_not_found' });
  res.json(invoice);
});

module.exports = router;
