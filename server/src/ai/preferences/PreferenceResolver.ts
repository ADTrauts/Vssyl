import { PrismaClient } from '@prisma/client';
import type {
  EffectiveHardControls,
  EffectiveInferredPreference,
  EffectivePreferencesContextBlock,
  EffectivePreferencesProvenance,
  EffectivePreferencesProviderPayload,
  EffectiveSoftPreferences,
  PreferenceProvenance,
  ResolvedEffectivePreferences,
  SoftRecommendationRichness,
  SoftStructurePreference,
  SoftTone,
  SoftVerbosity,
} from './preferenceTypes';
import {
  buildQuestionnaireSoftPromptInstructions,
  extractQuestionnairePromptDetail,
} from './questionnaireSoftPromptTemplates';
import type { RetrievedMemoryFact } from '../../services/userMemoryFactService';
import { memoryRetrievalService } from '../memory/MemoryRetrievalService';
import { HUMAN_REVIEWABLE_EVENT_TYPES } from '../learning/learningProposalTypes';
import { APPLIED_LEARNING_CONFIDENCE_FLOOR } from '../learning/learningApplicationTypes';
import { readLearningEventArtifact } from '../learning/learningEventContract';

const PROVIDER_KEY = 'ai_preferred_provider';
const MODEL_OPENAI_KEY = 'ai_preferred_model_openai';
const MODEL_ANTHROPIC_KEY = 'ai_preferred_model_anthropic';

const DEFAULT_AUTONOMY_MODULES = {
  scheduling: 30,
  communication: 20,
  fileManagement: 40,
  taskCreation: 30,
  dataAnalysis: 60,
  crossModuleActions: 20,
};

export interface PreferenceResolverInput {
  userId: string;
  dashboardId?: string | null;
  businessId?: string | null;
  /** Pre-scored memory facts from MemoryRetrievalService (avoids duplicate DB query). */
  retrievedMemoryFacts?: RetrievedMemoryFact[];
}

export const PREFERENCE_CONTEXT_BLOCK_TITLE = 'User communication and AI preference settings';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function clamp0_100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function readString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function mapFormalityToTone(formality: unknown): SoftTone {
  const f = String(formality ?? '').toLowerCase();
  if (f.includes('casual') || f.includes('informal')) return 'casual';
  if (f.includes('formal') || f.includes('professional')) return 'professional';
  if (f.includes('friendly') || f.includes('warm')) return 'warm';
  return 'adaptive';
}

function mapInformationNeedsToVerbosity(needs: unknown): SoftVerbosity {
  const n = String(needs ?? '').toLowerCase();
  if (n.includes('minimal') || n.includes('quick')) return 'brief';
  if (n.includes('comprehensive') || n.includes('thorough')) return 'detailed';
  return 'balanced';
}

function mapTraitsToRecommendationRichness(traits: Record<string, unknown> | undefined): SoftRecommendationRichness {
  const risk = typeof traits?.riskTolerance === 'number' ? traits.riskTolerance : 50;
  const extraversion = typeof traits?.extraversion === 'number' ? traits.extraversion : 50;
  const score = (risk + extraversion) / 2;
  if (score >= 65) return 'rich';
  if (score <= 40) return 'concise';
  return 'balanced';
}

function mapToStructurePreference(
  decisionNeeds: unknown,
  conscientiousness: number | undefined
): SoftStructurePreference {
  const n = String(decisionNeeds ?? '').toLowerCase();
  if (n.includes('comprehensive') || (conscientiousness ?? 50) >= 70) return 'analytical';
  if (n.includes('minimal') || n.includes('quick')) return 'conversational';
  return 'structured';
}

function buildCommunicationStyleNotes(prefs: Record<string, unknown> | undefined): string {
  const comm = isRecord(prefs?.communication) ? prefs.communication : {};
  const parts: string[] = [];
  const formality = readString(comm.formality);
  const responseSpeed = readString(comm.responseSpeed);
  const conflict = readString(comm.conflictStyle);
  if (formality) parts.push(`formality: ${formality}`);
  if (responseSpeed) parts.push(`response pace: ${responseSpeed}`);
  if (conflict) parts.push(`conflict approach: ${conflict}`);
  return parts.length ? parts.join('; ') : 'adapt to context';
}

