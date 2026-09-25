import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Normalizes a repo input string into a valid cloneable Git URL and local folder name.
 */
export function parseRepoSource(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    throw new Error('Repository URL or local path cannot be empty.');
  }

  // Check if it is a local filesystem path
  const resolvedPath = path.resolve(process.cwd(), trimmed);
  if (fs.existsSync(resolvedPath)) {
    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      return {
        isLocal: true,
        localPath: resolvedPath,
        repoName: path.basename(resolvedPath),
        source: trimmed,
      };
    }
  }

  // Handle GitHub shorthand: owner/repo
  let gitUrl = trimmed;
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    gitUrl = `https://github.com/${trimmed}.git`;
  }

  // Extract repo name from URL
  const nameMatch = gitUrl.match(/\/([a-zA-Z0-9_.-]+?)(\.git)?$/);
  const repoName = nameMatch ? nameMatch[1].replace(/\.git$/, '') : `repo-${Date.now()}`;

  return {
    isLocal: false,
    gitUrl,
    repoName,
    source: trimmed,
  };
}

/**
 * Clones a remote repository or prepares a local workspace.
 */
export function cloneOrInspectRepo(repoSource, options = {}) {
  const parsed = parseRepoSource(repoSource);
  const baseDir = options.targetDir || path.join(process.cwd(), '.sentinel', 'repos');

  let workspacePath;

  if (parsed.isLocal) {
    workspacePath = parsed.localPath;
  } else {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    workspacePath = path.join(baseDir, parsed.repoName);

    if (fs.existsSync(workspacePath)) {
      // If already exists, optionally pull or reuse
      if (options.forceFresh) {
        fs.rmSync(workspacePath, { recursive: true, force: true });
        execSync(`git clone --depth 1 "${parsed.gitUrl}" "${workspacePath}"`, { stdio: 'pipe' });
      }
    } else {
      execSync(`git clone --depth 1 "${parsed.gitUrl}" "${workspacePath}"`, { stdio: 'pipe' });
    }
  }

  const inspection = inspectWorkspace(workspacePath);

  return {
    repoName: parsed.repoName,
    workspacePath,
    isLocal: parsed.isLocal,
    ...inspection,
  };
}

/**
 * Inspects a directory for OpenAPI specs, routes, and API frameworks.
 */
export function inspectWorkspace(dirPath) {
  const specFiles = [];
  const routeFiles = [];
  let framework = 'unknown';
  let packageData = null;

  if (!fs.existsSync(dirPath)) {
    return { specFiles, routeFiles, framework, packageData, totalFilesScanned: 0 };
  }

  const pkgPath = path.join(dirPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      packageData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(packageData.dependencies || {}), ...(packageData.devDependencies || {}) };
      if (deps.express) framework = 'Express.js';
      else if (deps.fastify) framework = 'Fastify';
      else if (deps['@nestjs/core']) framework = 'NestJS';
      else if (deps.koa) framework = 'Koa';
      else if (deps.hono) framework = 'Hono';
    } catch (_e) {
      // ignore JSON parse error
    }
  }

  // Recursive scan limited to depth 4 to prevent hanging on node_modules
  function scan(current, depth = 0) {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relPath = path.relative(dirPath, fullPath);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '.vite', '.next', 'coverage'].includes(entry.name)) {
          continue;
        }
        scan(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        // Detect OpenAPI / Swagger
        if (
          lower.includes('openapi') ||
          lower.includes('swagger') ||
          lower.endsWith('.swagger.json') ||
          lower.endsWith('.swagger.yaml')
        ) {
          specFiles.push({ name: entry.name, path: fullPath, relPath });
        }

        // Detect potential route / controller files
        if (
          (relPath.includes('route') ||
            relPath.includes('controller') ||
            relPath.includes('api') ||
            relPath.includes('handler') ||
            relPath.includes('server')) &&
          (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.py') || lower.endsWith('.go'))
        ) {
          routeFiles.push({ name: entry.name, path: fullPath, relPath });
        }
      }
    }
  }

  scan(dirPath);

  return {
    specFiles,
    routeFiles,
    framework,
    packageData: packageData ? { name: packageData.name, version: packageData.version } : null,
  };
}

/**
 * Reads a file from workspace safely for agent context.
 */
export function readWorkspaceFile(workspacePath, relativeFilePath, maxLines = 150) {
  const target = path.resolve(workspacePath, relativeFilePath);
  if (!target.startsWith(workspacePath)) {
    throw new Error('Access outside workspace root is denied.');
  }

  if (!fs.existsSync(target)) {
    throw new Error(`File not found: ${relativeFilePath}`);
  }

  const content = fs.readFileSync(target, 'utf8');
  const lines = content.split('\n');
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join('\n') + `\n\n[... Truncated ${lines.length - maxLines} lines for token economy ...]`;
  }
  return content;
}
