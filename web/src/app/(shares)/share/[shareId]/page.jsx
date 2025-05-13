'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { FileIcon, FolderIcon, DownloadIcon } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

export default function SharedItemPage() {
  const { shareId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sharedItem, setSharedItem] = useState(null)

  useEffect(() => {
    const fetchSharedItem = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/public/share/${shareId}`)
        setSharedItem(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching shared item:', err)
        setError('This shared item could not be found or is no longer available')
        setLoading(false)
      }
    }

    if (shareId) {
      fetchSharedItem()
    }
  }, [shareId])

  const handleDownload = async () => {
    if (sharedItem?.type !== 'file') return
    
    try {
      const response = await axios.get(`/api/public/download/${shareId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', sharedItem.data.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading shared item...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">404</div>
          <h2 className="text-xl font-semibold mb-4">Shared item not found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!sharedItem) return null

  const isFile = sharedItem.type === 'file'
  const isFolder = sharedItem.type === 'folder'
  const data = sharedItem.data

  const renderFilePreview = () => {
    if (!isFile) return null
    
    const mimeType = data.mimeType || ''
    
    if (mimeType.startsWith('image/')) {
      return (
        <div className="mb-6 max-w-md mx-auto">
          <Image 
            src={data.currentVersion?.fileUrl || '/placeholder.png'} 
            alt={data.name}
            width={400}
            height={300}
            className="rounded-lg object-contain"
          />
        </div>
      )
    }
    
    if (mimeType === 'application/pdf') {
      return (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50 text-center">
          <p>PDF Preview (embed would go here in production)</p>
        </div>
      )
    }
    
    return null
  }

  const renderFileDetails = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <FileIcon size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-gray-500">Shared by {data.owner?.name || 'Unknown'}</p>
          </div>
        </div>
        
        {renderFilePreview()}
        
        <div className="border-t pt-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p>{data.mimeType || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p>{formatFileSize(data.currentVersion?.size || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p>{format(new Date(data.createdAt), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modified</p>
              <p>{format(new Date(data.currentVersion?.createdAt || data.updatedAt), 'PPP')}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DownloadIcon size={18} className="mr-2" />
          Download File
        </button>
      </div>
    )
  }

  const renderFolderDetails = () => {
    const files = data.children || []
    const folders = data.childFolders || []
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <FolderIcon size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-gray-500">Shared folder by {data.owner?.name || 'Unknown'}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Folder contents ({files.length + folders.length} items)</p>
          
          {folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">This folder is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <FolderIcon size={20} className="text-blue-600 mr-2" />
                  <div className="overflow-hidden">
                    <p className="truncate font-medium">{folder.name}</p>
                    <p className="text-xs text-gray-500">Folder</p>
                  </div>
                </div>
              ))}
              
              {files.map((file) => (
                <div key={file.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <FileIcon size={20} className="text-blue-600 mr-2" />
                  <div className="overflow-hidden">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.versions?.[0]?.size || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500">
            Created {format(new Date(data.createdAt), 'PPP')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {isFile && renderFileDetails()}
      {isFolder && renderFolderDetails()}
    </div>
  )
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 