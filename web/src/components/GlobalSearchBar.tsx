'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Command, ArrowUp, ArrowDown } from 'lucide-react';
import { useGlobalSearch } from '../contexts/GlobalSearchContext';
import { SearchResult, SearchSuggestion } from 'shared/types/search';
import { Button, Badge } from 'shared/components';

interface GlobalSearchBarProps {
  className?: string;
}

// Utility: highlight search terms in text
function highlightText(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <span key={i} className="bg-yellow-200 font-semibold">{part}</span> : part
  );
}

// Group results by module
function groupResultsByModule(results: SearchResult[]) {
  const groups: { [key: string]: SearchResult[] } = {};
  for (const result of results) {
    if (!groups[result.moduleId]) groups[result.moduleId] = [];
    groups[result.moduleId].push(result);
  }
  return groups;
}

export default function GlobalSearchBar({ className = '' }: GlobalSearchBarProps) {
  const { state, search, getSuggestions, clearResults } = useGlobalSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position when input changes
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Update position when dropdown opens or window resizes
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      // Perform actual search, not just suggestions
      handleSearch(value);
      getSuggestions(value);
    } else {
      clearResults();
    }
  };

  // Handle search submission
  const handleSearch = async (query?: string) => {
    const searchQuery = query || inputValue.trim();
    if (searchQuery) {
      await search(searchQuery);
      setIsOpen(true);
    }
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = [...state.suggestions, ...state.results];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const item = items[selectedIndex];
          if ('url' in item && item.url) {
            window.location.href = item.url;
          } else if (isSuggestion(item)) {
            handleSearch(item.text);
          }
          else {
            handleSearch();
          }
        } else {
          handleSearch();
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle item click
  const handleItemClick = (item: SearchResult | SearchSuggestion) => {
    if ('url' in item && item.url) {
      window.location.href = item.url;
    } else if (isSuggestion(item)) {
      handleSearch(item.text);
    } else {
      handleSearch();
    }
    setIsOpen(false);
  };

  // Handle search button click
  const handleSearchClick = () => {
    handleSearch();
  };

  // Handle clear button click
  const handleClearClick = () => {
    setInputValue('');
    clearResults();
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.children;
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Get module icon
  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'drive':
        return '📁';
      case 'chat':
        return '💬';
      case 'dashboard':
        return '📊';
      case 'tasks':
        return '✅';
      case 'calendar':
        return '📅';
      default:
        return '📄';
    }
  };

  // Get result type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'blue';
      case 'folder':
        return 'green';
      case 'message':
        return 'blue';
      case 'conversation':
        return 'green';
      case 'user':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const hasResults = state.suggestions.length > 0 || state.results.length > 0;
  const items = [...state.suggestions, ...state.results];

  const isSuggestion = (item: SearchResult | SearchSuggestion): item is SearchSuggestion => {
    return (item as SearchSuggestion).text !== undefined;
  };

  // Group results by module
  const groupedResults = groupResultsByModule(state.results);
  const moduleOrder = ['drive', 'chat', 'dashboard', 'member'];
  const moduleLabels: { [key: string]: string } = {
    drive: 'Drive',
    chat: 'Chat',
    dashboard: 'Dashboard',
    member: 'Members',
  };
  const moduleIcons: { [key: string]: string } = {
    drive: '📁',
    chat: '💬',
    dashboard: '📊',
    member: '👤',
  };

  // Render dropdown content
  const renderDropdownContent = () => (
    <div
      ref={resultsRef}
      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
      style={{
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999, // Very high z-index to ensure it's above everything
      }}
    >
      {state.loading && (
        <div className="p-4 text-center text-gray-400">
          <span className="animate-spin mr-2">⏳</span> Searching...
        </div>
      )}
      {state.error && (
        <div className="p-4 text-center text-red-500">
          Error: {state.error}
        </div>
      )}
      {!state.loading && !state.error && state.results.length === 0 && inputValue.trim() && (
        <div className="p-4 text-center text-gray-400">No results found.</div>
      )}
      {!state.loading && !state.error && state.results.length > 0 && (
        <>
          {moduleOrder.map((moduleId) =>
            groupedResults[moduleId] ? (
              <div key={moduleId} className="border-b last:border-b-0">
                <div className="flex items-center px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600">
                  <span className="mr-2">{moduleIcons[moduleId]}</span>
                  {moduleLabels[moduleId]}
                </div>
                {groupedResults[moduleId].map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 transition ${selectedIndex === idx ? 'bg-blue-100' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {/* Icon/avatar */}
                    <span className="mr-3 text-lg">
                      {moduleIcons[moduleId]}
                    </span>
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {highlightText(item.title || '', inputValue || '')}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {highlightText(item.description || '', inputValue || '')}
                      </div>
                    </div>
                    {/* Quick action: open */}
                    <button
                      className="ml-2 px-2 py-1 text-xs text-blue-600 border border-blue-100 rounded hover:bg-blue-100"
                      onClick={e => { e.stopPropagation(); window.location.href = item.url; }}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            ) : null
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="pl-3 pr-2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder="Search across all modules..."
            className="flex-1 py-2 px-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
          />
          
          <div className="flex items-center pr-2 space-x-1">
            {inputValue && (
              <button
                onClick={handleClearClick}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center text-xs text-gray-400">
              <Command className="w-3 h-3 mr-1" />
              <span>K</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSearchClick}
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
          size="sm"
        >
          Search
        </Button>
      </div>

      {/* Search Results Dropdown - Rendered via Portal */}
      {isOpen && isMounted && createPortal(
        renderDropdownContent(),
        document.body
      )}
    </div>
  );
} 