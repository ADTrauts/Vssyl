import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { PreferenceUpdate } from '../core/LearningEngine';
import type {
  SessionSoftPreferenceOverrides,
  SoftStructurePreference,
  SoftTone,
  SoftVerbosity,
} from './preferenceTypes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toneToFormality(tone: SoftTone): string {
  switch (tone) {
    case 'casual':
      return 'casual and friendly';
    case 'professional':
      return 'formal and professional';
    case 'warm':
      return 'warm and approachable';
    default:
      return 'professional but friendly';
  }
}

function verbosityToInformationNeeds(v: SoftVerbosity): string {
  switch (v) {
    case 'brief':
      return 'minimal';
    case 'detailed':
      return 'comprehensive';
    default:
      return 'moderate';
  }
}

/**
 * Persist session or explicit soft overrides into AIPersonalityProfile.questionnaire preferences.
 */
export async function promoteSessionSoftPreferences(
  userId: string,
  overrides: SessionSoftPreferenceOverrides
): Promise<void> {
  const profile = await prisma.aIPersonalityProfile.findUnique({ where: { userId } });
  const existing = isRecord(profile?.personalityData) ? { ...profile!.personalityData } : {};
  const prefs = isRecord(existing.preferences) ? { ...existing.preferences } : {};
  const comm = isRecord(prefs.communication) ? { ...prefs.communication } : {};
  const decision = isRecord(prefs.decision) ? { ...prefs.decision } : {};

  if (overrides.tone) {
    comm.formality = toneToFormality(overrides.tone);
  }
  if (overrides.verbosity) {
    decision.informationNeeds = verbosityToInformationNeeds(overrides.verbosity);
  }
  if (overrides.structurePreference === 'analytical') {
    decision.informationNeeds = 'comprehensive';
  } else if (overrides.structurePreference === 'conversational') {
    decision.informationNeeds = 'minimal';
  }

  prefs.communication = comm;
  prefs.decision = decision;
  existing.preferences = prefs;
  existing.questionnaireCompleted = existing.questionnaireCompleted ?? true;

  await prisma.aIPersonalityProfile.upsert({
    where: { userId },
    create: {
      userId,
      personalityData: existing as Prisma.InputJsonValue,
      learningHistory: [],
    },
    update: {
      personalityData: existing as Prisma.InputJsonValue,
    },
  });

  void logger.info('Promoted session soft preferences to profile', {
    operation: 'promote_session_soft_preferences',
    userId,
    keys: Object.keys(overrides).filter((k) => k !== 'summary'),
  });
}

/** Map legacy LearningEngine PreferenceUpdate into profile JSON. */
export async function applyLearningPreferenceUpdate(
  userId: string,
  update: PreferenceUpdate
): Promise<void> {
  const session: SessionSoftPreferenceOverrides = {};
  const key = `${update.category}.${update.key}`.toLowerCase();
  const val = String(update.newValue ?? '').toLowerCase();

  if (key.includes('tone') || key.includes('formality')) {
    if (val.includes('casual')) session.tone = 'casual';
    else if (val.includes('formal') || val.includes('professional')) session.tone = 'professional';
    else if (val.includes('warm')) session.tone = 'warm';
  }
  if (key.includes('verbosity') || key.includes('length') || key.includes('detail')) {
    if (val.includes('brief') || val.includes('short')) session.verbosity = 'brief';
    else if (val.includes('detail') || val.includes('long')) session.verbosity = 'detailed';
  }
  if (key.includes('structure')) {
    if (val.includes('analyt')) session.structurePreference = 'analytical';
    else if (val.includes('convers')) session.structurePreference = 'conversational';
    else session.structurePreference = 'structured' as SoftStructurePreference;
  }
  if (key.includes('recommendation') || key.includes('richness')) {
    if (val.includes('concise')) session.recommendationRichness = 'concise';
    else if (val.includes('rich')) session.recommendationRichness = 'rich';
  }

  if (Object.keys(session).filter((k) => k !== 'summary').length === 0) {
    void logger.debug('Learning preference update had no mappable soft fields', {
      operation: 'apply_learning_preference_update_skip',
      userId,
      category: update.category,
      key: update.key,
    });
    return;
  }

  await promoteSessionSoftPreferences(userId, session);
}
