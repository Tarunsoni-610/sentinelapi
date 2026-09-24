'use strict';
const path = require('path');
const express = require('express');
const { sandboxHeader, notFound, errorHandler } = require('./middleware');

const app = express();
app.disable('x-powered-by');
app.use(sandboxHeader);
app.use(express.json({ limit: '50kb' }));

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml').sendFile(path.join(__dirname, '..', 'openapi.yaml'));
});

app.use('/__sandbox', require('./routes/sandbox'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
