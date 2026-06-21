import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('tag index constitutional (CG-2A)', () => {
  const tagIndexSrc = readFileSync(
    resolve(process.cwd(), 'src/context-graph/tagIndexService.ts'),
    'utf8'
  );
  const tagProviderSrc = readFileSync(
    resolve(process.cwd(), 'src/context-graph/tagProviderTypes.ts'),
    'utf8'
  );

  it('does not create tag graph nodes or edges', () => {
    expect(tagIndexSrc).not.toMatch(/ContextGraphNode|NeighborEdge|edgeType.*tag/i);
    expect(tagProviderSrc).not.toMatch(/graph entity|V_Link/i);
  });

  it('tag providers do not write tag SoR', () => {
    const combined = [tagIndexSrc, tagProviderSrc].join('\n');
    expect(combined).not.toMatch(/tags:\s*\{|\.update\(\{[^}]*tags/);
  });
});
