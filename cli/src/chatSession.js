import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { getAgentPersona, listAgentPersonas } from './agentPersonas.js';
import { chatWithAgent } from './llmClient.js';
import { cloneOrInspectRepo, readWorkspaceFile } from './repoManager.js';
import { renderAgentHeader, renderRepoSummary, renderDiff } from './formatter.js';
import { parseOpenApiSpec } from './specParser.js';
import { runAuditOrchestration } from './orchestrator.js';
import { loadConfig, updateConfigKey } from './configManager.js';
import { createSessionRecorder } from './sessionRecorder.js';

export async function runAgentChatSession(initialOptions = {}) {
  let activeAgentId = initialOptions.agent || 'owasp_auditor';
  let activeAgent = getAgentPersona(activeAgentId);

  let workspaceContext = {
    workspacePath: initialOptions.workspace || process.cwd(),
    framework: null,
    specSummary: null,
    activeFilePath: null,
    activeFileContent: null,
    activeFindings: [],
  };

  const chatHistory = [];
  const apiKey = initialOptions.apiKey || process.env.GEMINI_API_KEY;

  // Initialize workspace if specified
  if (initialOptions.repo) {
    const spinner = ora(`Cloning / inspecting workspace from ${chalk.cyan(initialOptions.repo)}...`).start();
    try {
      const repoInfo = cloneOrInspectRepo(initialOptions.repo);
      workspaceContext.workspacePath = repoInfo.workspacePath;
      workspaceContext.framework = repoInfo.framework;
      spinner.succeed(`Workspace ready at ${chalk.bold(repoInfo.workspacePath)}`);
      console.log(renderRepoSummary(repoInfo));

      if (repoInfo.specFiles && repoInfo.specFiles.length > 0) {
        try {
          const parsedSpec = await parseOpenApiSpec(repoInfo.specFiles[0].path);
          workspaceContext.specSummary = `Spec Title: ${parsedSpec.title}\nEndpoints: ${parsedSpec.endpoints.length} routes discovered.`;
        } catch (_e) {
          // ignore spec parse error
        }
      }
    } catch (err) {
      spinner.fail(`Failed to initialize workspace: ${err.message}`);
    }
  }

  // Initialize dynamic session recorder text file
  const recorder = createSessionRecorder({
    agent: activeAgent,
    workspaceContext,
    sessionType: 'interactive_chat',
  });

  console.log(renderAgentHeader(activeAgent, workspaceContext));
  console.log(chalk.cyan(`📄 Live agent session log dynamically recording to: ${chalk.bold(recorder.filePath)}`));
  console.log(chalk.dim('Type your question or code inquiry below. Special commands: /agent, /repo, /file, /spec, /config, /scan, /help, /exit\n'));

  let inChat = true;

  while (inChat) {
    const { userInput } = await inquirer.prompt([
      {
        type: 'input',
        name: 'userInput',
        message: chalk.hex(activeAgent.badgeColor || '#43f283').bold(`[${activeAgent.badge}] >`),
      },
    ]);

    const trimmed = (userInput || '').trim();
    if (!trimmed) continue;

    // Handle slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      recorder.logEvent(`command_${command}`, { arg });

      switch (command) {
        case 'exit':
        case 'quit':
        case 'q': {
          inChat = false;
          const logPath = recorder.finalize();
          console.log(chalk.green(`\n✔ Session transcript finalized: ${chalk.bold(logPath)}\n`));
          break;
        }

        case 'help':
          printChatHelp();
          break;

        case 'agent':
          if (arg) {
            activeAgent = getAgentPersona(arg);
            activeAgentId = activeAgent.id;
            recorder.agent = activeAgent;
            recorder.logEvent('switch_agent', { name: activeAgent.name, id: activeAgent.id });
            console.log(`\nSwitched active agent to: ${chalk.bold.hex(activeAgent.badgeColor)(activeAgent.name)}\n`);
          } else {
            const { chosen } = await inquirer.prompt([
              {
                type: 'list',
                name: 'chosen',
                message: 'Select an AI Security Agent Persona:',
                choices: listAgentPersonas().map((p) => ({
                  name: `[${p.badge}] ${p.name} - ${chalk.dim(p.shortDesc)}`,
                  value: p.id,
                })),
              },
            ]);
            activeAgent = getAgentPersona(chosen);
            activeAgentId = activeAgent.id;
            recorder.agent = activeAgent;
            recorder.logEvent('switch_agent', { name: activeAgent.name, id: activeAgent.id });
            console.log(`\nSwitched active agent to: ${chalk.bold.hex(activeAgent.badgeColor)(activeAgent.name)}\n`);
          }
          break;

        case 'repo':
        case 'clone': {
          let repoTarget = arg;
          if (!repoTarget) {
            const { target } = await inquirer.prompt([
              {
                type: 'input',
                name: 'target',
                message: 'Enter GitHub Repository URL (or local folder path):',
              },
            ]);
            repoTarget = target;
          }
          if (repoTarget) {
            const spinner = ora(`Inspecting / cloning ${repoTarget}...`).start();
            try {
              const repoInfo = cloneOrInspectRepo(repoTarget);
              workspaceContext.workspacePath = repoInfo.workspacePath;
              workspaceContext.framework = repoInfo.framework;
              recorder.workspaceContext = workspaceContext;
              recorder.logEvent('attach_workspace', repoInfo);
              spinner.succeed(`Workspace loaded: ${repoInfo.repoName}`);
              console.log(renderRepoSummary(repoInfo));
            } catch (err) {
              spinner.fail(`Repo error: ${err.message}`);
            }
          }
          break;
        }

        case 'file':
        case 'read': {
          let filePath = arg;
          if (!filePath) {
            const { targetFile } = await inquirer.prompt([
              {
                type: 'input',
                name: 'targetFile',
                message: 'Enter relative file path inside workspace to inspect:',
              },
            ]);
            filePath = targetFile;
          }
          if (filePath) {
            try {
              const content = readWorkspaceFile(workspaceContext.workspacePath, filePath);
              workspaceContext.activeFilePath = filePath;
              workspaceContext.activeFileContent = content;
              recorder.logEvent('read_file', { filePath, linesCount: content.split('\n').length });
              console.log(chalk.green(`\n✔ Loaded file into agent context: ${chalk.bold(filePath)}\n`));
            } catch (err) {
              console.error(chalk.red(`\n✖ Could not read file: ${err.message}\n`));
            }
          }
          break;
        }

        case 'spec': {
          let specPath = arg || './sandbox-api/openapi.yaml';
          const spinner = ora(`Parsing OpenAPI specification from ${specPath}...`).start();
          try {
            const parsed = await parseOpenApiSpec(specPath);
            workspaceContext.specSummary = `Spec Title: ${parsed.title}\nEndpoints: ${parsed.endpoints.length} routes.`;
            recorder.logEvent('load_spec', { title: parsed.title, endpoints: parsed.endpoints.length });
            spinner.succeed(`OpenAPI spec loaded: ${parsed.endpoints.length} endpoints.`);
          } catch (err) {
            spinner.fail(`Spec parse error: ${err.message}`);
          }
          break;
        }

        case 'scan': {
          const spinner = ora('Executing live OWASP audit probes...').start();
          try {
            const result = await runAuditOrchestration({
              targetUrl: initialOptions.target || 'http://localhost:4000',
              specPathOrUrl: initialOptions.spec || './sandbox-api/openapi.yaml',
              apiKey,
            });
            workspaceContext.activeFindings = result.findings || [];
            recorder.logAudit(result);
            spinner.succeed(`Audit finished: ${result.findings?.length || 0} findings recorded.`);
          } catch (err) {
            spinner.fail(`Scan failed: ${err.message}`);
          }
          break;
        }

        case 'clear':
          chatHistory.length = 0;
          recorder.logEvent('clear_history');
          console.log(chalk.green('\n✔ Chat memory cleared.\n'));
          break;

        case 'config': {
          const cfg = loadConfig();
          console.log('\n' + boxen(JSON.stringify(cfg, null, 2), {
            padding: 1,
            margin: { top: 0, bottom: 1 },
            borderStyle: 'round',
            borderColor: '#818cf8',
            title: chalk.bold.hex('#818cf8')(' CURRENT SENTINEL CONFIG '),
          }));
          break;
        }

        case 'set': {
          const [key, ...valParts] = arg.split(' ');
          const val = valParts.join(' ').trim();
          if (!key || !val) {
            console.log(chalk.yellow('Usage: /set <key> <value> (e.g. /set target http://localhost:8080)'));
          } else {
            const res = updateConfigKey(key, val);
            recorder.logEvent('config_update', { key: res.key, value: res.value });
            console.log(chalk.green(`\n✔ Updated ${chalk.bold(res.key)} = ${chalk.cyan(JSON.stringify(res.value))} in sentinel.config.json\n`));
          }
          break;
        }

        case 'export': {
          const exportPath = path.join(process.cwd(), `sentinel-agent-chat-${Date.now()}.md`);
          const markdown = [
            `# Sentinel Security Agent Session Transcript`,
            `**Agent:** ${activeAgent.name} (${activeAgent.badge})`,
            `**Workspace:** ${workspaceContext.workspacePath}`,
            `**Date:** ${new Date().toISOString()}`,
            '',
            '---',
            '',
            ...chatHistory.map((t) => `### ${t.role === 'user' ? '👤 User' : '🤖 ' + activeAgent.name}\n\n${t.text}\n`),
          ].join('\n');
          fs.writeFileSync(exportPath, markdown, 'utf8');
          console.log(chalk.green(`\n✔ Exported chat session to ${chalk.bold(exportPath)}\n`));
          break;
        }

        default:
          console.log(chalk.yellow(`Unknown command: /${command}. Type /help for available commands.`));
          break;
      }
      continue;
    }

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      inChat = false;
      const logPath = recorder.finalize();
      console.log(chalk.green(`\n✔ Session transcript finalized: ${chalk.bold(logPath)}\n`));
      break;
    }

    // Record user turn
    recorder.logTurn({ role: 'user', message: trimmed });

    // Call LLM / Agent
    const spinner = ora(`Consulting ${activeAgent.name}...`).start();
    try {
      const response = await chatWithAgent({
        message: trimmed,
        agentId: activeAgentId,
        context: workspaceContext,
        history: chatHistory,
        apiKey,
      });

      spinner.stop();

      // Record agent reply
      recorder.logTurn({ role: 'model', message: response.text });

      console.log('\n' + boxen(response.text, {
        padding: 1,
        margin: { top: 0, bottom: 1 },
        borderStyle: 'round',
        borderColor: activeAgent.badgeColor || '#43f283',
        backgroundColor: '#0a0b0e',
        title: chalk.bold.hex(activeAgent.badgeColor || '#43f283')(` ${activeAgent.name} [${response.provider.toUpperCase()}] `),
      }));

      // Append to session memory
      chatHistory.push({ role: 'user', text: trimmed });
      chatHistory.push({ role: 'model', text: response.text });
    } catch (err) {
      spinner.fail(`Agent error: ${err.message}`);
    }
  }
}

