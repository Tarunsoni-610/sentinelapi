import fs from 'fs';
import path from 'path';

/**
 * SessionRecorder manages real-time dynamic text file logging for any active Sentinel Agent.
 */
export class SessionRecorder {
  constructor(options = {}) {
    const {
      agent = { id: 'sentinel', name: 'Sentinel Security Agent', badge: 'AGENT' },
      workspaceContext = {},
      sessionType = 'agent_session',
      outputDir = path.join(process.cwd(), 'sentinel-reports'),
    } = options;

    this.agent = agent;
    this.workspaceContext = workspaceContext;
    this.sessionType = sessionType;
    this.outputDir = outputDir;
    this.sessionId = `session_${Date.now()}`;
    this.startTime = new Date();

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const dateSlug = this.startTime.toISOString().replace(/[:.]/g, '-');
    const safeAgentId = (agent.id || 'agent').replace(/[^a-zA-Z0-9_-]/g, '_');
    this.filePath = path.join(this.outputDir, `sentinel-${safeAgentId}-${dateSlug}.txt`);

    this.initFile();
  }

  initFile() {
    const header = [
      '================================================================================',
      '                 SENTINEL-AGENT DYNAMIC SESSION AUDIT TRANSCRIPT                 ',
      '================================================================================',
      `Session ID:       ${this.sessionId}`,
      `Session Type:     ${this.sessionType.toUpperCase()}`,
      `Started At:       ${this.startTime.toISOString()}`,
      `Active Agent:     ${this.agent.name} [${this.agent.badge || 'AGENT'}]`,
      `Agent Role:       ${this.agent.role || 'API Security Specialist'}`,
      `Workspace Path:   ${this.workspaceContext.workspacePath || process.cwd()}`,
      `Framework:        ${this.workspaceContext.framework || 'Generic'}`,
      `OpenAPI Spec:     ${this.workspaceContext.specSummary || 'None loaded'}`,
      '--------------------------------------------------------------------------------',
      '',
    ].join('\n');

    fs.writeFileSync(this.filePath, header, 'utf8');
  }

  append(text) {
    try {
      fs.appendFileSync(this.filePath, text + '\n', 'utf8');
    } catch (_err) {
      // ignore logging errors
    }
  }

  logTurn({ role, message }) {
    const timestamp = new Date().toISOString();
    const prefix = role === 'user' ? '👤 USER' : `🤖 AGENT (${this.agent.name})`;
    const separator = '-'.repeat(80);

    const block = [
      `[${timestamp}] ${prefix}`,
      message,
      separator,
      '',
    ].join('\n');

    this.append(block);
  }

  logEvent(eventName, details = {}) {
    const timestamp = new Date().toISOString();
    const block = [
      `[${timestamp}] ⚡ EVENT: ${eventName.toUpperCase()}`,
      typeof details === 'string' ? details : JSON.stringify(details, null, 2),
      '-'.repeat(80),
      '',
    ].join('\n');

    this.append(block);
  }

  logAudit(auditResult) {
    const timestamp = new Date().toISOString();
    const findings = auditResult.findings || [];
    const stats = auditResult.stats || auditResult.metrics || {};

    const lines = [
      `[${timestamp}] 🛡️ SECURITY AUDIT EXECUTION RECORD`,
      `Target API:       ${auditResult.targetUrl}`,
      `Assessed Routes:  ${auditResult.endpointsCount || 0}`,
      `Security Score:   ${stats.securityScore || 0}/100`,
      `Vulnerabilities:  ${findings.length} flagged`,
      `Controls Passed:  ${stats.controlsPassedCount || 0}`,
      '',
      '=== ACTIVE VULNERABILITY FINDINGS ===',
    ];

    findings.forEach((f, idx) => {
      lines.push(`\nFinding #${idx + 1}: [${f.severity}] ${f.title}`);
      lines.push(`Endpoint:       ${f.method} ${f.path}`);
      lines.push(`OWASP Category: ${f.category || f.owaspCategory || f.owaspId}`);
      lines.push(`CWE / CVSS:     ${f.cwe || 'N/A'} (CVSS ${f.cvssScore || 'N/A'})`);
      lines.push(`Description:    ${f.description}`);
      lines.push(`Impact:         ${f.businessImpact || 'N/A'}`);
      if (f.curlPoc) {
        lines.push(`Reproducible cURL PoC:\n${f.curlPoc}`);
      }
      if (f.patchDiff || f.remediation?.diff) {
        lines.push(`Unified Git Diff:\n${f.patchDiff || f.remediation?.diff}`);
      }
    });

    lines.push('\n' + '-'.repeat(80) + '\n');
    this.append(lines.join('\n'));
  }

  finalize() {
    const endTime = new Date();
    const durationSec = ((endTime - this.startTime) / 1000).toFixed(2);
    const footer = [
      '================================================================================',
      `Session Closed:   ${endTime.toISOString()} (Duration: ${durationSec}s)`,
      `Log File:         ${this.filePath}`,
      '================================================================================\n',
    ].join('\n');

    this.append(footer);
    return this.filePath;
  }
}

/**
 * Helper function to create and initialize a session recorder.
 */
export function createSessionRecorder(options = {}) {
  return new SessionRecorder(options);
}
