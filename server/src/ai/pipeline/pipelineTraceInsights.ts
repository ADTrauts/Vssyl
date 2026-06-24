/**
 * Pure derived insights for admin pipeline traces (operations console).
 */

import { GROUNDING_ISSUE } from './buildPipelineTrace';
import { getDefaultPipelineCatalog, getWeakPhrasesFromCatalog } from './pipelineCatalogDefaults';
import type {
  AIPipelineTrace,
  PipelineCatalog,
  PipelineContextSourceDefinition,
  PipelineContextSourceId,
  PipelineEvidenceBundle,
  PipelineIntentId,
} from '../types/pipelineDiagnostics';

export type PipelineContextUsedStatus = 'used' | 'not_used' | 'planned' | 'disabled';
export type PipelineReasoningDepth = 'LOW' | 'MEDIUM' | 'HIGH';

export type PipelineFailureCategory =
  | 'GROUNDING_FAILURE'
  | 'RETRIEVAL_FAILURE'
  | 'TOOL_SELECTION_FAILURE'
  | 'GENERIC_RESPONSE'
  | 'LOW_CONFIDENCE_RESPONSE'
  | 'MISSING_CONTEXT'
  | 'POLICY_MISMATCH';

export interface PipelineContextUsedRow {
  id: string;
  label: string;
  status: PipelineContextUsedStatus;
  itemCount?: number;
  statusReason?: string;
}

export interface PipelineTraceInsights {
  flagReasons: string[];
  contextUsed: PipelineContextUsedRow[];
  reasoningDepth: PipelineReasoningDepth;
  failureCategories: PipelineFailureCategory[];
}

const INTENT_LABELS: Record<PipelineIntentId, string> = {
  emotional_support: 'Emotional support intent detected',
  local_discovery: 'Local discovery intent detected',
  recommendation: 'Recommendation intent detected',
  planning: 'Planning intent detected',
  research: 'Research intent detected',
  personal_reflection: 'Personal reflection intent detected',
  business_operations: 'Business operations intent detected',
  technical_help: 'Technical help intent detected',
  workflow_action: 'Workflow action intent detected',
  project_assistant: 'Project assistant intent detected',
  general_chat: 'General chat intent detected',
};

/** Display order for operations console checklist. */
const CONTEXT_CHECKLIST_ORDER: Array<{
  id: PipelineContextSourceId | 'tool_outputs';
  label: string;
}> = [
  { id: 'user_memory', label: 'User memory' },
  { id: 'recent_conversations', label: 'Conversation history' },
  { id: 'profile', label: 'Profile' },
  { id: 'location', label: 'Location' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'drive_files', label: 'Drive / files' },
  { id: 'business_context', label: 'Business context' },
  { id: 'vssyl_place', label: 'Vssyl Place' },
  { id: 'vlink', label: 'V_Link Relationships' },
  { id: 'graph_bundle', label: 'Context Graph Bundles' },
  { id: 'web_search', label: 'Web search' },
  { id: 'module_context', label: 'Module context' },
  { id: 'tool_outputs', label: 'Tool outputs' },
];

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '_');
}

function haystack(trace: AIPipelineTrace, bundle?: PipelineEvidenceBundle): string {
  const parts: string[] = [
    ...trace.sourcesUsed,
    ...trace.contextRetrieved.map((c) => `${c.source} ${c.provider ?? ''}`),
    ...trace.toolsUsed.map((t) => t.name),
    ...(bundle?.assembledUsedModules ?? []),
  ];
  return parts.map(normalizeToken).join(' ');
}

function matchesSource(hay: string, ...needles: string[]): boolean {
  return needles.some((n) => hay.includes(normalizeToken(n)));
}

