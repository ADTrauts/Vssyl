/** Helpers for Notebook PAGE → FILE links (Phase 5). */

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFileDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

/** Open file in File Hub using existing query param contract. */
export function getDriveFileOpenUrl(fileId: string, dashboardId?: string | null): string {
  const params = new URLSearchParams({ file: fileId });
  if (dashboardId) params.set('dashboard', dashboardId);
  return `/drive?${params.toString()}`;
}

export function fileTypeLabel(mimeType?: string | null, extension?: string | null): string {
  if (extension) return extension.toUpperCase();
  if (!mimeType) return 'File';
  const slash = mimeType.indexOf('/');
  return slash >= 0 ? mimeType.slice(slash + 1).toUpperCase() : mimeType;
}
