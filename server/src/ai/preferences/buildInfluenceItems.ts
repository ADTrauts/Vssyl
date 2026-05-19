import type { ResolvedEffectivePreferences } from './preferenceTypes';
import type { EffectivePreferencesPreview } from './effectivePreferencesPreview';

export type InfluencePermanence = 'permanent' | 'learned' | 'workspace' | 'session';

export interface AIIdentityInfluence {
  id: string;
  label: string;
  detail?: string;
  permanence: InfluencePermanence;
}

export interface BuildInfluenceItemsInput {
  preview: EffectivePreferencesPreview;
  resolved: ResolvedEffectivePreferences;
  memoryFactCount: number;
  learnedContextCount: number;
  userContextCount: number;
  pendingLearningCount: number;
  businessPolicyLines?: string[];
}

/**
 * Human-readable influence stack for AI Identity UI (no provenance keys).
 */
export function buildInfluenceItems(input: BuildInfluenceItemsInput): AIIdentityInfluence[] {
  const {
    preview,
    resolved,
    memoryFactCount,
    learnedContextCount,
    userContextCount,
    pendingLearningCount,
    businessPolicyLines,
  } = input;

  const items: AIIdentityInfluence[] = [];

  if (businessPolicyLines && businessPolicyLines.length > 0) {
    items.push({
      id: 'workspace-policy',
      label: 'This workspace shapes what your twin can access and do',
      detail: businessPolicyLines[0],
      permanence: 'workspace',
    });
  } else if (preview.scopeNote) {
    items.push({
      id: 'workspace-policy',
      label: 'Workspace policies apply in addition to your personal AI Identity',
      detail: preview.scopeNote,
      permanence: 'workspace',
    });
  }

  if (preview.actionBoundaries.length > 0) {
    items.push({
      id: 'autonomy-boundaries',
      label: 'Your autonomy settings guide when your twin suggests vs acts',
      detail: preview.actionBoundaries[0],
      permanence: 'permanent',
    });
  }

  if (preview.setup.hasPersonalityProfile) {
    items.push({
      id: 'personality',
      label: 'Your personality profile shapes tone and communication style',
      permanence: 'permanent',
    });
  }

  for (const inf of resolved.inferred.slice(0, 4)) {
    const label =
      inf.kind === 'memory_fact'
        ? `You asked me to remember: ${inf.label}`
        : `Learned from you: ${inf.label}`;
    const detail =
      inf.value.length > 140 ? `${inf.value.slice(0, 137)}…` : inf.value;
    items.push({
      id: `inferred-${inf.id}`,
      label,
      detail,
      permanence: 'learned',
    });
  }

  if (learnedContextCount > 0 && resolved.inferred.length === 0) {
    items.push({
      id: 'learned-conversations',
      label: 'Learned from your recent conversations',
      detail: `${learnedContextCount} saved preference${learnedContextCount === 1 ? '' : 's'} from chat`,
      permanence: 'learned',
    });
  }

  if (memoryFactCount > 0 && !resolved.inferred.some((i) => i.kind === 'memory_fact')) {
    items.push({
      id: 'memory-facts',
      label: 'You asked your twin to remember specific things',
      detail: `${memoryFactCount} long-term memor${memoryFactCount === 1 ? 'y' : 'ies'}`,
      permanence: 'permanent',
    });
  }

  if (userContextCount > 0) {
    items.push({
      id: 'user-context',
      label: 'Instructions and context you added directly',
      detail: `${userContextCount} active entr${userContextCount === 1 ? 'y' : 'ies'}`,
      permanence: 'permanent',
    });
  }

  if (pendingLearningCount > 0) {
    items.push({
      id: 'pending-learning',
      label: 'New observations waiting in Learning',
      detail: `${pendingLearningCount} item${pendingLearningCount === 1 ? '' : 's'} not applied yet`,
      permanence: 'learned',
    });
  }

  if (!preview.setup.hasPersonalityProfile) {
    items.push({
      id: 'setup-personality',
      label: 'Complete your personality profile for richer style matching',
      permanence: 'permanent',
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'defaults',
      label: 'Your twin is using thoughtful defaults until you personalize more',
      permanence: 'permanent',
    });
  }

  return items.slice(0, 10);
}

export function describeCommunicationStyleFromPreview(
  preview: EffectivePreferencesPreview
): string {
  if (preview.communication.styleSummary?.trim()) {
    return preview.communication.styleSummary.trim();
  }
  const tone = preview.communication.tone;
  const verbosity =
    preview.communication.verbosity === 'brief'
      ? 'concise'
      : preview.communication.verbosity === 'detailed'
        ? 'detailed'
        : 'balanced';
  const rec = preview.response.recommendationStyle;
  return `You prefer ${tone} tone, ${verbosity} replies, and ${rec} suggestions.`;
}
