'use strict';
const crypto = require('crypto');
const router = require('express').Router();
const store = require('../store');
const { rateLimiter } = require('../middleware');

// VULNERABILITY (rate limiting): login is unthrottled -> brute force / credential stuffing.
// FIX (patch "login-rate-limit"): 10 attempts per 10s per client, then 429 + Retry-After.
const loginLimiter = rateLimiter({
  name: 'login',
  windowMs: 10_000,
  max: 10,
  enabled: () => store.patches.has('login-rate-limit'),
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'bad_request' });
  }
  const user = store.users.find((u) => u.email === email);
  if (!user || user.passwordHash !== store.sha256(password)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  store.tokens.set(token, user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

module.exports = router;
