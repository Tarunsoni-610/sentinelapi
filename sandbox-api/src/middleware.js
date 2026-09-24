'use strict';
const store = require('./store');

// Every response advertises that this is a sandbox. The scanner refuses targets without this header.
function sandboxHeader(_req, res, next) {
  res.set('X-SentinelAPI-Sandbox', 'true');
  next();
}

function authenticate(req, res, next) {
  const m = (req.get('authorization') || '').match(/^Bearer (.+)$/i);
  if (!m) return res.status(401).json({ error: 'missing_token' });
  const userId = store.tokens.get(m[1]);
  const user = userId && store.users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: 'invalid_token' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

// Fixed-window in-memory limiter. `enabled` lets us switch it on via a sandbox patch.
function rateLimiter({ name, windowMs, max, enabled = () => true }) {
  return (req, res, next) => {
    if (!enabled()) return next();
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    let bucket = store.rate.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      store.rate.set(key, bucket);
    }
    bucket.count += 1;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

const parseIntParam = (v) => (/^\d+$/.test(String(v)) ? parseInt(v, 10) : null);

function notFound(_req, res) {
  res.status(404).json({ error: 'not_found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({ error: status === 400 ? 'bad_request' : 'internal_error' });
}

module.exports = { sandboxHeader, authenticate, requireAdmin, rateLimiter, parseIntParam, notFound, errorHandler };
