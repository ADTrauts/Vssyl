'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUI } from '@/contexts/ui-context'
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/ContextMenu'
import { useDrag } from 'react-dnd'
import { FileIcon, Star, Download, Share2, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { FileItem } from '@/contexts/ui-context'

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder'
}

export interface FileCardFile {
  id: string
  name: string
  isStarred?: boolean
  mimeType?: string
  size?: number
  updatedAt?: string
  url?: string
}

export interface FileCardProps {
  file?: FileCardFile
  item?: FileCardFile
  type?: 'file' | 'folder'
  onClick?: (id: string) => void
  onDelete?: () => Promise<void> | void
  isDeleting?: boolean
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  item,
  type = 'file',
  onClick,
  onDelete,
  isDeleting = false,
}) => {
  const router = useRouter()
  const { openDetailsPanel, openRenameDialog, openShareDialog } = useUI()
  const [previewError, setPreviewError] = useState(false)
  const [isStarred, setIsStarred] = useState(file?.isStarred || false)
  const ref = useRef<HTMLDivElement>(null)
  
  // Use either file or item prop
  const data = file || item
  
  // Make file draggable (must always be called)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FILE,
    item: { id: data?.id, type: ItemTypes.FILE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [data])
  // Apply drag ref
  drag(ref)

  // Return placeholder if no data (after hooks)
  if (!data) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <FileIcon className="w-8 h-8 text-gray-300" />
          <span className="font-medium text-gray-400">No file data</span>
        </div>
      </div>
    )
  }
  
  const isImage = type === 'file' && data.mimeType?.startsWith('image/')
  const isPDF = type === 'file' && data.mimeType === 'application/pdf'
  const showPreview = (isImage || isPDF) && !previewError

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${data.id}/star`, {
        method: 'POST',
        credentials: 'include'
      })
      if (!res.ok) throw new Error()
      setIsStarred(!isStarred)
      toast.success(isStarred ? 'Removed from starred' : 'Added to starred')
    } catch (err) {
      toast.error('Failed to update star status')
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${data.id}/download`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      toast.error('Failed to download file')
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(data.id)
    } else if (type === 'folder') {
      router.push(`/drive/${data.id}`)
    } else {
      const fileItem: FileItem = {
        id: data.id,
        name: data.name,
        size: data.size ?? 0,
        type: 'file',
        url: data.url ?? '',
        updatedAt: data.updatedAt ?? '',
        createdAt: 'createdAt' in data && typeof data.createdAt === 'string' ? data.createdAt : '',
      }
      openDetailsPanel(fileItem)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting || !onDelete) return

    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const fileItem: FileItem = {
    id: data.id,
    name: data.name,
    size: data.size ?? 0,
    type: 'file',
    url: data.url ?? '',
    updatedAt: data.updatedAt ?? '',
    createdAt: 'createdAt' in data && typeof data.createdAt === 'string' ? data.createdAt : '',
  }

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger asChild>
        <div 
          ref={ref}
          className={`
            relative group p-4 bg-white rounded-lg shadow-sm border border-gray-200
            hover:border-blue-500 hover:shadow-md transition-all cursor-pointer
            ${isDragging ? 'opacity-50' : ''}
            ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={handleClick}
        >
          <div className="flex items-center gap-3 mb-2">
            <FileIcon className="w-8 h-8 text-gray-500" />
            <span className="font-medium truncate">{data.name || 'Unnamed file'}</span>
          </div>

          <div className="text-sm text-gray-500">
            <p>{data.size ? formatBytes(data.size) : 'Size unknown'}</p>
            <p>Modified {data.updatedAt ? formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true }) : 'date unknown'}</p>
          </div>

          {showPreview && (
            <div className="mt-2 relative pt-[100%]">
              {isImage && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${data.url}`}
                  alt={data.name}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                  onError={() => setPreviewError(true)}
                />
              )}
              {isPDF && (
                <iframe
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${data.url}`}
                  className="absolute inset-0 w-full h-full rounded"
                  title={data.name}
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={handleStar}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              {isStarred ? (
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              ) : (
                <Star className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openShareDialog(fileItem)
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openRenameDialog(fileItem)
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
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => openDetailsPanel(fileItem)}>
          <MoreVertical className="w-4 h-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openShareDialog(fileItem)}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => openRenameDialog(fileItem)}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleStar}>
          {isStarred ? (
            <>
              <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
              Remove from Starred
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Add to Starred
            </>
          )}
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
