'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Folder {
  id: string
  name: string
}

interface FoldersState {
  starred: Folder[]
  recent: Folder[]
  shared: Folder[]
}

const Sidebar: React.FC = () => {
  const router = useRouter()
  const [folders, setFolders] = useState<FoldersState>({
    starred: [],
    recent: [],
    shared: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      const [starredRes, recentRes, sharedRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/starred`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/recent`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/shared`, {
          credentials: 'include'
        })
      ])

      if (!starredRes.ok || !recentRes.ok || !sharedRes.ok) {
        throw new Error('Failed to fetch folders')
      }

      const [starred, recent, shared] = await Promise.all([
        starredRes.json(),
        recentRes.json(),
        sharedRes.json()
      ])

      setFolders({
        starred: starred.folders || [],
        recent: recent.folders || [],
        shared: shared.folders || []
      })
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast.error('Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  /**
   * @param {Array<{id: string, name: string}>} folders
   * @param {React.ReactElement} icon
   * @param {string} emptyMessage
   */
  const renderFolderList = (folders: Folder[], icon: React.ReactElement, emptyMessage: string) => {
    if (loading) {
      return <div className="text-sm text-gray-500">Loading...</div>
    }

    if (folders.length === 0) {
      return <div className="text-sm text-gray-500">{emptyMessage}</div>
    }

    return (
      <div className="space-y-1">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => router.push(`/drive/${folder.id}`)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            {icon}
            <span className="truncate">{folder.name}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 p-4">
      <div className="space-y-6">
        {/* Starred Folders */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-gray-900">Starred</h3>
          </div>
          {renderFolderList(folders.starred, <Star className="w-4 h-4 text-yellow-400" />, 'No starred folders')}
        </div>

        {/* Recent Folders */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Recent</h3>
          </div>
          {renderFolderList(folders.recent, <Clock className="w-4 h-4 text-gray-500" />, 'No recent folders')}
        </div>

        {/* Shared Folders */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-900">Shared with me</h3>
          </div>
          {renderFolderList(folders.shared, <Users className="w-4 h-4 text-blue-500" />, 'No shared folders')}
        </div>
      </div>
    </div>
  )
}

export default Sidebar 