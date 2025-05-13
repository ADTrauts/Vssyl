'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileCard } from './FileCard'
import type { FileCardFile } from './FileCard'
import { useUI } from '@/contexts/ui-context'

interface Folder {
  id: string
  name: string
  [key: string]: unknown
}

interface VirtualizedFileGridProps {
  folders?: Folder[]
  files?: FileCardFile[]
  onFolderDelete?: (id: string) => void
  onFileDelete?: (id: string) => void
}

// Type guard for objects with a string 'createdAt' property
function hasStringCreatedAt(obj: unknown): obj is { createdAt: string } {
  return typeof obj === 'object' && obj !== null && typeof (obj as { createdAt?: unknown }).createdAt === 'string';
}

const VirtualizedFileGrid: React.FC<VirtualizedFileGridProps> = ({
  folders = [],
  files = [],
  onFolderDelete,
  onFileDelete,
}) => {
  const router = useRouter()
  const { openDetailsPanel } = useUI()
  const [visibleItems, setVisibleItems] = useState<(Folder | FileCardFile & { type: 'file' | 'folder' })[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(30) // Initial visible item count
  const containerRef = useRef<HTMLDivElement>(null)

  // All items combined
  const allItems = [
    ...folders.map(folder => ({ ...folder, type: 'folder' as const })),
    ...files.map(file => ({ ...file, type: 'file' as const }))
  ]

  // Item dimensions and calculation constants
  const itemHeight = 180 // Approximate height of each item
  const itemWidth = 180 // Approximate width of each item
  const bufferItems = 10 // Extra items to render for smooth scrolling
  
  // Update visible items based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return

      const { scrollTop, clientHeight, clientWidth } = containerRef.current

      // Calculate how many items can fit in view horizontally
      const columns = Math.floor(clientWidth / itemWidth) || 1
      
      // Calculate which items should be visible
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) * columns - bufferItems)
      const newEndIndex = Math.min(
        allItems.length,
        Math.ceil((scrollTop + clientHeight) / itemHeight) * columns + bufferItems
      )

      setStartIndex(newStartIndex)
      setEndIndex(newEndIndex)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial calculation
    }

    return () => container?.removeEventListener('scroll', handleScroll)
  }, [allItems.length])

  // Update visible items when indices change
  useEffect(() => {
    setVisibleItems(allItems.slice(startIndex, endIndex))
  }, [startIndex, endIndex, allItems])

  // Handle item click
  const handleItemClick = (e: React.MouseEvent, item: (Folder | FileCardFile & { type: 'file' | 'folder' })) => {
    if (e.type === 'contextmenu') {
      e.preventDefault()
      return
    }

    if (item.type === 'folder') {
      router.push(`/drive/${item.id}`)
    } else {
      openDetailsPanel({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        size: typeof item.size === 'number' ? item.size : 0,
        type: 'file',
        url: typeof item.url === 'string' ? item.url : '',
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
        createdAt: hasStringCreatedAt(item) ? item.createdAt : '',
      })
    }
  }

  // Total grid height for proper scrolling
  const totalHeight = Math.ceil(allItems.length / (containerRef.current?.clientWidth ? containerRef.current.clientWidth / itemWidth : 5)) * itemHeight

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{ 
        height: '80vh', // Set an appropriate height
        position: 'relative' 
      }}
    >
      {/* Empty State */}
      {allItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-lg">No items</p>
          <p className="text-sm">Drag and drop files here or use the New button</p>
        </div>
      )}

      {/* Virtual Height Container */}
      <div 
        style={{ 
          height: `${totalHeight}px`,
          position: 'relative'
        }}
      >
        {/* Section labels */}
        {folders.length > 0 && startIndex === 0 && (
          <h2 className="text-sm font-medium text-gray-900 mb-2 sticky top-0 bg-white z-10 pl-2">
            Folders
          </h2>
        )}

        {/* Virtualized grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 absolute w-full"
          style={{
            transform: `translateY(${Math.floor(startIndex / Math.floor(containerRef.current?.clientWidth ? containerRef.current.clientWidth / itemWidth : 5)) * itemHeight}px)`
          }}
        >
          {visibleItems.map((item) => {
            const isFile = item.type === 'file';
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="cursor-pointer"
                onClick={(e) => handleItemClick(e, item)}
                onContextMenu={(e) => handleItemClick(e, item)}
              >
                {isFile ? (
                  <FileCard
                    file={item as FileCardFile}
                    item={item}
                    type="file"
                    onDelete={() => onFileDelete && onFileDelete(item.id)}
                  />
                ) : (
                  <FileCard
                    item={item}
                    type="folder"
                    onDelete={() => onFolderDelete && onFolderDelete(item.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Files label if folders exist and we're past them */}
        {folders.length > 0 && files.length > 0 && startIndex >= folders.length && (
          <h2 
            className="text-sm font-medium text-gray-900 mb-2 sticky top-0 bg-white z-10 pl-2"
            style={{
              transform: `translateY(${Math.ceil(folders.length / Math.floor(containerRef.current?.clientWidth ? containerRef.current.clientWidth / itemWidth : 5)) * itemHeight}px)`
            }}
          >
            Files
          </h2>
        )}
      </div>
    </div>
  )
}

export default VirtualizedFileGrid 