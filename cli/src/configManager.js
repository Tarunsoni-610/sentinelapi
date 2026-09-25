import fs from 'fs';
import path from 'path';

export const DEFAULT_CONFIG = {
  $schema: 'https://sentinelapi.dev/schema.json',
  target: 'http://localhost:4000',
  spec: './sandbox-api/openapi.yaml',
  scannerUrl: 'http://localhost:5000',
  llmProvider: 'gemini',
  model: 'gemini-2.5-flash',
  defaultAgent: 'owasp_auditor',
  modules: [
    'bola',
    'broken_auth',
    'excessive_data_exposure',
    'rate_limiting',
  ],
  failOn: 'high',
  enrichWithAi: true,
  reposDir: './.sentinel/repos',
  agentSettings: {
    temperature: 0.3,
    maxContextLines: 200,
    autoExportChat: false,
  },
};

/**
 * Finds the nearest sentinel.config.json file.
 */
export function findConfigPath() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const configPath = path.join(dir, 'sentinel.config.json');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), 'sentinel.config.json');
}

/**
 * Loads configuration with fallback to defaults.
 */
export function loadConfig() {
  const configPath = findConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (_e) {
      // return default on parse error
    }
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Saves or updates configuration file.
 */
export function saveConfig(newConfig, targetPath = null) {
  const file = targetPath || findConfigPath();
  fs.writeFileSync(file, JSON.stringify(newConfig, null, 2) + '\n', 'utf8');
  return file;
}

/**
 * Updates a single key in the configuration.
 */
export function updateConfigKey(key, value) {
  const current = loadConfig();
  let parsedVal = value;

  if (value === 'true') parsedVal = true;
  else if (value === 'false') parsedVal = false;
  else if (!isNaN(Number(value)) && value.trim() !== '') parsedVal = Number(value);
  else if (value.startsWith('[') || value.startsWith('{')) {
    try {
      parsedVal = JSON.parse(value);
    } catch (_e) {}
  }

  current[key] = parsedVal;
  const savedPath = saveConfig(current);
  return { key, value: parsedVal, savedPath, config: current };
}
