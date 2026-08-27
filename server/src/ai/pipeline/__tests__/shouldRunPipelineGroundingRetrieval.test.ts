import { describe, expect, it } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { shouldRunPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';
import { shouldRunGroundingRetrievalPrepass } from '../pipelineEnforcement';
import { needsLiveExternalWebTruth } from '../../external/needsLiveExternalWebTruth';
import { inferStructuredResponseMode } from '../../utils/structuredResponseMode';
import { requiresAuthoritativeContext } from '../../utils/requiresAuthoritativeContext';

const off = { enforcementEnabled: false, enforcementMode: 'off' as const };
const regenerate = { enforcementEnabled: true, enforcementMode: 'regenerate' as const };
const block = { enforcementEnabled: true, enforcementMode: 'block' as const };

describe('shouldRunPipelineGroundingRetrieval', () => {
  const catalog = getDefaultPipelineCatalog();

  it('runs for live web even when enforcement is OFF', () => {
    const q = 'What are average mortgage rates today?';
    expect(needsLiveExternalWebTruth(q)).toBe(true);
    expect(shouldRunGroundingRetrievalPrepass(off)).toBe(false);
    expect(shouldRunPipelineGroundingRetrieval(off, q, catalog)).toBe(true);
    expect(shouldRunPipelineGroundingRetrieval(block, q, catalog)).toBe(true);
  });

  it('runs for OpenAI today with conversation contract and no authoritative context', () => {
    const q = "What's happening with OpenAI today?";
    const structured = inferStructuredResponseMode({ query: q });
    expect(structured.responseContract).toBe('conversation');
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    expect(shouldRunPipelineGroundingRetrieval(off, q, catalog)).toBe(true);
  });

  it('does not run for stable knowledge when enforcement is OFF', () => {
    for (const q of [
      'What is EBITDA?',
      'How do mortgages work?',
      'Why does salt melt ice?',
      'What is gross profit?',
    ]) {
      expect(needsLiveExternalWebTruth(q)).toBe(false);
      expect(shouldRunPipelineGroundingRetrieval(off, q, catalog)).toBe(false);
    }
  });

  it('still runs when regenerate enforcement is enabled (unchanged)', () => {
    expect(shouldRunGroundingRetrievalPrepass(regenerate)).toBe(true);
    expect(
      shouldRunPipelineGroundingRetrieval(regenerate, 'What is EBITDA?', catalog)
    ).toBe(true);
  });

  it('runs for grounding-required intents (Places path shares gate) when OFF', () => {
    expect(
      shouldRunPipelineGroundingRetrieval(off, 'Yoga clubs near me', catalog)
    ).toBe(true);
  });

  it('mortgage rates today keeps conversation + false requiresAuthoritativeContext', () => {
    const q = 'What are average mortgage rates today?';
    const structured = inferStructuredResponseMode({ query: q });
    expect(structured.responseContract).toBe('conversation');
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    expect(shouldRunPipelineGroundingRetrieval(off, q, catalog)).toBe(true);
  });
});
