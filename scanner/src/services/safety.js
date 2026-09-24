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
  const candidateUrls = [cleanUrl];
  if (cleanUrl.includes('localhost')) {
    candidateUrls.push(cleanUrl.replace('localhost', '127.0.0.1'));
  } else if (cleanUrl.includes('127.0.0.1')) {
    candidateUrls.push(cleanUrl.replace('127.0.0.1', 'localhost'));
  }

  let res = null;
  let lastErr = null;

  for (const u of candidateUrls) {
    try {
      res = await fetch(`${u}/healthz`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res) break;
    } catch (err) {
      lastErr = err;
      try {
        res = await fetch(u, { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (res) break;
      } catch (err2) {
        lastErr = err2;
      }
    }
  }

  if (!res) {
    throw new Error(`Target is unreachable at ${cleanUrl}: ${lastErr?.message || 'fetch failed'}`);
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
