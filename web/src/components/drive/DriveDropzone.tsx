'use client'

import React, { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useDrop } from 'react-dnd'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface DriveDropzoneProps {
  folderId: string
  onUploadComplete?: () => void
  children?: ReactNode
}

const DriveDropzone: React.FC<DriveDropzoneProps> = ({ folderId, onUploadComplete, children }) => {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  /**
   * @param {File|{id:string}} file
   */
  const handleFile = async (file: File | { id: string }) => {
    console.log('Handling file:', file)
    try {
      if ('id' in file) {
        // This is a file being moved
        console.log('Moving file:', file.id, 'to folder:', folderId)
        const response = await fetch(`/api/files/${file.id}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderId }),
          credentials: 'include'
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to move file')
        }
        toast.success('File moved successfully')
      } else {
        // This is a new file being uploaded
        // Treat as File (JS file, so no type assertion)
        const uploadFile = file
        console.log('Uploading new file:', uploadFile.name)
        const formData = new FormData()
        formData.append('file', uploadFile)
        if (folderId) {
          formData.append('folderId', folderId)
        }
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload file')
        }
        const data = await response.json()
        console.log('Upload response:', data)
        toast.success(`${uploadFile.name} uploaded successfully`)
      }
      onUploadComplete?.()
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('Error handling file:', err)
      toast.error(err.message || 'An error occurred while processing the file')
    }
  }

  // Type guard for drag-and-drop item
  function isIdObject(item: unknown): item is { id: string } {
    return typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'string';
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['FILE', 'FILES'],
    drop: async (items: File | { id: string } | Array<File | { id: string }>) => {
      if (isUploading) return
      setIsUploading(true)
      try {
        if (Array.isArray(items)) {
          await Promise.all(items.map(file => handleFile(file)))
        } else if (items instanceof File) {
          await handleFile(items)
        } else if (isIdObject(items)) {
          await handleFile(items)
        }
      } finally {
        setIsUploading(false)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [folderId, session, isUploading])

  /** @type {(e: React.DragEvent) => void} */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (isUploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setIsUploading(true)
    Promise.all(files.map(file => handleFile(file)))
      .finally(() => setIsUploading(false))
  }, [isUploading])

  /** @type {(e: React.DragEvent) => void} */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /** @type {(e: React.DragEvent) => void} */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  /** @type {(e: React.DragEvent) => void} */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  return (
    <div
      ref={node => { drop(node); }}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
        ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isDragging ? 'border-blue-500 bg-blue-50' : ''}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <CloudArrowUpIcon 
        className={`mx-auto h-12 w-12 ${isUploading ? 'animate-bounce' : ''} text-gray-400`}
      />
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {isUploading ? 'Uploading...' : 
           isOver ? 'Drop files here' : 
           'Drag and drop files here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {isOver ? 'Files will be moved to this folder' : 
           'Files will be uploaded to this folder'}
        </p>
      </div>
      {children}
    </div>
  )
}

export default DriveDropzone
