import type { EffectivePreferencesPreview } from '../api/aiEffectivePreferences';

export type InfluencePermanence = 'permanent' | 'learned' | 'workspace' | 'session';

export interface InfluenceItem {
  id: string;
  label: string;
  detail?: string;
  permanence: InfluencePermanence;
}

export interface BuildInfluenceStackInput {
  preview: EffectivePreferencesPreview | null;
  memoryFactCount: number;
  learnedContextCount: number;
  userContextCount: number;
  pendingLearningCount: number;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Human-readable communication style line for identity home. */
export function describeCommunicationStyle(preview: EffectivePreferencesPreview): string {
  if (preview.communication.styleSummary) {
    return preview.communication.styleSummary;
  }

  const tone = capitalize(preview.communication.tone);
  const verbosity =
    preview.communication.verbosity === 'brief'
      ? 'concise'
      : preview.communication.verbosity === 'detailed'
        ? 'detailed'
        : 'balanced';
  const rec =
    preview.response.recommendationStyle === 'rich' ||
    preview.response.recommendationStyle === 'Rich'
      ? 'recommendation-rich'
      : preview.response.recommendationStyle === 'concise'
        ? 'focused'
        : 'balanced';

  return `You prefer ${tone} tone, ${verbosity} replies, and ${rec} suggestions.`;
}

export function buildInfluenceStack(input: BuildInfluenceStackInput): InfluenceItem[] {
  const items: InfluenceItem[] = [];
  const { preview, memoryFactCount, learnedContextCount, userContextCount, pendingLearningCount } =
    input;

  if (preview?.scopeNote) {
    items.push({
      id: 'workspace-policy',
      label: 'This workspace limits what your twin can suggest',
      detail: preview.scopeNote,
      permanence: 'workspace',
    });
  }

  if (preview && preview.actionBoundaries.length > 0) {
    const first = preview.actionBoundaries[0];
    items.push({
      id: 'autonomy-boundaries',
      label: 'Your action boundaries guide when your twin suggests vs asks for approval',
      detail: first.length > 120 ? `${first.slice(0, 117)}…` : first,
      permanence: 'permanent',
    });
  }

  if (preview?.setup.hasPersonalityProfile) {
    items.push({
      id: 'personality',
      label: 'Your personality profile shapes tone and communication style',
      permanence: 'permanent',
    });
  }

  if (learnedContextCount > 0 || (preview?.setup.inferredHintCount ?? 0) > 0) {
    items.push({
      id: 'learned-conversations',
      label: 'Learned from your recent conversations',
      detail:
        learnedContextCount > 0
          ? `${learnedContextCount} saved preference${learnedContextCount === 1 ? '' : 's'} from chat`
          : `${preview?.setup.inferredHintCount ?? 0} subtle preference hint${(preview?.setup.inferredHintCount ?? 0) === 1 ? '' : 's'} active`,
      permanence: 'learned',
    });
  }

  if (memoryFactCount > 0) {
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
      label: 'New observations waiting for you in Learning',
      detail: `${pendingLearningCount} item${pendingLearningCount === 1 ? '' : 's'} not applied yet`,
      permanence: 'learned',
    });
  }

  if (!preview?.setup.hasPersonalityProfile) {
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

  return items.slice(0, 8);
}
