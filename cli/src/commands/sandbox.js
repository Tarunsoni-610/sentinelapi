'use strict';
const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const ora = require('ora');
const { loadConfig } = require('../utils/config');
const apiClient = require('../utils/api');

async function handleSandboxInfo(options) {
  const config = loadConfig();
  const targetUrl = options.target || config.defaultTargetUrl;
  const scannerUrl = options.scanner || config.scannerUrl;
  const isJson = Boolean(options.json);

  const spinner = !isJson ? ora(`Fetching sandbox API metadata from ${chalk.hex('#43f283')(targetUrl)}...`).start() : null;

  try {
    const info = await apiClient.getSandboxInfo(scannerUrl, targetUrl);
    if (spinner) spinner.succeed(chalk.green('Sandbox metadata retrieved successfully.'));

    if (isJson) {
      console.log(JSON.stringify(info, null, 2));
      return;
    }

    const availablePatches = info.availablePatches || info.patches || {};
    const appliedSet = new Set(info.appliedPatches || []);
    const patchKeys = Object.keys(availablePatches);

    console.log(boxen([
      `${chalk.bold.white('Sandbox Mode:')}        ${chalk.hex('#43f283')(info.name || 'SentinelAPI Vulnerable Sandbox')}`,
      `${chalk.bold.white('Version:')}             ${chalk.dim(info.version || '1.0.0')}`,
      `${chalk.bold.white('Target URL:')}          ${chalk.cyan(targetUrl)}`,
      `${chalk.bold.white('Active Patches:')}      ${chalk.hex('#43f283').bold(appliedSet.size)} applied`,
      `${chalk.bold.white('Available Patches:')}   ${chalk.white(patchKeys.length)} catalogued`,
      `${chalk.bold.white('Control Plane Route:')} ${chalk.dim('/__sandbox/patches/:id/apply')}`,
    ].join('\n'), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: '#43f283',
      backgroundColor: '#12141a',
      title: chalk.bold.hex('#43f283')(' SANDBOX TARGET STATUS '),
    }));

    if (patchKeys.length > 0) {
      const table = new Table({
        head: [chalk.hex('#43f283')('Patch ID'), chalk.hex('#43f283')('Active Status'), chalk.hex('#43f283')('Description')],
        colWidths: [26, 18, 50],
        style: { border: ['#1f212a'] },
      });

      for (const [patchId, details] of Object.entries(availablePatches)) {
        const isApplied = appliedSet.has(patchId);
        const statusLabel = isApplied ? chalk.green.bold('✔ ACTIVE') : chalk.red.bold('✖ DISABLED');
        const desc = typeof details === 'string' ? details : (details?.description || details?.title || 'Sandbox vulnerability toggle');
        table.push([chalk.yellow.bold(patchId), statusLabel, chalk.white(desc)]);
      }

      console.log(table.toString() + '\n');
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Failed to fetch sandbox info: ${err.message}`));
    if (isJson) console.log(JSON.stringify({ error: err.message }));
    else console.error(chalk.red(`\n✖ Could not query sandbox: ${err.message}`));
    process.exit(1);
  }
}

async function handleSandboxPatch(patchId, options) {
  const config = loadConfig();
  const targetUrl = options.target || config.defaultTargetUrl;
  const scannerUrl = options.scanner || config.scannerUrl;
  const isJson = Boolean(options.json);
  const apply = options.revert ? false : true;

  const spinner = !isJson
    ? ora(`${apply ? 'Applying' : 'Reverting'} sandbox patch ${chalk.yellow(patchId)}...`).start()
    : null;

  try {
    const res = await apiClient.toggleSandboxPatch(scannerUrl, targetUrl, patchId, apply);
    if (spinner) {
      spinner.succeed(chalk.green(`Successfully ${apply ? 'applied' : 'reverted'} patch ${chalk.yellow.bold(patchId)}.`));
    }
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Patch operation failed: ${err.message}`));
    if (isJson) console.log(JSON.stringify({ error: err.message }));
    else console.error(chalk.red(`\n✖ Patch error: ${err.message}`));
    process.exit(1);
  }
}

async function handleSandboxReset(options) {
  const config = loadConfig();
  const targetUrl = options.target || config.defaultTargetUrl;
  const scannerUrl = options.scanner || config.scannerUrl;
  const isJson = Boolean(options.json);

  const spinner = !isJson ? ora(`Resetting all sandbox patches on ${chalk.hex('#43f283')(targetUrl)}...`).start() : null;

  try {
    const res = await apiClient.resetSandbox(scannerUrl, targetUrl);
    if (spinner) {
      spinner.succeed(chalk.green('✔ All sandbox patches have been reset to vulnerable baseline state.'));
    }
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Reset failed: ${err.message}`));
    if (isJson) console.log(JSON.stringify({ error: err.message }));
    else console.error(chalk.red(`\n✖ Sandbox reset error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = {
  handleSandboxInfo,
  handleSandboxPatch,
  handleSandboxReset,
};
