'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const CONFIG_PATH = path.join(os.homedir(), '.sentinelrc');

const DEFAULT_CONFIG = {
  scannerUrl: process.env.SCANNER_URL || 'http://127.0.0.1:5000',
  defaultTargetUrl: process.env.TARGET_URL || 'http://127.0.0.1:4000',
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  defaultModules: ['bola', 'excessive_exposure', 'missing_auth', 'rate_limiting'],
};

function loadConfig() {
  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (_e) {
      // ignore
    }
  }

  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
  };
}

function saveConfig(updates) {
  const current = loadConfig();
  const next = { ...current, ...updates };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
    return next;
  } catch (err) {
    throw new Error(`Failed to save config to ${CONFIG_PATH}: ${err.message}`);
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  CONFIG_PATH,
};
