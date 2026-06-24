import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';

/** Provenance for inferred bundle nodes and edges — never source-of-truth. */
export interface RetrievalInferenceProvenance {
  /** Always `inference` — distinct from federation SoR. */
  provenance: 'inference';
  /** Discovery system that produced the evidence. */
  source: 'ai_retrieval';
  /** Unified Search module id. */
  retrievalOrigin: string;
  /** Normalized confidence 0–1 when available. */
  confidence?: number;
  /** ISO timestamp from evidence.retrievedAt. */
  timestamp: string;
  /** Pipeline consumer intent that triggered discovery. */
  consumerIntent: AIRetrievalConsumerIntent;
}

export interface RetrievalBundleEnrichmentResult {
  bundles: import('./contextGraphTypes.js').ContextBundleDescriptor[];
  enrichmentApplied: boolean;
  inferenceNodesAdded: number;
  inferenceEdgesAdded: number;
  skippedReason?: 'bridge_disabled' | 'no_eligible_evidence' | 'not_pilot_consumer';
}
