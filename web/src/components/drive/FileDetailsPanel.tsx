'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import FilePreview from './FilePreview'
import type { File as ApiFile } from '../../../../shared/types/api'

interface FileDetailsPanelProps {
  fileId: string;
  onClose: () => void;
}

interface FileVersion {
  id: string;
  name: string;
  createdAt: string;
  size: number;
}

interface ActivityLog {
  id: string;
  message: string;
  createdAt: string;
}

/**
 * @param {{ fileId: string, onClose: Function }} props
 */
export default function FileDetailsPanel({ fileId, onClose }: FileDetailsPanelProps) {
  const { data: session } = useSession()
  const panelRef = useRef<HTMLElement | null>(null)
  useOnClickOutside(panelRef as React.RefObject<HTMLElement>, onClose)

  const [file, setFile] = useState<ApiFile | null>(null)
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = session?.accessToken || session?.serverToken
        const [fileRes, versionRes, activityRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${fileId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${fileId}/versions`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activity?fileId=${fileId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (!isMounted) return;

        const [fileData, versionData, activityData] = await Promise.all([
          fileRes.json(),
          versionRes.json(),
          activityRes.json()
        ]);

        setFile(fileData.file as ApiFile);
        setVersions((versionData.versions || []) as FileVersion[]);
        setActivity((activityData.activity || []) as ActivityLog[]);
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load file details');
          console.error('Error fetching file details:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (session?.accessToken || session?.serverToken) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [fileId, session?.accessToken, session?.serverToken]);

  /** @type {(versionId: string) => Promise<void>} */
  const handleRestore = async (versionId: string) => {
    try {
      const token = session?.accessToken || session?.serverToken
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${fileId}/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ versionId })
      })

      if (!res.ok) throw new Error()
      const data = await res.json()
      setFile(data.file as ApiFile)
      toast.success('Version restored')
    } catch {
      toast.error('Failed to restore version')
    }
  }

  /** @type {(e: React.ChangeEvent<HTMLInputElement>) => Promise<void>} */
  const handleVersionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const token = session?.accessToken || session?.serverToken
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/${fileId}/versions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) throw new Error()
      const data = await res.json()
      setFile(data.file as ApiFile)
      setVersions(prev => [data.version as FileVersion, ...prev])
      toast.success('New version uploaded')
    } catch {
      toast.error('Failed to upload new version')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">File not found</p>
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" />

      {/* Panel */}
      <aside 
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[250px] bg-white shadow-xl z-50 overflow-y-auto"
      >
        <div className="p-3">
          {/* Close button */}
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-4">File Details</h2>

          {/* File Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{file.name}</h3>
            <p className="text-sm text-gray-500">
              Type: {file.type} <br />
              Size: {(file.size / 1024).toFixed(1)} KB <br />
              Last Updated: {new Date(file.updatedAt).toLocaleString()}
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${file.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm mt-2 inline-block hover:underline"
            >
              Download current version
            </a>
          </div>

          {/* 🔍 Enhanced Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <FilePreview file={file ? {
              ...file,
              url: `${process.env.NEXT_PUBLIC_API_BASE_URL}${file.path}`,
            } : file} />
          </div>

          {/* ➕ Upload New Version */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Upload new version:</label>
            <input
              type="file"
              onChange={handleVersionUpload}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>

          {/* 🕒 Version History */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Version History</h3>
            {versions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No previous versions</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="border rounded px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p>{v.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(v.createdAt).toLocaleString()} • {(v.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 📜 Activity */}
          <div>
            <h3 className="text-lg font-medium mb-2">Activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No recent activity</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activity.map((log) => (
                  <li key={log.id}>
                    {log.message}
                    <div className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
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
