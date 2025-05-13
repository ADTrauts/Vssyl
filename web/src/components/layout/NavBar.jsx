'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import SearchBar from '@/components/drive/SearchBar'

export default function NavBar() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    axios.get('http://localhost:5000/me', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => {}) // not logged in, skip
  }, [])

  const handleLogout = async () => {
    await axios.post('http://localhost:5000/auth/logout', {}, { withCredentials: true })
    router.push('/login')
  }

  return (
    <nav className="h-14 flex items-center justify-between bg-white border-b px-6 shadow-sm">
      <div className="flex gap-4 items-center">
        <Link href="/dashboard" className="font-semibold hover:text-blue-600">Dashboard</Link>
        <Link href="/drive" className="font-semibold hover:text-blue-600">Drive</Link>
      </div>

      {user && (
        <div className="flex-1 max-w-md mx-4">
          <SearchBar />
        </div>
      )}

      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Hi, {user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">Not signed in</div>
      )}
    </nav>
  )
}
