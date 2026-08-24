/**
 * Domain verification for the AI authoritative-truth fixture.
 * Run after: pnpm --filter vssyl-server seed:ai-truth
 */

import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { verifyAiTruthFixture } from './seed-ai-truth-fixture';

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, '../../.env'));
loadEnvFile(resolve(__dirname, '../.env'));

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await verifyAiTruthFixture();
    console.log('AI truth fixture verification');
    console.log(`Business: ${result.meta.businessName} (${result.meta.businessId})`);
    for (const row of result.rows) {
      console.log(
        `${row.pass ? 'PASS' : 'FAIL'} | ${row.fact} | expected=${row.expected} | actual=${row.actual}`
      );
    }
    if (!result.ok) {
      process.exitCode = 1;
      console.error('VERIFICATION FAILED');
      return;
    }
    console.log('VERIFICATION PASSED');
  } catch (error) {
    console.error('Verification error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
