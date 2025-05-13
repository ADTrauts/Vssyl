import { useState, useEffect } from 'react'

interface RenameDialogProps {
  isOpen: boolean;
  initialName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ isOpen, initialName, onRename, onClose }) => {
  const [name, setName] = useState<string>(initialName)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '')
    }
  }, [isOpen, initialName])

  const handleRename = async () => {
    if (!name.trim() || name === initialName) {
      onClose()
      return
    }
    setLoading(true)
    try {
      await onRename(name.trim())
      onClose()
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Rename</h2>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          autoFocus
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
            onClick={handleRename}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading || !name.trim() || name === initialName}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  )
}

export default RenameDialog; 