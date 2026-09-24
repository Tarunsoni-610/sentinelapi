'use strict';
const crypto = require('crypto');
const { verifySandboxTarget } = require('./safety');
const { loadSpec } = require('./openapi');
const { probeBola } = require('./probes/bola');
const { probeExcessiveExposure } = require('./probes/excessive_exposure');
const { probeMissingAuth } = require('./probes/missing_auth');
const { probeRateLimiting } = require('./probes/rate_limiting');
const { generateRemediation } = require('./llm');

// In-memory cache of recent scans
const scanStore = new Map();

/**
 * Calculates security score (0-100) based on findings severity.
 */
function calculateSecurityScore(findings) {
  let score = 100;
  for (const f of findings) {
    if (f.status === 'VULNERABLE') {
      if (f.severity === 'CRITICAL') score -= 30;
      else if (f.severity === 'HIGH') score -= 20;
      else if (f.severity === 'MEDIUM') score -= 10;
      else if (f.severity === 'LOW') score -= 5;
    }
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Runs a complete stateful security scan against the target.
 */
async function runScan({
  targetUrl,
  rawSpec = null,
  modules = ['bola', 'excessive_exposure', 'missing_auth', 'rate_limiting'],
  llmApiKey = null,
  llmProvider = null,
  enrichWithAi = true,
}) {
  const scanId = `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const startedAt = new Date().toISOString();
  const logs = [];

  logs.push(`[Sentinel Scanner] Initializing scan ID: ${scanId}`);
  logs.push(`[Sentinel Scanner] Validating target safety & connectivity: ${targetUrl}`);

  // 1. Safety verification
  const targetInfo = await verifySandboxTarget(targetUrl);
  logs.push(`[Sentinel Scanner] Target reachable. Sandbox header detected: ${targetInfo.isSandboxHeader}`);

  // 2. Load OpenAPI specification
  logs.push(`[Sentinel Scanner] Ingesting OpenAPI contract...`);
  const spec = await loadSpec(targetUrl, rawSpec);
  logs.push(`[Sentinel Scanner] Loaded spec "${spec.info.title}" v${spec.info.version} with ${spec.endpoints.length} endpoints.`);

  const findings = [];
  const controls = [];

  // 3. Run selected probe modules
  const shouldRun = (mod) => !modules || modules.length === 0 || modules.includes(mod);

  if (shouldRun('bola')) {
    logs.push(`[Sentinel Scanner] Starting Module: BOLA / IDOR Testing...`);
    const bolaRes = await probeBola(targetUrl, spec.endpoints);
    findings.push(...bolaRes.findings);
    controls.push(...bolaRes.controls);
    logs.push(...bolaRes.logs);
  }

  if (shouldRun('excessive_exposure')) {
    logs.push(`[Sentinel Scanner] Starting Module: Excessive Data Exposure & PII Leakage...`);
    const dataRes = await probeExcessiveExposure(targetUrl, spec.doc);
    findings.push(...dataRes.findings);
    controls.push(...dataRes.controls);
    logs.push(...dataRes.logs);
  }

  if (shouldRun('missing_auth')) {
    logs.push(`[Sentinel Scanner] Starting Module: Broken Authentication & Function Level Authorization...`);
    const authRes = await probeMissingAuth(targetUrl, spec.doc);
    findings.push(...authRes.findings);
    controls.push(...authRes.controls);
    logs.push(...authRes.logs);
  }

  if (shouldRun('rate_limiting')) {
    logs.push(`[Sentinel Scanner] Starting Module: Unrestricted Resource Consumption / Rate Limiting...`);
    const rateRes = await probeRateLimiting(targetUrl, spec.doc);
    findings.push(...rateRes.findings);
    controls.push(...rateRes.controls);
    logs.push(...rateRes.logs);
  }

  // 4. Enrich findings with remediation diffs (LLM or template)
  if (enrichWithAi) {
    logs.push(`[Sentinel Scanner] Generating remediation diffs and security analysis...`);
    for (const finding of findings) {
      if (finding.status === 'VULNERABLE') {
        try {
          const remediation = await generateRemediation(finding, {
            apiKey: llmApiKey,
            provider: llmProvider,
          });
          finding.remediation = remediation;
        } catch (err) {
          logs.push(`[Sentinel Scanner] Remediation generation error for ${finding.id}: ${err.message}`);
        }
      }
    }
  }

  // 5. Compile statistics
  const vulnerableCount = findings.filter((f) => f.status === 'VULNERABLE').length;
  const verifiedFixedCount = findings.filter((f) => f.status === 'FIX_VERIFIED').length;
  const securityScore = calculateSecurityScore(findings);

  const severityCounts = {
    critical: findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'CRITICAL').length,
    high: findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'HIGH').length,
    medium: findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'MEDIUM').length,
    low: findings.filter((f) => f.status === 'VULNERABLE' && f.severity === 'LOW').length,
  };

  const completedAt = new Date().toISOString();
  logs.push(`[Sentinel Scanner] Scan completed in ${Date.now() - new Date(startedAt).getTime()}ms. Found ${vulnerableCount} vulnerabilities, Score: ${securityScore}/100.`);

  const scanResult = {
    id: scanId,
    targetUrl,
    startedAt,
    completedAt,
    specInfo: spec.info,
    endpointsCount: spec.endpoints.length,
    endpoints: spec.endpoints,
    stats: {
      totalEndpoints: spec.endpoints.length,
      totalProbes: findings.length + controls.length,
      vulnerableCount,
      verifiedFixedCount,
      controlsPassedCount: controls.length,
      securityScore,
      severityCounts,
    },
    findings,
    controls,
    logs,
  };

  scanStore.set(scanId, scanResult);
  return scanResult;
}

function getScan(scanId) {
  return scanStore.get(scanId) || null;
}

function listScans() {
  return Array.from(scanStore.values()).map((s) => ({
    id: s.id,
    targetUrl: s.targetUrl,
    startedAt: s.startedAt,
    stats: s.stats,
    specInfo: s.specInfo,
  }));
}

module.exports = {
  runScan,
  getScan,
  listScans,
  scanStore,
};
