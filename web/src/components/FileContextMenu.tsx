'use client';

import React, { useEffect, useRef } from 'react';
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  StarIcon,
  ArrowDownTrayIcon,
  FolderArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface FileContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  actions: ContextMenuAction[];
}

export default function FileContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  actions 
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = React.useMemo(() => {
    if (!isOpen) return position;

    const menuWidth = 200;
    const menuHeight = actions.length * 40 + 16; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    // Adjust vertical position
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    return { x, y };
  }, [isOpen, position, actions.length]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <React.Fragment key={action.id}>
            <button
              onClick={() => {
                if (!action.disabled) {
                  action.onClick();
                  onClose();
                }
              }}
              disabled={action.disabled}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left transition-colors ${
                action.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : action.destructive
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
            {/* Add separator after certain actions */}
            {(index === 2 || index === 5) && index < actions.length - 1 && (
              <div className="my-1 border-t border-gray-100" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Helper function to generate common file actions
export const createFileActions = (
  file: { id: string; name: string; type: 'file' | 'folder'; starred?: boolean },
  callbacks: {
    onRename?: () => void;
    onDuplicate?: () => void;
    onDownload?: () => void;
    onMove?: () => void;
    onShare?: () => void;
    onStar?: () => void;
    onDelete?: () => void;
    onInfo?: () => void;
  }
): ContextMenuAction[] => {
  const actions: ContextMenuAction[] = [];

  if (callbacks.onRename) {
    actions.push({
      id: 'rename',
      label: 'Rename',
      icon: PencilIcon,
      onClick: callbacks.onRename
    });
  }

  if (callbacks.onDuplicate && file.type === 'file') {
    actions.push({
      id: 'duplicate',
      label: 'Make a copy',
      icon: DocumentDuplicateIcon,
      onClick: callbacks.onDuplicate
    });
  }

  if (callbacks.onDownload && file.type === 'file') {
    actions.push({
      id: 'download',
      label: 'Download',
      icon: ArrowDownTrayIcon,
      onClick: callbacks.onDownload
    });
  }

  if (callbacks.onMove) {
    actions.push({
      id: 'move',
      label: 'Move to...',
      icon: FolderArrowDownIcon,
      onClick: callbacks.onMove
    });
  }

  if (callbacks.onShare) {
    actions.push({
      id: 'share',
      label: 'Share',
      icon: ShareIcon,
      onClick: callbacks.onShare
    });
  }

  if (callbacks.onStar) {
    actions.push({
      id: 'star',
      label: file.starred ? 'Remove from starred' : 'Add to starred',
      icon: StarIcon,
      onClick: callbacks.onStar
    });
  }

  if (callbacks.onInfo) {
    actions.push({
      id: 'info',
      label: 'File information',
      icon: InformationCircleIcon,
      onClick: callbacks.onInfo
    });
  }

  if (callbacks.onDelete) {
    actions.push({
      id: 'delete',
      label: 'Move to trash',
      icon: TrashIcon,
      onClick: callbacks.onDelete,
      destructive: true
    });
  }

  return actions;
}; 