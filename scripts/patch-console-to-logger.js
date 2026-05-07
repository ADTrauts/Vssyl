/**
 * One-off / repeatable: replace common console.* patterns in server routes & services
 * with structured logger calls. Run: node scripts/patch-console-to-logger.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SERVER_SRC = path.join(ROOT, 'server/src');

const SKIP_PARTS = [`${path.sep}__tests__${path.sep}`, '/__tests__/'];

function skipFile(abs) {
  const n = abs.split(path.sep).join('/');
  return SKIP_PARTS.some((p) => n.includes(p.replace(/\\/g, '/')));
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '__tests__') continue;
      walk(abs, out);
    } else if (ent.name.endsWith('.ts')) {
      if (!skipFile(abs)) out.push(abs);
    }
  }
  return out;
}

function loggerImportPath(fromAbs) {
  const libDir = path.join(SERVER_SRC, 'lib');
  let rel = path.relative(path.dirname(fromAbs), libDir);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return `${rel.split(path.sep).join('/')}/logger`;
}

const HELPER = `
function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}
`;

function insertAfterImports(content, insert) {
  const lines = content.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport === -1) {
    return insert + '\n' + content;
  }
  const next = [...lines.slice(0, lastImport + 1), insert.trimEnd(), '', ...lines.slice(lastImport + 1)];
  return next.join('\n');
}

function ensureLogger(content, importPath) {
  const needle = `from '${importPath}'`;
  const needle2 = `from "${importPath}"`;
  if (content.includes(needle) || content.includes(needle2)) return content;
  if (/import\s*\{\s*logger\s*\}/.test(content)) return content;
  const imp = `import { logger } from '${importPath}';`;
  const lines = content.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport === -1) return `${imp}\n${content}`;
  lines.splice(lastImport + 1, 0, imp);
  return lines.join('\n');
}

function ensureHelper(content) {
  if (content.includes('function logSrvErr')) return content;
  return insertAfterImports(content, HELPER);
}

function slug(fileSlug, msg) {
  const m = msg
    .replace(/:\s*$/, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
    .slice(0, 56);
  return `${fileSlug}_${m}`;
}

function escapeMsg(msg) {
  return msg.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Replace console.error('msg', ident); */
function patchSimpleError(content, fileSlug) {
  return content.replace(
    /console\.error\(\s*'((?:\\'|[^'])*)'\s*,\s*(\w+)\s*\)/g,
    (_, msg, id) => {
      const op = slug(fileSlug, msg);
      return `logSrvErr('${op}', '${escapeMsg(msg)}', ${id})`;
    }
  );
}

function patchSimpleErrorDouble(content, fileSlug) {
  return content.replace(
    /console\.error\(\s*"((?:\\"|[^"])*)"\s*,\s*(\w+)\s*\)/g,
    (_, msg, id) => {
      const op = slug(fileSlug, msg);
      const safe = msg.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `logSrvErr('${op}', '${safe}', ${id})`;
    }
  );
}

function patchSimpleWarn(content, fileSlug) {
  return content.replace(
    /console\.warn\(\s*'((?:\\'|[^'])*)'\s*,\s*(\w+)\s*\)/g,
    (_, msg, id) => {
      const op = slug(fileSlug, msg);
      return `logSrvWarn('${op}', '${escapeMsg(msg)}', ${id})`;
    }
  );
}

function patchSimpleLogString(content, fileSlug) {
  return content.replace(/console\.log\(\s*'((?:\\'|[^'])*)'\s*\)/g, (_, msg) => {
    const op = slug(fileSlug, msg);
    return `logSrvDebug('${op}', '${escapeMsg(msg)}')`;
  });
}

function processContent(raw, abs) {
  let s = raw;
  const base = path.basename(abs, '.ts');
  const fileSlug = base.replace(/[^a-z0-9]+/gi, '_').toLowerCase();

  // file.ts had console before imports — strip any leading console.* lines before first import
  s = s.replace(/^[^\n]*console\.(log|warn|error)\([^;]*;\s*\n(?=import\s)/m, '');

  if (!/\bconsole\.(log|warn|error|debug|info)\b/.test(s)) return raw;

  const imp = loggerImportPath(abs);
  s = ensureLogger(s, imp);
  s = ensureHelper(s);

  s = patchSimpleError(s, fileSlug);
  s = patchSimpleErrorDouble(s, fileSlug);
  s = patchSimpleWarn(s, fileSlug);
  s = patchSimpleLogString(s, fileSlug);

  return s;
}

function main() {
  const dirs = [path.join(SERVER_SRC, 'routes'), path.join(SERVER_SRC, 'services')];
  let changed = 0;
  let total = 0;
  for (const dir of dirs) {
    const files = walk(dir);
    for (const abs of files) {
      total++;
      const raw = fs.readFileSync(abs, 'utf8');
      const next = processContent(raw, abs);
      if (next !== raw) {
        fs.writeFileSync(abs, next);
        changed++;
        console.log('updated', path.relative(ROOT, abs));
      }
    }
  }
  console.log(`Done. Files scanned: ${total}, changed: ${changed}`);
}

main();
