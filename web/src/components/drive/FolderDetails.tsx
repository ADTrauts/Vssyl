'use client'

import React, { useEffect, useState } from 'react'
import type { Folder as SharedFolder, File as SharedFile, User } from '../../../../shared/types/api'

interface FolderDetailsProps {
  folderId: string
}

// Use shared Folder type, and extend to add files/children if needed
interface FolderWithContents extends SharedFolder {
  files?: SharedFile[];
  children?: FolderWithContents[];
}

interface ActivityLog {
  id: string;
  message: string;
  createdAt: string;
  user?: User;
}

const FolderDetails: React.FC<FolderDetailsProps> = ({ folderId }) => {
  const [folder, setFolder] = useState<FolderWithContents | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    const fetchFolderDetails = async () => {
      try {
        const [folderRes, activityRes] = await Promise.all([
          fetch(`http://localhost:5000/folders/${folderId}`, {
            credentials: 'include'
          }),
          fetch(`http://localhost:5000/api/activity?folderId=${folderId}`, {
            credentials: 'include'
          })
        ])

        if (folderRes.ok) {
          const data = await folderRes.json()
          setFolder(data.folder)
        }

        if (activityRes.ok) {
          const data = await activityRes.json()
          setActivityLogs(data.activity || [])
        }
      } catch (error) {
        console.error('Error fetching folder details:', error)
      }
    }

    fetchFolderDetails()
  }, [folderId])

  if (!folder) return null

  return (
    <div className="mt-8 border-t pt-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Folder Details</h2>
        {/* Folder Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Properties</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm">{folder.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm">{new Date(folder.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last modified</dt>
                <dd className="text-sm">{new Date(folder.updatedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Items</dt>
                <dd className="text-sm">{(folder.files?.length || 0) + (folder.children?.length || 0)} items</dd>
              </div>
            </dl>
          </div>
          {/* Activity Feed */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              <ul className="space-y-3">
                {activityLogs.slice(0, 5).map((log) => (
                  <li key={log.id} className="text-sm">
                    <p>{log.message}</p>
                    <time className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FolderDetails
