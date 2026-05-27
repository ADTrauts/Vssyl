/**
 * Lightweight user context for twin queries (Phase A lazy fullContext).
 */

import type { UserContext } from './CrossModuleContextEngine';
import { prisma } from '../../lib/prisma';

export async function buildSkimUserContext(userId: string): Promise<UserContext> {
  const activeModules = await getInstalledModuleIds(userId);

  return {
    userId,
    timestamp: new Date(),
    activeModules: activeModules.length > 0 ? activeModules : ['dashboard'],
    crossModuleInsights: [],
    currentFocus: {
      module: 'dashboard',
      activity: 'overview',
      priority: 'medium',
      timeSpent: 0,
    },
    patterns: [],
    relationships: [],
    preferences: {
      communication: {
        preferredChannels: [],
        responseTimeExpectations: {},
        formalityLevel: 0.5,
        timezone: 'UTC',
      },
      work: {
        productiveHours: [],
        focusBlockPreference: 60,
        interruptionTolerance: 0.5,
        collaborationStyle: 'balanced',
        prioritizationMethod: 'priority',
      },
      personal: {
        socialEngagement: 0.5,
        privacyLevel: 0.5,
        sharingComfort: 0.5,
        planningHorizon: 7,
      },
    },
    lifeState: {
      workLifeBalance: { score: 50, trend: 'stable', concerns: [], opportunities: [] },
      productivity: { score: 50, peakHours: [], efficiency: 0.5, bottlenecks: [] },
      relationships: { score: 50, socialConnections: 0, communicationHealth: 0.5, networkGrowth: 0 },
      goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
    },
  };
}

async function getInstalledModuleIds(userId: string): Promise<string[]> {
  try {
    const installations = await prisma.moduleInstallation.findMany({
      where: { userId, enabled: true },
      select: { moduleId: true },
      orderBy: { moduleId: 'asc' },
    });
    const ids = installations.map((i) => i.moduleId);
    return ids.length > 0 ? ids : ['dashboard'];
  } catch {
    return ['dashboard'];
  }
}
