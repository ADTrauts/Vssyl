import type { RetrievedMemoryFact } from '../../services/userMemoryFactService';
import { MEMORY_INFERRED_CONFIDENCE_FLOOR } from './memoryScoring';
import { isExplicitSourceType, isMemoryFactSourceType } from './memoryFactTypes';

export type MemoryInjectionTier = 'explicit' | 'inferred';

export interface MemoryFactAssemblyItem {
  id: string;
  subject: string;
  fact: string;
  confidence: number;
  sourceType: string;
  isExplicit: boolean;
  injectionTier: MemoryInjectionTier;
}

export interface PreparedMemoryFactsForAssembly {
  items: MemoryFactAssemblyItem[];
  explicitCount: number;
  inferredCount: number;
  excludedInferredLowConfidence: number;
}

/**
 * Defense-in-depth: explicit facts always inject; inferred require confidence floor.
 */
export function prepareMemoryFactsForAssembly(
  facts: Array<{
    id?: string;
    subject: string;
    predicate: string;
    confidence: number;
    sourceType?: string;
    isExplicit?: boolean;
  }>,
  truncatePredicate: (text: string, max: number) => string,
  maxPredicateLen = 600
): PreparedMemoryFactsForAssembly {
  let excludedInferredLowConfidence = 0;
  const items: MemoryFactAssemblyItem[] = [];

  for (const f of facts) {
    const isExplicit =
      typeof f.isExplicit === 'boolean'
        ? f.isExplicit
        : f.sourceType && isMemoryFactSourceType(f.sourceType)
          ? isExplicitSourceType(f.sourceType)
          : true;
    if (!isExplicit && f.confidence < MEMORY_INFERRED_CONFIDENCE_FLOOR) {
      excludedInferredLowConfidence += 1;
      continue;
    }

    items.push({
      id: f.id ?? '',
      subject: f.subject,
      fact: truncatePredicate(f.predicate, maxPredicateLen),
      confidence: f.confidence,
      sourceType: f.sourceType ?? (isExplicit ? 'explicit_user' : 'inferred_chat'),
      isExplicit,
      injectionTier: isExplicit ? 'explicit' : 'inferred',
    });
  }

  return {
    items,
    explicitCount: items.filter((i) => i.injectionTier === 'explicit').length,
    inferredCount: items.filter((i) => i.injectionTier === 'inferred').length,
    excludedInferredLowConfidence,
  };
}

export function isRetrievedMemoryFact(value: unknown): value is RetrievedMemoryFact {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.subject === 'string' && typeof o.predicate === 'string';
}
