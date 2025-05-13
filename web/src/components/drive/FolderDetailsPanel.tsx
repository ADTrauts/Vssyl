'use client'

import { useState, useEffect, useRef } from 'react'
import { useUI } from '@/contexts/ui-context'
import { toast } from 'sonner'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { formatBytes } from '@/lib/utils'

interface FolderDetailsPanelProps {
  folderId: string;
  onClose: () => void;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
  accessControls?: AccessControl[];
}

interface AccessControl {
  id: string;
  user: { name: string };
  access: string;
}

interface ActivityLog {
  id: string;
  message: string;
  createdAt: string;
}

/**
 * @param {FolderDetailsPanelProps} props
 */
export default function FolderDetailsPanel({ folderId, onClose }: FolderDetailsPanelProps) {
  const [folder, setFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)
  const [activity] = useState<ActivityLog[]>([])
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [stats, setStats] = useState({ fileCount: 0, folderCount: 0, totalSize: 0 })
  const panelRef = useRef<HTMLElement | null>(null)
  const { openShareDialog } = useUI()

  // Close panel when clicking outside
  useOnClickOutside(panelRef as React.RefObject<HTMLElement>, onClose)

  // Fetch folder details and stats
  useEffect(() => {
    const fetchFolderDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`http://localhost:5000/api/folders/${folderId}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to fetch folder details')
        const data = await res.json()
        setFolder(data.folder)
        setNewName(data.folder.name)
        setStats(data.stats)
      } catch (err) {
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    fetchFolderDetails()
  }, [folderId])

  const handleRename = async () => {
    if (!newName.trim() || (folder && newName === folder.name)) {
      setIsRenaming(false)
      setNewName(folder ? folder.name : '')
      return
    }
    try {
      const res = await fetch(`http://localhost:5000/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFolder(data.folder)
      setIsRenaming(false)
      toast.success('Folder renamed')
    } catch (err) {
      toast.error('Failed to rename folder')
      setNewName(folder ? folder.name : '')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Folder not found</p>
      </div>
    )
  }

  // Build a minimal FolderItem for openShareDialog
  const folderItem = {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId || '',
    userId: folder.userId || '',
    createdAt: folder.createdAt || '',
    updatedAt: folder.updatedAt || '',
    type: 'folder' as const,
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <aside 
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[300px] bg-white shadow-xl z-50 overflow-y-auto"
      >
        <div className="p-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-4">Folder Details</h2>

          {/* Folder Info */}
          <div className="mb-6">
            {isRenaming && folder ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border rounded px-2 py-1"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRename}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsRenaming(false)
                      setNewName(folder.name)
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{folder?.name}</h3>
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Rename
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>Created: {folder?.createdAt ? new Date(folder.createdAt).toLocaleString() : ''}</p>
                  <p>Last Modified: {folder?.updatedAt ? new Date(folder.updatedAt).toLocaleString() : ''}</p>
                  <p>Files: {stats.fileCount}</p>
                  <p>Subfolders: {stats.folderCount}</p>
                  <p>Total Size: {formatBytes(stats.totalSize)}</p>
                  <p>Status: {folder?.isPublic ? 'Public' : 'Private'}</p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => openShareDialog(folderItem)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Share Folder
            </button>
            <button
              onClick={() => {
                toast.info('Download feature coming soon')
              }}
              className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
            >
              Download All
            </button>
          </div>

          {/* Access Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Access</h3>
            <div className="space-y-2">
              {folder.accessControls?.map((access: AccessControl) => (
                <div key={access.id} className="flex items-center justify-between text-sm">
                  <span>{access.user.name}</span>
                  <span className="text-gray-500">{access.access}</span>
                </div>
              ))}
              {(!folder.accessControls || folder.accessControls.length === 0) && (
                <p className="text-sm text-gray-500 italic">No additional access granted</p>
              )}
            </div>
          </div>

          {/* Activity */}
          <div>
            <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No recent activity</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activity.map((log: ActivityLog) => (
                  <li key={log.id} className="flex flex-col">
                    <span>{log.message}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  )
} 