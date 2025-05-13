"use client";

import React, { useEffect, useRef } from "react";
import { useUI } from "@/contexts/ui-context";
import { toast } from "sonner";
import type { FileItem, FolderItem } from '@/contexts/ui-context';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  item: FileItem | FolderItem;
  type: string;
  onRename?: () => void;
  onDelete?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  item,
  type,
  onRename,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { openShareDialog } = useUI();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const node = menuRef.current;
      if (node && node.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      const endpoint = type === "file" ? "files" : "folders";
      const res = await fetch(`http://localhost:5000/api/${endpoint}/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      toast.success(`${type === "file" ? "File" : "Folder"} moved to trash`);
      onDelete?.();
    } catch (err) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleShare = () => {
    openShareDialog(item);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-lg rounded-lg py-1 z-50 min-w-[200px]"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <button
        onClick={() => {
          onRename?.();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Rename
      </button>
      <button
        onClick={handleShare}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        Share
      </button>
      <button
        onClick={() => {
          handleDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
      >
        Move to Trash
      </button>
    </div>
  );
};

export default ContextMenu; 