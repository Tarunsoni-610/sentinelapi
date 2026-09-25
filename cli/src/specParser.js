import path from 'path';
import fs from 'fs';
import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'yaml';

/**
 * Parses and validates an OpenAPI / Swagger specification from a file path or URL.
 * Uses @apidevtools/swagger-parser for schema validation and dereferencing.
 *
 * @param {string} specPathOrUrl - Local path (YAML/JSON) or HTTP/HTTPS URL
 * @returns {Promise<{ api: object, endpoints: Array<object>, info: object, raw: string }>}
 */
export async function parseSpec(specPathOrUrl) {
  if (!specPathOrUrl) {
    throw new Error('No OpenAPI specification path or URL provided.');
  }

  let resolvedTarget = specPathOrUrl;
  let rawContent = '';

  // Determine if remote URL or local file
  const isUrl = specPathOrUrl.startsWith('http://') || specPathOrUrl.startsWith('https://');

  if (isUrl) {
    try {
      const res = await fetch(specPathOrUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        throw new Error(`Failed to fetch OpenAPI spec from ${specPathOrUrl}: HTTP ${res.status}`);
      }
      rawContent = await res.text();
    } catch (err) {
      throw new Error(`Remote OpenAPI spec fetch error: ${err.message}`);
    }
  } else {
    let fullPath = path.resolve(process.cwd(), specPathOrUrl);
    if (!fs.existsSync(fullPath)) {
      const altPath = path.resolve(process.cwd(), '..', specPathOrUrl);
      if (fs.existsSync(altPath)) {
        fullPath = altPath;
      } else {
        throw new Error(`OpenAPI spec file not found at: ${fullPath} (or ${altPath})`);
      }
    }
    rawContent = fs.readFileSync(fullPath, 'utf8');
    resolvedTarget = fullPath;
  }

  let parsedApi;
  try {
    // Parse using SwaggerParser (supports both YAML and JSON, OpenAPI 3.x and Swagger 2.0)
    parsedApi = await SwaggerParser.validate(resolvedTarget);
  } catch (validateErr) {
    // If strict validation fails due to minor custom extensions, attempt loose parsing
    try {
      parsedApi = await SwaggerParser.parse(resolvedTarget);
    } catch (_parseErr) {
      try {
        parsedApi = yaml.parse(rawContent);
      } catch (yamlErr) {
        throw new Error(`Failed to parse OpenAPI specification: ${validateErr.message} (Fallback error: ${yamlErr.message})`);
      }
    }
  }

  if (!parsedApi || typeof parsedApi !== 'object') {
    throw new Error('Invalid OpenAPI contract: content does not resolve to an object');
  }

  const info = {
    title: parsedApi.info?.title || 'API Specification',
    version: parsedApi.info?.version || '1.0.0',
    description: parsedApi.info?.description || '',
    servers: parsedApi.servers || [],
    specVersion: parsedApi.openapi || parsedApi.swagger || '3.0.0',
  };

  const endpoints = [];
  const paths = parsedApi.paths || {};

  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [routePath, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const security = operation.security !== undefined ? operation.security : (parsedApi.security || []);
      const requiresAuth = Array.isArray(security) && security.length > 0;

      endpoints.push({
        method: method.toUpperCase(),
        path: routePath,
        operationId: operation.operationId || `${method}_${routePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        summary: operation.summary || '',
        description: operation.description || '',
        tags: operation.tags || [],
        security,
        requiresAuth,
        parameters: [...(pathItem.parameters || []), ...(operation.parameters || [])],
        requestBody: operation.requestBody || null,
        responses: operation.responses || {},
      });
    }
  }

  return {
    api: parsedApi,
    info,
    endpoints,
    raw: rawContent,
  };
}

export const parseOpenApiSpec = parseSpec;

