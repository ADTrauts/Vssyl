/**
 * Backfill AIMessageRecallIndex from existing AIMessage rows.
 * Safe to run multiple times (skips already-indexed messages).
 *
 * Usage:
 *   pnpm --filter vssyl-server backfill:ai-recall-index
 *   pnpm --filter vssyl-server backfill:ai-recall-index -- <userId>
 */
import { prisma } from '../src/lib/prisma';
import { backfillAIMessageRecallIndex } from '../src/services/aiMessageRecallService';

async function main(): Promise<void> {
  const userId = process.argv[2]?.trim() || undefined;
  console.log('Starting AI message recall index backfill...', userId ? { userId } : { scope: 'all users' });

  const result = await backfillAIMessageRecallIndex({ userId, batchSize: 200 });

  console.log('Backfill complete.');
  console.log(`  indexed: ${result.indexed}`);
  console.log(`  skipped: ${result.skipped}`);
  console.log(`  errors:  ${result.errors}`);
}

main()
  .catch((err: unknown) => {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('Backfill failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
