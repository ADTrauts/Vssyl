import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

type FolderCardProps = {
  name: string;
  icon?: React.ReactNode;
  isStarred?: boolean;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
};

export const FolderCard: React.FC<FolderCardProps> = ({ name, icon, isStarred, onClick, onContextMenu, children }) => (
  <div 
    className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center min-w-[120px] max-w-[160px] h-32 hover:bg-gray-100 transition-colors duration-150 cursor-pointer shadow-sm relative"
    onClick={onClick}
    onContextMenu={onContextMenu}
  >
    {isStarred && (
        <StarIcon className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
    )}
    <div className="text-4xl mb-2 text-blue-500">{icon || '📁'}</div>
    <div className="font-medium text-sm truncate w-full text-center text-gray-700">{name}</div>
    {children && <div className="mt-2 w-full">{children}</div>}
  </div>
); 