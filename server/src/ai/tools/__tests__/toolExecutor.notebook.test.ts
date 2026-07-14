import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as skillCanonicalEntry from '../../skills/skillCanonicalEntry';
import * as notebookAIActionService from '../../../services/notebook/notebookAIActionService';

describe('toolExecutor notebook tools (Phase 8B canonical Skills)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('summarize_notebook_page delegates to Skill canonical entry', async () => {
    vi.spyOn(skillCanonicalEntry, 'runNotebookPageSummarySkill').mockResolvedValue({
      summary: 'Team sync',
      keyDecisions: [],
      openTasks: [],
      risksAndFollowUps: [],
      warnings: [],
    });

    const raw = await executeTool(
      'summarize_notebook_page',
      { pageId: 'page-abc' },
      { userId: 'user-1' }
    );
    const parsed = JSON.parse(raw) as { success: boolean; data?: { pageId: string } };

    expect(skillCanonicalEntry.runNotebookPageSummarySkill).toHaveBeenCalledWith({
      pageId: 'page-abc',
      userId: 'user-1',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.pageId).toBe('page-abc');
  });

  it('extract_notebook_action_items does not create tasks', async () => {
    const extractSpy = vi
      .spyOn(skillCanonicalEntry, 'runNotebookActionExtractionSkill')
      .mockResolvedValue({
        proposals: [{ title: 'Send recap', description: null, dueDate: null, priority: null }],
        warnings: [],
      });
    const confirmSpy = vi.spyOn(notebookAIActionService, 'confirmExtractedActionItems');

    const raw = await executeTool(
      'extract_notebook_action_items',
      { pageId: 'page-abc' },
      { userId: 'user-1' }
    );
    const parsed = JSON.parse(raw) as { success: boolean; message: string };

    expect(extractSpy).toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(parsed.success).toBe(true);
    expect(parsed.message).toMatch(/Confirm/i);
  });
});
