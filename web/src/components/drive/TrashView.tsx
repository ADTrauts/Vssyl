'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import FileGrid from './FileGrid'
import DriveDropzone from './DriveDropzone'
import { useUI } from '@/contexts/ui-context'
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/ContextMenu'
import type { File as SharedFile, Folder as SharedFolder } from '../../../../shared/types/api'

type TrashFile = SharedFile & { type: 'file'; url?: string };
type TrashFolder = SharedFolder & { type: 'folder'; userId?: string };
type TrashItem = TrashFile | TrashFolder;

interface TrashViewProps {
  initialItems: TrashItem[]
}

const TrashView: React.FC<TrashViewProps> = ({ initialItems }) => {
  const { openDetailsPanel } = useUI()
  const [items, setItems] = useState<TrashItem[]>(initialItems)
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)

  /**
   * @param {string} id
   * @param {'file' | 'folder'} type
   */
  const handleRestore = async (id: string, type: 'file' | 'folder') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${type}s/${id}/restore`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!res.ok) throw new Error(`Failed to restore ${type}`)

      toast.success(`${type} restored successfully`)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      toast.error(`Failed to restore ${type}`)
      console.error(error)
    }
  }

  /**
   * @param {string} id
   * @param {'file' | 'folder'} type
   */
  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${type}s/${id}/permanent`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error(`Failed to delete ${type}`)

      toast.success(`${type} permanently deleted`)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      toast.error(`Failed to delete ${type}`)
      console.error(error)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to empty the trash? This cannot be undone.')) {
      return
    }
    
    setIsEmptyingTrash(true)
    
    try {
      const fileRequests = items
        .filter(item => item.type === 'file')
        .map(item => 
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${item.id}/permanent`, {
            method: 'DELETE',
            credentials: 'include'
          })
        )
      
      const folderRequests = items
        .filter(item => item.type === 'folder')
        .map(item => 
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/${item.id}/permanent`, {
            method: 'DELETE',
            credentials: 'include'
          })
        )
      
      const results = await Promise.allSettled([...fileRequests, ...folderRequests])
      const successCount = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<Response>).value.ok).length
      
      if (successCount === items.length) {
        toast.success('Trash emptied successfully')
        setItems([])
      } else {
        toast.warning(`Deleted ${successCount} of ${items.length} items`)
        setItems(items.filter((_, index) => {
          const result = results[index]
          return !(result && result.status === 'fulfilled' && (result as PromiseFulfilledResult<Response>).value && (result as PromiseFulfilledResult<Response>).value.ok)
        }))
      }
    } catch (error) {
      toast.error('Failed to empty trash')
      console.error(error)
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  /**
   * @param {React.MouseEvent} e
   * @param {TrashItem} item
   */
  const handleItemClick = (e: React.MouseEvent, item: TrashItem) => {
    if (e.type === 'contextmenu') {
      e.preventDefault()
      return
    }
    if (item.type === 'file') {
      openDetailsPanel({ ...item, url: item.url ?? '', type: 'file' })
    } else {
      openDetailsPanel({ ...item, userId: item.userId ?? '', parentId: item.parentId ?? '', type: 'folder' })
    }
  }

  /**
   * @param {string} id
   * @param {'file' | 'folder'} type
   */
  const renderItemActions = (id: string, type: 'file' | 'folder') => (
    <ContextMenuContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      <ContextMenuItem 
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          handleRestore(id, type)
        }}
      >
        🔄 Restore
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          if (confirm('Are you sure? This cannot be undone.')) {
            handleDelete(id, type)
          }
        }}
      >
        🗑 Delete forever
      </ContextMenuItem>
      <ContextMenuItem 
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          const item = items.find(i => i.id === id && i.type === type)
          if (item) {
            if (item.type === 'file') {
              openDetailsPanel({ ...item, url: item.url ?? '', type: 'file' })
            } else {
              openDetailsPanel({ ...item, userId: item.userId ?? '', parentId: item.parentId ?? '', type: 'folder' })
            }
          }
        }}
      >
        🧐 View Details
      </ContextMenuItem>
    </ContextMenuContent>
  )

  return (
    <DriveDropzone folderId={''}>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-6">Trash</h1>
        
        {items.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className={`px-4 py-2 text-red-600 hover:bg-red-50 rounded ${
                  isEmptyingTrash ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isEmptyingTrash ? 'Emptying trash...' : 'Empty trash'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 auto-rows-max">
              {items.map((item) => (
                <ContextMenuRoot key={item.id}>
                  <ContextMenuTrigger>
                    <div 
                      onClick={(e) => handleItemClick(e, item)}
                      onContextMenu={(e) => handleItemClick(e, item)}
                      className="cursor-pointer"
                    >
                      <FileGrid
                        files={item.type === 'file' ? [{ ...item, url: item.url ?? '' }] : []}
                        folders={item.type === 'folder' ? [{ ...item, userId: item.userId ?? '', parentId: item.parentId ?? '' }] : []}
                      />
                    </div>
                  </ContextMenuTrigger>
                  {renderItemActions(item.id, item.type)}
                </ContextMenuRoot>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
            <p className="text-lg">Trash is empty</p>
            <p className="text-sm">No items in the trash</p>
          </div>
        )}
      </div>
    </DriveDropzone>
  )
}

export default TrashView 