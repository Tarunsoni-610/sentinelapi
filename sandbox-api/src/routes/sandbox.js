'use strict';
// Sandbox control plane: lets SentinelAPI reset state and apply/revert fixes to prove a re-test flips to "Fix Verified".
const router = require('express').Router();
const store = require('../store');

router.use((_req, res, next) =>
  process.env.SANDBOX_CONTROL_ENABLED === 'false' ? res.status(404).json({ error: 'not_found' }) : next());

const info = () => ({
  sandbox: true,
  name: 'SentinelAPI Vulnerable Sandbox',
  version: '1.0.0',
  appliedPatches: [...store.patches],
  availablePatches: store.PATCH_CATALOG,
});

router.get('/info', (_req, res) => res.json(info()));

router.post('/reset', (_req, res) => {
  store.reset();
  res.json({ ok: true, ...info() });
});

function setPatch(apply) {
  return (req, res) => {
    const id = req.params.id;
    if (!store.PATCH_CATALOG[id]) return res.status(404).json({ error: 'unknown_patch' });
    if (apply) store.patches.add(id); else store.patches.delete(id);
    store.rate.clear(); // start each verification run with clean rate-limit buckets
    res.json({ ok: true, patch: id, applied: apply, ...info() });
  };
}
router.post('/patches/:id/apply', setPatch(true));
router.post('/patches/:id/revert', setPatch(false));

module.exports = router;
