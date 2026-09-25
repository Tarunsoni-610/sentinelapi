'use strict';
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const boxen = require('boxen');
const { loadConfig } = require('../utils/config');
const apiClient = require('../utils/api');
const { printBanner } = require('../utils/banner');
const {
  renderExecutiveSummary,
  renderFindingsTable,
  renderSeverity,
  renderStatus,
  renderDiff,
  renderCurlBox,
} = require('../utils/formatters');

const SEVERITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

async function executeScan(options) {
  const config = loadConfig();
  const targetUrl = options.target || config.defaultTargetUrl;
  const scannerUrl = options.scanner || config.scannerUrl;
  const isJson = Boolean(options.json);
  const isQuiet = Boolean(options.quiet);
  const apiKey = options.apiKey || config.geminiApiKey || config.openaiApiKey;
  const provider = options.provider || config.llmProvider || 'gemini';

  let rawSpec = null;
  if (options.spec) {
    try {
      if (options.spec.startsWith('http://') || options.spec.startsWith('https://')) {
        const specRes = await fetch(options.spec);
        rawSpec = await specRes.text();
      } else {
        const specPath = path.resolve(process.cwd(), options.spec);
        rawSpec = fs.readFileSync(specPath, 'utf8');
      }
    } catch (err) {
      if (isJson) {
        console.log(JSON.stringify({ error: `Failed to load spec file: ${err.message}` }));
      } else {
        console.error(chalk.red(`✖ Error loading spec file: ${err.message}`));
      }
      process.exit(1);
    }
  }

  let modules = null;
  if (options.modules) {
    modules = options.modules.split(',').map((m) => m.trim().toLowerCase());
  }

  if (!isJson && !isQuiet) {
    printBanner();
  }

  const spinner = !isJson ? ora(`Initializing autonomous probe scan against ${chalk.hex('#43f283')(targetUrl)}...`).start() : null;

  let scanResult;
  const startTime = Date.now();
  try {
    scanResult = await apiClient.runScan({
      scannerUrl,
      targetUrl,
      rawSpec,
      modules,
      apiKey,
      provider,
    });
    if (spinner) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.succeed(chalk.green(`Security scan complete in ${elapsed}s! Analyzed ${scanResult.stats?.totalEndpoints || 0} endpoints.`));
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Scan failed: ${err.message}`));
    if (isJson) {
      console.log(JSON.stringify({ error: err.message, status: 'error' }));
    } else {
      console.error(chalk.red(`\n✖ Ensure the Scanner daemon is running on ${scannerUrl}`));
      console.error(chalk.dim(`  Try running: npm run scanner or sentinel config set scannerUrl <url>`));
    }
    process.exit(1);
  }

  if (isJson) {
    console.log(JSON.stringify(scanResult, null, 2));
    handleExitCode(scanResult, options.failOn);
    return;
  }

  // Print Executive Summary and Table
  console.log(renderExecutiveSummary(scanResult));
  console.log(renderFindingsTable(scanResult.findings || []));

  // Determine if interactive session should run
  const shouldInteract = options.interactive !== false && Boolean(process.stdin.isTTY);

  if (shouldInteract && scanResult.findings && scanResult.findings.length > 0) {
    await runInteractiveFindingLoop(scanResult, { scannerUrl, targetUrl, apiKey, provider });
  }

  handleExitCode(scanResult, options.failOn);
}

function handleExitCode(scanResult, failOn) {
  if (!failOn) return;
  const targetThreshold = SEVERITY_LEVELS[failOn.toLowerCase()] || 3; // default HIGH
  const hasThresholdBreach = (scanResult.findings || []).some((f) => {
    if (f.status === 'FIX_VERIFIED') return false;
    const sev = SEVERITY_LEVELS[(f.severity || '').toLowerCase()] || 0;
    return sev >= targetThreshold;
  });

  if (hasThresholdBreach) {
    process.exit(1);
  }
}

async function runInteractiveFindingLoop(scanResult, context) {
  let activeFindings = [...(scanResult.findings || [])];
  let running = true;

  while (running) {
    const choices = activeFindings.map((f, idx) => {
      const statusIcon = f.status === 'FIX_VERIFIED' ? chalk.green('✔') : chalk.red('✖');
      const sevBadge = `[${f.severity.toUpperCase()}]`;
      const sevColored = f.severity === 'critical' ? chalk.bgRed.black(sevBadge) :
                         f.severity === 'high' ? chalk.bgYellow.black(sevBadge) :
                         chalk.bgCyan.black(sevBadge);
      return {
        name: `${statusIcon} ${idx + 1}. ${sevColored} ${f.title} (${chalk.hex('#818cf8')(f.method + ' ' + f.path)})`,
        value: idx,
      };
    });

    choices.push(new inquirer.Separator());
    choices.push({ name: chalk.cyan('⚡ Verify All Patches against Sandbox API'), value: 'VERIFY_ALL' });
    choices.push({ name: chalk.yellow('💾 Export Findings to JSON file'), value: 'EXPORT' });
    choices.push({ name: chalk.dim('🚪 Exit Agent'), value: 'EXIT' });

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: chalk.bold.white('Select a finding to triage & remediate:'),
        pageSize: 12,
        choices,
      },
    ]);

    if (selected === 'EXIT') {
      running = false;
      console.log(chalk.dim('\nSession closed. Stay secure!\n'));
      break;
    }

    if (selected === 'VERIFY_ALL') {
      await handleVerifyAll(activeFindings, context);
      continue;
    }

    if (selected === 'EXPORT') {
      const exportPath = path.join(process.cwd(), `sentinel-report-${Date.now()}.json`);
      fs.writeFileSync(exportPath, JSON.stringify({ ...scanResult, findings: activeFindings }, null, 2), 'utf8');
      console.log(chalk.green(`✔ Exported comprehensive report to ${chalk.bold(exportPath)}\n`));
      continue;
    }

    if (typeof selected === 'number') {
      const finding = activeFindings[selected];
      await handleFindingDrillDown(finding, activeFindings, context);
    }
  }
}

async function handleFindingDrillDown(finding, allFindings, context) {
  let inDrillDown = true;

  while (inDrillDown) {
    console.log('\n' + boxen([
      `${chalk.bold.white('Vulnerability:')}   ${chalk.bold(finding.title)}`,
      `${chalk.bold.white('Severity:')}        ${renderSeverity(finding.severity)}`,
      `${chalk.bold.white('OWASP Category:')}  ${chalk.hex('#818cf8')(finding.owaspCategory || finding.owaspId)}`,
      `${chalk.bold.white('Target Endpoint:')}  ${chalk.hex('#43f283')(`${finding.method} ${finding.path}`)}`,
      `${chalk.bold.white('Patch ID:')}         ${chalk.yellow(finding.patchId || 'N/A')}`,
      `${chalk.bold.white('Current Status:')}   ${renderStatus(finding.status)}`,
    ].join('\n'), {
      padding: 1,
      margin: { top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor: '#43f283',
      backgroundColor: '#12141a',
      title: chalk.bold.hex('#43f283')(' FINDING DETAILS '),
    }));

    const actions = [
      { name: '📋 View Description, Impact & Root Cause Analysis', value: 'DETAILS' },
      { name: '🚀 View & Copy Reproducible cURL PoC', value: 'CURL' },
      { name: '💻 View AI Remediation Unified Git Diff', value: 'DIFF' },
    ];

    if (finding.patchId) {
      actions.push({ name: '⚡ Apply Sandbox Patch & Live Re-Verify Target', value: 'APPLY_AND_VERIFY' });
      actions.push({ name: '↩  Revert Sandbox Patch & Re-Test', value: 'REVERT_AND_VERIFY' });
    }

    actions.push(new inquirer.Separator());
    actions.push({ name: chalk.dim('⬅  Back to Findings List'), value: 'BACK' });

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold('Action:'),
        choices: actions,
      },
    ]);

    switch (action) {
      case 'DETAILS':
        console.log('\n' + boxen([
          chalk.bold.hex('#43f283')('DESCRIPTION:'),
          finding.description || 'No description provided.',
          '',
          chalk.bold.hex('#f43f5e')('SECURITY IMPACT:'),
          finding.businessImpact || finding.impact || 'High potential data compromise or unauthorized modification.',
          '',
          chalk.bold.hex('#818cf8')('REMEDIATION GUIDANCE:'),
          (typeof finding.remediation === 'object' ? (finding.remediation?.remediationSummary || finding.remediation?.explanation) : finding.remediation) || 'Enforce robust object-level authorization and validation.',
        ].join('\n'), {
          padding: 1,
          borderStyle: 'round',
          borderColor: '#1f212a',
          backgroundColor: '#0a0b0e',
        }));
        break;

      case 'CURL': {
        const curlCode = finding.curlPoc || finding.curlProofOfConcept || '# No PoC available for this check';
        console.log('\n' + renderCurlBox(curlCode));
        break;
      }

      case 'DIFF': {
        const diffCode = finding.remediation?.diff ||
                         finding.remediation?.unifiedDiff ||
                         finding.patchDiff ||
                         finding.aiRemediation?.unifiedDiff ||
                         '# No unified diff generated';
        console.log('\n' + boxen(
          renderDiff(diffCode),
          {
            padding: 1,
            borderStyle: 'round',
            borderColor: '#1f212a',
            backgroundColor: '#0a0b0e',
            title: chalk.bold.hex('#43f283')(` Unified Remediation Diff (${finding.patchId || 'suggested'}) `),
          }
        ));
        break;
      }

      case 'APPLY_AND_VERIFY': {
        const verifySpinner = ora(`Applying patch ${chalk.yellow(finding.patchId)} on sandbox and executing live verification probe...`).start();
        try {
          const res = await apiClient.verifyFix({
            scannerUrl: context.scannerUrl,
            targetUrl: context.targetUrl,
            patchId: finding.patchId,
            applyPatch: true,
          });

          if (res.isFixed) {
            verifySpinner.succeed(chalk.green.bold(`✔ VERIFICATION PASSED: Vulnerability successfully mitigated!`));
            finding.status = 'FIX_VERIFIED';
            console.log(chalk.dim(`  Response status: ${res.status || 403} (${res.message || 'Access Forbidden'})`));
          } else {
            verifySpinner.fail(chalk.red.bold(`✖ VERIFICATION FAILED: Endpoint remains vulnerable!`));
            finding.status = 'VULNERABLE';
          }
        } catch (err) {
          verifySpinner.fail(chalk.red(`Verification probe error: ${err.message}`));
        }
        break;
      }

      case 'REVERT_AND_VERIFY': {
        const revertSpinner = ora(`Reverting patch ${chalk.yellow(finding.patchId)} and re-verifying vulnerability...`).start();
        try {
          const res = await apiClient.verifyFix({
            scannerUrl: context.scannerUrl,
            targetUrl: context.targetUrl,
            patchId: finding.patchId,
            applyPatch: false,
          });

          if (!res.isFixed) {
            revertSpinner.info(chalk.yellow(`↩ Reverted: Endpoint is confirmed vulnerable as expected.`));
            finding.status = 'VULNERABLE';
          } else {
            revertSpinner.warn(chalk.cyan(`Target reported secure.`));
          }
        } catch (err) {
          revertSpinner.fail(chalk.red(`Revert error: ${err.message}`));
        }
        break;
      }

      case 'BACK':
      default:
        inDrillDown = false;
        break;
    }
  }
}

async function handleVerifyAll(findings, context) {
  const patchable = findings.filter((f) => f.patchId);
  if (patchable.length === 0) {
    console.log(chalk.yellow('\nNo patchable sandbox findings available.\n'));
    return;
  }

  console.log(chalk.bold(`\n⚡ Running Batch Verification on ${patchable.length} sandbox controls...\n`));

  for (const f of patchable) {
    const spinner = ora(`Testing patch ${chalk.yellow(f.patchId)} on ${f.method} ${f.path}...`).start();
    try {
      const res = await apiClient.verifyFix({
        scannerUrl: context.scannerUrl,
        targetUrl: context.targetUrl,
        patchId: f.patchId,
        applyPatch: true,
      });

      if (res.isFixed) {
        spinner.succeed(chalk.green(`[PASS] ${f.title} -> FIX_VERIFIED`));
        f.status = 'FIX_VERIFIED';
      } else {
        spinner.fail(chalk.red(`[FAIL] ${f.title} -> STILL VULNERABLE`));
        f.status = 'VULNERABLE';
      }
    } catch (err) {
      spinner.fail(chalk.red(`[ERR] ${f.title}: ${err.message}`));
    }
  }

  console.log(chalk.green.bold('\n✔ Batch verification completed.\n'));
}

module.exports = {
  executeScan,
};
