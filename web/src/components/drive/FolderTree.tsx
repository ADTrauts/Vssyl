'use client';

import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  isExpanded: boolean;
  level: number;
  path: string;
  hasChildren: boolean;
  isLoading: boolean;
}

interface FolderTreeProps {
  folders: FolderNode[];
  onFolderSelect: (folder: FolderNode) => void;
  onFolderExpand: (folderId: string) => Promise<void>;
  selectedFolderId?: string;
  className?: string;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onFolderSelect,
  onFolderExpand,
  selectedFolderId,
  className = ''
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleFolderClick = useCallback(async (folder: FolderNode) => {
    // If folder has children and isn't expanded, expand it
    if (folder.hasChildren && !expandedFolders.has(folder.id)) {
      setExpandedFolders(prev => new Set([...prev, folder.id]));
      await onFolderExpand(folder.id);
    }
    // Always select the folder
    onFolderSelect(folder);
  }, [expandedFolders, onFolderExpand, onFolderSelect]);

  const handleExpandToggle = useCallback(async (folder: FolderNode, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (expandedFolders.has(folder.id)) {
      // Collapse
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folder.id);
        return newSet;
      });
    } else {
      // Expand
      setExpandedFolders(prev => new Set([...prev, folder.id]));
      await onFolderExpand(folder.id);
    }
  }, [expandedFolders, onFolderExpand]);

  const renderFolder = (folder: FolderNode) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.hasChildren || folder.children.length > 0;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`
            flex items-center py-1.5 px-2 rounded-md cursor-pointer group
            hover:bg-gray-100 transition-colors duration-150
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
            ${folder.level > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: `${folder.level * 16 + 8}px` }}
          onClick={() => handleFolderClick(folder)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              className="mr-2 p-0.5 hover:bg-gray-200 rounded"
              onClick={(e) => handleExpandToggle(folder, e)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" /> // Spacer for alignment
          )}

          {/* Folder Icon */}
          <div className="mr-2">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {/* Folder Name */}
          <span className="flex-1 text-sm font-medium truncate">
            {folder.name}
          </span>

          {/* Loading Indicator */}
          {folder.isLoading && (
            <div className="ml-2">
              <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && folder.children.length > 0 && (
          <div className="ml-2">
            {folder.children.map(child => renderFolder(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {folders.map(folder => renderFolder(folder))}
    </div>
  );
};

export default FolderTree;
