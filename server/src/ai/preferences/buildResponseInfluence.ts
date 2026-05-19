import type { BusinessWorkspaceBoundaryBlock } from '../enterprise/businessWorkspaceBoundaries';
import type {
  ResolvedEffectivePreferences,
  SessionSoftPreferenceOverrides,
} from './preferenceTypes';
import { describeCommunicationStyleFromPreview } from './buildInfluenceItems';
import { toEffectivePreferencesPreview } from './effectivePreferencesPreview';

export interface ResponseInfluenceSummary {
  /** One or two conversational sentences. */
  summary: string;
  /** Primary factors (max 5), plain language. */
  shapedBy: string[];
  /** Ephemeral session-only adjustments for this chat. */
  sessionOnly?: string[];
  /** Memory subjects referenced in this turn (not raw predicates). */
  memoriesUsed?: Array<{ title: string }>;
  /** Workspace policy lines when in business context. */
  workspacePolicies?: string[];
  /** Autonomy / action gating hints. */
  autonomyNotes?: string[];
}

export interface BuildResponseInfluenceInput {
  effectivePreferences?: ResolvedEffectivePreferences;
  sessionAdjustments?: SessionSoftPreferenceOverrides;
  businessBoundaries?: BusinessWorkspaceBoundaryBlock;
  userMemoryFacts?: Array<{ subject: string; predicate: string }>;
  recalledMessageCount?: number;
  modulesFocused?: string[];
  hasPersonalityProfile?: boolean;
  hasAutonomySettings?: boolean;
}

const MAX_SHAPED_BY = 5;
const MAX_MEMORIES = 3;
const MAX_POLICIES = 3;

function pushUnique(target: string[], line: string): void {
  if (!line.trim()) return;
  if (target.includes(line)) return;
  target.push(line);
}

/**
 * Build user-safe explainability metadata for a single assistant turn.
 */
export function buildResponseInfluence(input: BuildResponseInfluenceInput): ResponseInfluenceSummary {
  const shapedBy: string[] = [];
  const sessionOnly: string[] = [];
  const memoriesUsed: Array<{ title: string }> = [];
  const workspacePolicies: string[] = [];
  const autonomyNotes: string[] = [];

  const { effectivePreferences, sessionAdjustments, businessBoundaries } = input;

  if (sessionAdjustments) {
    const label =
      sessionAdjustments.summary?.trim() ||
      [sessionAdjustments.tone, sessionAdjustments.verbosity]
        .filter(Boolean)
        .join(', ') ||
      'a different style';
    const line = `This chat is temporarily using ${label} — only for this conversation unless you save it to AI Identity.`;
    pushUnique(sessionOnly, line);
    pushUnique(shapedBy, `You asked for ${label} in this conversation`);
  }

  if (businessBoundaries) {
    for (const line of businessBoundaries.policyLines.slice(0, MAX_POLICIES)) {
      pushUnique(workspacePolicies, line);
      pushUnique(shapedBy, line);
    }
    for (const hint of (businessBoundaries.businessVoiceHints ?? []).slice(0, 2)) {
      pushUnique(workspacePolicies, hint);
    }
    if (businessBoundaries.businessName && workspacePolicies.length > 0) {
      pushUnique(
        shapedBy,
        `${businessBoundaries.businessName} workspace policies shaped what I could access and suggest`
      );
    }
  }

  if (effectivePreferences) {
    const preview = toEffectivePreferencesPreview(effectivePreferences, {
      hasPersonalityProfile: input.hasPersonalityProfile ?? true,
      hasAutonomySettings: input.hasAutonomySettings ?? true,
      businessId: businessBoundaries?.businessId,
      hasBusinessWorkspacePolicies: Boolean(businessBoundaries),
    });

    if (!sessionAdjustments) {
      pushUnique(
        shapedBy,
        describeCommunicationStyleFromPreview(preview).replace(/^You prefer /i, 'Your AI Identity prefers ')
      );
    }

    for (const inf of effectivePreferences.inferred.slice(0, 2)) {
      const line =
        inf.kind === 'memory_fact'
          ? `I used what you asked me to remember about ${inf.label}`
          : `I applied a preference you saved: ${inf.label}`;
      pushUnique(shapedBy, line);
    }

    const boundary = preview.actionBoundaries[0];
    if (boundary) {
      pushUnique(autonomyNotes, boundary);
      if (shapedBy.length < MAX_SHAPED_BY) {
        pushUnique(shapedBy, 'Your autonomy settings influenced what I could suggest or do');
      }
    }
  }

  if (input.userMemoryFacts && input.userMemoryFacts.length > 0) {
    for (const fact of input.userMemoryFacts.slice(0, MAX_MEMORIES)) {
      const title = fact.subject?.trim() || 'something you asked me to remember';
      if (!memoriesUsed.some((m) => m.title === title)) {
        memoriesUsed.push({ title });
      }
    }
    if (memoriesUsed.length > 0 && !shapedBy.some((s) => s.includes('remember'))) {
      pushUnique(
        shapedBy,
        `I drew on ${memoriesUsed.length} thing${memoriesUsed.length === 1 ? '' : 's'} you asked me to remember`
      );
    }
  }

  if ((input.recalledMessageCount ?? 0) > 0) {
    pushUnique(
      shapedBy,
      `I brought in context from ${input.recalledMessageCount} earlier message${input.recalledMessageCount === 1 ? '' : 's'} you asked about`
    );
  }

  const modules = input.modulesFocused?.filter(Boolean) ?? [];
  if (modules.length > 0 && shapedBy.length < MAX_SHAPED_BY) {
    const names = modules.slice(0, 3).join(', ');
    pushUnique(shapedBy, `Relevant parts of your workspace (${names}) informed this reply`);
  }

  const trimmedShapedBy = shapedBy.slice(0, MAX_SHAPED_BY);

  let summary: string;
  if (sessionOnly.length > 0) {
    summary =
      'I shaped this answer using your temporary chat style, your AI Identity, and any workspace rules that apply.';
  } else if (workspacePolicies.length > 0) {
    summary =
      'I shaped this answer using your AI Identity and your organization’s workspace policies.';
  } else if (trimmedShapedBy.length > 0) {
    summary = 'I shaped this answer using your AI Identity and what I know about you.';
  } else {
    summary = 'I shaped this answer using your AI Identity defaults.';
  }

  return {
    summary,
    shapedBy: trimmedShapedBy,
    ...(sessionOnly.length > 0 && { sessionOnly }),
    ...(memoriesUsed.length > 0 && { memoriesUsed }),
    ...(workspacePolicies.length > 0 && { workspacePolicies }),
    ...(autonomyNotes.length > 0 && { autonomyNotes }),
  };
}
