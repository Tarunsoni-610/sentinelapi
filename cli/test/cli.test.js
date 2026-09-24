'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const path = require('path');

const CLI_BIN = path.resolve(__dirname, '../bin/sentinel.js');

function runCli(args, env = {}) {
  try {
    const stdout = execSync(`node "${CLI_BIN}" ${args}`, {
      encoding: 'utf8',
      env: { ...process.env, ...env },
      timeout: 20000,
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

describe('Sentinel CLI Agent Integration Tests', () => {
  before(() => {
    // Reset sandbox before test run
    runCli('sandbox reset --json');
  });

  after(() => {
    // Clean up sandbox state after test run
    runCli('sandbox reset --json');
  });

  test('sentinel --help displays banner and command listing', () => {
    const res = runCli('--help');
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /Usage: sentinel/);
    assert.match(res.stdout, /scan/);
    assert.match(res.stdout, /verify/);
    assert.match(res.stdout, /remediate/);
    assert.match(res.stdout, /sandbox/);
    assert.match(res.stdout, /config/);
  });

  test('sentinel config list --json returns valid configuration', () => {
    const res = runCli('config list --json');
    assert.strictEqual(res.status, 0);
    const cfg = JSON.parse(res.stdout);
    assert.ok(cfg.scannerUrl);
    assert.ok(cfg.defaultTargetUrl);
    assert.ok(Array.isArray(cfg.defaultModules));
  });

  test('sentinel config set and get works persistently', () => {
    const setRes = runCli('config set testSetting custom_val --json');
    assert.strictEqual(setRes.status, 0);
    const setObj = JSON.parse(setRes.stdout);
    assert.strictEqual(setObj.key, 'testSetting');
    assert.strictEqual(setObj.value, 'custom_val');

    const getRes = runCli('config get testSetting --json');
    assert.strictEqual(getRes.status, 0);
    const getObj = JSON.parse(getRes.stdout);
    assert.strictEqual(getObj.testSetting, 'custom_val');
  });

  test('sentinel sandbox info --json returns active and catalogued patches', () => {
    const res = runCli('sandbox info --json');
    assert.strictEqual(res.status, 0);
    const info = JSON.parse(res.stdout);
    assert.strictEqual(info.sandbox, true);
    assert.ok(info.availablePatches);
    assert.ok(info.availablePatches['bola-orders']);
  });

  test('sentinel scan --json executes stateful audit probes against target', () => {
    const res = runCli('scan --no-interactive --json');
    assert.strictEqual(res.status, 0);
    const scan = JSON.parse(res.stdout);

    assert.ok(scan.id);
    assert.strictEqual(scan.status, 'completed');
    assert.ok(Array.isArray(scan.findings));
    assert.ok(scan.findings.length >= 4);

    // Verify finding structures
    const bolaFinding = scan.findings.find((f) => f.patchId === 'bola-orders');
    assert.ok(bolaFinding, 'BOLA finding should be present');
    assert.strictEqual(bolaFinding.severity, 'CRITICAL');
    assert.strictEqual(bolaFinding.status, 'VULNERABLE');
    assert.ok(bolaFinding.curlPoc, 'cURL PoC should be present');
    assert.ok(bolaFinding.remediation?.diff, 'Unified diff should be present');

    const piiFinding = scan.findings.find((f) => f.patchId === 'excessive-exposure-me');
    assert.ok(piiFinding, 'Excessive Data Exposure finding should be present');
    assert.strictEqual(piiFinding.severity, 'HIGH');
  });

  test('sentinel verify <patchId> verifies targeted fix live on sandbox', () => {
    // 1. Verify when patch is applied -> FIX_VERIFIED (secure)
    const verifyApply = runCli('verify bola-orders --json');
    assert.strictEqual(verifyApply.status, 0);
    const applyData = JSON.parse(verifyApply.stdout);
    assert.strictEqual(applyData.isFixed, true);
    assert.strictEqual(applyData.status, 'FIX_VERIFIED');

    // 2. Verify when patch is reverted -> VULNERABLE
    const verifyRevert = runCli('verify bola-orders --revert --json');
    assert.strictEqual(verifyRevert.status, 0);
    const revertData = JSON.parse(verifyRevert.stdout);
    assert.strictEqual(revertData.isFixed, false);
    assert.strictEqual(revertData.status, 'VULNERABLE');
  });

  test('sentinel remediate --patch-id generates unified diff', () => {
    const res = runCli('remediate --patch-id bola-orders --json');
    assert.strictEqual(res.status, 0);
    const remediation = JSON.parse(res.stdout);
    assert.ok(remediation.explanation);
    assert.ok(remediation.diff || remediation.unifiedDiff);
    assert.match(remediation.diff || remediation.unifiedDiff, /--- a\/src\/routes\/orders\.js/);
  });
});
