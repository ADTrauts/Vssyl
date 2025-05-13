import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../utils/logger';
import { SearchResult } from './SearchResult';
import { SearchIcon, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'thread' | 'user' | 'message';
  title?: string;
  content?: string;
  description?: string;
  lastActivity?: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const RealTimeSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const [threadsResponse, usersResponse, messagesResponse] = await Promise.all([
        fetch(`/api/search/threads?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/search/messages?q=${encodeURIComponent(searchQuery)}`)
      ]);

      const threads = await threadsResponse.json();
      const users = await usersResponse.json();
      const messages = await messagesResponse.json();

      const combinedResults: SearchResult[] = [
        ...threads.map((thread: any) => ({
          id: thread.id,
          type: 'thread' as const,
          title: thread.title,
          description: thread.description,
          lastActivity: new Date(thread.lastActivity)
        })),
        ...users.map((user: any) => ({
          id: user.id,
          type: 'user' as const,
          title: user.name,
          user: {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl
          }
        })),
        ...messages.map((message: any) => ({
          id: message.id,
          type: 'message' as const,
          content: message.content,
          title: message.thread.title,
          lastActivity: new Date(message.createdAt),
          user: message.user
        }))
      ];

      setResults(combinedResults);
    } catch (error) {
      logger.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="search-container">
      <div className="search-input-container">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search threads, users, or messages..."
          className="search-input"
        />
        {query && (
          <button onClick={handleClear} className="clear-button">
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="search-results">
          {isLoading ? (
            <div className="loading">Searching...</div>
          ) : results.length > 0 ? (
            <div className="results-list">
              {results.map(result => (
                <SearchResult key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          ) : (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}; 