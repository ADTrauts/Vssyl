'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { File as SharedFile } from '../../../../shared/types/api'

interface FilePreviewProps {
  file: SharedFile & { url: string; mimeType?: string };
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewComponent, setPreviewComponent] = useState<React.ReactElement | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return

    setLoading(true)
    setError(null)

    // Handle both absolute and relative URLs
    const url = file.url.startsWith('http') 
      ? file.url 
      : file.url.startsWith('/') 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${file.url}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${file.url}`

    setFileUrl(url)
    
    // Add error logging
    console.log('Preview URL:', url)
    const mimeType = file && typeof file === 'object' && 'mimeType' in file && typeof file.mimeType === 'string' ? file.mimeType : ''

    try {
      // Handle different file types
      if (mimeType.startsWith('image/')) {
        // Images
        setPreviewComponent(
          <div className="relative pt-[56.25%] w-full">
            <img 
              src={`${url}?token=${session?.accessToken || session?.serverToken || ''}`}
              alt={file.name}
              className="absolute inset-0 w-full h-full object-contain rounded"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error('Image load error:', e)
                setLoading(false)
                setError('Failed to load image')
              }}
            />
          </div>
        )
      } else if (mimeType === 'application/pdf') {
        // PDFs
        setPreviewComponent(
          <div className="relative h-[500px] w-full">
            <iframe
              src={`${url}?token=${session?.accessToken || session?.serverToken || ''}`}
              className="absolute inset-0 w-full h-full border rounded"
              title={file.name}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error('PDF load error:', e)
                setLoading(false)
                setError('Failed to load PDF')
              }}
            />
          </div>
        )
      } else if (mimeType.startsWith('video/')) {
        // Videos
        setPreviewComponent(
          <div className="relative pt-[56.25%] w-full">
            <video
              src={`${url}?token=${session?.accessToken || session?.serverToken || ''}`}
              className="absolute inset-0 w-full h-full rounded"
              controls
              autoPlay={false}
              onLoadedData={() => setLoading(false)}
              onError={(e) => {
                console.error('Video load error:', e)
                setLoading(false)
                setError('Failed to load video')
              }}
            />
          </div>
        )
      } else if (mimeType.startsWith('audio/')) {
        // Audio
        setPreviewComponent(
          <div className="p-4 border rounded bg-gray-50">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎵</div>
              <div className="font-medium">{file.name}</div>
            </div>
            <audio
              src={`${url}?token=${session?.accessToken || session?.serverToken || ''}`}
              className="w-full"
              controls
              onLoadedData={() => setLoading(false)}
              onError={(e) => {
                console.error('Audio load error:', e)
                setLoading(false)
                setError('Failed to load audio')
              }}
            />
          </div>
        )
      } else if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'application/json') {
        // Text-based files
        fetch(url, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken || session?.serverToken || ''}`
          }
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
            return res.text()
          })
          .then(text => {
            setPreviewComponent(
              <div className="p-4 border rounded bg-gray-50 max-h-[500px] overflow-auto">
                <pre className="whitespace-pre-wrap break-all text-sm">{text}</pre>
              </div>
            )
            setLoading(false)
          })
          .catch(err => {
            console.error('Failed to load text:', err)
            setError('Failed to load text content')
            setLoading(false)
          })
      } else {
        // Unsupported formats
        setPreviewComponent(
          <div className="p-8 border rounded bg-gray-50 text-center">
            <div className="text-6xl mb-4">{getFileIcon(mimeType)}</div>
            <h3 className="text-lg font-medium mb-2">{file.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Preview not available for this file type ({mimeType || 'unknown'})
            </p>
            <a
              href={`${url}?token=${session?.accessToken || session?.serverToken || ''}`}
              download={file.name}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download File
            </a>
          </div>
        )
        setLoading(false)
      }
    } catch (err) {
      console.error('Preview error:', err)
      setError('Failed to generate preview')
      setLoading(false)
    }
  }, [file, session?.accessToken, session?.serverToken])

  // Get appropriate icon for file type
  /**
   * @param {string} mimeType
   * @returns {string}
   */
  const getFileIcon = (mimeType: string): string => {
    if (!mimeType) return '📄'
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📑'
    if (mimeType.startsWith('video/')) return '🎬'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    if (mimeType === 'text/plain') return '📄'
    if (mimeType === 'text/markdown') return '📝'
    if (mimeType === 'application/json') return '🔧'
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
    return '📄'
  }

  if (!file) return null

  return (
    <div className="preview-container">
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="p-8 border rounded bg-red-50 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Preview Error</h3>
          <p className="text-sm text-red-600">{error}</p>
          {fileUrl && (
            <a
              href={`${fileUrl}?token=${session?.accessToken || session?.serverToken || ''}`}
              download={file.name}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download File
            </a>
          )}
        </div>
      )}

      {!loading && !error && previewComponent}
    </div>
  )
}

export default FilePreview 