'use strict';
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const scanRoutes = require('./routes/scan');
const remediateRoutes = require('./routes/remediate');
const verifyRoutes = require('./routes/verify');
const sandboxRoutes = require('./routes/sandbox');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log incoming requests in dev mode
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Scanner HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/remediate', remediateRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/sandbox', sandboxRoutes);

// Error Handling Middleware
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Scanner Fatal Error]:', err);
  res.status(500).json({
    error: err.message || 'Internal Scanner Error',
    status: 'error',
  });
});

module.exports = app;
