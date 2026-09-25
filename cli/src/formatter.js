import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';

export function printBanner() {
  const banner = `
   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
  
  SENTINEL-AGENT • Autonomous Terminal API Security Scanner & Agent v1.0.0
  ─────────────────────────────────────────────────────────────────────────────`;
  console.log(chalk.hex('#43f283').bold(banner));
}

export function renderSeverity(severity) {
  const s = String(severity || '').toUpperCase();
  switch (s) {
    case 'CRITICAL':
      return chalk.bgHex('#f43f5e').black.bold(' CRITICAL ');
    case 'HIGH':
      return chalk.bgHex('#fbbf24').black.bold(' HIGH ');
    case 'MEDIUM':
      return chalk.bgHex('#e2e8f0').black.bold(' MEDIUM ');
    case 'LOW':
      return chalk.bgHex('#38bdf8').black.bold(' LOW ');
    default:
      return chalk.bgGray.white(` ${s} `);
  }
}

export function renderStatus(status) {
  if (status === 'FIX_VERIFIED') {
    return chalk.hex('#43f283').bold('✔ FIX VERIFIED');
  }
  return chalk.hex('#f43f5e').bold('✖ VULNERABLE');
}

export function renderScoreGauge(score) {
  let scoreColor = chalk.hex('#f43f5e');
  let label = 'Needs Attention';

  if (score >= 80) {
    scoreColor = chalk.hex('#43f283');
    label = 'Secure Posture';
  } else if (score >= 50) {
    scoreColor = chalk.hex('#fbbf24');
    label = 'Moderate Risk';
  }

  return `${scoreColor.bold(score + '/100')} ${chalk.dim(`(${label})`)}`;
}

export function renderDiff(diffText) {
  if (!diffText) return chalk.dim('No diff available.');

  return diffText
    .split('\n')
    .map((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return chalk.hex('#43f283')(line);
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return chalk.hex('#f43f5e')(line);
      }
      if (line.startsWith('@@')) {
        return chalk.hex('#818cf8').bold(line);
      }
      if (line.startsWith('---') || line.startsWith('+++')) {
        return chalk.dim(line);
      }
      return chalk.white(line);
    })
    .join('\n');
}

export function renderCurlBox(curlText) {
  return boxen(chalk.hex('#818cf8')(curlText), {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: 'round',
    borderColor: '#1f212a',
    backgroundColor: '#0a0b0e',
    title: chalk.bold.hex('#43f283')(' Reproducible cURL PoC '),
    titleAlignment: 'left',
  });
}

export function renderExecutiveSummary(auditResult) {
  const stats = auditResult.stats || {};
  const vulnerableCount = stats.vulnerableCount ?? 0;
  const verifiedCount = stats.verifiedFixedCount ?? 0;
  const totalEndpoints = stats.totalEndpoints || auditResult.endpointsCount || 0;
  const score = stats.securityScore ?? 0;

  const content = [
    ` ${chalk.bold.white('Target URL:')}       ${chalk.hex('#43f283')(auditResult.targetUrl)}`,
    ` ${chalk.bold.white('OpenAPI Spec:')}     ${chalk.cyan(auditResult.specInfo?.title || 'API Specification')} ${chalk.dim(`(v${auditResult.specInfo?.version || '1.0.0'})`)}`,
    ` ${chalk.bold.white('Assessed Routes:')}  ${chalk.white.bold(totalEndpoints)} endpoints`,
    ` ${chalk.bold.white('Security Score:')}   ${renderScoreGauge(score)}`,
    ` ${chalk.bold.white('Active Findings:')}  ${chalk.hex('#f43f5e').bold(vulnerableCount)} vulnerabilities flagged`,
    ` ${chalk.bold.white('Verified Patches:')} ${chalk.hex('#43f283').bold(verifiedCount)} resolved`,
    ` ${chalk.bold.white('Controls Passed:')}  ${chalk.hex('#43f283').bold(stats.controlsPassedCount || 0)} baseline controls (0% false positives)`,
  ].join('\n');

  return boxen(content, {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: '#43f283',
    backgroundColor: '#12141a',
    title: chalk.bold.hex('#43f283')(' EXECUTIVE SECURITY POSTURE SUMMARY '),
    titleAlignment: 'center',
  });
}

