import React, { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDrag, useDrop } from 'react-dnd'
import { formatDistanceToNow } from 'date-fns'
import { useUI } from '@/contexts/ui-context'
import { Share2, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/ContextMenu'
import { FolderIcon } from 'lucide-react'
import type { Folder } from '../../../../shared/types/api'

interface FolderCardProps {
  folder: Folder;
  onDelete?: () => void;
  onClick?: (id: string) => void;
  onMove?: (id: string, targetId: string, type: string) => void;
  isDeleting?: boolean;
}

interface DraggableItem {
  id: string;
  type: string;
}

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder'
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, onDelete, onClick, onMove, isDeleting = false }) => {
  const router = useRouter()
  const { openDetailsPanel, openRenameDialog, openShareDialog } = useUI()
  const ref = useRef<HTMLDivElement | null>(null)

  // Make folder draggable
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FOLDER,
    item: { id: folder.id, type: ItemTypes.FOLDER },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  // Make folder a drop target for files and other folders
  const [{ isOverCurrent }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.FOLDER],
    drop: (item: DraggableItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return
      if (item.id === folder.id) return // Prevent dropping on itself
      if (item.type === ItemTypes.FOLDER && item.id === folder.parentId) return // Prevent dropping into parent
      onMove?.(item.id, folder.id, item.type)
    },
    hover: (item: DraggableItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  }))

  // Combine drag and drop refs
  drag(drop(ref))

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(folder.id)
    } else {
      router.push(`/drive/${folder.id}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting || !onDelete) return
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger asChild>
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={handleClick}
          className={`
            relative group p-4 bg-white rounded-lg shadow-sm border 
            ${isOverCurrent ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} 
            ${isDragging ? 'opacity-50' : ''}
            hover:border-blue-500 hover:shadow-md transition-all cursor-pointer
            ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <FolderIcon className="w-8 h-8 text-blue-500" />
            <span className="font-medium truncate">{folder.name}</span>
          </div>

          <div className="text-sm text-gray-500">
            <p>Created {formatDistanceToNow(new Date(folder.createdAt), { addSuffix: true })}</p>
            {folder.updatedAt && folder.updatedAt !== folder.createdAt && (
              <p>Modified {formatDistanceToNow(new Date(folder.updatedAt), { addSuffix: true })}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openShareDialog({ ...folder, parentId: folder.parentId ?? '', updatedAt: folder.updatedAt ?? '', type: 'folder', userId: '' })
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openRenameDialog({ ...folder, parentId: folder.parentId ?? '', updatedAt: folder.updatedAt ?? '', type: 'folder', userId: '' })
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Pencil className="w-4 h-4 text-gray-400" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 rounded-full hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>

          {/* Drop indicator */}
          {isOverCurrent && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => router.push(`/drive/${folder.id}`)}>
          <MoreVertical className="w-4 h-4 mr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openDetailsPanel({ ...folder, parentId: folder.parentId ?? '', updatedAt: folder.updatedAt ?? '', type: 'folder', userId: '' })}>
          <MoreVertical className="w-4 h-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openShareDialog({ ...folder, parentId: folder.parentId ?? '', updatedAt: folder.updatedAt ?? '', type: 'folder', userId: '' })}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openRenameDialog({ ...folder, parentId: folder.parentId ?? '', updatedAt: folder.updatedAt ?? '', type: 'folder', userId: '' })}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        {onDelete && (
          <ContextMenuItem onSelect={handleDelete} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenuRoot>
  )
}

export default FolderCard; 