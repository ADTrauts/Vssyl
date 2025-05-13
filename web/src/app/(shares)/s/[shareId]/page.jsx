'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getSharedResource } from '@/lib/share'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatBytes, formatDate } from '@/lib/utils'
import Image from 'next/image'
import { Download } from 'lucide-react'

export default function SharedFilePage() {
  const { shareId } = useParams()
  const [sharedItem, setSharedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSharedItem() {
      try {
        setLoading(true)
        const data = await getSharedResource(shareId)
        setSharedItem(data)
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to load shared resource')
      } finally {
        setLoading(false)
      }
    }

    if (shareId) {
      fetchSharedItem()
    }
  }, [shareId])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    )
  }

  if (!sharedItem) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Resource Not Found</h1>
        <p className="mt-2 text-gray-600">The shared item you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  const { file, share } = sharedItem
  const isImage = file.mimeType?.startsWith('image/')
  const isPDF = file.mimeType === 'application/pdf'
  const previewUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/content`
  
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{file.name}</h1>
          <a 
            href={previewUrl} 
            download={file.name}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Download size={18} />
            Download
          </a>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Shared by: {share.owner?.email || 'Unknown'}</p>
          <p>Size: {formatBytes(file.size)}</p>
          <p>Last modified: {formatDate(file.updatedAt)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        {isImage && (
          <div className="flex justify-center">
            <Image 
              src={previewUrl}
              alt={file.name}
              width={800}
              height={600}
              className="max-h-[600px] rounded object-contain"
              unoptimized
            />
          </div>
        )}
        
        {isPDF && (
          <div className="h-[600px] w-full">
            <iframe 
              src={previewUrl} 
              className="h-full w-full rounded border"
              title={file.name}
            />
          </div>
        )}
        
        {!isImage && !isPDF && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 rounded-lg bg-gray-100 p-8">
              <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium">Preview not available</p>
            <p className="mt-1 text-sm text-gray-500">Download the file to view its contents</p>
          </div>
        )}
      </div>
    </div>
  )
} 