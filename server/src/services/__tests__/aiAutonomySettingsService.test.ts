import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getOrCreateAutonomySettings,
  updateAutonomySettingsForUser,
} from '../aiAutonomySettingsService';

describe('aiAutonomySettingsService', () => {
  it('getOrCreateAutonomySettings returns existing row', async () => {
    const row = {
      id: 'a1',
      userId: 'u1',
      scheduling: 40,
      communication: 20,
      fileManagement: 40,
      taskCreation: 30,
      dataAnalysis: 60,
      crossModuleActions: 25,
    };
    const prisma = {
      aIAutonomySettings: {
        findUnique: vi.fn().mockResolvedValue(row),
        create: vi.fn(),
      },
    } as unknown as PrismaClient;

    const result = await getOrCreateAutonomySettings('u1', prisma);
    expect(result.scheduling).toBe(40);
    expect(prisma.aIAutonomySettings.create).not.toHaveBeenCalled();
  });

  it('updateAutonomySettingsForUser delegates to AutonomyManager', async () => {
    const updated = { id: 'a1', userId: 'u1', scheduling: 99 };
    const prisma = {
      aIAutonomySettings: {
        upsert: vi.fn().mockResolvedValue(updated),
      },
    } as unknown as PrismaClient;

    const result = await updateAutonomySettingsForUser('u1', { scheduling: 99 }, prisma);
    expect(result.scheduling).toBe(99);
  });
});
