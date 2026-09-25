'use strict';
const router = require('express').Router();

router.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sentinelapi-scanner',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
