/**
 * Per-turn explainability payload from twin metadata.responseInfluence
 */

export interface ResponseInfluenceSummary {
  summary: string;
  shapedBy: string[];
  sessionOnly?: string[];
  memoriesUsed?: Array<{ title: string }>;
  workspacePolicies?: string[];
  autonomyNotes?: string[];
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
  const memoriesUsed = Array.isArray(o.memoriesUsed)
    ? o.memoriesUsed
        .map((m) => {
          if (!m || typeof m !== 'object') return null;
          const title = (m as { title?: string }).title;
          return typeof title === 'string' && title.trim() ? { title: title.trim() } : null;
        })
        .filter((m): m is { title: string } => m !== null)
    : undefined;
  const workspacePolicies = Array.isArray(o.workspacePolicies)
    ? o.workspacePolicies.filter((s): s is string => typeof s === 'string')
    : undefined;
  const autonomyNotes = Array.isArray(o.autonomyNotes)
    ? o.autonomyNotes.filter((s): s is string => typeof s === 'string')
    : undefined;

  return {
    summary: summary || 'This answer reflects your AI Identity and current context.',
    shapedBy,
    ...(sessionOnly?.length ? { sessionOnly } : {}),
    ...(memoriesUsed?.length ? { memoriesUsed } : {}),
    ...(workspacePolicies?.length ? { workspacePolicies } : {}),
    ...(autonomyNotes?.length ? { autonomyNotes } : {}),
  };
}
