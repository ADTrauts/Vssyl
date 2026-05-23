import type { AILearningEvent, PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  buildLearningEventArtifactEnvelope,
  isRecord,
  readLearningEventArtifact,
} from '../ai/learning/learningEventContract';
import { LEARNING_EVENT_TYPES, HUMAN_REVIEWABLE_EVENT_TYPES } from '../ai/learning/learningProposalTypes';
import { inferMemoryFactCategory } from '../ai/memory/memoryFactTypes';
import { createUserMemoryFact } from './userMemoryFactService';
import {
  APPLIED_LEARNING_CONFIDENCE_FLOOR,
  isPersonalityTraitKey,
  LEARNING_LAST_PROMOTION_PREF_KEY,
  type LearningApplicationRecord,
  type LearningApplicationTarget,
  type LearningWhatChangedSummary,
} from '../ai/learning/learningApplicationTypes';

export class LearningApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LearningApplicationError';
  }
}

const CONFIDENCE_BUMP_ON_APPROVE = 0.05;
const CONFIDENCE_DECAY_ON_DISMISS = 0.1;
const MIN_CONFIDENCE_AFTER_DISMISS = 0.25;

function readScopeFromEvent(event: AILearningEvent): {
  businessId?: string;
  dashboardId?: string;
} {
  const ms = event.moduleSpecificData;
  if (!isRecord(ms)) return {};
  const businessId = typeof ms.businessId === 'string' ? ms.businessId : undefined;
  const dashboardId = typeof ms.dashboardId === 'string' ? ms.dashboardId : undefined;
  return { businessId, dashboardId };
}

function mergeApplicationIntoPatternData(
  event: AILearningEvent,
  application: LearningApplicationRecord
): Prisma.InputJsonValue {
  const existingArtifact = readLearningEventArtifact(event);
  const base = isRecord(existingArtifact) ? existingArtifact : { summary: event.newBehavior };
  return buildLearningEventArtifactEnvelope({
    ...base,
    application,
  });
}

export class LearningApplicationService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async applyApprovedEvent(event: AILearningEvent): Promise<LearningApplicationRecord> {
    const artifact = readLearningEventArtifact(event);
    const payload = isRecord(artifact) ? artifact : {};
    const scope = readScopeFromEvent(event);

    const beforeSummary =
      (typeof event.oldBehavior === 'string' && event.oldBehavior.trim()) ||
      'Previous AI behavior or default';

    let record: LearningApplicationRecord;

    if (event.eventType === LEARNING_EVENT_TYPES.CORRECTION) {
      record = await this.applyToMemory(event, payload, beforeSummary, scope);
    } else if (
      isRecord(payload) &&
      typeof payload.traitKey === 'string' &&
      isPersonalityTraitKey(payload.traitKey) &&
      typeof payload.traitValue === 'number'
    ) {
      record = await this.applyToPersonality(event, payload.traitKey, payload.traitValue, beforeSummary);
    } else {
      record = await this.applyToPreferenceContext(event, beforeSummary, scope);
    }

    await this.persistLastPromotion(event.userId, {
      eventId: event.id,
      eventType: event.eventType,
      ...record,
    });

    void logger.info('Learning event applied to identity/memory', {
      operation: 'learning_application_apply',
      userId: event.userId,
      eventId: event.id,
      targetType: record.targetType,
      targetId: record.targetId,
    });

