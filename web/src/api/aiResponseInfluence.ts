/**
 * Per-turn explainability payload from twin metadata.responseInfluence
 */

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
  summary: string;
  shapedBy: string[];
  /** Module context available vs included in prompt (Phase 3D). */
  contextUsed?: ResponseInfluenceContextUsedItem[];
  sessionOnly?: string[];
  /** Structured memory influence for explain drawer (no raw predicates). */
  memoryItems?: ResponseInfluenceMemoryItem[];
  learningItems?: ResponseInfluenceLearningItem[];
  /** Backward-compatible subject list. */
  memoriesUsed?: Array<{ title: string; sourceLabel?: string; isExplicit?: boolean }>;
  workspacePolicies?: string[];
  autonomyNotes?: string[];
}

function parseMemoryItem(value: unknown): ResponseInfluenceMemoryItem | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const subject = typeof o.subject === 'string' ? o.subject.trim() : '';
  const id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : subject;
  if (!subject) return null;
  const sourceType = typeof o.sourceType === 'string' ? o.sourceType : undefined;
  const sourceLabel = typeof o.sourceLabel === 'string' ? o.sourceLabel : undefined;
  const confidence = typeof o.confidence === 'number' ? o.confidence : undefined;
  const isExplicit = typeof o.isExplicit === 'boolean' ? o.isExplicit : undefined;
  return {
    kind: 'memory_fact',
    id,
    subject,
    sourceType,
    confidence,
    isExplicit,
    sourceLabel,
  };
}

function parseLearningItem(value: unknown): ResponseInfluenceLearningItem | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const label = typeof o.label === 'string' ? o.label.trim() : '';
  const id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : label;
  if (!label) return null;
  const kind =
    o.kind === 'learning_applied' || o.kind === 'preference_context' ? o.kind : 'preference_context';
  const confidence = typeof o.confidence === 'number' ? o.confidence : undefined;
  const eventType = typeof o.eventType === 'string' ? o.eventType : undefined;
  return { kind, id, label, confidence, eventType };
}

function parseContextUsedItem(value: unknown): ResponseInfluenceContextUsedItem | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const moduleName = typeof o.moduleName === 'string' ? o.moduleName.trim() : '';
  if (!moduleName) return null;
  return {
    moduleName,
    usedInPrompt: o.usedInPrompt === true,
  };
}

export function extractResponseInfluenceFromTwinMetadata(
  metadata: Record<string, unknown> | undefined
): ResponseInfluenceSummary | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = metadata.responseInfluence;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const summary = typeof o.summary === 'string' ? o.summary.trim() : '';
  const shapedBy = Array.isArray(o.shapedBy)
    ? o.shapedBy.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];
  if (!summary && shapedBy.length === 0) return null;

  const sessionOnly = Array.isArray(o.sessionOnly)
    ? o.sessionOnly.filter((s): s is string => typeof s === 'string')
    : undefined;

  const memoryItems = Array.isArray(o.memoryItems)
    ? o.memoryItems.map(parseMemoryItem).filter((m): m is ResponseInfluenceMemoryItem => m !== null)
    : undefined;

  const learningItems = Array.isArray(o.learningItems)
    ? o.learningItems
        .map(parseLearningItem)
        .filter((m): m is ResponseInfluenceLearningItem => m !== null)
    : undefined;

  const memoriesUsed = Array.isArray(o.memoriesUsed)
    ? o.memoriesUsed
        .map((m) => {
          if (!m || typeof m !== 'object') return null;
          const row = m as { title?: string; sourceLabel?: string; isExplicit?: boolean };
          const title = row.title;
          if (typeof title !== 'string' || !title.trim()) return null;
          return {
            title: title.trim(),
            ...(typeof row.sourceLabel === 'string' ? { sourceLabel: row.sourceLabel } : {}),
            ...(typeof row.isExplicit === 'boolean' ? { isExplicit: row.isExplicit } : {}),
          };
        })
        .filter((m): m is { title: string; sourceLabel?: string; isExplicit?: boolean } => m !== null)
    : undefined;

  const workspacePolicies = Array.isArray(o.workspacePolicies)
    ? o.workspacePolicies.filter((s): s is string => typeof s === 'string')
    : undefined;
  const autonomyNotes = Array.isArray(o.autonomyNotes)
    ? o.autonomyNotes.filter((s): s is string => typeof s === 'string')
    : undefined;

  const contextUsed = Array.isArray(o.contextUsed)
    ? o.contextUsed
        .map(parseContextUsedItem)
        .filter((item): item is ResponseInfluenceContextUsedItem => item !== null)
    : undefined;

  return {
    summary: summary || 'This answer reflects your AI Identity and current context.',
    shapedBy,
    ...(contextUsed?.length ? { contextUsed } : {}),
    ...(sessionOnly?.length ? { sessionOnly } : {}),
    ...(memoryItems?.length ? { memoryItems } : {}),
    ...(learningItems?.length ? { learningItems } : {}),
    ...(memoriesUsed?.length ? { memoriesUsed } : {}),
    ...(workspacePolicies?.length ? { workspacePolicies } : {}),
    ...(autonomyNotes?.length ? { autonomyNotes } : {}),
  };
}
