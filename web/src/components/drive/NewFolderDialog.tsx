import { useState } from 'react'
import type { Folder } from '@/types/api'

interface NewFolderDialogProps {
  isOpen: boolean;
  currentParentId: string;
  onCreate: (folder: Folder) => void;
  onClose: () => void;
}

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({ isOpen, currentParentId, onCreate, onClose }) => {
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      // Optionally show error
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': '', // Add token if needed
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          parentId: currentParentId === 'root' ? null : currentParentId
        })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      const data = await res.json()
      onCreate(data.folder)
      setName('')
      onClose()
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleCreate()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">New Folder</h2>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full border rounded px-3 py-2 mb-4"
          autoFocus
          placeholder="Folder name"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading || !name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewFolderDialog; 