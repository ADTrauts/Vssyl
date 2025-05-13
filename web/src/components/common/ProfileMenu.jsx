import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfileMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (res.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={user?.avatarUrl || '/default-avatar.png'}
            alt="Profile"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={user?.avatarUrl || '/default-avatar.png'}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">👤</span>
                Profile Settings
              </Link>
              
              <Link
                href="/profile/security"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">🔒</span>
                Security
              </Link>

              <Link
                href="/profile/preferences"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">⚙️</span>
                Preferences
              </Link>

              <div className="border-t my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">🚪</span>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 