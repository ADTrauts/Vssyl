'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NewButton from './NewButton'

const DriveSidebar: React.FC = () => {
  const pathname = usePathname()

  /**
   * @param {string} path
   */
  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-60 min-h-screen bg-gray-50 p-4 flex flex-col">
      <div className="mb-6">
        <NewButton onClick={() => {}} />
      </div>

      <nav className="space-y-1">
        <Link
          href="/drive"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/drive') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Home
        </Link>

        <Link
          href="/drive"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/drive') && !pathname.includes('/folder/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          My Drive
        </Link>

        <Link
          href="/shared"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/shared') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Shared with me
        </Link>

        <Link
          href="/recent"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/recent') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Recent
        </Link>

        <Link
          href="/starred"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/starred') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Starred
        </Link>

        <Link
          href="/trash"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
            isActive('/trash') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Trash
        </Link>
      </nav>

      <div className="mt-auto pt-6 border-t">
        <div className="text-sm text-gray-500">
          <div className="h-1 w-full bg-gray-200 rounded">
            <div className="h-1 bg-blue-500 rounded" style={{ width: '15%' }}></div>
          </div>
          <p className="mt-2">318.2 MB of 15 GB used</p>
        </div>
        <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
          Get more storage
        </button>
      </div>
    </aside>
  )
}

export default DriveSidebar 