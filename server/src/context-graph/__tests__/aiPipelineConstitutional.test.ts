import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Constitutional checks — AI must not own or mutate graph state (CG-1D).
 */
describe('context graph AI pipeline constitutional (CG-1D)', () => {
  const providerSrc = readFileSync(
    resolve(process.cwd(), 'src/context-graph/contextGraphBundleProvider.ts'),
    'utf8'
  );
  const pipelineSrc = readFileSync(
    resolve(process.cwd(), 'src/ai/context/graphBundlePipelineContextService.ts'),
    'utf8'
  );

  it('provider does not import adapter registry directly', () => {
    expect(providerSrc).not.toMatch(/adapterRegistry/);
    expect(providerSrc).not.toMatch(/getAdapterForEntity/);
  });

  it('pipeline service delegates resolution to provider', () => {
    expect(pipelineSrc).toMatch(/resolveVLinkBundlesForAi/);
    expect(pipelineSrc).not.toMatch(/getAdapterForEntity/);
  });

  it('provider uses orchestrator resolveVLinkBundle only', () => {
    expect(providerSrc).toMatch(/resolveVLinkBundle/);
    expect(providerSrc).not.toMatch(/prisma\./);
  });
});
