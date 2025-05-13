import type { File, Folder } from '@/types/api';
import type { FileItem, FolderItem } from '@/contexts/ui-context';

export const toFileItem = (file: File | Folder): FileItem => {
  if (!('size' in file) || !('url' in file)) {
    throw new Error('Invalid file object');
  }
  return {
    ...file,
    type: 'file' as const
  };
};

export const toFolderItem = (folder: File | Folder): FolderItem => {
  if (!('parentId' in folder) || !('userId' in folder)) {
    throw new Error('Invalid folder object');
  }
  return {
    ...folder,
    type: 'folder' as const
  };
};

export const toItem = (item: File | Folder, type: 'file' | 'folder'): FileItem | FolderItem => {
  try {
    if (type === 'file') {
      return toFileItem(item);
    }
    return toFolderItem(item);
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    throw new Error(`Failed to convert item to ${type}: ${error}`);
  }
}; 