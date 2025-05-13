import { Folder as FolderIcon, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import FolderCard from './FolderCard'
import {
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/ContextMenu'
import type { Folder } from '@/types/api'

interface FolderGridProps {
  folders: Folder[]
  onFolderClick?: (folderId: string) => void
  onFolderDelete?: (folderId: string) => void
  isGridView?: boolean
  renderContextMenu?: (folder: Folder, type: string) => React.ReactNode
}

// Type guard for objects with a string ownerId property
function hasOwnerId(obj: unknown): obj is { ownerId: string } {
  return typeof obj === 'object' && obj !== null && typeof (obj as { ownerId?: unknown }).ownerId === 'string';
}

// Type guard for objects with a string userId property
function hasUserId(obj: unknown): obj is { userId: string } {
  return typeof obj === 'object' && obj !== null && typeof (obj as { userId?: unknown }).userId === 'string';
}

export default function FolderGrid({
  folders = [],
  onFolderClick,
  onFolderDelete,
  isGridView = true,
  renderContextMenu,
}: FolderGridProps) {
  const handleFolderClick = (e: React.MouseEvent, folderId: string) => {
    if (e.type === 'contextmenu') {
      e.preventDefault()
      return
    }
    onFolderClick?.(folderId)
  }

  if (folders.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No folders found</p>
      </div>
    )
  }

  if (isGridView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <ContextMenuRoot key={folder.id}>
            <ContextMenuTrigger>
              <FolderCard
                folder={{
                  ...folder,
                  parentId: folder.parentId ?? '',
                  ownerId: hasOwnerId(folder) ? folder.ownerId : (hasUserId(folder) ? folder.userId : ''),
                }}
                onClick={onFolderClick ? () => onFolderClick(folder.id) : () => {}}
                onDelete={onFolderDelete ? () => onFolderDelete(folder.id) : () => {}}
                onMove={() => {}}
              />
            </ContextMenuTrigger>
            {renderContextMenu ? renderContextMenu(folder, 'folder') : null}
          </ContextMenuRoot>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {folders.map((folder) => (
            <tr 
              key={folder.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={(e) => handleFolderClick(e, folder.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{folder.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistanceToNow(new Date(folder.updatedAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ContextMenuRoot>
                  <ContextMenuTrigger>
                    <button className="text-gray-400 hover:text-gray-500">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </ContextMenuTrigger>
                  {renderContextMenu ? renderContextMenu(folder, 'folder') : null}
                </ContextMenuRoot>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 