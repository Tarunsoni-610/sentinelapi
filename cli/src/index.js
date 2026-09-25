import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import { runAuditOrchestration } from './orchestrator.js';
import { generateRemediation } from './llmClient.js';
import { runAgentChatSession } from './chatSession.js';
import { cloneOrInspectRepo } from './repoManager.js';
import { getAgentPersona, listAgentPersonas } from './agentPersonas.js';
import {
  printBanner,
  renderExecutiveSummary,
  renderFindingsTable,
  renderSeverity,
  renderStatus,
  renderDiff,
  renderCurlBox,
  renderRepoSummary,
} from './formatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEVERITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Finds and loads sentinel.config.json from cwd or ancestor directories.
 */
export function loadConfigFile() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const configPath = path.join(dir, 'sentinel.config.json');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (_e) {
        // ignore JSON parse error and fallback
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return {};
}

/**
 * Executes a security audit scan.
 */
export async function executeScan(options = {}) {
  const fileConfig = loadConfigFile();

  const targetUrl = options.target || fileConfig.target || fileConfig.defaultTargetUrl || 'http://localhost:4000';
  const specPathOrUrl = options.spec || fileConfig.spec || './sandbox-api/openapi.yaml';
  const isJson = Boolean(options.json);
  const isQuiet = Boolean(options.quiet);
  const apiKey = options.apiKey || fileConfig.geminiApiKey || process.env.GEMINI_API_KEY;
  const failOn = options.failOn || fileConfig.failOn;

  let modules = ['bola', 'broken_auth', 'excessive_data_exposure', 'rate_limiting'];
  if (options.modules) {
    modules = options.modules.split(',').map((m) => m.trim().toLowerCase());
  } else if (fileConfig.modules) {
    modules = fileConfig.modules;
  }

  if (!isJson && !isQuiet) {
    printBanner();
  }

  const spinner = !isJson ? ora(`Initializing autonomous probe scan against ${chalk.hex('#43f283')(targetUrl)}...`).start() : null;

  let auditResult;
  try {
    auditResult = await runAuditOrchestration({
      targetUrl,
      specPathOrUrl,
      modules,
      apiKey,
      enrichWithAi: options.enrichWithAi !== false,
      onProgress: (msg) => {
        if (spinner) spinner.text = msg;
      },
    });

    if (spinner) {
      spinner.succeed(chalk.green(`Security scan complete! Analyzed ${auditResult.endpointsCount || 0} endpoints.`));
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(`Scan failed: ${err.message}`));
    if (isJson) {
      console.log(JSON.stringify({ error: err.message, status: 'error' }));
    } else {
      console.error(chalk.red(`\n✖ Error during scan: ${err.message}`));
      console.error(chalk.dim(`  Ensure the target API is running on ${targetUrl}`));
    }
    process.exit(1);
  }

  if (isJson) {
    console.log(JSON.stringify(auditResult, null, 2));
    handleExitCode(auditResult, failOn);
    return;
  }

  // Print Executive Summary & Formatted Table
  console.log(renderExecutiveSummary(auditResult));
  console.log(renderFindingsTable(auditResult.findings || []));

  // Run interactive finding triage loop if in TTY
  const isInteractive = options.interactive !== false && Boolean(process.stdin.isTTY);
  if (isInteractive && auditResult.findings && auditResult.findings.length > 0) {
    await runInteractiveFindingLoop(auditResult, { targetUrl, apiKey });
  }

  handleExitCode(auditResult, failOn);
}

function handleExitCode(auditResult, failOn) {
  if (!failOn) return;
  const level = failOn.toLowerCase();
  if (level === 'none' || level === 'off') return;
  const targetThreshold = SEVERITY_LEVELS[level];
  if (!targetThreshold) return;

  const hasThresholdBreach = (auditResult.findings || []).some((f) => {
    if (f.status === 'FIX_VERIFIED') return false;
    const sev = SEVERITY_LEVELS[(f.severity || '').toLowerCase()] || 0;
    return sev >= targetThreshold;
  });

  if (hasThresholdBreach) {
    process.exit(1);
  }
}

