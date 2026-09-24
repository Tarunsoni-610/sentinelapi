'use strict';
const router = require('express').Router();
const config = require('../config');
const { sendRequest } = require('../services/probes/client');

// Proxy helper: GET /api/sandbox/info
router.get('/info', async (req, res) => {
  try {
    const targetUrl = req.query.targetUrl || config.defaultTargetUrl;
    const infoRes = await sendRequest(targetUrl, '/__sandbox/info');
    res.status(infoRes.status || 200).json(infoRes.data || { error: 'Failed to reach sandbox' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy helper: POST /api/sandbox/reset
router.post('/reset', async (req, res) => {
  try {
    const targetUrl = req.body.targetUrl || config.defaultTargetUrl;
    const resetRes = await sendRequest(targetUrl, '/__sandbox/reset', { method: 'POST' });
    res.status(resetRes.status || 200).json(resetRes.data || { ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy helper: POST /api/sandbox/patch
router.post('/patch', async (req, res) => {
  try {
    const { targetUrl = config.defaultTargetUrl, patchId, apply = true } = req.body;
    if (!patchId) return res.status(400).json({ error: 'Missing patchId' });

    const action = apply ? 'apply' : 'revert';
    const patchRes = await sendRequest(targetUrl, `/__sandbox/patches/${patchId}/${action}`, {
      method: 'POST',
    });
    res.status(patchRes.status || 200).json(patchRes.data || { ok: true, patchId, applied: apply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
