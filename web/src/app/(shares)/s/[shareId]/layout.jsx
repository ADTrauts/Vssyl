'use client'

import { Logo } from '@/components/common/Logo'
import Link from 'next/link'

export default function SharedFileLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-medium">Block Drive</span>
          </Link>
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Block Drive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 