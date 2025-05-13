import React, { useState, useEffect } from 'react'
import type { Folder as SharedFolder, File as SharedFile } from '../../../../shared/types/api'

interface FolderViewProps {
  folderId: string;
}

const FolderView: React.FC<FolderViewProps> = ({ folderId }) => {
  const [folders, setFolders] = useState<SharedFolder[]>([])
  const [files, setFiles] = useState<SharedFile[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Replace with actual API endpoints
        const foldersRes = await fetch(`/api/folders?parentId=${folderId}`)
        const filesRes = await fetch(`/api/files?folderId=${folderId}`)
        const foldersData = await foldersRes.json()
        const filesData = await filesRes.json()
        setFolders(foldersData.folders || [])
        setFiles(filesData.files || [])
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [folderId])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  return (
    <div className="folder-view">
      <h2 className="text-xl font-semibold mb-4">Folder Contents</h2>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Folders</h3>
        {folders.length === 0 ? (
          <p className="text-gray-500 italic">No subfolders.</p>
        ) : (
          <ul className="space-y-2">
            {folders.map(folder => (
              <li key={folder.id} className="border rounded px-3 py-2">
                {folder.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Files</h3>
        {files.length === 0 ? (
          <p className="text-gray-500 italic">No files.</p>
        ) : (
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.id} className="border rounded px-3 py-2">
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default FolderView; 