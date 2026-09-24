'use strict';
const router = require('express').Router();
const store = require('../store');
const { authenticate } = require('../middleware');

// VULNERABLE (intentional): returns the whole DB record -> passwordHash, ssn, apiKey, internalNotes leak.
function getMeVulnerable(req, res) {
  res.json(req.user);
}

// FIXED (patch "excessive-exposure-me"): explicit allow-list of fields.
function getMeFixed(req, res) {
  const { id, email, name, role } = req.user;
  res.json({ id, email, name, role });
}

router.get('/me', authenticate, (req, res) =>
  (store.patches.has('excessive-exposure-me') ? getMeFixed : getMeVulnerable)(req, res));

module.exports = router;
