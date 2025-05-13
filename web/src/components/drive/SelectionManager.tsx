import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2, FolderCode } from 'lucide-react'
import { toast } from 'sonner'

interface SelectionManagerProps {
  isSelectionMode: boolean
  selectedItems: Set<string>
  onBulkDelete: (ids: string[]) => void
  onBulkMove: (ids: string[], targetFolderId: string) => void
}

export default function SelectionManager({
  isSelectionMode,
  selectedItems,
  onBulkDelete,
  onBulkMove: _onBulkMove
}: SelectionManagerProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      setIsDeleting(true)
      try {
        await onBulkDelete(Array.from(selectedItems))
        toast.success(`${selectedItems.size} items moved to trash`)
      } catch (error) {
        toast.error('Failed to delete items')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (!isSelectionMode) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {selectedItems.size} items selected
      </span>
      
      <Button
        variant="outline"
        size="sm"
        // TODO: Implement folder picker/modal for bulk move
        onClick={() => {}}
        disabled={true}
      >
        <FolderCode className="w-4 h-4 mr-2" />
        Move
      </Button>

      {/* TODO: Add folder picker/modal to select target folder for bulk move */}
      <span className="text-xs text-gray-400">(Folder picker coming soon)</span>

      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkDelete}
        disabled={isDeleting || selectedItems.size === 0}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  )
}

export function SelectionCheckbox({ id, isSelected, onSelect }: { id: string, isSelected: boolean, onSelect: (id: string) => void }) {
  return (
    <div 
      className="absolute top-2 left-2 z-10"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      <Checkbox 
        checked={isSelected}
        className="bg-white border-2"
      />
    </div>
  )
} 