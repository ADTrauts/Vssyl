import { useState, useRef, useEffect } from 'react';
import { useThreadSearch } from '../../hooks/useThreadSearch';
import { formatDistanceToNow } from 'date-fns';
import { Search, X, Clock, Tag, User, Filter, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { logger } from '../../utils/logger';

export const ThreadSearch = () => {
  const {
    results,
    suggestions,
    popularSearches,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshPopularSearches
  } = useThreadSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest' | 'mostActive'>('relevance');

  const filtersRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(filtersRef, () => setShowFilters(false));
  useOnClickOutside(suggestionsRef, () => setShowSuggestions(false));

  const handleSearch = (query: string) => {
    updateFilters({ query });
    setShowSuggestions(true);
  };

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  };

  const handleDateRangeChange = (type: 'start' | 'end', date: string) => {
    const newDateRange = { ...dateRange, [type]: new Date(date) };
    setDateRange(newDateRange);
    updateFilters({ dateRange: newDateRange });
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    updateFilters({ sortBy: newSort });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setDateRange({});
    setSortBy('relevance');
    updateFilters({});
  };

  useEffect(() => {
    if (filters.query) {
      setShowSuggestions(true);
    }
  }, [filters.query]);

  return (
    <div className="thread-search">
      <div className="search-container">
        <div className="search-input-container">
          <Search className="search-icon" />
          <Input
            type="text"
            placeholder="Search threads..."
            value={filters.query || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilters({ query: '' })}
              className="clear-button"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="filters-button"
        >
          <Filter size={16} />
          Filters
          <ChevronDown size={16} />
        </Button>
      </div>

      {showFilters && (
        <div ref={filtersRef} className="filters-panel">
          <div className="filter-section">
            <h4>Tags</h4>
            <div className="tags-container">
              {suggestions.tags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  onClick={() => handleTagSelect(tag)}
                  className="tag-badge"
                >
                  <Tag size={12} />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Date Range</h4>
            <div className="date-range-container">
              <input
                type="date"
                value={dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="date-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>Sort By</h4>
            <div className="sort-options">
              {['relevance', 'newest', 'oldest', 'mostActive'].map(option => (
                <Button
                  key={option}
                  variant={sortBy === option ? 'default' : 'outline'}
                  onClick={() => handleSortChange(option as typeof sortBy)}
                  className="sort-button"
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={clearFilters}
            className="clear-filters-button"
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {showSuggestions && filters.query && (
        <div ref={suggestionsRef} className="suggestions-panel">
          {suggestions.threads.length > 0 && (
            <div className="suggestion-section">
              <h4>Threads</h4>
              {suggestions.threads.map(thread => (
                <div
                  key={thread.id}
                  className="suggestion-item"
                  onClick={() => {
                    updateFilters({ query: thread.title });
                    setShowSuggestions(false);
                  }}
                >
                  {thread.title}
                </div>
              ))}
            </div>
          )}

          {suggestions.tags.length > 0 && (
            <div className="suggestion-section">
              <h4>Tags</h4>
              {suggestions.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  onClick={() => {
                    handleTagSelect(tag);
                    setShowSuggestions(false);
                  }}
                  className="tag-badge"
                >
                  <Tag size={12} />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {suggestions.authors.length > 0 && (
            <div className="suggestion-section">
              <h4>Authors</h4>
              {suggestions.authors.map(author => (
                <div
                  key={author.id}
                  className="suggestion-item"
                  onClick={() => {
                    updateFilters({ authorId: author.id });
                    setShowSuggestions(false);
                  }}
                >
                  <Avatar src={author.avatarUrl} alt={author.name} />
                  {author.name}
                </div>
              ))}
            </div>
          )}

          {popularSearches.length > 0 && (
            <div className="suggestion-section">
              <h4>Popular Searches</h4>
              {popularSearches.map(search => (
                <div
                  key={search}
                  className="suggestion-item"
                  onClick={() => {
                    updateFilters({ query: search });
                    setShowSuggestions(false);
                  }}
                >
                  <Clock size={14} />
                  {search}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          Searching...
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map(result => (
            <div key={result.id} className="result-item">
              <div className="result-header">
                <Avatar src={result.author.avatarUrl} alt={result.author.name} />
                <div className="result-meta">
                  <span className="author-name">{result.author.name}</span>
                  <span className="timestamp">
                    {formatDistanceToNow(new Date(result.lastActivity), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <h3 className="result-title">{result.title}</h3>
              <p className="result-content">{result.content}</p>
              <div className="result-footer">
                <div className="tags">
                  {result.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="tag-badge">
                      <Tag size={12} />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="stats">
                  <span className="message-count">
                    <User size={14} />
                    {result.messageCount} messages
                  </span>
                  <Badge variant={result.status === 'active' ? 'default' : 'outline'}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 