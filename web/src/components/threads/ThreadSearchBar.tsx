import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useThreadFilter } from '@/hooks/useThreadFilter';
import { ThreadSearchResults } from './ThreadSearchResults';
import { useDebounce } from '@/hooks/useDebounce';

interface ThreadSearchBarProps {
  onSelect: (threadId: string) => void;
}

export const ThreadSearchBar: React.FC<ThreadSearchBarProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { searchResults, handleSearch, isSearching } = useThreadFilter();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, handleSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsFocused(false);
    }
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pr-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          )}
          <Search size={16} className="text-gray-400" />
        </div>
      </div>

      {isFocused && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : (
            <ThreadSearchResults
              results={searchResults}
              onSelect={(threadId) => {
                onSelect(threadId);
                setIsFocused(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}; 