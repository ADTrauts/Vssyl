#!/usr/bin/env node

'use strict';

const { URL } = require('node:url');

const ALLOW = Object.freeze({ permission: 'allow' });

function decision(permission, userMessage, agentMessage) {
  return {
    permission,
    user_message: userMessage,
    agent_message: agentMessage,
  };
}

function hasDatabaseOperation(command) {
  return [
    /\bprisma\b[^;&|\n]*\bmigrate\s+(?:dev|deploy|reset)\b/i,
    /\bprisma\b[^;&|\n]*\bdb\s+push\b/i,
    /\bprisma:migrate(?::deploy)?\b/i,
    /\bseed(?::test-data|[-_: ](?:test[-_ ]?data|database|db))\b/i,
    /\b(?:apply-production-migrations|migrate-database)\.sh\b/i,
  ].some(pattern => pattern.test(command));
}

function postgresTargets(command) {
  return command.match(/postgres(?:ql)?:\/\/[^\s"'`]+/gi) ?? [];
}

function isReadOnlyInspection(command) {
  if (!/^\s*(?:rg|grep|git\s+grep)\b/i.test(command)) return false;

  let quote = null;
  let escaped = false;
  for (const character of command) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (';&|><`'.includes(character)) return false;
  }
  return quote === null;
}

function classifyDatabaseTarget(command) {
  if (!hasDatabaseOperation(command)) return null;

  if (
    /\b(?:DATABASE_URL|DIRECT_URL)\s*=\s*["']?\$(?:\{)?[^}\s"']*(?:PROD|PRODUCTION)/i.test(
      command
    )
  ) {
    return 'production';
  }

  let sawRemote = false;
  for (const target of postgresTargets(command)) {
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return 'remote';
    }

    const host = parsed.hostname.toLowerCase();
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').split('/')[0]);
    const productionNamed =
      /(?:^|[-_.])prod(?:uction)?(?:$|[-_.])/i.test(host) ||
      /(?:^|[-_.])prod(?:uction)?(?:$|[-_.])/i.test(database) ||
      /cloudsql|vssyl_production|172\.30\./i.test(target);

    if (productionNamed) return 'production';
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
      sawRemote = true;
    }
  }

  return sawRemote ? 'remote' : null;
}

function classify(command) {
  const text = String(command ?? '');

  if (isReadOnlyInspection(text)) {
    return ALLOW;
  }

  if (/\bsk_live_[A-Za-z0-9]+/i.test(text)) {
    return decision(
      'deny',
      'Blocked: a Stripe live secret key appears in the shell command.',
      'Remove the live key. Vssyl development and Cloud Agents must use synthetic or test credentials.'
    );
  }

  if (
    /\bgit(?:\s+-C\s+\S+)?\s+push\b[^;&|\n]*--force-with-lease(?:=|\s|$)/i.test(text)
  ) {
    return decision(
      'ask',
      'Approval required: force-with-lease rewrites remote Git history.',
      'Proceed only after the user confirms the target branch and controlled reason.'
    );
  }

  if (
    /\bgit(?:\s+-C\s+\S+)?\s+push\b[^;&|\n]*(?:--force(?:=|\s|$)|(?:^|\s)-f(?:\s|$))/i.test(
      text
    )
  ) {
    return decision(
      'deny',
      'Blocked: destructive Git force push.',
      'Use a normal push, or use --force-with-lease only with explicit approval when history rewriting is justified.'
    );
  }

  if (/\bgit(?:\s+-C\s+\S+)?\s+reset\b[^;&|\n]*--hard(?:\s|$)/i.test(text)) {
    return decision(
      'deny',
      'Blocked: git reset --hard can irreversibly discard work.',
      'Use a non-destructive inspection or ask the user for a targeted recovery approach.'
    );
  }

  if (/\bprisma\b[^;&|\n]*\bmigrate\s+reset\b/i.test(text)) {
    return decision(
      'deny',
      'Blocked: prisma migrate reset destroys database data.',
      'Inspect migration status and drift; do not reset without a separately approved data-loss procedure.'
    );
  }

  if (
    /\bdrop\s+(?:database|schema|table)\b/i.test(text) ||
    /\btruncate(?:\s+table)?\b/i.test(text)
  ) {
    return decision(
      'deny',
      'Blocked: destructive SQL operation (DROP/TRUNCATE).',
      'Use a reviewed migration or a narrowly scoped, explicitly approved data operation.'
    );
  }

  if (
    /\bgcloud\s+projects\s+delete\b/i.test(text) ||
    /\bgcloud\s+(?:kms\s+keys\s+versions\s+destroy|sql\s+instances\s+delete)\b/i.test(text) ||
    /\bgcloud\s+storage\s+rm\b[^;&|\n]*(?:--recursive|-r)(?:\s|$)/i.test(text) ||
    /\bgsutil\b[^;&|\n]*\brm\b[^;&|\n]*(?:-r|-R)(?:\s|$)/i.test(text)
  ) {
    return decision(
      'deny',
      'Blocked: unquestionably destructive Google Cloud operation.',
      'Do not delete projects, database instances, key versions, or recursive storage through an agent shell.'
    );
  }

  if (
    /\bgcloud\b[^;&|\n]*\bdelete\b/i.test(text) ||
    /\bgcloud\s+storage\s+rm\b/i.test(text) ||
    /\bgsutil\b[^;&|\n]*\brm\b/i.test(text) ||
    /\bbq\s+rm\b/i.test(text)
  ) {
    return decision(
      'ask',
      'Approval required: this Google Cloud command deletes a resource.',
      'Confirm the exact project, resource, environment, and recovery plan before continuing.'
    );
  }

  const databaseTarget = classifyDatabaseTarget(text);
  if (databaseTarget === 'production') {
    return decision(
      'deny',
      'Blocked: database migration or seed targets an obvious production database.',
      'Vssyl Cloud Agent database operations must target local PostgreSQL only; use the guarded production release process separately.'
    );
  }
  if (databaseTarget === 'remote') {
    return decision(
      'ask',
      'Approval required: database migration or seed targets a remote PostgreSQL host.',
      'Confirm the environment and controlled migration procedure. Cloud Agent verification must use localhost and vssyl_ci.'
    );
  }

  return ALLOW;
}

function runHook() {
  let payload;
  try {
    payload = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
  } catch {
    process.stdout.write(
      JSON.stringify(
        decision(
          'deny',
          'Blocked: the Vssyl safety hook received invalid input.',
          'Retry after checking .cursor/hooks.json and the hook input payload.'
        )
      )
    );
    return;
  }

  process.stdout.write(JSON.stringify(classify(payload.command)));
}

if (require.main === module) {
  runHook();
}

module.exports = { classify };
