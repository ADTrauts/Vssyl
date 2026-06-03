import { describe, expect, it } from 'vitest';
import {
  NOTEBOOK_AI_MAX_PAGE_CONTENT_CHARS,
  buildGroundedContextFromPageContext,
} from '../notebook/notebookAIContextService';
import type { NotebookPageContext } from '../notebook/notebookContextTypes';

function baseContext(overrides?: Partial<NotebookPageContext>): NotebookPageContext {
  return {
    pageId: 'page-1',
    page: {
      id: 'page-1',
      title: 'Test',
      content: 'Hello world',
      tags: ['a'],
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
    tasks: [],
    files: [],
    events: [],
    summary: {
      taskCount: 0,
      fileCount: 0,
      eventCount: 0,
      totalLinks: 2,
      accessibleLinks: 1,
      restrictedLinks: 1,
      trashedTargets: 0,
      shareCount: 0,
      contentLength: 11,
      tagCount: 1,
    },
    relationshipCounts: {
      totalLinks: 2,
      accessibleLinks: 1,
      restrictedLinks: 1,
      trashedTargets: 0,
      byTargetType: {},
      byRelationshipType: {},
    },
    generatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('notebookAIContextService', () => {
  it('excludes restricted targets from grounded arrays', () => {
    const ctx = buildGroundedContextFromPageContext(baseContext());
    expect(ctx.tasks).toHaveLength(0);
    expect(ctx.warnings.some((w) => w.includes('restricted'))).toBe(true);
    expect(ctx.grounding.restrictedLinks).toBe(1);
  });

  it('truncates long page content', () => {
    const long = 'x'.repeat(NOTEBOOK_AI_MAX_PAGE_CONTENT_CHARS + 500);
    const ctx = buildGroundedContextFromPageContext(
      baseContext({
        page: { ...baseContext().page, content: long },
      })
    );
    expect(ctx.page.content.length).toBeLessThan(long.length);
    expect(ctx.grounding.contentTruncated).toBe(true);
    expect(ctx.warnings.some((w) => w.includes('truncated'))).toBe(true);
  });

  it('warns on empty content', () => {
    const ctx = buildGroundedContextFromPageContext(
      baseContext({ page: { ...baseContext().page, content: '   ' } })
    );
    expect(ctx.grounding.emptyContent).toBe(true);
    expect(ctx.warnings.some((w) => w.includes('empty'))).toBe(true);
  });

  it('includes accessible linked tasks', () => {
    const ctx = buildGroundedContextFromPageContext(
      baseContext({
        tasks: [
          {
            linkId: 'l1',
            targetId: 't1',
            relationshipType: 'REFERENCE',
            metadata: null,
            title: 'Do thing',
            status: 'TODO',
            dueDate: null,
          },
        ],
        summary: {
          ...baseContext().summary,
          taskCount: 1,
          accessibleLinks: 1,
          restrictedLinks: 0,
        },
      })
    );
    expect(ctx.tasks).toHaveLength(1);
    expect(ctx.tasks[0].title).toBe('Do thing');
  });
});
