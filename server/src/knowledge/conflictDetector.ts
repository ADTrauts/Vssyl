import { tierPrecedence } from './trustResolver.js';
import type { ConflictRecord, KnowledgeEdge } from './knowledgeTypes.js';

function edgeIdentityKey(edge: KnowledgeEdge): string {
  return `${edge.from}|${edge.to}|${edge.relationshipClass}`;
}

/**
 * Detect tier conflicts when duplicate relationship assertions exist.
 * Higher authority (lower L number) wins per KNOWLEDGE_TRUST_MODEL.md §5.
 */
export function detectKnowledgeConflicts(edges: KnowledgeEdge[]): ConflictRecord[] {
  const byKey = new Map<string, KnowledgeEdge[]>();

  for (const edge of edges) {
    const key = edgeIdentityKey(edge);
    const group = byKey.get(key) ?? [];
    group.push(edge);
    byKey.set(key, group);
  }

  const conflicts: ConflictRecord[] = [];

  for (const [key, group] of byKey) {
    if (group.length < 2) continue;

    const sorted = [...group].sort(
      (a, b) => tierPrecedence(a.provenance.tier) - tierPrecedence(b.provenance.tier)
    );
    const winner = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const loser = sorted[i];
      if (loser.provenance.tier === winner.provenance.tier) continue;
      conflicts.push({
        nodeOrEdgeKey: key,
        winnerTier: winner.provenance.tier,
        loserTier: loser.provenance.tier,
        reason: `Duplicate edge ${loser.edgeId} superseded by ${winner.edgeId} (tier precedence)`,
      });
    }
  }

  return conflicts;
}

/**
 * After conflict resolution, retain only winning edges per identity key.
 */
export function resolveEdgeConflicts(edges: KnowledgeEdge[]): {
  edges: KnowledgeEdge[];
  conflicts: ConflictRecord[];
} {
  const conflicts = detectKnowledgeConflicts(edges);
  const byKey = new Map<string, KnowledgeEdge>();

  for (const edge of edges) {
    const key = edgeIdentityKey(edge);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, edge);
      continue;
    }
    if (tierPrecedence(edge.provenance.tier) < tierPrecedence(existing.provenance.tier)) {
      byKey.set(key, edge);
    }
  }

  return { edges: [...byKey.values()], conflicts };
}
