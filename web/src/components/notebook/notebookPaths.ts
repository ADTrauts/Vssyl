/** Route helpers for Notebook (facade over Notes + Todo). */

export function getNotebookBasePath(businessId?: string | null): string {
  if (businessId) {
    return `/business/${businessId}/workspace/notebook`;
  }
  return '/notebook';
}

export function notebookPagePath(basePath: string, pageId: string): string {
  return `${basePath}/page/${pageId}`;
}

export function notebookViewPath(
  basePath: string,
  view: 'recent' | 'templates' | 'shared' | 'trash' | 'tasks' | 'pages' | 'favorites'
): string {
  if (view === 'pages') return `${basePath}?view=pages`;
  return `${basePath}?view=${view}`;
}
