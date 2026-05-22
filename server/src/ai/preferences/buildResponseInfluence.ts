import type { BusinessWorkspaceBoundaryBlock } from '../enterprise/businessWorkspaceBoundaries';
import type { AIAssembledContext } from '../context/AIContextAssembler';
import {
  isMemoryFactSourceType,
  memorySourceTypeUserLabel,
} from '../memory/memoryFactTypes';
import type {
  ResolvedEffectivePreferences,
  SessionSoftPreferenceOverrides,
} from './preferenceTypes';
import { describeCommunicationStyleFromPreview } from './buildInfluenceItems';
import { toEffectivePreferencesPreview } from './effectivePreferencesPreview';

export interface ResponseInfluenceMemoryItem {
  kind: 'memory_fact';
  id: string;
  subject: string;
  sourceType?: string;
  confidence?: number;
  isExplicit?: boolean;
  sourceLabel?: string;
}

export interface ResponseInfluenceLearningItem {
  kind: 'learning_applied' | 'preference_context';
  id: string;
  label: string;
  confidence?: number;
  eventType?: string;
}

export interface ResponseInfluenceContextUsedItem {
  moduleName: string;
  usedInPrompt: boolean;
}

export interface ResponseInfluenceSummary {
  /** One or two conversational sentences. */
  summary: string;
  /** Primary factors (max 5), plain language. */
  shapedBy: string[];
  /** Module context available vs used in prompt (Phase 3D). */
  contextUsed?: ResponseInfluenceContextUsedItem[];
  /** Ephemeral session-only adjustments for this chat. */
  sessionOnly?: string[];
  /** Structured memory influence for explain drawer (no raw predicates). */
  memoryItems?: ResponseInfluenceMemoryItem[];
  /** Saved learnings that shaped preferences (Phase 2D). */
  learningItems?: ResponseInfluenceLearningItem[];
  /** @deprecated Prefer memoryItems — kept for backward-compatible clients. */
  memoriesUsed?: Array<{ title: string; sourceLabel?: string; isExplicit?: boolean }>;
  /** Workspace policy lines when in business context. */
  workspacePolicies?: string[];
  /** Action boundary hints. */
  autonomyNotes?: string[];
}

export interface BuildResponseInfluenceInput {
  effectivePreferences?: ResolvedEffectivePreferences;
  sessionAdjustments?: SessionSoftPreferenceOverrides;
  businessBoundaries?: BusinessWorkspaceBoundaryBlock;
  userMemoryFacts?: Array<{
    id?: string;
    subject: string;
    predicate: string;
    sourceType?: string;
    confidence?: number;
    isExplicit?: boolean;
  }>;
  recalledMessageCount?: number;
  modulesFocused?: string[];
  hasPersonalityProfile?: boolean;
  hasAutonomySettings?: boolean;
  assembledContext?: Pick<AIAssembledContext, 'contextAvailability' | 'usedModules'>;
}

const MODULE_LIVE_CONTEXT_PREFIX = 'Module live context: ';

export function buildContextUsedFromAssembly(
  assembledContext?: Pick<AIAssembledContext, 'contextAvailability' | 'usedModules'>
): ResponseInfluenceContextUsedItem[] {
  if (!assembledContext?.contextAvailability?.length) {
    return (assembledContext?.usedModules ?? []).slice(0, 6).map((moduleName) => ({
      moduleName,
      usedInPrompt: false,
    }));
  }

  const items: ResponseInfluenceContextUsedItem[] = [];
  const seen = new Set<string>();

  for (const row of assembledContext.contextAvailability) {
    if (row.title.startsWith(MODULE_LIVE_CONTEXT_PREFIX)) {
      const moduleName = row.title.slice(MODULE_LIVE_CONTEXT_PREFIX.length).trim();
      const key = moduleName.toLowerCase();
      if (!moduleName || seen.has(key)) continue;
      seen.add(key);
      items.push({ moduleName, usedInPrompt: row.usedInPrompt });
      continue;
    }

    if (row.title === 'Cross-module summary') {
      const key = 'cross-module summary';
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ moduleName: 'Cross-module synthesis', usedInPrompt: row.usedInPrompt });
    }
  }

  return items;
}