async function runInteractiveFindingLoop(auditResult, context) {
  let activeFindings = [...(auditResult.findings || [])];
  let running = true;

  while (running) {
    const choices = activeFindings.map((f, idx) => {
      const statusIcon = f.status === 'FIX_VERIFIED' ? chalk.green('✔') : chalk.red('✖');
      const sevBadge = `[${f.severity.toUpperCase()}]`;
      const sevColored = f.severity === 'CRITICAL' ? chalk.bgRed.black(sevBadge) :
                         f.severity === 'HIGH' ? chalk.bgYellow.black(sevBadge) :
                         chalk.bgCyan.black(sevBadge);
      return {
        name: `${statusIcon} ${idx + 1}. ${sevColored} ${f.title} (${chalk.hex('#818cf8')(f.method + ' ' + f.path)})`,
        value: idx,
      };
    });

    choices.push(new inquirer.Separator());
    choices.push({ name: chalk.cyan('⚡ Verify All Patches against Sandbox Target'), value: 'VERIFY_ALL' });
    choices.push({ name: chalk.hex('#43f283')('💬 Discuss Findings with Security Agent'), value: 'CHAT_AGENT' });
    choices.push({ name: chalk.yellow('💾 Export Findings to JSON file'), value: 'EXPORT' });
    choices.push({ name: chalk.dim('🚪 Exit Agent'), value: 'EXIT' });

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: chalk.bold.white('Select a vulnerability to triage & remediate:'),
        pageSize: 12,
        choices,
      },
    ]);

    if (selected === 'EXIT') {
      running = false;
      console.log(chalk.dim('\nSession closed. Stay secure!\n'));
      break;
    }

    if (selected === 'CHAT_AGENT') {
      await runAgentChatSession({
        agent: 'owasp_auditor',
        apiKey: context.apiKey,
        target: context.targetUrl,
      });
      continue;
    }

    if (selected === 'EXPORT') {
      const exportPath = path.join(process.cwd(), `sentinel-report-${Date.now()}.json`);
      fs.writeFileSync(exportPath, JSON.stringify({ ...auditResult, findings: activeFindings }, null, 2), 'utf8');
      console.log(chalk.green(`✔ Exported comprehensive report to ${chalk.bold(exportPath)}\n`));
      continue;
    }

    if (selected === 'VERIFY_ALL') {
      await handleBatchVerification(activeFindings, context.targetUrl);
      continue;
    }

    if (typeof selected === 'number') {
      const finding = activeFindings[selected];
      await handleFindingDrillDown(finding, context);
    }
  }
}