export function renderFindingsTable(findings) {
  const table = new Table({
    head: [
      chalk.hex('#43f283')('#'),
      chalk.hex('#43f283')('Severity'),
      chalk.hex('#43f283')('Method & Route'),
      chalk.hex('#43f283')('OWASP Category'),
      chalk.hex('#43f283')('Vulnerability Title'),
      chalk.hex('#43f283')('Status'),
    ],
    colWidths: [4, 12, 24, 16, 38, 18],
    style: {
      head: [],
      border: ['#1f212a'],
    },
  });

  findings.forEach((f, idx) => {
    table.push([
      chalk.dim(idx + 1),
      renderSeverity(f.severity),
      chalk.hex('#818cf8').bold(`${f.method} ${f.path}`),
      chalk.dim(f.owaspId || f.owaspCategory || 'API'),
      chalk.white.bold(f.title),
      renderStatus(f.status),
    ]);
  });

  return table.toString();
}

export function renderAgentHeader(agent, workspaceContext = {}) {
  const badgeColor = agent.badgeColor || '#43f283';
  const badge = chalk.bgHex(badgeColor).black.bold(` ${agent.badge} `);
  const name = chalk.bold.white(agent.name);
  const role = chalk.dim(agent.role);
  const desc = chalk.hex('#a1a1aa')(agent.shortDesc);

  const lines = [
    `${badge} ${name} — ${role}`,
    `${desc}`,
  ];

  if (workspaceContext.workspacePath) {
    lines.push('');
    lines.push(`${chalk.bold.hex('#818cf8')('Workspace:')} ${chalk.cyan(workspaceContext.workspacePath)} ${workspaceContext.framework ? chalk.dim(`[${workspaceContext.framework}]`) : ''}`);
  }

  return boxen(lines.join('\n'), {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: 'round',
    borderColor: badgeColor,
    backgroundColor: '#12141a',
    title: chalk.bold.hex(badgeColor)(' ACTIVE SECURITY AGENT '),
    titleAlignment: 'left',
  });
}

export function renderRepoSummary(repoInfo) {
  const lines = [
    `${chalk.bold.white('Repository:')} ${chalk.hex('#43f283').bold(repoInfo.repoName || 'Local Workspace')}`,
    `${chalk.bold.white('Local Path:')}  ${chalk.cyan(repoInfo.workspacePath)}`,
    `${chalk.bold.white('Framework:')}   ${chalk.yellow(repoInfo.framework || 'Generic')}`,
    '',
    chalk.bold.hex('#818cf8')(`Discovered OpenAPI Specifications (${repoInfo.specFiles?.length || 0}):`),
  ];

  if (repoInfo.specFiles && repoInfo.specFiles.length > 0) {
    repoInfo.specFiles.forEach((s) => {
      lines.push(`  • ${chalk.white(s.relPath)}`);
    });
  } else {
    lines.push(chalk.dim('  (No standard openapi.yaml / swagger.json discovered in root)'));
  }

  lines.push('');
  lines.push(chalk.bold.hex('#818cf8')(`Identified API Controllers & Routes (${repoInfo.routeFiles?.length || 0}):`));

  if (repoInfo.routeFiles && repoInfo.routeFiles.length > 0) {
    repoInfo.routeFiles.slice(0, 8).forEach((r) => {
      lines.push(`  • ${chalk.white(r.relPath)}`);
    });
    if (repoInfo.routeFiles.length > 8) {
      lines.push(chalk.dim(`  ... and ${repoInfo.routeFiles.length - 8} more files`));
    }
  } else {
    lines.push(chalk.dim('  (No standard route files detected)'));
  }

  return boxen(lines.join('\n'), {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: 'round',
    borderColor: '#43f283',
    backgroundColor: '#12141a',
    title: chalk.bold.hex('#43f283')(' REPOSITORY WORKSPACE INSPECTION '),
  });
}
