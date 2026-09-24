'use strict';
const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  SentinelAPI Scanner Service v1.0.0`);
  console.log(`📡 Listening on: http://0.0.0.0:${config.port}`);
  console.log(`🎯 Default Target: ${config.defaultTargetUrl}`);
  console.log(`🔒 Allowed Targets: ${config.allowedTargets.join(', ')}`);
  console.log(`🤖 LLM Provider: ${config.llmProvider} (${config.geminiApiKey || config.openaiApiKey ? 'API Key Configured' : 'Dynamic / Template Fallback Mode'})`);
  console.log(`=======================================================`);
});

module.exports = server;
