import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'src/ai/actions/AutonomousActionExecutor.ts'),
  'utf8'
);

describe('AutonomousActionExecutor todo paths (Phase 1F)', () => {
  it('does not import todoController', () => {
    expect(source).not.toMatch(/controllers\/todoController/);
  });

  it('uses todoAIActionService for priority updates', () => {
    const block = source.match(
      /private async executeUpdateTaskPriority[\s\S]*?private async executeAnalyzeData/
    )?.[0];
    expect(block).toBeDefined();
    expect(block).toMatch(/todoAIActionService/);
    expect(block).not.toMatch(/mockReq/);
    expect(block).not.toMatch(/mockRes/);
  });
});
