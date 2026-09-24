'use strict';
const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const { loadConfig } = require('../utils/config');
const apiClient = require('../utils/api');
const { printBanner } = require('../utils/banner');

async function executeVerify(patchId, options) {
  const config = loadConfig();
  const targetUrl = options.target || config.defaultTargetUrl;
  const scannerUrl = options.scanner || config.scannerUrl;
  const isJson = Boolean(options.json);
  const isQuiet = Boolean(options.quiet);
  const applyPatch = options.revert ? false : true;

  if (!isJson && !isQuiet) {
    printBanner();
  }

  const spinner = !isJson
    ? ora(`${applyPatch ? 'Applying' : 'Reverting'} patch ${chalk.yellow(patchId)} and executing targeted verification probe on ${chalk.hex('#43f283')(targetUrl)}...`).start()
    : null;

  try {
    const result = await apiClient.verifyFix({
      scannerUrl,
      targetUrl,
      patchId,
      applyPatch,
    });

    if (spinner) {
      if (result.isFixed) {
        spinner.succeed(chalk.green.bold(`✔ VERIFICATION PASSED: Vulnerability successfully mitigated!`));
      } else {
        spinner.fail(chalk.red.bold(`✖ VERIFICATION FAILED: Target remains vulnerable.`));
      }
    }

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
      if (!result.isFixed && applyPatch) process.exit(1);
      return;
    }

    const boxContent = [
      `${chalk.bold.white('Patch ID:')}        ${chalk.yellow.bold(patchId)}`,
      `${chalk.bold.white('Action:')}          ${applyPatch ? chalk.green('APPLY & VERIFY') : chalk.yellow('REVERT & VERIFY')}`,
      `${chalk.bold.white('Target URL:')}       ${chalk.hex('#43f283')(targetUrl)}`,
      `${chalk.bold.white('Probe Status:')}     ${result.isFixed ? chalk.hex('#43f283').bold('FIX_VERIFIED (200 OK / 403 Expected)') : chalk.hex('#f43f5e').bold('VULNERABLE (State Compromised)')}`,
      `${chalk.bold.white('HTTP Status:')}     ${chalk.white(result.status || 'N/A')}`,
      `${chalk.bold.white('Details:')}         ${chalk.dim(result.message || result.details || 'Probe execution complete')}`,
    ].join('\n');

    console.log('\n' + boxen(boxContent, {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: result.isFixed ? '#43f283' : '#f43f5e',
      backgroundColor: '#12141a',
      title: chalk.bold(result.isFixed ? ' VERIFICATION REPORT: SECURE ' : ' VERIFICATION REPORT: VULNERABLE '),
      titleAlignment: 'center',
    }));

    if (!result.isFixed && applyPatch) {
      process.exit(1);
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Verification error: ${err.message}`));
    if (isJson) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`\n✖ Could not execute verification probe against ${scannerUrl}: ${err.message}`));
    }
    process.exit(1);
  }
}

module.exports = {
  executeVerify,
};
