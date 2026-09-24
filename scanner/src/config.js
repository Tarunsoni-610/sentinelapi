'use strict';
require('dotenv').config();

const config = {
  port: parseInt(process.env.SCANNER_PORT || process.env.PORT || '5000', 10),
  defaultTargetUrl: process.env.TARGET_URL || 'http://127.0.0.1:4000',
  allowedTargets: (process.env.ALLOWED_TARGETS || 'localhost,127.0.0.1,sandbox-api,0.0.0.0')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};

module.exports = config;
