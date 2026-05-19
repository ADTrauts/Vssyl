import { PrismaClient } from '@prisma/client';
import AutonomyManager from '../ai/autonomy/AutonomyManager';
import { prisma as sharedPrisma } from '../lib/prisma';

const DEFAULT_AUTONOMY = {
  scheduling: 30,
  communication: 20,
  fileManagement: 40,
  taskCreation: 30,
  dataAnalysis: 60,
  crossModuleActions: 20,
};

export type AIAutonomySettingsRecord = Awaited<
  ReturnType<PrismaClient['aIAutonomySettings']['findUnique']>
>;

/**
 * Canonical read/write for AIAutonomySettings.
 * Prefer /api/ai/autonomy/settings — legacy /api/ai/autonomy delegates here.
 */
export async function getOrCreateAutonomySettings(
  userId: string,
  prisma: PrismaClient = sharedPrisma
): Promise<NonNullable<AIAutonomySettingsRecord>> {
  const existing = await prisma.aIAutonomySettings.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.aIAutonomySettings.create({
    data: { userId, ...DEFAULT_AUTONOMY },
  });
}

export async function updateAutonomySettingsForUser(
  userId: string,
  updates: Record<string, unknown>,
  prisma: PrismaClient = sharedPrisma
): Promise<NonNullable<AIAutonomySettingsRecord>> {
  const manager = new AutonomyManager(prisma);
  return manager.updateAutonomySettings(userId, updates) as Promise<NonNullable<AIAutonomySettingsRecord>>;
}
