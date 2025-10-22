'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Command } from 'lucide-react';
import { useGlobalSearch } from '../../contexts/GlobalSearchContext';
import { SearchResult, SearchSuggestion } from 'shared/types/search';
import { Button } from 'shared/components';

interface CompactSearchButtonProps {
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

export default function CompactSearchButton({ className = '' }: CompactSearchButtonProps) {
  const { state, search, getSuggestions, clearResults } = useGlobalSearch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 300),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen]);

  // Handle button click
  const handleButtonClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsOpen(true);
      // Focus input after expansion animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      handleSearch();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim()) {
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
          } else {
            handleSearch();
          }
        } else {
          handleSearch();
        }
        break;
      
      case 'Escape':
        setIsExpanded(false);
        setIsOpen(false);
        setInputValue('');
        clearResults();
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
    setIsExpanded(false);
    setIsOpen(false);
    setInputValue('');
  };

  // Handle clear button click
  const handleClearClick = () => {
    setInputValue('');
    clearResults();
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsOpen(false);
        setInputValue('');
        clearResults();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.children;
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

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
  const renderDropdownContent = () => {
    if (!isOpen || !isMounted) return null;

    return (
      <div
        ref={resultsRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
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
                  {groupedResults[moduleId].map((item: SearchResult, idx: number) => (
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
  };

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      {/* Search Button/Input */}
      <div className="relative">
        <div 
          className={`flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-300 ease-out ${
            isExpanded ? 'w-80' : 'w-10'
          }`}
        >
          {!isExpanded ? (
            // Collapsed state - just icon button
            <button
              onClick={handleButtonClick}
              className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          ) : (
            // Expanded state - search input
            <>
              <div className="pl-3 pr-2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
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
            </>
          )}
        </div>
      </div>

      {/* Search Results Dropdown - Rendered via Portal */}
      {isOpen && isMounted && createPortal(
        renderDropdownContent(),
        document.body
      )}
    </div>
  );
}
