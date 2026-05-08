import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('AIResponseRenderer orchestration visibility guards', () => {
  it('keeps orchestration sections behind showOrchestrationDetails flag', () => {
    const rendererPath = path.resolve(
      __dirname,
      '../../../../../web/src/components/ai/AIResponseRenderer.tsx'
    );
    const source = fs.readFileSync(rendererPath, 'utf8');

    expect(source).toContain('showOrchestrationDetails = false');
    expect(source).toContain('{showOrchestrationDetails && evidence.length > 0 ?');
    expect(source).toContain('{showOrchestrationDetails && watchoutCount > 0 ?');
    expect(source).toContain('{showOrchestrationDetails && recActions.length > 0 ?');
  });
});
