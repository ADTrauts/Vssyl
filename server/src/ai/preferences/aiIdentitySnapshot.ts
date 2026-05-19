import { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { PreferenceResolver } from './PreferenceResolver';
import { toEffectivePreferencesPreview } from './effectivePreferencesPreview';
import {
  buildInfluenceItems,
  describeCommunicationStyleFromPreview,
  type AIIdentityInfluence,
} from './buildInfluenceItems';
import type { EffectivePreferencesPreview } from './effectivePreferencesPreview';
import { userAIContextLearningService } from '../../services/userAIContextLearningService';
import { loadBusinessWorkspaceBoundaryBlock } from '../enterprise/businessWorkspaceBoundaries';
import { promptEligibleContextWhere } from '../../services/userAIContextLearningService';

export interface AIIdentitySnapshot {
  preview: EffectivePreferencesPreview;
  communicationSummary: string;
  influences: AIIdentityInfluence[];
  learning: {
    pendingCount: number;
    pendingContextCount: number;
    pendingEventCount: number;
  };
  context: {
    scope: 'personal' | 'business';
    businessName?: string;
    memoryFactCount: number;
    learnedContextCount: number;
    userContextCount: number;
    modules: Array<{ id: string; name: string }>;
  };
  businessOverlay?: {
    active: boolean;
    businessId: string;
    businessName?: string;
    policySummary: string[];
  };
}

export interface BuildAIIdentitySnapshotInput {
  userId: string;
  businessId?: string;
  dashboardId?: string;
}

const CORE_MODULE_LABELS: Record<string, string> = {
  drive: 'File Hub',
  chat: 'Chat',
  calendar: 'Calendar',
  scheduling: 'Scheduling',
  todo: 'Tasks',
  ai: 'AI Assistant',
};

export class AIIdentitySnapshotBuilder {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly preferenceResolver = new PreferenceResolver(prisma)
  ) {}

  async build(input: BuildAIIdentitySnapshotInput): Promise<AIIdentitySnapshot> {
    const { userId, businessId, dashboardId } = input;

    const [
      resolved,
      profile,
      autonomy,
      businessTwin,
      businessBoundary,
      pendingContextCount,
      pendingEvents,
      memoryFactCount,
      activeContexts,
      moduleRows,
    ] = await Promise.all([
      this.preferenceResolver.resolve({ userId, businessId, dashboardId }),
      this.db.aIPersonalityProfile.findUnique({
        where: { userId },
        select: { id: true, personalityData: true },
      }),
      this.db.aIAutonomySettings.findUnique({ where: { userId }, select: { id: true } }),
      businessId
        ? this.db.businessAIDigitalTwin.findUnique({
            where: { businessId },
            select: { id: true, status: true, allowEmployeeInteraction: true },
          })
        : Promise.resolve(null),
      businessId
        ? loadBusinessWorkspaceBoundaryBlock(userId, businessId, this.db)
        : Promise.resolve(null),
      userAIContextLearningService.countPending(userId),
      this.db.aILearningEvent.count({
        where: { userId, validated: false },
      }),
      this.db.userMemoryFact.count({
        where: {
          userId,
          trashedAt: null,
          ...(businessId
            ? {
                OR: [{ scope: 'personal' }, { scope: 'business', businessId }],
              }
            : { scope: 'personal' }),
        },
      }),
      this.db.userAIContext.findMany({
        where: promptEligibleContextWhere(userId),
        select: { source: true },
      }),
      this.loadInfluencingModules(userId, businessId),
    ]);

    const personalityData = profile?.personalityData;
    const hasQuestionnaire =
      personalityData &&
      typeof personalityData === 'object' &&
      !Array.isArray(personalityData) &&
      (personalityData as Record<string, unknown>).questionnaireCompleted === true;

    const hasBusinessPolicies = Boolean(
      businessTwin?.status === 'active' && businessTwin.allowEmployeeInteraction
    );

    const preview = toEffectivePreferencesPreview(resolved, {
      hasPersonalityProfile: Boolean(profile && hasQuestionnaire),
      hasAutonomySettings: Boolean(autonomy),
      businessId,
      hasBusinessWorkspacePolicies: hasBusinessPolicies,
    });

    const learnedContextCount = activeContexts.filter((c) => c.source === 'conversation').length;
    const userContextCount = activeContexts.filter(
      (c) => c.source === 'user' || c.source == null
    ).length;

    const pendingLearningCount = pendingContextCount + pendingEvents;

    const policySummary = businessBoundary
      ? [
          ...businessBoundary.policyLines.slice(0, 4),
          ...(businessBoundary.businessVoiceHints?.slice(0, 2) ?? []),
        ]
      : [];

    const influences = buildInfluenceItems({
      preview,
      resolved,
      memoryFactCount,
      learnedContextCount,
      userContextCount,
      pendingLearningCount,
      businessPolicyLines: policySummary.length > 0 ? policySummary : undefined,
    });

    const snapshot: AIIdentitySnapshot = {
      preview,
      communicationSummary: describeCommunicationStyleFromPreview(preview),
      influences,
      learning: {
        pendingCount: pendingLearningCount,
        pendingContextCount,
        pendingEventCount: pendingEvents,
      },
      context: {
        scope: businessId && hasBusinessPolicies ? 'business' : 'personal',
        ...(businessBoundary?.businessName && { businessName: businessBoundary.businessName }),
        memoryFactCount,
        learnedContextCount,
        userContextCount,
        modules: moduleRows,
      },
    };

    if (businessId && businessBoundary) {
      snapshot.businessOverlay = {
        active: true,
        businessId,
        businessName: businessBoundary.businessName,
        policySummary,
      };
    }

    return snapshot;
  }

  private async loadInfluencingModules(
    userId: string,
    businessId?: string
  ): Promise<Array<{ id: string; name: string }>> {
    const names = new Map<string, string>();

    const personalInstalls = await this.db.moduleInstallation.findMany({
      where: { userId, enabled: true },
      select: {
        module: { select: { id: true, name: true, manifest: true } },
      },
      take: 12,
    });

    for (const row of personalInstalls) {
      const id = row.module.id;
      const manifest = row.module.manifest;
      const manifestId =
        manifest &&
        typeof manifest === 'object' &&
        !Array.isArray(manifest) &&
        typeof (manifest as Record<string, unknown>).id === 'string'
          ? String((manifest as Record<string, unknown>).id)
          : id;
      names.set(manifestId, row.module.name || CORE_MODULE_LABELS[manifestId] || manifestId);
    }

    if (businessId) {
      const bizInstalls = await this.db.businessModuleInstallation.findMany({
        where: { businessId, enabled: true },
        select: {
          module: { select: { id: true, name: true, manifest: true } },
        },
        take: 12,
      });
      for (const row of bizInstalls) {
        const id = row.module.id;
        const manifest = row.module.manifest;
        const manifestId =
          manifest &&
          typeof manifest === 'object' &&
          !Array.isArray(manifest) &&
          typeof (manifest as Record<string, unknown>).id === 'string'
            ? String((manifest as Record<string, unknown>).id)
            : id;
        if (!names.has(manifestId)) {
          names.set(manifestId, row.module.name || CORE_MODULE_LABELS[manifestId] || manifestId);
        }
      }
    }

    if (names.size === 0) {
      return Object.entries(CORE_MODULE_LABELS)
        .slice(0, 4)
        .map(([id, name]) => ({ id, name }));
    }

    return Array.from(names.entries())
      .slice(0, 8)
      .map(([id, name]) => ({ id, name }));
  }
}

export const aiIdentitySnapshotBuilder = new AIIdentitySnapshotBuilder();
