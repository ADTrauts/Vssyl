'use client';

import { useState } from 'react';
import { MessageSearch } from './MessageSearch';

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ChatHeader({ title, onBack }: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-2 p-1 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Search messages"
        >
          🔍
        </button>
      </div>
      {showSearch && <MessageSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
} 