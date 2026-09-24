'use strict';
const router = require('express').Router();
const config = require('../config');
const { runScan, getScan, listScans } = require('../services/scanner');
const { loadSpec } = require('../services/openapi');

// POST /api/scan - Trigger a live stateful scan
router.post('/', async (req, res) => {
  try {
    const targetUrl = req.body.targetUrl || config.defaultTargetUrl;
    const rawSpec = req.body.rawSpec || null;
    const modules = req.body.modules || null;
    const enrichWithAi = req.body.enrichWithAi !== false;

    // Dynamic API key resolution (Headers > Body > Config)
    const llmApiKey =
      req.get('x-gemini-api-key') ||
      req.get('x-openai-api-key') ||
      req.get('x-api-key') ||
      req.body.apiKey ||
      null;

    const llmProvider =
      req.get('x-llm-provider') ||
      req.body.provider ||
      (req.get('x-openai-api-key') ? 'openai' : 'gemini');

    const result = await runScan({
      targetUrl,
      rawSpec,
      modules,
      llmApiKey,
      llmProvider,
      enrichWithAi,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('[Scan Route Error]:', err);
    res.status(400).json({
      error: err.message,
      status: 'error',
    });
  }
});

// POST /api/scan/spec - Inspect and validate an OpenAPI spec without running full attacks
router.post('/spec', async (req, res) => {
  try {
    const targetUrl = req.body.targetUrl || config.defaultTargetUrl;
    const rawSpec = req.body.rawSpec || null;

    const spec = await loadSpec(targetUrl, rawSpec);
    res.json({
      info: spec.info,
      endpoints: spec.endpoints,
      components: spec.components,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/scans - List recent scans
router.get('/', (_req, res) => {
  res.json(listScans());
});

// GET /api/scans/:id - Retrieve specific scan result
router.get('/:id', (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json(scan);
});

module.exports = router;
