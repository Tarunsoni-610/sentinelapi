'use strict';
const router = require('express').Router();
const config = require('../config');
const { verifyPatch } = require('../services/verifier');

// POST /api/verify - Run targeted re-probe to verify if a patch fixed the issue
router.post('/', async (req, res) => {
  try {
    const targetUrl = req.body.targetUrl || config.defaultTargetUrl;
    const patchId = req.body.patchId;
    const applyPatch = req.body.applyPatch !== undefined ? Boolean(req.body.applyPatch) : null;

    if (!patchId) {
      return res.status(400).json({ error: 'Missing required "patchId" parameter' });
    }

    const result = await verifyPatch(targetUrl, patchId, { applyPatch });
    res.json(result);
  } catch (err) {
    console.error('[Verify Route Error]:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