const MAX_SHAPED_BY = 5;
const MAX_MEMORIES = 3;
const MAX_LEARNING_ITEMS = 3;
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
  const memoryItems: ResponseInfluenceMemoryItem[] = [];
  const learningItems: ResponseInfluenceLearningItem[] = [];
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
          : inf.kind === 'learning_applied'
            ? `I applied a learning you saved (${inf.label})`
            : `I applied a preference you saved: ${inf.label}`;
      pushUnique(shapedBy, line);
    }

    for (const inf of effectivePreferences.inferred) {
      if (inf.kind !== 'learning_applied' && inf.kind !== 'context') continue;
      if (learningItems.length >= MAX_LEARNING_ITEMS) break;
      if (learningItems.some((item) => item.id === inf.id)) continue;
      learningItems.push({
        kind: inf.kind === 'learning_applied' ? 'learning_applied' : 'preference_context',
        id: inf.id,
        label: inf.label,
        confidence: Math.round(inf.confidence * 100) / 100,
        ...(inf.eventType ? { eventType: inf.eventType } : {}),
      });
    }

    const boundary = preview.actionBoundaries[0];
    if (boundary) {
      pushUnique(autonomyNotes, boundary);
      if (shapedBy.length < MAX_SHAPED_BY) {
        pushUnique(shapedBy, 'Your action boundaries influenced what I could suggest');
      }
    }
  }

  if (input.userMemoryFacts && input.userMemoryFacts.length > 0) {
    for (const fact of input.userMemoryFacts.slice(0, MAX_MEMORIES)) {
      const subject = fact.subject?.trim() || 'something you asked me to remember';
      const id = fact.id?.trim() || subject;
      const sourceType =
        fact.sourceType && isMemoryFactSourceType(fact.sourceType) ? fact.sourceType : undefined;
      const sourceLabel = sourceType ? memorySourceTypeUserLabel(sourceType) : undefined;

      if (!memoryItems.some((m) => m.id === id)) {
        memoryItems.push({
          kind: 'memory_fact',
          id,
          subject,
          sourceType,
          confidence:
            typeof fact.confidence === 'number'
              ? Math.round(fact.confidence * 100) / 100
              : undefined,
          isExplicit: fact.isExplicit,
          sourceLabel,
        });
      }
    }
    if (memoryItems.length > 0 && !shapedBy.some((s) => s.includes('remember'))) {
      const explicitCount = memoryItems.filter((m) => m.isExplicit !== false).length;
      pushUnique(
        shapedBy,
        explicitCount > 0
          ? `I drew on ${memoryItems.length} memory fact${memoryItems.length === 1 ? '' : 's'} you saved or asked me to remember`
          : `I used ${memoryItems.length} inferred memory fact${memoryItems.length === 1 ? '' : 's'}`
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

  const contextUsed = buildContextUsedFromAssembly(input.assembledContext);
  const usedModuleNames = contextUsed.filter((c) => c.usedInPrompt).map((c) => c.moduleName);
  if (usedModuleNames.length > 0 && shapedBy.length < MAX_SHAPED_BY) {
    pushUnique(
      shapedBy,
      `Live context from ${usedModuleNames.slice(0, 3).join(', ')} was included in this reply`
    );
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

  const memoriesUsed =
    memoryItems.length > 0
      ? memoryItems.map((m) => ({
          title: m.subject,
          sourceLabel: m.sourceLabel,
          isExplicit: m.isExplicit,
        }))
      : undefined;

  return {
    summary,
    shapedBy: trimmedShapedBy,
    ...(contextUsed.length > 0 && { contextUsed }),
    ...(sessionOnly.length > 0 && { sessionOnly }),
    ...(memoryItems.length > 0 && { memoryItems, memoriesUsed }),
    ...(learningItems.length > 0 && { learningItems }),
    ...(workspacePolicies.length > 0 && { workspacePolicies }),
    ...(autonomyNotes.length > 0 && { autonomyNotes }),
  };
}
