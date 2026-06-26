import { assignConfidence } from './confidenceAssigner.js';
import { tierPrecedence } from './trustResolver.js';
import type {
  ConvergedFact,
  KnowledgeConfidence,
  KnowledgeFact,
  KnowledgeTier,
} from './knowledgeTypes.js';

function normalizeFactContent(content: string): string {
  return content.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Merge duplicate facts by normalized content.
 * Higher authority tier wins; provenance from losers preserved in mergedFromFactIds.
 * Never overwrites L0–L2 with lower-tier duplicates — losers are dropped.
 */
export function convergeFacts(facts: KnowledgeFact[]): {
  converged: ConvergedFact[];
  mergedCount: number;
  duplicateFactsRemoved: number;
} {
  const groups = new Map<string, KnowledgeFact[]>();

  for (const fact of facts) {
    const key = normalizeFactContent(fact.content);
    const group = groups.get(key) ?? [];
    group.push(fact);
    groups.set(key, group);
  }

  const converged: ConvergedFact[] = [];
  let mergedCount = 0;
  let duplicateFactsRemoved = 0;

  for (const group of groups.values()) {
    if (group.length === 1) {
      const f = group[0];
      converged.push({
        ...f,
        corroborationCount: 1,
        mergedFromFactIds: [f.factId],
        confidenceHistory: [f.confidence],
      });
      continue;
    }

    const sorted = [...group].sort(
      (a, b) => tierPrecedence(a.provenance.tier) - tierPrecedence(b.provenance.tier)
    );
    const winner = sorted[0];
    const losers = sorted.slice(1);
    duplicateFactsRemoved += losers.length;
    if (losers.length > 0) mergedCount += 1;

    const confidenceHistory: KnowledgeConfidence[] = [
      ...new Set(group.map((f) => f.confidence)),
    ];

    let confidence = winner.confidence;
    if (group.length >= 2 && tierPrecedence(winner.provenance.tier) >= tierPrecedence('L4')) {
      confidence = assignConfidence({
        tier: winner.provenance.tier,
        origin: winner.provenance.origin,
        normalizedScore: 0.65,
      });
    }

    converged.push({
      ...winner,
      confidence,
      corroborationCount: group.length,
      mergedFromFactIds: group.map((f) => f.factId),
      confidenceHistory,
      provenance: {
        ...winner.provenance,
        verificationHistory: [
          ...(winner.provenance.verificationHistory ?? []),
          ...losers.map((l) => ({
            at: l.provenance.verifiedAt,
            action: 'created' as const,
            actor: l.provenance.actor,
            method: 'lifecycle' as const,
            note: `Corroborated duplicate merged from ${l.factId}`,
          })),
        ],
      },
    });
  }

  return { converged, mergedCount, duplicateFactsRemoved };
}

export function isAuthoritativeTier(tier: KnowledgeTier): boolean {
  return tierPrecedence(tier) <= tierPrecedence('L3');
}
