import { useEffect } from 'react'
import { useUI } from '@/contexts/ui-context'

interface ShareModalProps {
  folderId: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ folderId, onClose }) => {
  const { openShareDialog } = useUI()

  useEffect(() => {
    // Redirect to the new ShareDialog
    openShareDialog({
      id: folderId,
      name: '',
      parentId: '',
      userId: '',
      createdAt: '',
      updatedAt: '',
      type: 'folder'
    })

    // Close this modal immediately
    if (onClose) {
      onClose()
    }
  }, [folderId, onClose, openShareDialog])

  return null // No UI is rendered
}

export default ShareModal; 