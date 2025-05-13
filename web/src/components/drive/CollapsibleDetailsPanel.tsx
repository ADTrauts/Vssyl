'use client'

import React, { useState, useEffect } from 'react'
import { useUI } from '@/contexts/ui-context'
import FileDetailsPanel from './FileDetailsPanel'
import FolderDetailsPanel from './FolderDetailsPanel'

const CollapsibleDetailsPanel: React.FC = () => {
  const { detailsPanel, closeDetailsPanel } = useUI()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!detailsPanel) return null

  // On mobile, panel takes full width
  const mobileStyles = isMobile
    ? {
        width: isCollapsed ? '0' : '100%',
        height: '100%',
        top: '0',
        right: '0',
        transform: isCollapsed ? 'translateX(100%)' : 'translateX(0)'
      }
    : {
        width: isCollapsed ? '48px' : '320px',
      }

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && !isCollapsed && detailsPanel && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => closeDetailsPanel()}
        />
      )}
    
      <div 
        className="fixed right-0 top-0 h-full bg-white shadow-xl transition-all duration-300 ease-in-out z-50"
        style={mobileStyles}
      >
        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute ${isMobile ? 'left-2 top-2' : '-left-3 top-1/2 transform -translate-y-1/2'} bg-white rounded-full p-1 shadow-md hover:bg-gray-50 z-50`}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed !== isMobile ? 'rotate-180' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d={isMobile ? "M6 18L18 6M6 6l12 12" : "M15 18l-6-6 6-6"}
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Panel content */}
        <div className={`h-full overflow-y-auto ${isCollapsed && !isMobile ? 'opacity-0' : 'opacity-100'}`}>
          {detailsPanel.type === 'file' && (
            <FileDetailsPanel fileId={detailsPanel.id} onClose={closeDetailsPanel} />
          )}
          {detailsPanel.type === 'folder' && (
            <FolderDetailsPanel folderId={detailsPanel.id} onClose={closeDetailsPanel} />
          )}
        </div>
      </div>
    </>
  )
}

export default CollapsibleDetailsPanel 