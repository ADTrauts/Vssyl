/** Detect OS file drag (upload) vs in-app File Hub item drag. */
export function isExternalFileDragTransfer(dataTransfer: Pick<DataTransfer, 'types' | 'files'>): boolean {
  const types = Array.from(dataTransfer.types);
  if (!types.includes('Files')) {
    return false;
  }
  if (isInternalDriveItemDragTransfer(dataTransfer)) {
    return false;
  }
  return true;
}

/** In-app File Hub / Global Trash item drag (native HTML5 path). */
export function isInternalDriveItemDragTransfer(dataTransfer: Pick<DataTransfer, 'types'>): boolean {
  return Array.from(dataTransfer.types).includes('application/json');
}

export function resolveDriveUploadFolderId(
  currentFolderId: string | null | undefined,
  selectedFolderId: string | null | undefined
): string | null {
  if (typeof currentFolderId === 'string' && currentFolderId.length > 0) {
    return currentFolderId;
  }
  if (typeof selectedFolderId === 'string' && selectedFolderId.length > 0) {
    return selectedFolderId;
  }
  return null;
}
