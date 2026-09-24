'use strict';
const { sendRequest } = require('./probes/client');
const { probeBola } = require('./probes/bola');
const { probeExcessiveExposure } = require('./probes/excessive_exposure');
const { probeMissingAuth } = require('./probes/missing_auth');
const { probeRateLimiting } = require('./probes/rate_limiting');

/**
 * Re-tests a specific vulnerability and optionally applies/reverts the sandbox patch.
 */
async function verifyPatch(targetUrl, patchId, { applyPatch = null, openApiDoc = null } = {}) {
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const logs = [];

  // 1. If applyPatch is explicitly requested, toggle the patch on sandbox control plane
  if (typeof applyPatch === 'boolean') {
    const action = applyPatch ? 'apply' : 'revert';
    logs.push(`[Verifier] Setting sandbox patch "${patchId}" to ${action}...`);

    const patchRes = await sendRequest(cleanUrl, `/__sandbox/patches/${patchId}/${action}`, {
      method: 'POST',
    });

    if (patchRes.status === 200) {
      logs.push(`[Verifier] Sandbox patch "${patchId}" successfully ${applyPatch ? 'applied' : 'reverted'}.`);
    } else {
      logs.push(`[Verifier] Sandbox patch toggle returned HTTP ${patchRes.status}: ${patchRes.rawText}`);
    }
  }

  // 2. Run the targeted probe corresponding to this patch ID
  logs.push(`[Verifier] Running targeted verification probe for "${patchId}"...`);
  let probeResult;

  switch (patchId) {
    case 'bola-orders':
      probeResult = await probeBola(cleanUrl);
      break;
    case 'excessive-exposure-me':
      probeResult = await probeExcessiveExposure(cleanUrl, openApiDoc);
      break;
    case 'missing-auth-admin-stats':
      probeResult = await probeMissingAuth(cleanUrl, openApiDoc);
      break;
    case 'login-rate-limit':
      probeResult = await probeRateLimiting(cleanUrl, openApiDoc);
      break;
    default:
      throw new Error(`Unknown patchId: "${patchId}". Supported: bola-orders, excessive-exposure-me, missing-auth-admin-stats, login-rate-limit`);
  }

  const combinedLogs = [...logs, ...probeResult.logs];
  const targetFinding = probeResult.findings.find((f) => f.patchId === patchId) || probeResult.findings[0];

  const isFixed = targetFinding?.status === 'FIX_VERIFIED';

  return {
    patchId,
    findingId: targetFinding?.id || `finding_${patchId}`,
    isFixed,
    status: isFixed ? 'FIX_VERIFIED' : 'VULNERABLE',
    finding: targetFinding,
    logs: combinedLogs,
    verifiedAt: new Date().toISOString(),
  };
}

module.exports = {
  verifyPatch,
};
