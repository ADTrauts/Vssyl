'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface FolderNodeData {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNodeData[];
  level: number;
  path: string;
  hasChildren: boolean;
  isLoading: boolean;
}

interface FolderNodeProps {
  folder: FolderNodeData;
  isExpanded: boolean;
  isSelected: boolean;
  onFolderClick: (folder: FolderNodeData) => void;
  onExpandToggle: (folder: FolderNodeData, e: React.MouseEvent) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  isExpanded,
  isSelected,
  onFolderClick,
  onExpandToggle
}) => {
  const hasChildren = folder.hasChildren || folder.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center py-1.5 px-2 rounded-md cursor-pointer group
          hover:bg-gray-100 transition-colors duration-150
          ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
        `}
        style={{ paddingLeft: `${folder.level * 16 + 8}px` }}
        onClick={() => onFolderClick(folder)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            className="mr-2 p-0.5 hover:bg-gray-200 rounded"
            onClick={(e) => onExpandToggle(folder, e)}
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
    </div>
  );
};

export default FolderNode;
