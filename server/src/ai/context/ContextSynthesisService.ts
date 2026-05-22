/**
 * Deterministic cross-module context synthesis (Phase 3C).
 */

import type { EntityLinkingResult } from './entityLinking';
import { linkEntitiesAcrossModules } from './entityLinking';

export interface ContextSynthesisInput {
  query: string;
  moduleContexts: Record<string, unknown>;
  entityLinks?: EntityLinkingResult;
  memoryFacts?: Array<{ subject: string; predicate: string }>;
}

export interface ContextSynthesisResult {
  summary: string;
  bulletPoints: string[];
  linkedEntities: EntityLinkingResult;
  modulesIncluded: string[];
  dataBacked: boolean;
}

function unwrapModulePayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const data = o.data !== undefined ? o.data : raw;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.context && typeof d.context === 'object') {
    return d.context as Record<string, unknown>;
  }
  return d;
}

function moduleSummaryLine(moduleId: string, payload: Record<string, unknown>): string | null {
  switch (moduleId) {
    case 'chat': {
      const summary =
        payload.summary && typeof payload.summary === 'object'
          ? (payload.summary as Record<string, unknown>)
          : null;
      const total =
        typeof summary?.totalActiveConversations === 'number'
          ? summary.totalActiveConversations
          : Array.isArray(payload.recentConversations)
            ? payload.recentConversations.length
            : 0;
      return total > 0 ? `Chat: ${total} active conversation(s)` : null;
    }
    case 'calendar': {
      const summary =
        payload.summary && typeof payload.summary === 'object'
          ? (payload.summary as Record<string, unknown>)
          : null;
      const total =
        typeof summary?.totalUpcomingEvents === 'number'
          ? summary.totalUpcomingEvents
          : Array.isArray(payload.upcomingEvents)
            ? payload.upcomingEvents.length
            : 0;
      const nextTitle =
        typeof summary?.nextEventTitle === 'string' ? summary.nextEventTitle : undefined;
      return total > 0
        ? `Calendar: ${total} upcoming event(s)${nextTitle ? ` — next: ${nextTitle}` : ''}`
        : null;
    }
    case 'drive': {
      const summary =
        payload.summary && typeof payload.summary === 'object'
          ? (payload.summary as Record<string, unknown>)
          : null;
      const total =
        typeof summary?.totalRecentFiles === 'number'
          ? summary.totalRecentFiles
          : Array.isArray(payload.recentFiles)
            ? payload.recentFiles.length
            : 0;
      return total > 0 ? `Drive: ${total} recent file(s)` : null;
    }
    default:
      return null;
  }
}

export function synthesizeCrossModuleContext(
  input: ContextSynthesisInput
): ContextSynthesisResult {
  const entityLinks =
    input.entityLinks ??
    linkEntitiesAcrossModules({
      moduleContexts: input.moduleContexts,
      query: input.query,
    });

  const modulesIncluded = Object.keys(input.moduleContexts).filter(
    (key) => !key.startsWith('_') && input.moduleContexts[key] != null
  );

  const bulletPoints: string[] = [];

  for (const moduleId of modulesIncluded) {
    const payload = unwrapModulePayload(input.moduleContexts[moduleId]);
    if (!payload) continue;
    const line = moduleSummaryLine(moduleId, payload);
    if (line) bulletPoints.push(line);
  }

  for (const person of entityLinks.linkedPeople) {
    bulletPoints.push(
      `Linked person: ${person.name} (${person.modules.join(' + ')})`
    );
  }

  for (const file of entityLinks.linkedFiles) {
    bulletPoints.push(
      `Linked file: ${file.fileName ?? file.fileId} (${file.modules.join(' + ')})`
    );
  }

  if (input.memoryFacts?.length) {
    const topFacts = input.memoryFacts.slice(0, 3);
    for (const fact of topFacts) {
      bulletPoints.push(`Memory: ${fact.subject} — ${fact.predicate}`);
    }
  }

  const hasLinks =
    entityLinks.linkedPeople.length > 0 || entityLinks.linkedFiles.length > 0;
  const dataBacked = modulesIncluded.length >= 2 && bulletPoints.length > 0;

  let summary: string;
  if (dataBacked && hasLinks) {
    summary = `Cross-module context spans ${modulesIncluded.join(', ')} with ${entityLinks.linkedPeople.length} shared participant link(s) and ${entityLinks.linkedFiles.length} file link(s).`;
  } else if (dataBacked) {
    summary = `Cross-module context spans ${modulesIncluded.join(', ')} from live module providers.`;
  } else {
    summary = 'Insufficient live module data for cross-module synthesis.';
  }

  return {
    summary,
    bulletPoints,
    linkedEntities: entityLinks,
    modulesIncluded,
    dataBacked,
  };
}