async function handleFindingDrillDown(finding, context) {
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
          finding.businessImpact || finding.impact || 'High potential data compromise or unauthorized access.',
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
        const curlCode = finding.curlPoc || '# No PoC available for this check';
        console.log('\n' + renderCurlBox(curlCode));
        break;
      }

      case 'DIFF': {
        const diffCode = finding.patchDiff || finding.remediation?.diff || '# No unified diff generated';
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
        const spinner = ora(`Applying patch ${chalk.yellow(finding.patchId)} and testing target...`).start();
        try {
          const res = await toggleSandboxPatch(context.targetUrl, finding.patchId, true);
          if (res.ok) {
            spinner.succeed(chalk.green.bold(`✔ VERIFICATION PASSED: Patch ${finding.patchId} applied! Vulnerability mitigated.`));
            finding.status = 'FIX_VERIFIED';
          } else {
            spinner.fail(chalk.red(`Patch application failed: ${res.error || 'unknown'}`));
          }
        } catch (err) {
          spinner.fail(chalk.red(`Verification error: ${err.message}`));
        }
        break;
      }

      case 'REVERT_AND_VERIFY': {
        const spinner = ora(`Reverting patch ${chalk.yellow(finding.patchId)}...`).start();
        try {
          const res = await toggleSandboxPatch(context.targetUrl, finding.patchId, false);
          if (res.ok) {
            spinner.info(chalk.yellow(`↩ Patch reverted. Target restored to vulnerable baseline state.`));
            finding.status = 'VULNERABLE';
          } else {
            spinner.fail(chalk.red(`Revert failed: ${res.error || 'unknown'}`));
          }
        } catch (err) {
          spinner.fail(chalk.red(`Revert error: ${err.message}`));
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

async function toggleSandboxPatch(targetUrl, patchId, apply = true) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const action = apply ? 'apply' : 'revert';
  const url = `${cleanUrl}/__sandbox/patches/${patchId}/${action}`;

  const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function handleBatchVerification(findings, targetUrl) {
  const patchable = findings.filter((f) => f.patchId);
  if (patchable.length === 0) {
    console.log(chalk.yellow('\nNo patchable sandbox findings found.\n'));
    return;
  }

  console.log(chalk.bold(`\n⚡ Applying and verifying ${patchable.length} sandbox patches...\n`));

  for (const f of patchable) {
    const spinner = ora(`Applying ${chalk.yellow(f.patchId)} on ${f.method} ${f.path}...`).start();
    try {
      const res = await toggleSandboxPatch(targetUrl, f.patchId, true);
      if (res.ok) {
        spinner.succeed(chalk.green(`[PASS] ${f.title} -> FIX_VERIFIED`));
        f.status = 'FIX_VERIFIED';
      } else {
        spinner.fail(chalk.red(`[FAIL] ${f.title}`));
      }
    } catch (err) {
      spinner.fail(chalk.red(`[ERR] ${f.title}: ${err.message}`));
    }
  }

  console.log(chalk.green.bold('\n✔ Batch patch verification complete.\n'));
}

/**
 * Interactive Wizard prompt when run without subcommands in TTY.
 */
async function runInteractiveWizard() {
  printBanner();
  const fileConfig = loadConfigFile();

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: chalk.bold.white('What would you like Sentinel to do?'),
      choices: [
        {
          name: `${chalk.hex('#43f283')('🛡️  Run Automated Security Audit')} - Probe API endpoints with OWASP Top 10 rules`,
          value: 'SCAN',
        },
        {
          name: `${chalk.hex('#38bdf8')('💬 Chat with Security Agent')} - Interactive coding, architecture & integration copilot`,
          value: 'CHAT',
        },
        {
          name: `${chalk.hex('#fbbf24')('🐙 Clone & Audit GitHub Repository')} - Clone a remote repo locally and inspect specs/routes`,
          value: 'CLONE',
        },
        {
          name: `${chalk.hex('#818cf8')('⚡ Verify Sandbox Patch')} - Test patch toggling against live sandbox`,
          value: 'VERIFY',
        },
        {
          name: `${chalk.hex('#f43f5e')('🛠️  Generate AI Remediation Diff')} - Create git diff patch for vulnerability`,
          value: 'REMEDIATE',
        },
        {
          name: chalk.dim('🚪 Exit'),
          value: 'EXIT',
        },
      ],
    },
  ]);

  if (mode === 'EXIT') {
    console.log(chalk.dim('\nGoodbye!\n'));
    return;
  }

  if (mode === 'CHAT') {
    const { agentChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agentChoice',
        message: 'Select an AI Security Agent to pair program with:',
        choices: listAgentPersonas().map((p) => ({
          name: `[${p.badge}] ${p.name} - ${chalk.dim(p.shortDesc)}`,
          value: p.id,
        })),
      },
    ]);

    await runAgentChatSession({
      agent: agentChoice,
      apiKey: fileConfig.geminiApiKey || process.env.GEMINI_API_KEY,
    });
    return;
  }

  if (mode === 'CLONE') {
    const { repoUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'repoUrl',
        message: 'Enter GitHub Repository URL (e.g. https://github.com/org/repo or owner/repo):',
      },
    ]);

    if (!repoUrl) return;

    const spinner = ora(`Cloning repository ${repoUrl}...`).start();
    try {
      const info = cloneOrInspectRepo(repoUrl);
      spinner.succeed(`Cloned and inspected repository: ${info.repoName}`);
      console.log(renderRepoSummary(info));

      const { nextAction } = await inquirer.prompt([
        {
          type: 'list',
          name: 'nextAction',
          message: 'What next with this cloned repository?',
          choices: [
            { name: '💬 Chat with Security Agent about this codebase', value: 'CHAT' },
            { name: '🛡️  Scan API if running locally', value: 'SCAN' },
            { name: '🚪 Back to main', value: 'BACK' },
          ],
        },
      ]);

      if (nextAction === 'CHAT') {
        await runAgentChatSession({
          repo: info.workspacePath,
          apiKey: fileConfig.geminiApiKey || process.env.GEMINI_API_KEY,
        });
      }
    } catch (err) {
      spinner.fail(`Failed to clone: ${err.message}`);
    }
    return;
  }

  if (mode === 'VERIFY') {
    const { patchId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'patchId',
        message: 'Enter Patch ID to verify (e.g. bola-orders):',
        default: 'bola-orders',
      },
    ]);
    const targetUrl = fileConfig.target || fileConfig.defaultTargetUrl || 'http://localhost:4000';
    const res = await toggleSandboxPatch(targetUrl, patchId, true);
    if (res.ok) {
      console.log(chalk.green.bold(`\n✔ Patch ${chalk.yellow(patchId)} applied on ${targetUrl}\n`));
    } else {
      console.error(chalk.red(`\n✖ Verification failed: ${res.data?.error || res.status}\n`));
    }
    return;
  }

  if (mode === 'REMEDIATE') {
    const { patchId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'patchId',
        message: 'Enter finding or patch ID to remediate:',
        default: 'bola-orders',
      },
    ]);
    const rem = await generateRemediation({
      patchId,
      title: 'BOLA Vulnerability',
      method: 'GET',
      path: '/api/orders/{id}',
      severity: 'CRITICAL',
    }, { apiKey: fileConfig.geminiApiKey || process.env.GEMINI_API_KEY });

    console.log(boxen(renderDiff(rem.diff), {
      padding: 1,
      borderStyle: 'round',
      borderColor: '#43f283',
      backgroundColor: '#0a0b0e',
      title: chalk.bold.hex('#43f283')(` AI Remediation Patch (${patchId}) `),
    }));
    return;
  }

  // mode === 'SCAN'
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'target',
      message: 'Target API Base URL:',
      default: fileConfig.target || fileConfig.defaultTargetUrl || 'http://localhost:4000',
    },
    {
      type: 'input',
      name: 'spec',
      message: 'Path or URL to OpenAPI Specification (YAML/JSON):',
      default: fileConfig.spec || './sandbox-api/openapi.yaml',
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: 'Select OWASP Security Modules to execute:',
      choices: [
        { name: 'BOLA / IDOR Testing (API1:2023)', value: 'bola', checked: true },
        { name: 'Excessive Data Exposure & Sensitive PII (API3:2023)', value: 'excessive_data_exposure', checked: true },
        { name: 'Broken Authentication & Admin RBAC (API2:2023 / API5:2023)', value: 'broken_auth', checked: true },
        { name: 'Rate Limiting & Credential Stuffing (API4:2023)', value: 'rate_limiting', checked: true },
      ],
    },
    {
      type: 'confirm',
      name: 'enrichWithAi',
      message: 'Synthesize context-aware AI remediation diffs with Gemini?',
      default: true,
    },
  ]);

  await executeScan({
    target: answers.target,
    spec: answers.spec,
    modules: answers.modules.join(','),
    enrichWithAi: answers.enrichWithAi,
    interactive: true,
  });
}

