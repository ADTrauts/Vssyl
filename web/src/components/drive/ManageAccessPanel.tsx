import React, { useEffect, useState } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SharedUser {
  id: string;
  name: string;
  email: string;
  permission: string;
}

interface ManageAccessPanelProps {
  folderId: string;
}

const ManageAccessPanel: React.FC<ManageAccessPanelProps> = ({ folderId }) => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [newUserEmail, setNewUserEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState('view')
  const [loading, setLoading] = useState(false)

  // ✅ Fetch shared users for this folder
  const fetchShared = async () => {
    try {
      const res = await fetch(`/access/shared-users?folderId=${encodeURIComponent(folderId)}`)
      const data = await res.json()
      setSharedUsers(data.users)
    } catch (err) {
      console.error('[❌ fetchShared failed]', err)
    }
  }

  useEffect(() => {
    if (folderId) fetchShared()
  }, [folderId])

  // ✅ Share access with a user
  const handleShare = async () => {
    if (!newUserEmail) return
    setLoading(true)

    try {
      const userRes = await fetch(`/users/by-email?email=${encodeURIComponent(newUserEmail)}`)
      const userData = await userRes.json()
      await fetch('/access/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          folderId,
          access: accessLevel
        })
      })

      setNewUserEmail('')
      fetchShared()
    } catch (err) {
      console.error('[❌ handleShare failed]', err)
      alert('User not found or error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Update permission level
  const handleAccessChange = async (_userId: string, newAccess: string) => {
    try {
      await fetch('/access/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: _userId, folderId, access: newAccess })
      })
      fetchShared()
    } catch (err) {
      console.error('[❌ handleAccessChange failed]', err)
    }
  }

  // ✅ Unshare user
  const handleRemove = async (userId: string) => {
    try {
      await fetch('/access/unshare', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, folderId })
      })
      fetchShared()
    } catch (err) {
      console.error('[❌ handleRemove failed]', err)
    }
  }

  return (
    <div className="p-4 border-t mt-4">
      <h3 className="text-lg font-semibold mb-2">Manage Access</h3>

      {sharedUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={user.permission.toLowerCase()}
              onValueChange={(value: string) => handleAccessChange(user.id, value)}
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="owner">Owner</option>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(user.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Share with email"
          value={newUserEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserEmail(e.target.value)}
        />
        <Select value={accessLevel} onValueChange={(value: string) => setAccessLevel(value)}>
          <option value="view">View</option>
          <option value="edit">Edit</option>
          <option value="owner">Owner</option>
        </Select>
        <Button onClick={handleShare} disabled={loading}>
          Share
        </Button>
      </div>
    </div>
  )
}

export default ManageAccessPanel; 