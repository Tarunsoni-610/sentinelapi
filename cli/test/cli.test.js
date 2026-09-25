import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { listAgentPersonas, getAgentPersona } from '../src/agentPersonas.js';
import { chatWithAgent } from '../src/llmClient.js';
import { cloneOrInspectRepo } from '../src/repoManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_BIN = path.resolve(__dirname, '../bin/sentinel.js');

function runCli(args, env = {}) {
  try {
    const stdout = execSync(`node "${CLI_BIN}" ${args}`, {
      encoding: 'utf8',
      env: { ...process.env, ...env },
      timeout: 25000,
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      status: err.status || 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message,
    };
  }
}

describe('Sentinel-Agent CLI ESM Integration Tests', () => {
  before(async () => {
    try {
      await fetch('http://localhost:4000/__sandbox/reset', { method: 'POST' });
    } catch (_e) {}
  });

  after(async () => {
    try {
      await fetch('http://localhost:4000/__sandbox/reset', { method: 'POST' });
    } catch (_e) {}
  });

  test('sentinel --help displays help, scan, chat, clone, verify, remediate commands', () => {
    const res = runCli('--help');
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /Usage: sentinel/);
    assert.match(res.stdout, /scan/);
    assert.match(res.stdout, /chat/);
    assert.match(res.stdout, /clone/);
    assert.match(res.stdout, /verify/);
    assert.match(res.stdout, /remediate/);
  });

  test('sentinel scan --no-interactive --json executes audit and returns findings', () => {
    const res = runCli('scan --no-interactive --json --fail-on none');
    assert.strictEqual(res.status, 0);
    const scan = JSON.parse(res.stdout);

    assert.ok(scan.id);
    assert.strictEqual(scan.status, 'completed');
    assert.ok(Array.isArray(scan.findings));
    assert.ok(scan.findings.length >= 4);

    const bola = scan.findings.find((f) => f.patchId === 'bola-orders');
    assert.ok(bola, 'BOLA finding should be present');
    assert.strictEqual(bola.severity, 'CRITICAL');
    assert.ok(bola.curlPoc, 'cURL PoC should be present');
    assert.ok(bola.remediation?.diff || bola.patchDiff, 'Unified diff should be present');
  });

  test('sentinel scan --fail-on high exits with code 1 on vulnerabilities', () => {
    const res = runCli('scan --no-interactive --json --fail-on high');
    assert.strictEqual(res.status, 1);
    if (res.stdout.trim().startsWith('{')) {
      const scan = JSON.parse(res.stdout);
      assert.ok(Array.isArray(scan.findings));
    }
  });

  test('sentinel remediate --patch-id bola-orders --json returns unified diff', () => {
    const res = runCli('remediate --patch-id bola-orders --json');
    assert.strictEqual(res.status, 0);
    const rem = JSON.parse(res.stdout);
    assert.ok(rem.diff || rem.unifiedDiff);
    assert.match(rem.diff || rem.unifiedDiff, /--- a\/src\/routes\/orders\.js/);
  });

  test('sentinel verify bola-orders --json applies patch on sandbox', () => {
    const res = runCli('verify bola-orders --json');
    assert.strictEqual(res.status, 0);
    const data = JSON.parse(res.stdout);
    assert.strictEqual(data.patchId, 'bola-orders');
    assert.strictEqual(data.isFixed, true);
  });

  test('sentinel clone local workspace discovers specs and routes', () => {
    const res = runCli('clone ./ --json');
    assert.strictEqual(res.status, 0);
    const data = JSON.parse(res.stdout);
    assert.ok(data.workspacePath);
    assert.ok(Array.isArray(data.specFiles));
    assert.ok(Array.isArray(data.routeFiles));
  });

  test('agent personas and chatWithAgent local offline fallback generation', async () => {
    const personas = listAgentPersonas();
    assert.ok(personas.length >= 4);

    const auditor = getAgentPersona('owasp_auditor');
    assert.strictEqual(auditor.id, 'owasp_auditor');

    const integrator = getAgentPersona('secure_integrator');
    assert.strictEqual(integrator.id, 'secure_integrator');

    const chatResponse = await chatWithAgent({
      message: 'How do I prevent BOLA vulnerabilities?',
      agentId: 'owasp_auditor',
    });
    assert.ok(chatResponse.text.includes('BOLA'));
    assert.ok(chatResponse.text.includes('Broken Object Level Authorization'));
  });

  test('sentinel config show and set operates on configuration', () => {
    const showRes = runCli('config show --json');
    assert.strictEqual(showRes.status, 0);
    const cfg = JSON.parse(showRes.stdout);
    assert.ok(cfg.target);
    assert.ok(cfg.spec);

    const setRes = runCli('config set failOn critical');
    assert.strictEqual(setRes.status, 0);
    assert.match(setRes.stdout, /Configuration updated/);

    // Reset back to high
    runCli('config set failOn high');
  });
});
