import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesServiceError } from '../notes/notesErrors';
import { NotebookAIServiceError } from '../notebook/notebookAIErrors';
import * as notebookContext from '../notebook/notebookContextService';
import * as aiCompletion from '../notebook/notebookAICompletion';
import * as todoAI from '../todoAIActionService';
import * as notebookLinkService from '../notebook/notebookLinkService';
import {
  confirmExtractedActionItems,
  extractActionItemsImplementation,
  generateMeetingRecap,
  summarizePageImplementation,
} from '../notebook/notebookAIActionService';

const grounded = {
  pageId: 'page-1',
  dashboardId: 'dash-1',
  businessId: null,
  page: {
    title: 'Sprint',
    content: 'Decide launch date. Follow up with design.',
    tags: [],
    pinned: false,
    canEdit: true,
    isOwner: true,
  },
  tasks: [{ linkId: 'l1', targetId: 't1', title: 'Existing', status: 'TODO', dueDate: null, relationshipType: 'REFERENCE' }],
  files: [],
  events: [],
  shareCount: 0,
  warnings: [],
  grounding: {
    restrictedLinks: 0,
    trashedTargets: 0,
    contentTruncated: false,
    emptyContent: false,
    totalLinks: 1,
  },
  sourceGeneratedAt: '2026-06-01T00:00:00.000Z',
};

describe('notebookAIActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notebookContext, 'getPageContext').mockResolvedValue({
      pageId: 'page-1',
      page: {
        id: 'page-1',
        title: 'Sprint',
        content: grounded.page.content,
        tags: [],
        pinned: false,
        dashboardId: 'dash-1',
        businessId: null,
        folderId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        isOwner: true,
        canEdit: true,
      },
      shares: [],
      tasks: [
        {
          linkId: 'l1',
          targetId: 't1',
          relationshipType: 'REFERENCE',
          metadata: null,
          title: 'Existing',
          status: 'TODO',
          dueDate: null,
        },
      ],
      files: [],
      events: [],
      summary: {
        taskCount: 1,
        fileCount: 0,
        eventCount: 0,
        totalLinks: 1,
        accessibleLinks: 1,
        restrictedLinks: 0,
        trashedTargets: 0,
        shareCount: 0,
        contentLength: 40,
        tagCount: 0,
      },
      relationshipCounts: {
        totalLinks: 1,
        accessibleLinks: 1,
        restrictedLinks: 0,
        trashedTargets: 0,
        byTargetType: { TASK: 1 },
        byRelationshipType: { REFERENCE: 1 },
      },
      generatedAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it('summarize delegates to AI completion with grounded context', async () => {
    vi.spyOn(aiCompletion, 'runNotebookAICompletion').mockResolvedValue({
      success: true,
      text: JSON.stringify({
        summary: 'Short summary',
        keyDecisions: ['Launch Q3'],
        openTasks: ['Design review'],
        risksAndFollowUps: [],
      }),
    });

    const result = await summarizePageImplementation('page-1', 'u1');

    expect(result.summary).toBe('Short summary');
    expect(aiCompletion.runNotebookAICompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        jsonMode: true,
        skipShadowRouting: true,
      })
    );
  });

  it('extract action items returns proposals only', async () => {
    vi.spyOn(aiCompletion, 'runNotebookAICompletion').mockResolvedValue({
      success: true,
      text: JSON.stringify({
        proposals: [{ title: 'Email team', description: null, dueDate: null, priority: 'MEDIUM' }],
      }),
    });

    const result = await extractActionItemsImplementation({ pageId: 'page-1', userId: 'u1' });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Email team');
  });

  it('confirm creates tasks via todoAIActionService and NotebookLink', async () => {
    vi.spyOn(todoAI, 'aiCreateTask').mockResolvedValue({
      success: true,
      data: { id: 'task-new' },
    });
    vi.spyOn(notebookLinkService, 'createPageLink').mockResolvedValue({
      link: {
        id: 'link-new',
        sourceType: 'PAGE',
        sourceId: 'page-1',
        targetType: 'TASK',
        targetId: 'task-new',
        relationshipType: 'ACTION_SOURCE',
        direction: 'OUTBOUND',
        createdById: 'u1',
        metadata: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        targetAccessible: true,
      },
      created: true,
    });

    const result = await confirmExtractedActionItems({
      pageId: 'page-1',
      userId: 'u1',
      proposals: [{ title: 'Ship docs' }],
    });

    expect(todoAI.aiCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', title: 'Ship docs', dashboardId: 'dash-1' })
    );
    expect(notebookLinkService.createPageLink).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'TASK',
        targetId: 'task-new',
        relationshipType: 'ACTION_SOURCE',
      })
    );
    expect(result.created).toHaveLength(1);
  });

  it('confirm fails closed without page edit permission', async () => {
    const readOnlyPage = await notebookContext.getPageContext('page-1', 'u1');
    vi.spyOn(notebookContext, 'getPageContext').mockResolvedValue({
      ...readOnlyPage,
      page: { ...readOnlyPage.page, canEdit: false, isOwner: false },
    });

    await expect(
      confirmExtractedActionItems({
        pageId: 'page-1',
        userId: 'u-viewer',
        proposals: [{ title: 'Nope' }],
      })
    ).rejects.toBeInstanceOf(NotebookAIServiceError);
  });

  it('meeting recap warns when no linked event', async () => {
    vi.spyOn(aiCompletion, 'runNotebookAICompletion').mockResolvedValue({
      success: true,
      text: JSON.stringify({
        recap: 'Met about sprint',
        decisions: [],
        actionItems: [],
        followUpAgenda: [],
      }),
    });

    const result = await generateMeetingRecap('page-1', 'u1');

    expect(result.recap).toContain('sprint');
    expect(result.warnings.some((w) => w.toLowerCase().includes('calendar'))).toBe(true);
  });

  it('denied page access propagates from context service', async () => {
    vi.spyOn(notebookContext, 'getPageContext').mockRejectedValue(
      new NotesServiceError('Page not found', 'not_found', 404)
    );

    await expect(summarizePageImplementation('missing', 'u1')).rejects.toBeInstanceOf(NotesServiceError);
  });
});
