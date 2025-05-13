import React from 'react';
import { LayoutGrid, List, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button'
import { CheckSquare } from 'lucide-react'

interface DriveHeaderProps {
  isTrashPage?: boolean;
  onViewChange?: (isGrid: boolean) => void;
  onSearch?: (query: string) => void;
  onEmptyTrash?: () => void;
  isGridView: boolean;
  isSelectionMode: boolean;
  onSelectionModeChange: (mode: boolean) => void;
}

const DriveHeader: React.FC<DriveHeaderProps> = ({
  isTrashPage = false,
  onViewChange,
  onSearch,
  onEmptyTrash,
  isGridView,
  isSelectionMode,
  onSelectionModeChange,
}) => {
  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <div className="flex rounded-lg border bg-gray-50 p-1">
          <button
            onClick={() => onViewChange?.(true)}
            className={`p-2 rounded ${
              isGridView 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewChange?.(false)}
            className={`p-2 rounded ${
              !isGridView 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>

        <Button
          variant={isSelectionMode ? "secondary" : "outline"}
          onClick={() => onSelectionModeChange(!isSelectionMode)}
          className="flex items-center gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Select
        </Button>

        {isTrashPage && (
          <button
            onClick={onEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Empty trash"
          >
            <Trash2 className="h-5 w-5" />
            Empty trash
          </button>
        )}
      </div>
    </div>
  );
};

export default DriveHeader; 