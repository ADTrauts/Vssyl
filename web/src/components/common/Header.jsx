'use client';

import { useState } from 'react'
import Logo from './Logo'
import UserMenu from './UserMenu'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const isPillarActive = (pillar) => {
    return pathname.startsWith(`/${pillar.toLowerCase()}`)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Left section with logo */}
          <div className="flex items-center ml-4">
            <Link href="/" className="flex items-center">
              <Logo size="md" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Block on Block</span>
            </Link>
          </div>

          {/* Center section with pillars navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/business"
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isPillarActive('business') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Business
            </Link>
            <Link
              href="/life"
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isPillarActive('life') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Life
            </Link>
            <Link
              href="/education"
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isPillarActive('education') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              Education
            </Link>
          </nav>

          {/* Right section with user menu */}
          <div className="flex items-center mr-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
} 