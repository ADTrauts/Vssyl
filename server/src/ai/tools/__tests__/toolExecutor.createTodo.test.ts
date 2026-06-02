import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as todoAIActionService from '../../../services/todoAIActionService';

const toolExecutorSource = readFileSync(
  join(process.cwd(), 'src/ai/tools/toolExecutor.ts'),
  'utf8'
);

describe('toolExecutor create_todo (Phase 1F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not use prisma.task.create', () => {
    expect(toolExecutorSource).not.toMatch(/prisma\.task\.create/);
    expect(toolExecutorSource).toMatch(/todoAIActionService/);
  });

  it('create_todo delegates to aiCreateTask', async () => {
    vi.spyOn(todoAIActionService, 'aiCreateTask').mockResolvedValue({
      success: true,
      data: { id: 'task-1', title: 'Review docs', priority: 'MEDIUM' },
    });

    const raw = await executeTool(
      'create_todo',
      { title: 'Review docs' },
      { userId: 'user-1', dashboardId: 'dash-1' }
    );

    const parsed = JSON.parse(raw) as { success: boolean; data?: { taskId: string } };
    expect(parsed.success).toBe(true);
    expect(parsed.data?.taskId).toBe('task-1');
    expect(todoAIActionService.aiCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: 'Review docs',
        dashboardId: 'dash-1',
      })
    );
  });
});
