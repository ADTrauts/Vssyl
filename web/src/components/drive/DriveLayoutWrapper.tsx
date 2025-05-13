'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
// NOTE: The following import may cause a linter error in JS files due to missing type declarations. This is a known, non-blocking issue and does not affect runtime behavior.
import { useUI } from '@/contexts/ui-context'
import { toast } from 'sonner'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Breadcrumbs from './Breadcrumbs'
import FileGrid from './FileGrid'
import NewFolderDialog from './NewFolderDialog'
import FileDetailsPanel from './FileDetailsPanel'
import FolderDetailsPanel from './FolderDetailsPanel'
import { ContextMenuContent, ContextMenuItem } from '@/components/ui/ContextMenu'
import { isFileItem, isFolderItem, isBreadcrumbFolder } from '@/lib/type-guards'
import { toItem } from '@/lib/type-converters'
import type { Folder, File as DriveFile, BreadcrumbFolder } from '@/types/api'
import type { FileGridFile, FileGridFolder } from './FileGrid'
import type { Item } from '@/contexts/ui-context'

/**
 * @typedef {import('@/types/api').Folder} Folder
 * @typedef {import('@/types/api').File} File
 * @typedef {import('@/contexts/ui-context').FileItem} FileItem
 * @typedef {import('@/contexts/ui-context').FolderItem} FolderItem
 * @typedef {import('@/types/api').BreadcrumbFolder} BreadcrumbFolder
 * @typedef {FileItem|FolderItem} Item
 * @typedef {BreadcrumbFolder[]} BreadcrumbPath
 */

/**
 * @param {Object} props
 * @param {Folder[]=} props.folders
 * @param {File[]=} props.files
 * @param {string|null=} props.currentFolderId
 * @param {BreadcrumbPath=} props.breadcrumbPath
 */
const DriveLayoutWrapper: React.FC<{
  folders?: Folder[];
  files?: DriveFile[];
  currentFolderId?: string | null;
  breadcrumbPath?: BreadcrumbFolder[];
}> = ({
  folders: initialFolders = [],
  files: initialFiles = [],
  currentFolderId = null,
  breadcrumbPath = [],
}) => {
  const router = useRouter()
  const { openDetailsPanel, openRenameDialog, openShareDialog } = useUI()
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [files, setFiles] = useState<DriveFile[]>(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  /**
   * @param {FileList|File[]} files
   */
  const handleFileUpload = async (files: FileList | File[]) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      let fileArray: File[]
      if (files instanceof FileList) {
        fileArray = Array.from(files)
      } else {
        fileArray = files
      }
      fileArray.forEach(file => {
        if (file instanceof window.File) {
          formData.append('files', file)
        }
      })
      if (currentFolderId) {
        formData.append('folderId', currentFolderId)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!res.ok) throw new Error('Failed to upload files')
      const data = await res.json()
      // Expecting data.files to be DriveFile[]
      if (Array.isArray(data.files)) {
        setFiles(prev => [...prev, ...data.files as DriveFile[]])
      }
      toast.success('Files uploaded successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to upload files')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * @param {string} folderId
   */
  const handleFolderDelete = async (folderId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/${folderId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to delete folder')
      
      setFolders(prev => prev.filter(f => f.id !== folderId))
      toast.success('Folder deleted successfully')
    } catch (error) {
      toast.error('Failed to delete folder')
      console.error(error)
    }
  }

  /**
   * @param {string} fileId
   */
  const handleFileDelete = async (fileId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to delete file')
      
      setFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    }
  }

  /**
   * @param {(File|Folder) & {type: 'file'|'folder'}} item
   */
  const handleItemClick = (item: (DriveFile | Folder) & { type: 'file' | 'folder' }) => {
    try {
      const convertedItem = toItem(item, item.type)
      setSelectedItem(convertedItem)
      
      if (item.type === 'folder') {
        router.push(`/drive?folder=${item.id}`)
      } else {
        openDetailsPanel(convertedItem)
      }
    } catch (error) {
      console.error('Failed to handle item click:', error)
      toast.error('Failed to process item')
    }
  }

  /**
   * @param {File|Folder} item
   * @param {'file'|'folder'} type
   */
  const renderContextMenu = (item: DriveFile | Folder, type: 'file' | 'folder') => {
    try {
      const convertedItem = toItem(item, type)
      return (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => openShareDialog(convertedItem)}>
            Share
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openRenameDialog(convertedItem)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => type === 'folder' ? handleFolderDelete(item.id) : handleFileDelete(item.id)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )
    } catch (error) {
      console.error('Failed to render context menu:', error)
      return null
    }
  }

  /** @type {BreadcrumbFolder[]} */
  const validBreadcrumbs: BreadcrumbFolder[] = Array.isArray(breadcrumbPath) 
    ? breadcrumbPath.filter(isBreadcrumbFolder)
    : []

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        <div className="flex-1">
          <Breadcrumbs path={validBreadcrumbs} />

          <div className="p-4 border-2 border-dashed rounded-lg text-center mb-4">
            <input
              type="file"
              multiple
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
              disabled={isUploading}
            />
            {isUploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
          </div>

          <FileGrid
            folders={folders as FileGridFolder[]}
            files={files as FileGridFile[]}
            onFolderDelete={handleFolderDelete}
            onFileDelete={handleFileDelete}
            onItemClick={handleItemClick}
            renderContextMenu={renderContextMenu}
          />

          <NewFolderDialog
            isOpen={isNewFolderDialogOpen}
            onClose={() => setIsNewFolderDialogOpen(false)}
            currentParentId={currentFolderId || 'root'}
            onCreate={(newFolder: Folder) => {
              setFolders(prev => [...prev, newFolder])
              setIsNewFolderDialogOpen(false)
              router.refresh()
            }}
          />
        </div>

        {selectedItem && isFileItem(selectedItem) && (
          <FileDetailsPanel 
            fileId={selectedItem.id} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
        
        {selectedItem && isFolderItem(selectedItem) && (
          <FolderDetailsPanel 
            folderId={selectedItem.id} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </div>
    </DndProvider>
  )
}

export default DriveLayoutWrapper
