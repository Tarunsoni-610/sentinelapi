'use strict';
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const { loadConfig } = require('../utils/config');
const apiClient = require('../utils/api');
const { renderDiff } = require('../utils/formatters');
const { printBanner } = require('../utils/banner');

async function executeRemediate(options) {
  const config = loadConfig();
  const scannerUrl = options.scanner || config.scannerUrl;
  const apiKey = options.apiKey || config.geminiApiKey || config.openaiApiKey;
  const provider = options.provider || config.llmProvider || 'gemini';
  const isJson = Boolean(options.json);

  let finding = null;
  if (options.finding) {
    try {
      if (options.finding.startsWith('{')) {
        finding = JSON.parse(options.finding);
      } else {
        const filePath = path.resolve(process.cwd(), options.finding);
        finding = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (err) {
      if (isJson) {
        console.log(JSON.stringify({ error: `Invalid finding payload: ${err.message}` }));
      } else {
        console.error(chalk.red(`✖ Invalid finding payload: ${err.message}`));
      }
      process.exit(1);
    }
  } else {
    // Generate standard remediation request for sandbox route
    finding = {
      title: options.title || 'Broken Object Level Authorization (BOLA)',
      method: options.method || 'GET',
      path: options.path || '/api/users/{id}',
      owaspCategory: 'API1:2023 Broken Object Level Authorization',
      description: 'The endpoint does not verify whether the requesting user owns or has permission to view the resource.',
      patchId: options.patchId || 'bola-01',
    };
  }

  if (!isJson && !options.quiet) {
    printBanner();
  }

  const spinner = !isJson ? ora(`Requesting AI remediation and unified git diff from ${provider.toUpperCase()}...`).start() : null;

  try {
    const result = await apiClient.generateRemediation({
      scannerUrl,
      finding,
      apiKey,
      provider,
    });

    if (spinner) {
      spinner.succeed(chalk.green('Remediation analysis & unified diff generated!'));
    }

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(boxen([
      `${chalk.bold.white('Vulnerability:')}   ${chalk.bold(finding.title)} (${chalk.hex('#818cf8')(finding.method + ' ' + finding.path)})`,
      `${chalk.bold.white('Model Used:')}      ${chalk.cyan(result.model || provider)}`,
      `${chalk.bold.white('Explanation:')}     ${chalk.white(result.explanation || 'See unified diff below')}`,
    ].join('\n'), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: '#43f283',
      backgroundColor: '#12141a',
      title: chalk.bold.hex('#43f283')(' AI REMEDIATION ANALYSIS '),
    }));

    const diffContent = result.diff || result.unifiedDiff;
    if (diffContent) {
      console.log(boxen(renderDiff(diffContent), {
        padding: 1,
        borderStyle: 'round',
        borderColor: '#1f212a',
        backgroundColor: '#0a0b0e',
        title: chalk.bold.hex('#43f283')(' Unified Git Patch Diff '),
      }));
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Remediation generation failed: ${err.message}`));
    if (isJson) console.log(JSON.stringify({ error: err.message }));
    else console.error(chalk.red(`\n✖ Remediation error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = {
  executeRemediate,
};
