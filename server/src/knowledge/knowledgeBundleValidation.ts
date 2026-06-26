import type { KnowledgeBundle, KnowledgeConfidence, KnowledgeTier } from './knowledgeTypes.js';

export interface KnowledgeBundleValidationIssue {
  rule: string;
  message: string;
  bundleId?: string;
}

const VALID_TIERS: KnowledgeTier[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
const VALID_CONFIDENCE: KnowledgeConfidence[] = ['C1', 'C2', 'C3', 'C4'];
const FORBIDDEN_BUNDLE_EDGE_TIERS: KnowledgeTier[] = ['L5'];

/**
 * Constitutional bundle validation per KNOWLEDGE_BUNDLE_STANDARD.md rules KB-1–KB-5.
 */
export function validateKnowledgeBundle(bundle: KnowledgeBundle): KnowledgeBundleValidationIssue[] {
  const issues: KnowledgeBundleValidationIssue[] = [];

  if (bundle.version !== '1.0') {
    issues.push({ rule: 'KB-0', message: 'version must be 1.0', bundleId: bundle.bundleId });
  }

  if (!bundle.contextBundle) {
    issues.push({ rule: 'KB-4', message: 'contextBundle fallback required', bundleId: bundle.bundleId });
  }

  for (const edge of bundle.edges) {
    if (!edge.provenance.tier || !edge.provenance.origin) {
      issues.push({
        rule: 'KB-1',
        message: `edge ${edge.edgeId} missing tier or origin`,
        bundleId: bundle.bundleId,
      });
    }
    if (FORBIDDEN_BUNDLE_EDGE_TIERS.includes(edge.provenance.tier)) {
      issues.push({
        rule: 'KB-2',
        message: `edge ${edge.edgeId} has forbidden tier L5`,
        bundleId: bundle.bundleId,
      });
    }
    if (!VALID_CONFIDENCE.includes(edge.confidence)) {
      issues.push({
        rule: 'KB-5',
        message: `edge ${edge.edgeId} invalid confidence`,
        bundleId: bundle.bundleId,
      });
    }
    if (!VALID_TIERS.includes(edge.provenance.tier)) {
      issues.push({
        rule: 'KB-1',
        message: `edge ${edge.edgeId} invalid tier`,
        bundleId: bundle.bundleId,
      });
    }
    if (!edge.consumerEligibility?.length) {
      issues.push({
        rule: 'KB-3',
        message: `edge ${edge.edgeId} missing consumerEligibility`,
        bundleId: bundle.bundleId,
      });
    }
  }

  for (const node of bundle.nodes) {
    if (!node.consumerEligibility?.length) {
      issues.push({
        rule: 'KB-3',
        message: `node ${node.nodeKey} missing consumerEligibility`,
        bundleId: bundle.bundleId,
      });
    }
  }

  return issues;
}

export function validateKnowledgeBundles(bundles: KnowledgeBundle[]): KnowledgeBundleValidationIssue[] {
  return bundles.flatMap((b) => validateKnowledgeBundle(b));
}