function buildAutonomyBoundaryLines(hard: EffectiveHardControls): string[] {
  const lines: string[] = [];
  const m = hard.autonomyModules;
  const describe = (label: string, level: number) => {
    if (level < 25) return `${label}: suggest only — do not act without explicit user approval`;
    if (level < 50) return `${label}: prefer suggestions; confirm before acting`;
    if (level < 75) return `${label}: may act on routine items when low risk`;
    return `${label}: may act autonomously when risk is low`;
  };
  lines.push(describe('Scheduling', m.scheduling));
  lines.push(describe('Communication', m.communication));
  lines.push(describe('File management', m.fileManagement));
  lines.push(describe('Task creation', m.taskCreation));
  lines.push(describe('Data analysis', m.dataAnalysis));
  lines.push(describe('Cross-module actions', m.crossModuleActions));
  if (hard.financialThreshold > 0) {
    lines.push(`Financial actions: require approval above $${hard.financialThreshold}`);
  }
  if (hard.timeCommitmentThreshold > 0) {
    lines.push(`Time commitments: require approval above ${hard.timeCommitmentThreshold} minutes`);
  }
  if (hard.peopleAffectedThreshold > 0) {
    lines.push(
      `Actions affecting others: require approval when ${hard.peopleAffectedThreshold}+ people impacted`
    );
  }
  const tb = hard.timeBoundaries;
  if (tb?.workHours?.enabled) {
    lines.push(`Respect work-hours window ${tb.workHours.start}–${tb.workHours.end} for proactive actions`);
  }
  if (tb?.familyTime?.enabled) {
    lines.push(`Respect family-time window ${tb.familyTime.start}–${tb.familyTime.end}`);
  }
  if (tb?.sleepHours?.enabled) {
    lines.push(`Avoid proactive actions during sleep window ${tb.sleepHours.start}–${tb.sleepHours.end}`);
  }
  return lines;
}

function buildContextBlock(
  soft: EffectiveSoftPreferences,
  hard: EffectiveHardControls,
  inferred: EffectiveInferredPreference[]
): EffectivePreferencesContextBlock {
  const boundaries = buildAutonomyBoundaryLines(hard).slice(0, 8);
  const inferredHints =
    inferred.length > 0
      ? inferred.slice(0, 4).map((i) => `${i.label}: ${i.value.slice(0, 120)}`)
      : undefined;
  return {
    communication: {
      tone: soft.tone,
      verbosity: soft.verbosity,
      styleNotes: soft.communicationStyle.slice(0, 200),
    },
    response: {
      structure: soft.structurePreference,
      recommendationRichness: soft.recommendationRichness,
    },
    boundaries,
    inferredHints,
  };
}

function buildProviderPayload(
  soft: EffectiveSoftPreferences,
  hard: EffectiveHardControls,
  personalityData: Record<string, unknown>
): EffectivePreferencesProviderPayload {
  const questionnaireDetail = extractQuestionnairePromptDetail(personalityData);
  return {
    personality: {
      tone: soft.tone,
      verbosity: soft.verbosity,
      recommendationRichness: soft.recommendationRichness,
      structurePreference: soft.structurePreference,
      communicationStyle: soft.communicationStyle.slice(0, 240),
      ...(questionnaireDetail ? { questionnaireDetail } : {}),
    },
    autonomyBoundaries: {
      actionRules: buildAutonomyBoundaryLines(hard),
      moduleLevels: hard.autonomyModules,
    },
    softPromptInstructions: buildQuestionnaireSoftPromptInstructions(soft, questionnaireDetail),
  };
}

/** Inferred hints may adjust soft prefs only — never hard controls. */
function applyInferredSoftOverride(
  soft: EffectiveSoftPreferences,
  item: EffectiveInferredPreference,
  provenance: EffectivePreferencesProvenance
): void {
  const lower = item.value.toLowerCase();
  if (/\b(brief|short|concise|tl;dr)\b/.test(lower)) {
    soft.verbosity = 'brief';
    provenance.soft.verbosity = 'inferred';
  } else if (/\b(detailed|in depth|thorough|long form)\b/.test(lower)) {
    soft.verbosity = 'detailed';
    provenance.soft.verbosity = 'inferred';
  }
  if (/\b(casual|informal)\b/.test(lower)) {
    soft.tone = 'casual';
    provenance.soft.tone = 'inferred';
  } else if (/\b(formal|professional)\b/.test(lower)) {
    soft.tone = 'professional';
    provenance.soft.tone = 'inferred';
  }
}