function countForSource(
  trace: AIPipelineTrace,
  bundle: PipelineEvidenceBundle | undefined,
  sourceId: PipelineContextSourceId | 'tool_outputs'
): number {
  if (sourceId === 'tool_outputs') {
    return trace.toolsUsed.filter((t) => t.success).length || trace.toolsUsed.length;
  }

  const hay = haystack(trace, bundle);

  switch (sourceId) {
    case 'user_memory':
      return trace.memoryRetrieved.facts;
    case 'recent_conversations':
      return (
        trace.memoryRetrieved.recalledMessages + (trace.memoryRetrieved.threadMemory ? 1 : 0)
      );
    case 'profile':
      return matchesSource(hay, 'profile') ? 1 : 0;
    case 'location':
      if (trace.toolsUsed.some((t) => t.name === 'location')) return 1;
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source), 'location'))
        .reduce((sum, c) => sum + Math.max(c.itemCount, 1), 0);
    case 'calendar':
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source + (c.provider ?? '')), 'calendar'))
        .reduce((sum, c) => sum + c.itemCount, 0);
    case 'drive_files':
      if (trace.toolsUsed.some((t) => t.name === 'list_drive_files' || t.name === 'share_file')) {
        return trace.toolsUsed.filter((t) =>
          ['list_drive_files', 'share_file'].includes(t.name)
        ).length;
      }
      return matchesSource(hay, 'drive', 'drive_files') ? 1 : 0;
    case 'business_context':
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source), 'business'))
        .reduce((sum, c) => sum + c.itemCount, 0);
    case 'vssyl_place':
      if (trace.toolsUsed.some((t) => t.name === 'place_search')) return 1;
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source + (c.provider ?? '')), 'place', 'vssyl'))
        .reduce((sum, c) => sum + c.itemCount, 0);
    case 'vlink':
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source + (c.provider ?? '')), 'vlink'))
        .reduce((sum, c) => sum + Math.max(c.itemCount, 0), 0);
    case 'graph_bundle':
      return trace.contextRetrieved
        .filter((c) => matchesSource(normalizeToken(c.source + (c.provider ?? '')), 'graph_bundle'))
        .reduce((sum, c) => sum + Math.max(c.itemCount, 0), 0);
    case 'web_search':
      return trace.toolsUsed.some((t) => t.name === 'web_search') ? 1 : 0;
    case 'module_context':
      return (
        trace.contextRetrieved
          .filter(
            (c) =>
              matchesSource(normalizeToken(c.source), 'module') &&
              !matchesSource(normalizeToken(c.source + (c.provider ?? '')), 'vlink')
          )
          .reduce((sum, c) => sum + c.itemCount, 0) +
        (bundle?.assembledUsedModules.filter((m) => m !== 'vlink').length ?? 0)
      );
    default:
      return 0;
  }
}

function catalogSourceDef(
  catalog: PipelineCatalog,
  sourceId: PipelineContextSourceId
): PipelineContextSourceDefinition | undefined {
  return catalog.contextSources.find((s) => s.id === sourceId);
}

function toolEnabled(catalog: PipelineCatalog, toolId: string): boolean {
  const policy = catalog.toolPolicies.find((t) => t.toolId === toolId);
  return policy?.enabled !== false;
}

function detectUsed(
  trace: AIPipelineTrace,
  bundle: PipelineEvidenceBundle | undefined,
  sourceId: PipelineContextSourceId | 'tool_outputs'
): { used: boolean; itemCount: number } {
  const itemCount = countForSource(trace, bundle, sourceId);
  return { used: itemCount > 0, itemCount };
}

export function buildContextUsedRows(
  trace: AIPipelineTrace,
  catalog?: PipelineCatalog
): PipelineContextUsedRow[] {
  const cat = catalog ?? getDefaultPipelineCatalog();
  const bundle = trace.evidenceBundle;

  return CONTEXT_CHECKLIST_ORDER.map(({ id, label }) => {
    if (id === 'tool_outputs') {
      const { used, itemCount } = detectUsed(trace, bundle, id);
      return {
        id,
        label,
        status: used ? 'used' : 'not_used',
        itemCount: itemCount > 0 ? itemCount : undefined,
        statusReason: used ? `${itemCount} tool invocation(s)` : 'No tools executed',
      } satisfies PipelineContextUsedRow;
    }

    const def = catalogSourceDef(cat, id);
    const enabled = def?.enabled !== false;
    const wired = def?.wiredInTwin === true;

    if (!enabled) {
      return {
        id,
        label: def?.label ?? label,
        status: 'disabled',
        statusReason: 'Disabled in pipeline catalog',
      } satisfies PipelineContextUsedRow;
    }

    if (!wired) {
      const { used, itemCount } = detectUsed(trace, bundle, id);
      if (used) {
        return {
          id,
          label: def?.label ?? label,
          status: 'used',
          itemCount,
          statusReason: 'Used via prepass or supplemental path',
        } satisfies PipelineContextUsedRow;
      }
      return {
        id,
        label: def?.label ?? label,
        status: 'planned',
        statusReason: 'Enabled but not wired into twin assembly yet',
      } satisfies PipelineContextUsedRow;
    }

    if (id === 'web_search' && !toolEnabled(cat, 'web_search')) {
      const { used, itemCount } = detectUsed(trace, bundle, id);
      if (used) {
        return {
          id,
          label: def?.label ?? label,
          status: 'used',
          itemCount,
        } satisfies PipelineContextUsedRow;
      }
      return {
        id,
        label: def?.label ?? label,
        status: 'disabled',
        statusReason: 'Web search tool is not enabled',
      } satisfies PipelineContextUsedRow;
    }

    const { used, itemCount } = detectUsed(trace, bundle, id);
    return {
      id,
      label: def?.label ?? label,
      status: used ? 'used' : 'not_used',
      itemCount: itemCount > 0 ? itemCount : undefined,
      statusReason: used ? undefined : 'Available but not detected in this trace',
    } satisfies PipelineContextUsedRow;
  });
}

