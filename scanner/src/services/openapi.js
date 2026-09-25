'use strict';
const yaml = require('yaml');

/**
 * Loads and parses an OpenAPI specification from raw text or a target URL.
 */
async function loadSpec(targetUrl, rawSpecString = null) {
  let text = rawSpecString;
  let source = 'provided_spec';

  if (!text) {
    const cleanUrl = targetUrl.replace(/\/+$/, '');
    source = `${cleanUrl}/openapi.yaml`;
    try {
      const res = await fetch(`${cleanUrl}/openapi.yaml`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        text = await res.text();
      } else {
        // Try openapi.json
        const jsonRes = await fetch(`${cleanUrl}/openapi.json`, { signal: AbortSignal.timeout(6000) });
        if (jsonRes.ok) {
          text = await jsonRes.text();
          source = `${cleanUrl}/openapi.json`;
        } else {
          throw new Error(`Server returned HTTP ${res.status} when fetching openapi.yaml`);
        }
      }
    } catch (err) {
      throw new Error(`Failed to retrieve OpenAPI specification from ${source}: ${err.message}`);
    }
  }

  let doc;
  try {
    // Try YAML parser first (handles both YAML and JSON)
    doc = yaml.parse(text);
  } catch (err) {
    try {
      doc = JSON.parse(text);
    } catch (_e2) {
      throw new Error(`Failed to parse OpenAPI specification: ${err.message}`);
    }
  }

  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid OpenAPI spec: content is not an object');
  }

  const version = doc.openapi || doc.swagger || 'Unknown';
  const info = {
    title: doc.info?.title || 'Unknown API',
    version: doc.info?.version || '1.0.0',
    description: doc.info?.description || '',
    specVersion: version,
    source,
  };

  const endpoints = [];
  const paths = doc.paths || {};

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      endpoints.push({
        method: method.toUpperCase(),
        path: pathStr,
        operationId: op.operationId || `${method}_${pathStr.replace(/[^a-zA-Z0-9]/g, '_')}`,
        summary: op.summary || '',
        tags: op.tags || [],
        security: op.security !== undefined ? op.security : doc.security || [],
        parameters: [...(pathItem.parameters || []), ...(op.parameters || [])],
        requestBody: op.requestBody || null,
        responses: op.responses || {},
      });
    }
  }

  return {
    raw: text,
    doc,
    info,
    endpoints,
    components: doc.components || {},
  };
}

module.exports = {
  loadSpec,
};
