import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useUI } from '@/contexts/ui-context'

interface SearchResult {
  id: string | number;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState<string>('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showResults, setShowResults] = useState<boolean>(false)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const { openDetailsPanel } = useUI()

  // Handle search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle clicks outside of search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        typeof searchRef.current === 'object' &&
        typeof searchRef.current.contains === 'function' &&
        event.target instanceof Node &&
        !searchRef.current.contains(event.target)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async () => {
    setIsSearching(true)
    try {
      // Replace with actual search API endpoint
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.results || [])
      setShowResults(true)
    } catch (err) {
      toast.error('Failed to search')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (item: SearchResult) => {
    // Construct a minimal Item object for openDetailsPanel
    if ('type' in item && item.type === 'folder') {
      openDetailsPanel({
        id: String(item.id),
        name: item.name || item.title || '',
        type: 'folder',
        parentId: '',
        userId: '',
        createdAt: '',
        updatedAt: ''
      })
    } else {
      openDetailsPanel({
        id: String(item.id),
        name: item.name || item.title || '',
        type: 'file',
        size: 0,
        url: '',
        updatedAt: '',
        createdAt: ''
      })
    }
    setShowResults(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <Input
        type="text"
        placeholder="Search files and folders..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setShowResults(results.length > 0)}
        className="w-full px-3 py-2 border rounded"
      />
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 bg-white border rounded shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : (
            <ul>
              {results.map((item, idx) => (
                <li
                  key={item.id || idx}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleResultClick(item)}
                >
                  {item.name || item.title || 'Untitled'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar; 