    return record;
  }

  buildApprovedUpdate(
    event: AILearningEvent,
    application: LearningApplicationRecord
  ): { confidence: number; patternData: Prisma.InputJsonValue } {
    return {
      confidence: Math.min(1, event.confidence + CONFIDENCE_BUMP_ON_APPROVE),
      patternData: mergeApplicationIntoPatternData(event, application),
    };
  }

  buildDismissedUpdate(event: AILearningEvent): {
    confidence: number;
    patternData: Prisma.InputJsonValue;
  } {
    const artifact = readLearningEventArtifact(event);
    const base = isRecord(artifact) ? artifact : { summary: event.newBehavior };
    return {
      confidence: Math.max(MIN_CONFIDENCE_AFTER_DISMISS, event.confidence - CONFIDENCE_DECAY_ON_DISMISS),
      patternData: buildLearningEventArtifactEnvelope({
        ...base,
        dismissedAt: new Date().toISOString(),
      }),
    };
  }

  private async applyToMemory(
    event: AILearningEvent,
    payload: Record<string, unknown>,
    beforeSummary: string,
    scope: { businessId?: string; dashboardId?: string }
  ): Promise<LearningApplicationRecord> {
    const predicate =
      (typeof payload.predicate === 'string' && payload.predicate.trim()) ||
      event.newBehavior.trim();
    const subject =
      (typeof payload.subject === 'string' && payload.subject.trim()) ||
      event.context.trim().slice(0, 80) ||
      'Correction';

    const fact = await createUserMemoryFact({
      userId: event.userId,
      subject,
      predicate,
      scope: scope.businessId ? 'business' : 'personal',
      businessId: scope.businessId ?? null,
      dashboardId: scope.dashboardId ?? null,
      sourceType: 'explicit_user',
      category: inferMemoryFactCategory(subject, predicate),
      isExplicit: true,
      confidence: Math.max(event.confidence, APPLIED_LEARNING_CONFIDENCE_FLOOR),
    });

    return {
      targetType: 'memory',
      targetId: fact.id,
      beforeSummary,
      afterSummary: `${subject}: ${predicate.slice(0, 200)}`,
      appliedAt: new Date().toISOString(),
    };
  }

  private async applyToPreferenceContext(
    event: AILearningEvent,
    beforeSummary: string,
    scope: { businessId?: string; dashboardId?: string }
  ): Promise<LearningApplicationRecord> {
    const title =
      event.context.trim().slice(0, 120) || event.newBehavior.trim().slice(0, 80) || 'Learned preference';
    const content = event.newBehavior.trim();

    const context = await this.db.userAIContext.create({
      data: {
        userId: event.userId,
        scope: scope.businessId ? 'business' : 'personal',
        scopeId: scope.businessId,
        contextType: 'preference',
        title,
        content,
        tags: ['learning', event.eventType],
        priority: Math.round(Math.max(event.confidence, APPLIED_LEARNING_CONFIDENCE_FLOOR) * 100),
        active: true,
        source: 'user',
        learningStatus: 'active',
      },
    });

    return {
      targetType: 'preference',
      targetId: context.id,
      beforeSummary,
      afterSummary: content.slice(0, 240),
      appliedAt: new Date().toISOString(),
    };
  }

  private async applyToPersonality(
    event: AILearningEvent,
    traitKey: string,
    traitValue: number,
    beforeSummary: string
  ): Promise<LearningApplicationRecord> {
    const profile = await this.db.aIPersonalityProfile.findUnique({
      where: { userId: event.userId },
    });

    const existingData = isRecord(profile?.personalityData)
      ? (profile.personalityData as Record<string, unknown>)
      : {};
    const traits = isRecord(existingData.traits) ? { ...existingData.traits } : {};
    const previousValue = typeof traits[traitKey] === 'number' ? traits[traitKey] : null;
    traits[traitKey] = Math.max(0, Math.min(100, Math.round(traitValue)));

    const personalityData = {
      ...existingData,
      traits,
    };

    if (profile) {
      await this.db.aIPersonalityProfile.update({
        where: { userId: event.userId },
        data: { personalityData: personalityData as Prisma.InputJsonValue },
      });
    } else {
      await this.db.aIPersonalityProfile.create({
        data: {
          userId: event.userId,
          personalityData: personalityData as Prisma.InputJsonValue,
        },
      });
    }

    return {
      targetType: 'personality',
      targetId: profile?.id ?? event.userId,
      beforeSummary,
      afterSummary:
        previousValue === null
          ? `Set ${traitKey} to ${traits[traitKey]}`
          : `Updated ${traitKey} from ${previousValue} to ${traits[traitKey]}`,
      appliedAt: new Date().toISOString(),
    };
  }

  private async persistLastPromotion(
    userId: string,
    summary: LearningWhatChangedSummary
  ): Promise<void> {
    const value = JSON.stringify(summary);
    const existing = await this.db.userPreference.findFirst({
      where: { userId, key: LEARNING_LAST_PROMOTION_PREF_KEY },
    });
    if (existing) {
      await this.db.userPreference.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await this.db.userPreference.create({
        data: { userId, key: LEARNING_LAST_PROMOTION_PREF_KEY, value },
      });
    }
  }

  async getWhatChangedSummary(userId: string): Promise<LearningWhatChangedSummary | null> {
    const pref = await this.db.userPreference.findFirst({
      where: { userId, key: LEARNING_LAST_PROMOTION_PREF_KEY },
    });
    if (pref?.value) {
      try {
        const parsed = JSON.parse(pref.value) as LearningWhatChangedSummary;
        if (parsed && typeof parsed.afterSummary === 'string') {
          parsed.preferenceShiftNote = await this.detectPreferenceShiftNote(userId);
          return parsed;
        }
      } catch {
        // fall through to event scan
      }
    }

    const event = await this.db.aILearningEvent.findFirst({
      where: {
        userId,
        validated: true,
        applied: true,
        eventType: { in: [...HUMAN_REVIEWABLE_EVENT_TYPES] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!event) return null;

    const artifact = readLearningEventArtifact(event);
    if (!isRecord(artifact) || !isRecord(artifact.application)) return null;

    const app = artifact.application;
    const summary: LearningWhatChangedSummary = {
      eventId: event.id,
      eventType: event.eventType,
      targetType: app.targetType as LearningApplicationTarget,
      targetId: String(app.targetId),
      beforeSummary: String(app.beforeSummary),
      afterSummary: String(app.afterSummary),
      appliedAt: String(app.appliedAt),
    };
    summary.preferenceShiftNote = await this.detectPreferenceShiftNote(userId);
    return summary;
  }

  async detectPreferenceShiftNote(userId: string): Promise<string | undefined> {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [recentApplied, priorApplied] = await Promise.all([
      this.db.aILearningEvent.count({
        where: {
          userId,
          validated: true,
          applied: true,
          createdAt: { gte: weekAgo },
        },
      }),
      this.db.aILearningEvent.count({
        where: {
          userId,
          validated: true,
          applied: true,
          createdAt: { gte: monthAgo, lt: weekAgo },
        },
      }),
    ]);

    if (recentApplied === 0) return undefined;
    if (recentApplied > priorApplied) {
      return `You saved ${recentApplied} learning${recentApplied === 1 ? '' : 's'} this week — more than the prior period.`;
    }
    if (recentApplied > 0 && priorApplied === 0) {
      return 'Your AI Identity recently started incorporating saved learnings.';
    }
    return undefined;
  }

  async recordContextPromotion(input: {
    userId: string;
    contextId: string;
    title: string;
    content: string;
  }): Promise<void> {
    await this.persistLastPromotion(input.userId, {
      targetType: 'preference',
      targetId: input.contextId,
      beforeSummary: 'Pending observation from chat',
      afterSummary: `${input.title}: ${input.content.slice(0, 200)}`,
      appliedAt: new Date().toISOString(),
    });
  }

  /**
   * Phase 5E — repeated suggestion accepts create a reviewable pending preference (not auto-promote).
   */
  async createPendingPreferenceFromSuggestionPattern(input: {
    userId: string;
    suggestionType: string;
    correlationRuleId?: string | null;
    acceptanceCount: number;
    dashboardId?: string | null;
    businessId?: string | null;
  }): Promise<{ id: string } | null> {
    const dedupeTag = `ambient_suggestion:${input.suggestionType}`;
    const existing = await this.db.userAIContext.findFirst({
      where: {
        userId: input.userId,
        learningStatus: 'pending',
        tags: { has: dedupeTag },
      },
    });
    if (existing) return null;

    const typeLabel = input.suggestionType.replace(/_/g, ' ');
    const title = `Prefer ${typeLabel} suggestions`;
    const content =
      `You've accepted ${input.acceptanceCount} "${typeLabel}" contextual suggestions recently. ` +
      `Save this as a preference if you'd like me to keep surfacing similar ideas — or dismiss if not.`;

    const context = await this.db.userAIContext.create({
      data: {
        userId: input.userId,
        scope: input.businessId ? 'business' : 'personal',
        scopeId: input.businessId ?? undefined,
        moduleId: 'ai',
        contextType: 'preference',
        title,
        content,
        tags: ['ambient_suggestion', dedupeTag, input.suggestionType],
        priority: 55,
        active: false,
        source: 'inferred',
        learningStatus: 'pending',
      },
      select: { id: true },
    });

    void logger.info('Created pending learning from repeated suggestion accepts', {
      operation: 'ambient_suggestion_learning_proposal',
      userId: input.userId,
      suggestionType: input.suggestionType,
      contextId: context.id,
      acceptanceCount: input.acceptanceCount,
      correlationRuleId: input.correlationRuleId ?? undefined,
    });

    return context;
  }
}

export const learningApplicationService = new LearningApplicationService();