export class PreferenceResolver {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(input: PreferenceResolverInput): Promise<ResolvedEffectivePreferences> {
    const { userId } = input;

    const [prefs, profile, autonomy, inferredContexts, appliedLearningEvents, memoryFactsFromDb] =
      await Promise.all([
      this.prisma.userPreference.findMany({
        where: {
          userId,
          key: { in: [PROVIDER_KEY, MODEL_OPENAI_KEY, MODEL_ANTHROPIC_KEY] },
        },
      }),
      this.prisma.aIPersonalityProfile.findUnique({ where: { userId } }),
      this.prisma.aIAutonomySettings.findUnique({ where: { userId } }),
      this.prisma.userAIContext.findMany({
        where: {
          userId,
          active: true,
          learningStatus: 'active',
          contextType: 'preference',
        },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        take: 5,
        select: { id: true, title: true, content: true, source: true, priority: true },
      }),
      this.prisma.aILearningEvent.findMany({
        where: {
          userId,
          validated: true,
          applied: true,
          confidence: { gte: APPLIED_LEARNING_CONFIDENCE_FLOOR },
          eventType: { in: [...HUMAN_REVIEWABLE_EVENT_TYPES] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          eventType: true,
          context: true,
          newBehavior: true,
          confidence: true,
          patternData: true,
        },
      }),
      input.retrievedMemoryFacts
        ? Promise.resolve(null)
        : memoryRetrievalService.retrieve({
            userId,
            query: '',
            businessId: input.businessId ?? undefined,
            limit: 5,
          }),
    ]);

    const memoryFacts: RetrievedMemoryFact[] = input.retrievedMemoryFacts
      ? input.retrievedMemoryFacts.slice(0, 5)
      : (memoryFactsFromDb?.facts ?? []);

    const prefMap = new Map(prefs.map((p) => [p.key, p.value]));
    const providerRaw = prefMap.get(PROVIDER_KEY);
    const preferredProvider =
      providerRaw === 'openai' || providerRaw === 'anthropic' || providerRaw === 'auto'
        ? providerRaw
        : 'auto';

    const hard: EffectiveHardControls = {
      preferredProvider,
      preferredModelOpenai: readString(prefMap.get(MODEL_OPENAI_KEY)) ?? null,
      preferredModelAnthropic: readString(prefMap.get(MODEL_ANTHROPIC_KEY)) ?? null,
      autonomyModules: {
        scheduling: clamp0_100(autonomy?.scheduling ?? DEFAULT_AUTONOMY_MODULES.scheduling),
        communication: clamp0_100(autonomy?.communication ?? DEFAULT_AUTONOMY_MODULES.communication),
        fileManagement: clamp0_100(autonomy?.fileManagement ?? DEFAULT_AUTONOMY_MODULES.fileManagement),
        taskCreation: clamp0_100(autonomy?.taskCreation ?? DEFAULT_AUTONOMY_MODULES.taskCreation),
        dataAnalysis: clamp0_100(autonomy?.dataAnalysis ?? DEFAULT_AUTONOMY_MODULES.dataAnalysis),
        crossModuleActions: clamp0_100(
          autonomy?.crossModuleActions ?? DEFAULT_AUTONOMY_MODULES.crossModuleActions
        ),
      },
      financialThreshold: autonomy?.financialThreshold ?? 0,
      timeCommitmentThreshold: autonomy?.timeCommitmentThreshold ?? 0,
      peopleAffectedThreshold: autonomy?.peopleAffectedThreshold ?? 0,
      timeBoundaries: {
        workHours: autonomy?.workHoursOverride
          ? {
              enabled: true,
              start: autonomy.workHoursStart ?? '09:00',
              end: autonomy.workHoursEnd ?? '17:00',
            }
          : undefined,
        familyTime: autonomy?.familyTimeOverride
          ? {
              enabled: true,
              start: autonomy.familyTimeStart ?? '18:00',
              end: autonomy.familyTimeEnd ?? '22:00',
            }
          : undefined,
        sleepHours: autonomy?.sleepHoursOverride
          ? {
              enabled: true,
              start: autonomy.sleepHoursStart ?? '22:00',
              end: autonomy.sleepHoursEnd ?? '07:00',
            }
          : undefined,
      },
    };

    const personalityData = isRecord(profile?.personalityData) ? profile.personalityData : {};
    const traits = isRecord(personalityData.traits) ? personalityData.traits : {};
    const prefObj = isRecord(personalityData.preferences) ? personalityData.preferences : {};
    const comm = isRecord(prefObj.communication) ? prefObj.communication : {};
    const decision = isRecord(prefObj.decision) ? prefObj.decision : {};

    const provenance: EffectivePreferencesProvenance = {
      hard: {
        preferredProvider: prefMap.has(PROVIDER_KEY) ? 'user' : 'default',
        preferredModelOpenai: prefMap.has(MODEL_OPENAI_KEY) ? 'user' : 'default',
        preferredModelAnthropic: prefMap.has(MODEL_ANTHROPIC_KEY) ? 'user' : 'default',
        autonomyModules: autonomy ? 'user' : 'default',
        financialThreshold: autonomy ? 'user' : 'default',
      },
      soft: {},
    };

    const hasQuestionnaire = Boolean(profile?.personalityData);
    const softSource: PreferenceProvenance = hasQuestionnaire ? 'questionnaire' : 'default';

    const soft: EffectiveSoftPreferences = {
      tone: mapFormalityToTone(comm.formality),
      verbosity: mapInformationNeedsToVerbosity(decision.informationNeeds),
      recommendationRichness: mapTraitsToRecommendationRichness(traits),
      structurePreference: mapToStructurePreference(
        decision.informationNeeds,
        typeof traits.conscientiousness === 'number' ? traits.conscientiousness : undefined
      ),
      communicationStyle: buildCommunicationStyleNotes(prefObj),
    };

    for (const key of Object.keys(soft) as (keyof EffectiveSoftPreferences)[]) {
      provenance.soft[key] = softSource;
    }

    const inferred: EffectiveInferredPreference[] = [];

    for (const ctx of inferredContexts) {
      const content = typeof ctx.content === 'string' ? ctx.content.trim() : '';
      if (!content) continue;
      inferred.push({
        id: ctx.id,
        kind: 'context',
        label: ctx.title || 'preference',
        value: content.slice(0, 300),
        confidence: Math.min(1, (ctx.priority ?? 50) / 100),
      });
    }

    for (const fact of memoryFacts) {
      if (fact.confidence < 0.55) continue;
      inferred.push({
        id: fact.id,
        kind: 'memory_fact',
        label: fact.subject,
        value: fact.predicate.slice(0, 300),
        confidence: fact.confidence,
        sourceType: fact.sourceType,
        category: fact.category,
        isExplicit: fact.isExplicit,
      });
    }

    for (const event of appliedLearningEvents) {
      const artifact = readLearningEventArtifact(event);
      const summary =
        isRecord(artifact) && typeof artifact.summary === 'string'
          ? artifact.summary.trim()
          : event.newBehavior.trim();
      if (!summary) continue;
      inferred.push({
        id: event.id,
        kind: 'learning_applied',
        label: event.context.trim().slice(0, 80) || event.eventType,
        value: summary.slice(0, 300),
        confidence: event.confidence,
        eventType: event.eventType,
      });
    }

    inferred.sort((a, b) => b.confidence - a.confidence);
    const topInferred = inferred.slice(0, 5);

    for (const item of topInferred) {
      if (
        (item.kind === 'context' || item.kind === 'learning_applied') &&
        item.confidence >= 0.6
      ) {
        applyInferredSoftOverride(soft, item, provenance);
      }
    }

    const contextBlock = buildContextBlock(soft, hard, topInferred);
    const providerPayload = buildProviderPayload(soft, hard, personalityData);

    return {
      hard,
      soft,
      inferred: topInferred,
      provenance,
      contextBlock,
      providerPayload,
    };
  }
}
