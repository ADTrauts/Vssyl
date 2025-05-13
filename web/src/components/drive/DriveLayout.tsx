'use client'

import React from 'react'
import FileGrid from './FileGrid'
import FolderDetailsPanel from './FolderDetailsPanel'
import DriveDropzone from './DriveDropzone'
import { Button } from '@/components/ui/button'
import type { Folder, File } from '@/types/api'
import type { FileGridFile, FileGridFolder } from './FileGrid'

interface DriveLayoutProps {
  folders: Folder[]
  files: File[]
  selectedFolder: Folder | null
  setSelectedFolder: (folder: Folder | null) => void
  onUploadComplete: (folderId: string) => void
  onNewFolderClick: () => void
}

const DriveLayout: React.FC<DriveLayoutProps> = ({
  folders,
  files,
  selectedFolder,
  setSelectedFolder,
  onUploadComplete,
  onNewFolderClick,
}) => {
  const currentFiles: FileGridFile[] = selectedFolder
    ? files.filter((f) => (f as { folderId?: string | null }).folderId === selectedFolder.id)
      .map(f => ({ ...f }))
    : files.filter((f) => !(f as { folderId?: string | null }).folderId)
      .map(f => ({ ...f }))

  const currentFolders: FileGridFolder[] = selectedFolder
    ? folders.filter((f) => f.parentId === selectedFolder.id).map(f => ({ ...f }))
    : folders.filter((f) => !f.parentId).map(f => ({ ...f }))

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r p-4">
        <h2 className="font-semibold mb-2">My Drive</h2>
        <ul>
          {folders.filter((f) => !f.parentId).map((folder) => (
            <li
              key={folder.id}
              className="cursor-pointer hover:text-blue-500"
              onClick={() => setSelectedFolder(folder)}
            >
              📁 {folder.name}
            </li>
          ))}
          <li
            className="cursor-pointer text-sm text-blue-600 mt-2"
            onClick={() => setSelectedFolder(null)}
          >
            ⬅️ Back to Root
          </li>
        </ul>
      </aside>

      {/* Main Area Wrapped with Dropzone */}
      <DriveDropzone folderId={selectedFolder?.id || ''} onUploadComplete={() => onUploadComplete(selectedFolder?.id || '')}>
        <main className="flex-grow p-4 overflow-auto">
          <h1 className="text-2xl font-semibold mb-4">
            {selectedFolder ? selectedFolder.name : 'My Drive'}
          </h1>
          <Button onClick={onNewFolderClick} className="mb-4">
            ➕ New Folder
          </Button>

          <FileGrid
            folders={currentFolders}
            files={currentFiles}
            onItemClick={() => { /* no-op for type safety */ }}
          />
        </main>
      </DriveDropzone>

      {/* Details Panel */}
      {selectedFolder && (
        <FolderDetailsPanel folderId={selectedFolder.id} onClose={() => setSelectedFolder(null)} />
      )}
    </div>
  )
}

export default DriveLayout
