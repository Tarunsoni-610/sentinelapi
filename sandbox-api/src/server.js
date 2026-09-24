'use strict';
const app = require('./app');

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[sandbox] SentinelAPI vulnerable sandbox listening on http://${HOST}:${PORT}`);
  console.log('[sandbox] Intentionally vulnerable. Local demo use only.');
});
