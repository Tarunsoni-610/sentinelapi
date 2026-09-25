'use strict';

/**
 * Standard HTTP request wrapper for scanner probes.
 */
async function sendRequest(baseUrl, path, { method = 'GET', token = null, headers = {}, body = null, timeout = 7000 } = {}) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}${path.startsWith('/') ? path : '/' + path}`;

  const reqHeaders = {
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  let bodyStr;
  if (body !== null && body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
    bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: bodyStr,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network / Connection Error',
      headers: {},
      data: null,
      rawText: '',
      durationMs: Date.now() - startTime,
      error: err.message,
      url,
      method,
    };
  }

  const durationMs = Date.now() - startTime;
  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch (_e) {
    // raw text
  }

  const resHeaders = {};
  for (const [key, value] of res.headers.entries()) {
    resHeaders[key.toLowerCase()] = value;
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    data,
    rawText,
    durationMs,
    url,
    method,
  };
}

/**
 * Logs in a user in the sandbox API and returns bearer token + user details.
 */
async function login(baseUrl, who = 'alice', password = null) {
  const pwd = password || `${who}123`;
  const email = `${who}@sandbox.local`;

  const res = await sendRequest(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: { email, password: pwd },
  });

  if (res.status === 200 && res.data?.token) {
    return {
      token: res.data.token,
      user: res.data.user,
      email,
    };
  }

  throw new Error(`Authentication failed for ${email} (status ${res.status}): ${res.rawText}`);
}

/**
 * Generates an executable, formatted cURL command representing a PoC request.
 */
function buildCurl(url, { method = 'GET', token = null, headers = {}, body = null } = {}) {
  const parts = ['curl', '-i', '-X', method, `"${url}"`];

  if (token) {
    parts.push(`-H "Authorization: Bearer ${token}"`);
  }

  for (const [k, v] of Object.entries(headers)) {
    parts.push(`-H "${k}: ${v}"`);
  }

  if (body) {
    const jsonStr = typeof body === 'string' ? body : JSON.stringify(body);
    // Escape quotes for bash
    parts.push(`-H "Content-Type: application/json"`);
    parts.push(`--data '${jsonStr}'`);
  }

  return parts.join(' \\\n  ');
}

module.exports = {
  sendRequest,
  login,
  buildCurl,
};
