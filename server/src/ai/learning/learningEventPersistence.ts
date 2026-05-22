import type { PrismaClient } from '@prisma/client';
import { buildDerivedLearningEventWrite } from './learningEventContract';

export async function upsertDerivedLearningEvent(
  db: PrismaClient,
  input: Parameters<typeof buildDerivedLearningEventWrite>[0]
): Promise<void> {
  const write = buildDerivedLearningEventWrite(input);

  const existing = await db.aILearningEvent.findFirst({
    where: {
      userId: write.userId,
      eventType: write.eventType,
      context: write.context,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    await db.aILearningEvent.update({
      where: { id: existing.id },
      data: {
        newBehavior: write.newBehavior,
        patternData: write.patternData,
        confidence: write.confidence,
        frequency: { increment: 1 },
        applied: true,
        validated: true,
      },
    });
    return;
  }

  await db.aILearningEvent.create({ data: write });
}
