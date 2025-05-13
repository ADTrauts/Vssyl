import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

interface User {
  id: string;
  name: string;
  email: string;
}

interface SharedUser {
  user: User;
  access: string;
}

interface ActivityLog {
  id: string;
  message: string;
  createdAt: string;
}

interface SharedUsersPanelProps {
  folderId: string;
  onClose: () => void;
}

const socket = io('http://localhost:5000', {
  withCredentials: true
})

function getInitials(name = ''): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getColorForName(name: string = ''): string {
  const colors = ['bg-red-200', 'bg-green-200', 'bg-blue-200', 'bg-yellow-200', 'bg-pink-200']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || 'bg-gray-200'
}

const SharedUsersPanel: React.FC<SharedUsersPanelProps> = ({ folderId, onClose }) => {
  const [users, setUsers] = useState<SharedUser[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [presence, setPresence] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)

  const [showUsers, setShowUsers] = useState(true)
  const [showActivity, setShowActivity] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('http://localhost:5000/me', {
          credentials: 'include'
        })
        const data = await res.json()
        setCurrentUser(data.user)
      } catch {
        console.error('Failed to fetch current user')
      }
    }
    fetchMe()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/access/shared-users?folderId=${folderId}`,
          { credentials: 'include' }
        )
        const data = await res.json()
        setUsers(data.users || [])
      } catch {
        toast.error('Failed to load shared users')
      } finally {
        setLoadingUsers(false)
      }
    }

    const fetchActivity = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/activity?folderId=${folderId}`,
          { credentials: 'include' }
        )
        const data = await res.json()
        setActivity(data.logs || [])
      } catch {
        toast.error('Failed to load activity log')
      } finally {
        setLoadingActivity(false)
      }
    }

    fetchUsers()
    fetchActivity()
  }, [folderId])

  useEffect(() => {
    if (!currentUser) return

    socket.emit('join', `folder:${folderId}`)
    socket.emit('presence:join', {
      folderId,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      }
    })

    socket.on('presence:update', (data: User[]) => setPresence(data))
    socket.on('access:updated', () => {
      toast.success('Sharing updated')
    })
    socket.on('activity:new', (log: ActivityLog) => {
      setActivity(prev => [log, ...prev])
    })

    const handleExit = () => {
      socket.emit('leave', `folder:${folderId}`)
    }

    window.addEventListener('beforeunload', handleExit)

    return () => {
      socket.emit('leave', `folder:${folderId}`)
      socket.off('presence:update')
      socket.off('access:updated')
      socket.off('activity:new')
      window.removeEventListener('beforeunload', handleExit)
    }
  }, [folderId, currentUser])

  const handleUnshare = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/access/unshare`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, folderId })
      })

      if (!res.ok) throw new Error('Unshare failed')
      setUsers(prev => prev.filter(u => u.user.id !== userId))
      toast.success('Access removed')
    } catch {
      toast.error('Failed to unshare')
    }
  }

  return (
    <div className="fixed right-0 top-0 w-full sm:w-96 h-full bg-white shadow-lg p-6 z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Folder Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:underline">
          Close
        </button>
      </div>

      {/* 👥 Live Presence */}
      <div className="text-sm text-gray-600 mb-4 flex flex-wrap items-center gap-2">
        {presence.length === 0 ? (
          'No one else is viewing'
        ) : (
          <>
            {presence.map((u, i) => (
              <div
                key={i}
                title={u.name}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[10px] text-gray-800 ${getColorForName(
                  u.name ?? ''
                )}`}
              >
                {getInitials(u.name)}
              </div>
            ))}
            <span className="ml-1">
              {presence.length === 1 ? 'is viewing' : 'are viewing'}
            </span>
          </>
        )}
      </div>

      {/* 👤 Shared Users Section */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => setShowUsers(prev => !prev)}
        >
          <h3 className="text-lg font-medium">Shared Users</h3>
          <span className="text-xs text-blue-600">
            {showUsers ? 'Hide' : 'Show'}
          </span>
        </div>
        {showUsers &&
          (loadingUsers ? (
            <p className="text-sm text-gray-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No users shared yet.</p>
          ) : (
            <ul className="space-y-3">
              {users.map(u => (
                <li
                  key={u.user.id}
                  className="border rounded px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{u.user.name}</p>
                    <p className="text-xs text-gray-500">{u.user.email}</p>
                    <p className="text-xs text-gray-500">Access: {u.access}</p>
                  </div>
                  <button
                    onClick={() => handleUnshare(u.user.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </div>

      {/* 📝 Activity Log Section */}
      <div>
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => setShowActivity(prev => !prev)}
        >
          <h3 className="text-lg font-medium">Activity</h3>
          <span className="text-xs text-blue-600">
            {showActivity ? 'Hide' : 'Show'}
          </span>
        </div>
        {showActivity &&
          (loadingActivity ? (
            <p className="text-sm text-gray-500">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No recent activity.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map(log => (
                <li key={log.id} className="text-gray-700">
                  {log.message}
                  <div className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}

export default SharedUsersPanel; 