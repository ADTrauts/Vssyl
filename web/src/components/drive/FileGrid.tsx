import React from 'react'
import { FileCard } from './FileCard'
import FolderCard from './FolderCard'
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/ContextMenu'
import type { Folder, File } from '@/types/api'

export interface FileGridFile extends File {
  [key: string]: unknown;
}

export interface FileGridFolder extends Folder {
  [key: string]: unknown;
}

interface FileGridProps {
  folders?: FileGridFolder[];
  files?: FileGridFile[];
  onFolderDelete?: (id: string) => void;
  onFileDelete?: (id: string) => void;
  onItemClick?: (item: (FileGridFile | FileGridFolder) & { type: 'file' | 'folder' }) => void;
  renderContextMenu?: (item: FileGridFile | FileGridFolder, type: 'file' | 'folder') => React.ReactNode;
  isGridView?: boolean;
}

const FileGrid: React.FC<FileGridProps> = ({
  folders = [],
  files = [],
  onFolderDelete,
  onFileDelete,
  onItemClick,
  renderContextMenu,
  isGridView = true
}) => {
  return (
    <div className={isGridView ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
      {folders.map(folder => (
        <ContextMenuRoot key={folder.id}>
          <ContextMenuTrigger>
            <FolderCard
              folder={{
                ...folder,
                parentId: folder.parentId ?? '',
                ownerId: typeof folder.ownerId === 'string' ? folder.ownerId : (typeof (folder as { userId?: string }).userId === 'string' ? (folder as { userId: string }).userId : ''),
              }}
              onClick={onItemClick ? (id: string) => onItemClick({ ...folder, type: 'folder', id }) : () => {}}
              onDelete={onFolderDelete ? () => onFolderDelete(folder.id) : () => {}}
              onMove={() => {}}
            />
          </ContextMenuTrigger>
          {renderContextMenu ? renderContextMenu(folder, 'folder') : null}
        </ContextMenuRoot>
      ))}
      {files.map(file => (
        <ContextMenuRoot key={file.id}>
          <ContextMenuTrigger>
            <FileCard
              {...file}
              item={file}
              type="file"
              onClick={onItemClick ? (id: string) => onItemClick({ ...file, type: 'file', id }) : () => {}}
              onDelete={onFileDelete ? () => onFileDelete(file.id) : () => {}}
            />
          </ContextMenuTrigger>
          {renderContextMenu ? renderContextMenu(file, 'file') : null}
        </ContextMenuRoot>
      ))}
    </div>
  )
}

export default FileGrid; 