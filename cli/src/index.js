'use strict';
const { Command } = require('commander');
const { executeScan } = require('./commands/scan');
const { executeVerify } = require('./commands/verify');
const { executeRemediate } = require('./commands/remediate');
const { handleSandboxInfo, handleSandboxPatch, handleSandboxReset } = require('./commands/sandbox');
const { handleConfigList, handleConfigGet, handleConfigSet } = require('./commands/config');
const { printBanner } = require('./utils/banner');

function createProgram() {
  const program = new Command();

  program
    .name('sentinel')
    .description('Autonomous Terminal Security Agent CLI for dynamic API auditing, cURL PoCs, AI diffs & live sandbox verification.')
    .version('1.0.0');

  // Command: scan
  program
    .command('scan')
    .description('Run automated stateful security audit probes against target API')
    .option('-t, --target <url>', 'Target API base URL (e.g. http://localhost:4000)')
    .option('-s, --scanner <url>', 'Scanner service URL (e.g. http://localhost:5000)')
    .option('-m, --modules <modules>', 'Comma-separated modules (bola,excessive_exposure,missing_auth,rate_limiting)')
    .option('--spec <pathOrUrl>', 'Path or URL to OpenAPI specification (YAML or JSON)')
    .option('-i, --interactive', 'Run interactive finding triage session in terminal (default in TTY)')
    .option('--no-interactive', 'Disable interactive prompts (for CI/CD scripts)')
    .option('-j, --json', 'Output raw JSON report')
    .option('-q, --quiet', 'Suppress branding banner and spinner logs')
    .option('--fail-on <severity>', 'Exit with error code 1 if findings meet or exceed severity (critical, high, medium, low)')
    .option('--api-key <key>', 'Override LLM API Key (Gemini or OpenAI)')
    .option('--provider <provider>', 'LLM Provider (gemini or openai)')
    .action(async (options) => {
      await executeScan(options);
    });

  // Command: verify
  program
    .command('verify <patchId>')
    .description('Execute live targeted verification probe against Sandbox API with optional patch toggling')
    .option('-t, --target <url>', 'Target Sandbox API base URL')
    .option('-s, --scanner <url>', 'Scanner service URL')
    .option('--revert', 'Revert patch before testing rather than applying')
    .option('-j, --json', 'Output raw JSON result')
    .option('-q, --quiet', 'Suppress branding banner')
    .action(async (patchId, options) => {
      await executeVerify(patchId, options);
    });

  // Command: remediate
  program
    .command('remediate')
    .description('Generate AI-powered code analysis and Unified Git Diff patch for a finding')
    .option('-s, --scanner <url>', 'Scanner service URL')
    .option('--finding <fileOrJson>', 'Path to finding JSON file or inline JSON string')
    .option('--patch-id <id>', 'Sandbox patch identifier to generate remediation for (e.g. bola-01)')
    .option('--api-key <key>', 'Override LLM API key')
    .option('--provider <provider>', 'LLM provider (gemini or openai)')
    .option('-j, --json', 'Output raw JSON response')
    .option('-q, --quiet', 'Suppress branding banner')
    .action(async (options) => {
      await executeRemediate(options);
    });

  // Command Group: sandbox
  const sandboxCmd = program
    .command('sandbox')
    .description('Manage vulnerable sandbox API environment and live runtime patches');

  sandboxCmd
    .command('info')
    .description('Inspect sandbox API endpoints, active runtime patches, and health')
    .option('-t, --target <url>', 'Target API base URL')
    .option('-s, --scanner <url>', 'Scanner service URL')
    .option('-j, --json', 'Output JSON')
    .action(async (options) => {
      await handleSandboxInfo(options);
    });

  sandboxCmd
    .command('patch <patchId>')
    .description('Apply or revert a specific runtime security patch on sandbox')
    .option('-t, --target <url>', 'Target API base URL')
    .option('-s, --scanner <url>', 'Scanner service URL')
    .option('--revert', 'Revert the patch instead of applying')
    .option('-j, --json', 'Output JSON')
    .action(async (patchId, options) => {
      await handleSandboxPatch(patchId, options);
    });

  sandboxCmd
    .command('reset')
    .description('Reset all sandbox patches to default vulnerable baseline state')
    .option('-t, --target <url>', 'Target API base URL')
    .option('-s, --scanner <url>', 'Scanner service URL')
    .option('-j, --json', 'Output JSON')
    .action(async (options) => {
      await handleSandboxReset(options);
    });

  // Command Group: config
  const configCmd = program
    .command('config')
    .description('View and update persistent Sentinel CLI settings in ~/.sentinelrc');

  configCmd
    .command('list')
    .alias('show')
    .description('List all active CLI configurations')
    .option('-j, --json', 'Output JSON')
    .action((options) => {
      handleConfigList(options);
    });

  configCmd
    .command('get <key>')
    .description('Get a specific config value')
    .option('-j, --json', 'Output JSON')
    .action((key, options) => {
      handleConfigGet(key, options);
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a persistent config value (e.g. sentinel config set scannerUrl http://localhost:5000)')
    .option('-j, --json', 'Output JSON')
    .action((key, value, options) => {
      handleConfigSet(key, value, options);
    });

  // Default action when invoked with no args
  if (process.argv.length <= 2) {
    printBanner();
    program.outputHelp();
    process.exit(0);
  }

  return program;
}

module.exports = {
  createProgram,
};
