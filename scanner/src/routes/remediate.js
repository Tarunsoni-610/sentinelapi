'use strict';
const router = require('express').Router();
const { generateRemediation } = require('../services/llm');

// POST /api/remediate - Generate LLM analysis and unified diff patch for a finding
router.post('/', async (req, res) => {
  try {
    const finding = req.body.finding;
    if (!finding) {
      return res.status(400).json({ error: 'Missing required "finding" object in request body' });
    }

    const apiKey =
      req.get('x-gemini-api-key') ||
      req.get('x-openai-api-key') ||
      req.get('x-api-key') ||
      req.body.apiKey ||
      null;

    const provider =
      req.get('x-llm-provider') ||
      req.body.provider ||
      (req.get('x-openai-api-key') ? 'openai' : 'gemini');

    const remediation = await generateRemediation(finding, {
      apiKey,
      provider,
    });

    res.json(remediation);
  } catch (err) {
    console.error('[Remediate Route Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
