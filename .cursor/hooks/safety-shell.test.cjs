#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { classify } = require('./safety-shell.cjs');

const fixtures = [
  ['allow', 'git status'],
  ['allow', 'git push origin feature/safe-change'],
  ['allow', 'pnpm install --frozen-lockfile'],
  ['allow', 'pnpm prisma:build && pnpm prisma:generate'],
  ['allow', 'pnpm type-check && pnpm test'],
  ['allow', 'pnpm prisma migrate status'],
  ['allow', 'rg "DROP TABLE|TRUNCATE" server'],
  ['allow', 'git grep "git reset --hard"'],
  ['allow', 'rg "sk_live_" .'],
  ['allow', 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vssyl_ci pnpm prisma:migrate:deploy'],
  ['allow', 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/vssyl_ci pnpm --filter vssyl-server seed:test-data'],
  ['deny', 'git push --force origin main'],
  ['deny', 'git push -f origin feature/rewrite'],
  ['deny', 'git push --force-with-lease origin feature/rewrite'],
  ['deny', 'git reset --hard HEAD~1'],
  ['deny', 'pnpm exec prisma migrate reset'],
  ['deny', 'psql -c "DROP DATABASE vssyl"'],
  ['deny', 'psql -c "DROP SCHEMA public"'],
  ['deny', 'psql -c "DROP TABLE users"'],
  ['deny', 'psql -c "TRUNCATE TABLE users"'],
  ['deny', 'gcloud projects delete vssyl-production'],
  ['deny', 'gcloud sql instances delete vssyl-production'],
  ['deny', 'gcloud storage rm --recursive gs://critical-bucket'],
  ['deny', 'gcloud secrets delete old-secret --project vssyl-staging'],
  ['deny', 'gsutil rm gs://controlled-bucket/obsolete.txt'],
  ['deny', 'DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/vssyl pnpm prisma:migrate:deploy'],
  ['deny', 'DATABASE_URL=postgresql://user:pass@staging-db.example.com:5432/vssyl pnpm prisma:migrate:deploy'],
  ['deny', 'DATABASE_URL=$PRODUCTION_DATABASE_URL pnpm --filter vssyl-server seed:test-data'],
  ['deny', 'STRIPE_SECRET_KEY=sk_live_example pnpm dev'],
];

for (const [expected, command] of fixtures) {
  assert.notEqual(
    expected,
    'ask',
    'Fixture matrix must not depend on ask; Cloud Agent approval is not a safety boundary'
  );
  const result = classify(command);
  assert.equal(
    result.permission,
    expected,
    `Expected ${expected} for ${JSON.stringify(command)}, received ${result.permission}`
  );
  assert.notEqual(
    result.permission,
    'ask',
    `Classifier must not return ask for ${JSON.stringify(command)}`
  );
}

const hookPath = path.join(__dirname, 'safety-shell.cjs');
const protocol = spawnSync(process.execPath, [hookPath], {
  input: JSON.stringify({ command: 'pnpm test', cwd: process.cwd(), sandbox: false }),
  encoding: 'utf8',
});
assert.equal(protocol.status, 0);
assert.deepEqual(JSON.parse(protocol.stdout), { permission: 'allow' });

const invalidInput = spawnSync(process.execPath, [hookPath], {
  input: 'not-json',
  encoding: 'utf8',
});
assert.equal(invalidInput.status, 0);
assert.equal(JSON.parse(invalidInput.stdout).permission, 'deny');

console.log(`PASS: ${fixtures.length} command fixtures and hook protocol checks`);
