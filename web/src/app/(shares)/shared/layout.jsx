'use client'

import { useState } from 'react'
import DriveSidebar from '@/components/drive/DriveSidebar'

export default function SharedLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div 
        className={`
          fixed top-0 left-0 z-30 h-full bg-white transition-transform md:static md:z-auto
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <DriveSidebar />
      </div>

      {/* Mobile toggle button */}
      <button
        className="fixed left-4 bottom-4 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center z-20 md:hidden shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Main content */}
      <main className="flex-1 transition-all duration-300 ease-in-out p-4">
        {children}
      </main>
    </div>
  )
} 