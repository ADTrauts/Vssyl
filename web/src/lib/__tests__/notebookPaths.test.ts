import { describe, expect, it } from 'vitest';
import { getNotebookBasePath, notebookPagePath, notebookViewPath } from '../../components/notebook/notebookPaths';

describe('notebookPaths', () => {
  it('resolves personal and business base paths', () => {
    expect(getNotebookBasePath()).toBe('/notebook');
    expect(getNotebookBasePath('biz-1')).toBe('/business/biz-1/workspace/notebook');
  });

  it('builds page and view URLs', () => {
    expect(notebookPagePath('/notebook', 'page-1')).toBe('/notebook/page/page-1');
    expect(notebookViewPath('/notebook', 'recent')).toBe('/notebook?view=recent');
    expect(notebookViewPath('/notebook', 'templates')).toBe('/notebook?view=templates');
  });
});