/**
 * Creates and registers the Commander program.
 */
export async function createProgram() {
  const program = new Command();

  program
    .name('sentinel')
    .description('Autonomous Terminal Security Agent CLI for dynamic API auditing, cURL PoCs, AI diffs & live sandbox verification.')
    .version('1.0.0');

  // Command: scan
  program
    .command('scan')
    .description('Run automated stateful security audit probes against target API')
    .option('-t, --target <url>', 'Target API base URL (defaults to sentinel.config.json or http://localhost:4000)')
    .option('-s, --spec <pathOrUrl>', 'Path or URL to OpenAPI specification (YAML/JSON)')
    .option('-m, --modules <modules>', 'Comma-separated modules (bola,broken_auth,excessive_data_exposure,rate_limiting)')
    .option('-i, --interactive', 'Run interactive finding triage session in terminal')
    .option('--no-interactive', 'Disable interactive prompts (for CI/CD scripts)')
    .option('-j, --json', 'Output raw JSON report')
    .option('-q, --quiet', 'Suppress branding banner and spinner logs')
    .option('--fail-on <severity>', 'Exit with error code 1 if findings meet or exceed severity (critical, high, medium, low)')
    .option('--api-key <key>', 'Override Google Gemini API Key')
    .action(async (options) => {
      await executeScan(options);
    });

  // Command: chat / agent
  program
    .command('chat')
    .alias('agent')
    .description('Launch interactive conversational AI security agent with persona customization')
    .option('-a, --agent <personaId>', 'Agent persona: owasp_auditor, secure_integrator, remediation_copilot, pentester')
    .option('-r, --repo <urlOrPath>', 'Target GitHub repo URL or local workspace path to inspect')
    .option('-s, --spec <path>', 'Path to OpenAPI spec file')
    .option('-t, --target <url>', 'Target running API base URL')
    .option('--api-key <key>', 'Override Gemini API key')
    .action(async (options) => {
      await runAgentChatSession(options);
    });

  // Command: clone
  program
    .command('clone <repoUrl>')
    .description('Clone a GitHub repository locally and auto-discover OpenAPI specs and routes')
    .option('-d, --dest <dir>', 'Destination directory')
    .option('-j, --json', 'Output raw JSON summary')
    .action((repoUrl, options) => {
      const spinner = ora(`Cloning repository ${chalk.cyan(repoUrl)}...`).start();
      try {
        const info = cloneOrInspectRepo(repoUrl, { targetDir: options.dest });
        spinner.succeed(`Cloned repository to ${chalk.bold(info.workspacePath)}`);
        if (options.json) {
          console.log(JSON.stringify(info, null, 2));
        } else {
          console.log(renderRepoSummary(info));
        }
      } catch (err) {
        spinner.fail(`Failed to clone repository: ${err.message}`);
        process.exit(1);
      }
    });

  // Command: verify
  program
    .command('verify <patchId>')
    .description('Execute live targeted verification probe against Sandbox API with optional patch toggling')
    .option('-t, --target <url>', 'Target Sandbox API base URL')
    .option('--revert', 'Revert patch before testing rather than applying')
    .option('-j, --json', 'Output raw JSON result')
    .action(async (patchId, options) => {
      const fileConfig = loadConfigFile();
      const targetUrl = options.target || fileConfig.target || fileConfig.defaultTargetUrl || 'http://localhost:4000';
      const apply = !options.revert;
      const res = await toggleSandboxPatch(targetUrl, patchId, apply);
      if (options.json) {
        console.log(JSON.stringify({ patchId, isFixed: apply, ...res }, null, 2));
      } else {
        if (res.ok) {
          console.log(chalk.green.bold(`✔ Patch ${chalk.yellow(patchId)} successfully ${apply ? 'applied' : 'reverted'} on ${targetUrl}`));
        } else {
          console.error(chalk.red(`✖ Failed to toggle patch ${patchId}: ${res.data?.error || res.status}`));
        }
      }
    });

  // Command: remediate
  program
    .command('remediate')
    .description('Generate AI-powered code analysis and Unified Git Diff patch for a finding')
    .option('--patch-id <id>', 'Sandbox patch identifier to generate remediation for (e.g. bola-orders)')
    .option('--api-key <key>', 'Override Gemini API key')
    .option('-j, --json', 'Output raw JSON response')
    .action(async (options) => {
      const patchId = options.patchId || 'bola-orders';
      const finding = { patchId, title: 'BOLA vulnerability', method: 'GET', path: '/api/orders/{id}', severity: 'CRITICAL' };
      const rem = await generateRemediation(finding, { apiKey: options.apiKey });
      if (options.json) {
        console.log(JSON.stringify(rem, null, 2));
      } else {
        console.log(boxen(renderDiff(rem.diff), {
          padding: 1,
          borderStyle: 'round',
          borderColor: '#43f283',
          backgroundColor: '#0a0b0e',
          title: chalk.bold.hex('#43f283')(` AI Remediation Diff (${patchId}) `),
        }));
      }
    });

  // If invoked without any subcommand and in TTY -> Launch interactive wizard
  if (process.argv.length <= 2) {
    if (process.stdin.isTTY) {
      await runInteractiveWizard();
      return null;
    } else {
      printBanner();
      program.outputHelp();
      process.exit(0);
    }
  }

  return program;
}