function findWeakPhraseInResponse(
  response: string,
  catalog: PipelineCatalog
): string | undefined {
  const lower = response.toLowerCase();
  return getWeakPhrasesFromCatalog(catalog).find((phrase) => lower.includes(phrase.toLowerCase()));
}

export function buildFlagReasons(trace: AIPipelineTrace, catalog?: PipelineCatalog): string[] {
  const cat = catalog ?? getDefaultPipelineCatalog();
  const reasons: string[] = [];
  const seen = new Set<string>();

  const add = (line: string) => {
    if (!seen.has(line)) {
      seen.add(line);
      reasons.push(line);
    }
  };

  for (const intent of trace.intentDetected) {
    const label = INTENT_LABELS[intent];
    if (label) add(label);
  }

  if (trace.groundingRequired) {
    add('Grounding was required for the detected intent(s)');
  }

  if (trace.groundingRequired && !trace.retrievalPerformed) {
    add('No retrieval or tool usage occurred');
  }

  if (trace.toolsConsidered.length > 0 && trace.toolsUsed.length === 0) {
    add(`Tools were considered (${trace.toolsConsidered.join(', ')}) but none were used`);
  }

  for (const issue of trace.issues) {
    if (issue.includes(GROUNDING_ISSUE) || issue.toLowerCase().includes('grounding')) {
      add('Grounding was required but no retrieval/tool was used');
    } else {
      add(issue);
    }
  }

  for (const warning of trace.qualityWarnings) {
    add(warning);
  }

  const weakPhrase = findWeakPhraseInResponse(trace.finalResponsePreview, cat);
  if (weakPhrase) {
    add(`Weak generic phrase detected: "${weakPhrase}"`);
  }

  if (
    trace.confidenceLevel === 'medium' &&
    trace.groundingRequired &&
    !trace.retrievalPerformed
  ) {
    add('Confidence was medium despite missing evidence');
  }

  if (trace.confidenceLevel === 'high' && !trace.retrievalPerformed && trace.groundingRequired) {
    add('Confidence was high but grounding retrieval was missing');
  }

  if (trace.enforcementApplied && trace.enforcementAction && trace.enforcementAction !== 'none') {
    add(`Enforcement applied: ${trace.enforcementAction}`);
  }

  if (trace.genericResponseRisk && reasons.length === 0) {
    add('Response flagged as generic or under-grounded');
  }

  return reasons;
}

function distinctContextSourcesUsed(trace: AIPipelineTrace, bundle?: PipelineEvidenceBundle): number {
  const rows = buildContextUsedRows(trace);
  const usedRows = rows.filter((r) => r.status === 'used' && r.id !== 'tool_outputs').length;
  const toolUsed = trace.toolsUsed.length > 0 ? 1 : 0;
  const moduleCount = bundle?.assembledUsedModules.length ?? 0;
  return usedRows + toolUsed + (moduleCount > 0 ? 1 : 0);
}

function hasEvidence(bundle?: PipelineEvidenceBundle): boolean {
  if (!bundle) return false;
  return (
    bundle.assembledEvidence.length > 0 ||
    bundle.structuredEvidence.length > 0 ||
    bundle.retrievalRecords.some((r) => r.itemCount > 0)
  );
}