function printChatHelp() {
  console.log(boxen([
    chalk.bold.hex('#43f283')('SENTINEL AGENT CHAT COMMANDS:'),
    '',
    `  ${chalk.cyan('/agent [name]')}   - Switch AI Persona (auditor, integrator, copilot, pentester)`,
    `  ${chalk.cyan('/repo <url|path>')}- Clone a remote GitHub repo or set local workspace`,
    `  ${chalk.cyan('/file <relPath>')}  - Read and inject a code file into the agent context`,
    `  ${chalk.cyan('/spec [path]')}     - Parse and load an OpenAPI contract into context`,
    `  ${chalk.cyan('/config')}          - Display active configuration settings`,
    `  ${chalk.cyan('/set <key> <val>')} - Update configuration key live (e.g. /set target http://...)`,
    `  ${chalk.cyan('/scan')}            - Run stateful OWASP probe scan against target API`,
    `  ${chalk.cyan('/clear')}           - Reset conversation memory`,
    `  ${chalk.cyan('/export')}          - Save conversation transcript to Markdown file`,
    `  ${chalk.cyan('/help')}            - Show this command reference`,
    `  ${chalk.cyan('/exit')}            - Exit chat session`,
  ].join('\n'), {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: 'round',
    borderColor: '#818cf8',
  }));
}
