'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function AdminDashboard() {
  const [shares, setShares] = useState([])
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loadingShares, setLoadingShares] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [filterAction, setFilterAction] = useState('all')

  const router = useRouter()

  useEffect(() => {
    loadShares()
    loadUsers()
    loadActivity()
  }, [])

  const loadShares = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/access/all-shares', {
        credentials: 'include'
      })
      const data = await res.json()
      setShares(data.shares || [])
    } catch {
      toast.error('Failed to load shares')
    } finally {
      setLoadingShares(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/me/all', {
        credentials: 'include'
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadActivity = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/activity/all', {
        credentials: 'include'
      })
      const data = await res.json()
      setActivity(data.activity || [])
    } catch {
      toast.error('Failed to load activity')
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(`http://localhost:5000/me/role/${id}`, {
        role: newRole
      }, { withCredentials: true })
      toast.success('Role updated!')
      loadUsers()
    } catch {
      toast.error('Failed to update role')
    }
  }

  const handleRemoveShare = async (userId, folderId, fileId) => {
    try {
      await axios.delete('http://localhost:5000/api/access/admin-remove', {
        data: { userId, folderId, fileId },
        withCredentials: true
      })
      toast.success('Share removed')
      loadShares()
    } catch {
      toast.error('Failed to remove share')
    }
  }

  const handleTakeover = async (folderId, fileId) => {
    try {
      await axios.post('http://localhost:5000/api/access/admin-takeover', {
        folderId,
        fileId
      }, { withCredentials: true })
      toast.success('You now have OWNER access')
      loadShares()
    } catch {
      toast.error('Takeover failed')
    }
  }

  const filteredActivity = filterAction === 'all'
    ? activity
    : activity.filter(log => log.action === filterAction)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">🛠 Admin Dashboard</h1>

      {/* 🔗 Active Shares */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-2">Shared Items</h2>
        {loadingShares ? (
          <p className="text-gray-500">Loading shares...</p>
        ) : shares.length === 0 ? (
          <p className="text-gray-500 italic">No active shares.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">User</th>
                <th className="p-2">Type</th>
                <th className="p-2">Item</th>
                <th className="p-2">Access</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    {share.user.name}
                    <br />
                    <span className="text-xs text-gray-500">{share.user.email}</span>
                  </td>
                  <td className="p-2">{share.folder ? 'Folder' : 'File'}</td>
                  <td className="p-2">
                    {(share.folder || share.file)?.name || 'Unknown'}
                  </td>
                  <td className="p-2">
                    {share.access}
                    <br />
                    <button
                      onClick={() =>
                        handleRemoveShare(share.user.id, share.folder?.id, share.file?.id)
                      }
                      className="text-red-600 hover:underline text-xs mt-1"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() =>
                        handleTakeover(share.folder?.id, share.file?.id)
                      }
                      className="text-blue-600 hover:underline text-xs ml-3"
                    >
                      Take Over
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 🕵️ Activity Log */}
      <section className="mt-12 mb-12">
        <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Filter by action:</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="upload">Upload</option>
            <option value="delete">Delete</option>
            <option value="rename">Rename</option>
            <option value="share">Share</option>
            <option value="unshare">Unshare</option>
            <option value="create">Create Folder</option>
            <option value="takeover">Take Over</option>
          </select>
          <button
            onClick={loadActivity}
            className="text-sm text-blue-600 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loadingActivity ? (
          <p className="text-gray-500">Loading activity...</p>
        ) : filteredActivity.length === 0 ? (
          <p className="text-gray-500 italic">No matching activity found.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {filteredActivity.map((entry) => (
              <li key={entry.id} className="border rounded px-3 py-2 bg-white shadow-sm">
                <div className="text-gray-700">{entry.message}</div>
                <div className="text-xs text-gray-500">
                  {entry.user?.name} • {new Date(entry.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 👥 User Role Management */}
      <section>
        <h2 className="text-xl font-semibold mb-2">User Roles</h2>
        {loadingUsers ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 italic">No users found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
