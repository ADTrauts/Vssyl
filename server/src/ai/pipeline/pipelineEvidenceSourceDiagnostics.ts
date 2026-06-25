import type { PipelineContextRetrievedRecord } from '../types/pipelineDiagnostics';
import type { AIRetrievalDiscoverResult } from '../retrieval/aiRetrievalTypes';

export interface PipelineEvidenceSourceBucket {
  sources: string[];
  providers: string[];
  itemCount: number;
}

export interface PipelineEvidenceSourceDiagnostics {
  recencyContext: PipelineEvidenceSourceBucket;
  searchEvidence: PipelineEvidenceSourceBucket & {
    modulesContributing: string[];
    retrievalConsumerIntent?: string;
    retrievalPathway?: string;
  };
  graphInference: PipelineEvidenceSourceBucket;
}

const RECENCY_PROVIDER_PATTERN =
  /recent_|upcoming_|discoveries|module_context|list_|today|summary/i;

const GRAPH_PROVIDER_PATTERN = /graph_bundle|retrieval_inference|vlink/i;

function bucketFromRecords(
  records: PipelineContextRetrievedRecord[],
  classify: (record: PipelineContextRetrievedRecord) => boolean
): PipelineEvidenceSourceBucket {
  const matched = records.filter(classify);
  const sources = [...new Set(matched.map((r) => r.source))];
  const providers = [
    ...new Set(matched.map((r) => r.provider).filter((p): p is string => Boolean(p))),
  ];
  const itemCount = matched.reduce((sum, r) => sum + r.itemCount, 0);
  return { sources, providers, itemCount };
}

function isSearchRecord(record: PipelineContextRetrievedRecord): boolean {
  return (
    record.source === 'unified_search' ||
    record.provider === 'ai_retrieval_adapter' ||
    record.source === 'ai_retrieval'
  );
}

function isGraphRecord(record: PipelineContextRetrievedRecord): boolean {
  if (record.source === 'graph_bundle' || record.source === 'vlink') return true;
  if (record.provider && GRAPH_PROVIDER_PATTERN.test(record.provider)) return true;
  return false;
}

function isRecencyRecord(record: PipelineContextRetrievedRecord): boolean {
  if (isSearchRecord(record) || isGraphRecord(record)) return false;
  if (record.provider && RECENCY_PROVIDER_PATTERN.test(record.provider)) return true;
  return record.source === 'drive_files' || record.source === 'calendar' || record.source === 'vssyl_place';
}

/**
 * Operator-facing breakdown: recency context vs search evidence vs graph inference.
 */
export function buildPipelineEvidenceSourceDiagnostics(input: {
  contextRetrieved: PipelineContextRetrievedRecord[];
  retrievalDiscovery?: AIRetrievalDiscoverResult;
}): PipelineEvidenceSourceDiagnostics {
  const recencyContext = bucketFromRecords(input.contextRetrieved, isRecencyRecord);
  const graphInference = bucketFromRecords(input.contextRetrieved, isGraphRecord);

  const searchRecords = input.contextRetrieved.filter(isSearchRecord);
  const modulesContributing =
    input.retrievalDiscovery?.diagnostics.modulesContributingEvidence ?? [];

  const searchEvidence: PipelineEvidenceSourceDiagnostics['searchEvidence'] = {
    sources: [...new Set(searchRecords.map((r) => r.source))],
    providers: [
      ...new Set(searchRecords.map((r) => r.provider).filter((p): p is string => Boolean(p))),
    ],
    itemCount:
      input.retrievalDiscovery?.evidence.length ??
      searchRecords.reduce((sum, r) => sum + r.itemCount, 0),
    modulesContributing,
    retrievalConsumerIntent: input.retrievalDiscovery?.diagnostics.intent,
    retrievalPathway: input.retrievalDiscovery?.diagnostics.retrievalPathway,
  };

  if (searchEvidence.sources.length === 0 && input.retrievalDiscovery) {
    searchEvidence.sources = ['unified_search', 'ai_retrieval'];
    searchEvidence.providers = ['ai_retrieval_adapter'];
  }

  return { recencyContext, searchEvidence, graphInference };
}