export function deriveReasoningDepth(
  trace: AIPipelineTrace,
  evidenceBundle?: PipelineEvidenceBundle
): PipelineReasoningDepth {
  const bundle = evidenceBundle ?? trace.evidenceBundle;
  const meaningfulContext =
    trace.contextRetrieved.some((c) => c.itemCount > 0) ||
    trace.memoryRetrieved.facts > 0 ||
    trace.memoryRetrieved.recalledMessages > 0 ||
    trace.memoryRetrieved.threadMemory;

  const groundingSatisfied =
    !trace.groundingRequired || (trace.retrievalPerformed && !trace.genericResponseRisk);

  const sourceCount = distinctContextSourcesUsed(trace, bundle);

  const isHigh =
    trace.retrievalPerformed &&
    trace.toolsUsed.length > 0 &&
    sourceCount >= 2 &&
    groundingSatisfied &&
    (hasEvidence(bundle) || meaningfulContext);

  if (isHigh) return 'HIGH';

  const isLow =
    !trace.retrievalPerformed &&
    trace.toolsUsed.length === 0 &&
    !meaningfulContext &&
    (trace.genericResponseRisk || trace.confidenceLevel === 'low');

  if (isLow) return 'LOW';

  return 'MEDIUM';
}

export function buildFailureCategories(trace: AIPipelineTrace): PipelineFailureCategory[] {
  const categories = new Set<PipelineFailureCategory>();

  if (trace.groundingRequired && !trace.retrievalPerformed) {
    categories.add('GROUNDING_FAILURE');
    categories.add('RETRIEVAL_FAILURE');
  } else if (trace.groundingRequired && trace.retrievalPerformed && trace.genericResponseRisk) {
    categories.add('GROUNDING_FAILURE');
  }

  if (
    trace.toolsConsidered.length > 0 &&
    trace.toolsUsed.length === 0 &&
    trace.groundingRequired
  ) {
    categories.add('TOOL_SELECTION_FAILURE');
  }

  if (trace.genericResponseRisk) {
    categories.add('GENERIC_RESPONSE');
  }

  if (trace.confidenceLevel === 'low') {
    categories.add('LOW_CONFIDENCE_RESPONSE');
  }

  if (
    trace.confidenceLevel === 'medium' &&
    trace.groundingRequired &&
    !trace.retrievalPerformed
  ) {
    categories.add('LOW_CONFIDENCE_RESPONSE');
  }

  if (!trace.retrievalPerformed && trace.toolsUsed.length === 0) {
    const hasMemory =
      trace.memoryRetrieved.facts > 0 ||
      trace.memoryRetrieved.recalledMessages > 0 ||
      trace.memoryRetrieved.threadMemory;
    if (!hasMemory && trace.contextRetrieved.length === 0) {
      categories.add('MISSING_CONTEXT');
    }
  }

  if (trace.issues.some((i) => i.toLowerCase().includes('policy'))) {
    categories.add('POLICY_MISMATCH');
  }

  if (
    trace.groundingRequired &&
    trace.intentDetected.length > 0 &&
    trace.genericResponseRisk &&
    !categories.has('GROUNDING_FAILURE')
  ) {
    categories.add('POLICY_MISMATCH');
  }

  return [...categories];
}

export function buildPipelineTraceInsights(
  trace: AIPipelineTrace,
  catalog?: PipelineCatalog
): PipelineTraceInsights {
  const bundle = trace.evidenceBundle;
  return {
    flagReasons: buildFlagReasons(trace, catalog),
    contextUsed: buildContextUsedRows(trace, catalog),
    reasoningDepth: deriveReasoningDepth(trace, bundle),
    failureCategories: buildFailureCategories(trace),
  };
}

export type AIPipelineTraceWithInsights = AIPipelineTrace & {
  insights: PipelineTraceInsights;
  diagnosticSource?: 'TWIN' | 'TEST_LAB';
};

export function enrichTraceWithInsights(
  trace: AIPipelineTrace,
  catalog?: PipelineCatalog,
  options?: { diagnosticSource?: 'TWIN' | 'TEST_LAB' }
): AIPipelineTraceWithInsights {
  return {
    ...trace,
    insights: buildPipelineTraceInsights(trace, catalog),
    ...(options?.diagnosticSource ? { diagnosticSource: options.diagnosticSource } : {}),
  };
}
