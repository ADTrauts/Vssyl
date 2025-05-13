'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/chat-context';

interface MessageSearchProps {
  onClose: () => void;
}

export function MessageSearch({ onClose }: MessageSearchProps) {
  const { messages } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    content: string;
    timestamp: string;
    sender: string;
  }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages
      .filter(message => 
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(message => ({
        id: message.id,
        content: message.content,
        timestamp: new Date(message.timestamp).toLocaleString(),
        sender: message.sender
      }));

    setSearchResults(results);
    setSelectedIndex(0);
  }, [searchQuery, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      const selectedMessage = searchResults[selectedIndex];
      if (selectedMessage) {
        // Scroll to the message
        const messageElement = document.getElementById(`message-${selectedMessage.id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('bg-blue-50');
          setTimeout(() => {
            messageElement.classList.remove('bg-blue-50');
          }, 2000);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mt-20">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((result, index) => (
                <li
                  key={result.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    const messageElement = document.getElementById(`message-${result.id}`);
                    if (messageElement) {
                      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      messageElement.classList.add('bg-blue-50');
                      setTimeout(() => {
                        messageElement.classList.remove('bg-blue-50');
                      }, 2000);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{result.sender}</span>
                      <span className="text-gray-500 text-sm ml-2">{result.timestamp}</span>
                    </div>
                  </div>
                  <div className="mt-1">
                    {result.content.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                      <span
                        key={i}
                        className={
                          part.toLowerCase() === searchQuery.toLowerCase()
                            ? 'bg-yellow-200'
                            : ''
                        }
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              No messages found
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 