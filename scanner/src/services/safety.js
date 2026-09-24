'use strict';
const config = require('../config');

/**
 * Validates if the target URL hostname is in the allowed targets whitelist.
 */
function isTargetAllowed(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    return config.allowedTargets.some((allowed) => {
      if (allowed === hostname) return true;
      if (allowed.startsWith('*') && hostname.endsWith(allowed.slice(1))) return true;
      return false;
    });
  } catch (_e) {
    return false;
  }
}

/**
 * Probes the target API to verify reachability and sandbox confirmation header.
 */
async function verifySandboxTarget(targetUrl) {
  if (!isTargetAllowed(targetUrl)) {
    throw new Error(
      `Target host is not in ALLOWED_TARGETS whitelist (${config.allowedTargets.join(', ')}). For security, scanning unlisted external targets is refused.`
    );
  }

  const cleanUrl = targetUrl.replace(/\/+$/, '');
  let res;
  try {
    res = await fetch(`${cleanUrl}/healthz`, { method: 'GET', signal: AbortSignal.timeout(5000) });
  } catch (err) {
    // Try fallback to root if healthz doesn't exist
    try {
      res = await fetch(cleanUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
    } catch (_e2) {
      throw new Error(`Target is unreachable at ${cleanUrl}: ${err.message}`);
    }
  }

  const isSandboxHeader = res.headers.get('x-sentinelapi-sandbox') === 'true';
  const targetInfo = {
    targetUrl: cleanUrl,
    reachable: true,
    statusCode: res.status,
    isSandboxHeader,
  };

  return targetInfo;
}

module.exports = {
  isTargetAllowed,
  verifySandboxTarget,
};
