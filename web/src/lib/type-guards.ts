import type { FileItem, FolderItem } from '@/contexts/ui-context';
import type { BreadcrumbFolder } from '@/types/api';

export const isFileItem = (item: unknown): item is FileItem => {
  if (!item || typeof item !== 'object') return false;
  const fileItem = item as Partial<FileItem>;
  return (
    fileItem.type === 'file' &&
    typeof fileItem.id === 'string' &&
    typeof fileItem.name === 'string' &&
    typeof fileItem.size === 'number' &&
    typeof fileItem.url === 'string' &&
    typeof fileItem.createdAt === 'string' &&
    typeof fileItem.updatedAt === 'string'
  );
};

export const isFolderItem = (item: unknown): item is FolderItem => {
  if (!item || typeof item !== 'object') return false;
  const folderItem = item as Partial<FolderItem>;
  return (
    folderItem.type === 'folder' &&
    typeof folderItem.id === 'string' &&
    typeof folderItem.name === 'string' &&
    typeof folderItem.userId === 'string' &&
    typeof folderItem.createdAt === 'string' &&
    typeof folderItem.updatedAt === 'string'
  );
};

export const isBreadcrumbFolder = (item: unknown): item is BreadcrumbFolder => {
  if (!item || typeof item !== 'object') return false;
  const breadcrumb = item as Partial<BreadcrumbFolder>;
  return (
    typeof breadcrumb.id === 'string' &&
    typeof breadcrumb.name === 'string'
  );
}; 