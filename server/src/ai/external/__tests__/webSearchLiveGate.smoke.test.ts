/**
 * Smoke: live-web need + missing TAVILY_API_KEY → required failure, not silent skip.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { runPipelineGroundingRetrieval } from '../../pipeline/pipelineGroundingRetrieval';
import { getDefaultCatalog } from '../../pipeline/defaultPipelineCatalog';
import { shouldRunPipelineGroundingRetrieval } from '../../pipeline/pipelineGroundingRetrieval';

describe('live web gate smoke (no Tavily key)', () => {
  const prev = process.env.TAVILY_API_KEY;

  afterEach(() => {
    if (prev === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = prev;
  });

  it('mortgage rates today attempts web_search and marks required failure when unconfigured', async () => {
    delete process.env.TAVILY_API_KEY;
    const catalog = getDefaultCatalog();
    const off = { enforcementEnabled: false, enforcementMode: 'off' as const };
    const q = 'What are average mortgage rates today?';
    expect(shouldRunPipelineGroundingRetrieval(off, q, catalog)).toBe(true);

    const result = await runPipelineGroundingRetrieval({
      userId: 'smoke-user',
      userMessage: q,
      catalog,
    });

    expect(result.toolsUsed.some((t) => t.name === 'web_search')).toBe(true);
    expect(result.toolsUsed.some((t) => t.name === 'web_search' && !t.success)).toBe(true);
    expect(result.webSearchUnavailable).toBe(true);
    expect(result.requiredSourceFailures).toContain('web_search');
    expect(result.sourcesUsed.includes('web_search')).toBe(false);
  });

  it('EBITDA does not attempt web_search', async () => {
    delete process.env.TAVILY_API_KEY;
    const catalog = getDefaultCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'smoke-user',
      userMessage: 'What is EBITDA?',
      catalog,
    });
    expect(result.toolsUsed.some((t) => t.name === 'web_search')).toBe(false);
    expect(result.webSearchUnavailable).toBeFalsy();
  });
});
