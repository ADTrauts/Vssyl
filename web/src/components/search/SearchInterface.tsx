import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter, History, BarChart2, Share2, Users, Download, Plug, ChevronUp, ChevronDown, SortAsc, Folder, FileText, MessageSquare, Settings, Bell } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LineChart, BarChart } from '@/components/ui/charts';
import { Textarea } from '@/components/ui/textarea';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SearchFilters } from './SearchFilters';
import { SearchShare } from './SearchShare';
import { SearchFilter, SearchResult as SearchResultType, SearchAnalytics as SearchAnalyticsType, SearchHistoryEntry, SavedSearch } from '@/types/search';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { ShareSearch } from './ShareSearch';
import { SearchAnalytics } from './SearchAnalytics';
import { SearchVisualization } from './SearchVisualization';
import { SearchCollaboration } from './SearchCollaboration';
import { SearchExport } from './SearchExport';
import { SearchHistory } from './SearchHistory';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchCustomization } from './SearchCustomization';
import { SearchNotifications } from './SearchNotifications';
import { SearchAccessibility } from './SearchAccessibility';
import { SearchIntegration } from './SearchIntegration';

interface SearchInterfaceProps {
  searchId: string;
  query: string;
  filters: Record<string, unknown>;
  results: SearchResultType[];
  onUpdate: (updates: Record<string, unknown>) => void;
}

interface SearchSettings {
  autoSave: boolean;
  autoRefresh: boolean;
  defaultSort: string;
  defaultFilters: SearchFilter[];
  maxResults: number;
  highlightMatches: boolean;
  showMetadata: boolean;
  showScore: boolean;
  showTimestamp: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  metadata: Record<string, unknown>;
}

interface VisualizationFilters {
  dateRange: [Date | null, Date | null];
  type: string[];
  size: [number, number];
  relevance: number;
}

interface CollaborationUpdate {
  type: 'comment' | 'share' | 'edit';
  data: Record<string, unknown>;
}

export function SearchInterface({ 
  searchId,
  query,
  filters,
  results,
  onUpdate
}: SearchInterfaceProps) {
  const {
    setQuery,
    setFilters,
    groups,
    history,
    savedSearches,
    analytics,
    isLoading,
    isLoadingMore,
    error: searchError,
    hasMore,
    loadMore,
    saveSearch,
    updateSavedSearch,
    deleteSavedSearch,
    clearSavedSearches,
    clearHistory,
    clearAnalytics,
    deleteHistoryEntry,
    updateHistoryEntry
  } = useSearch();

  // State variables
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newSavedSearchName, setNewSavedSearchName] = useState('');
  const [editingSavedSearchId, setEditingSavedSearchId] = useState<string | null>(null);
  const [editingSavedSearchName, setEditingSavedSearchName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [focusedElement, setFocusedElement] = useState<'search' | 'filters' | 'results'>('search');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    reducedMotion: false,
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    soundEnabled: true,
    soundVolume: 50,
    zoomLevel: 100
  });
  const [analyticsData, setAnalyticsData] = useState<SearchAnalyticsType | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationFilters, setVisualizationFilters] = useState<VisualizationFilters>({
    dateRange: [null, null],
    type: [],
    size: [0, 100],
    relevance: 0
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultType[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [settings, setSettings] = useState<SearchSettings>({
    autoSave: true,
    autoRefresh: true,
    defaultSort: 'score',
    defaultFilters: [],
    maxResults: 100,
    highlightMatches: true,
    showMetadata: true,
    showScore: true,
    showTimestamp: true
  });
  const [newFilter, setNewFilter] = useState<Partial<SearchFilter>>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Function definitions
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilter[]) => {
    try {
      // Implement search logic here
      return [];
    } catch (err) {
      throw new Error('Failed to perform search');
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      // Implement history loading logic here
      return [];
    } catch (err) {
      throw new Error('Failed to load history');
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      // Implement analytics loading logic here
      return null;
    } catch (err) {
      throw new Error('Failed to load analytics');
    }
  }, []);

  const loadSavedSearches = useCallback(async () => {
    try {
      // Implement saved searches loading logic here
      return [];
    } catch (err) {
      throw new Error('Failed to load saved searches');
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilter[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await performSearch(searchQuery, searchFilters);
      setResults(results);
    } catch (err) {
      setError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  }, [performSearch, setLoading, setError, setResults]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [historyData, analyticsData, savedSearchesData] = await Promise.all([
          loadHistory(),
          loadAnalytics(),
          loadSavedSearches()
        ]);
        setHistory(historyData);
        setAnalytics(analyticsData);
        setSavedSearches(savedSearchesData);
      } catch (err) {
        setError('Failed to load search data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadHistory, loadAnalytics, loadSavedSearches, setLoading, setError, setHistory, setAnalytics, setSavedSearches]);

  // Focus management
  useEffect(() => {
    if (focusedElement === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [focusedElement]);

  // Keyboard navigation
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    setFocusedElement('search');
  });

  useHotkeys('esc', () => {
    setShowFilters(false);
    setShowHistory(false);
    setShowAnalytics(false);
    setShowShare(false);
    setFocusedElement('search');
  });

  useHotkeys('tab', (e) => {
    e.preventDefault();
    if (focusedElement === 'search') {
      setFocusedElement('filters');
    } else if (focusedElement === 'filters') {
      setFocusedElement('results');
    } else {
      setFocusedElement('search');
    }
  });

  useHotkeys('shift+tab', (e) => {
    e.preventDefault();
    if (focusedElement === 'search') {
      setFocusedElement('results');
    } else if (focusedElement === 'filters') {
      setFocusedElement('search');
    } else {
      setFocusedElement('filters');
    }
  });

  // Result navigation
  useHotkeys('up, down', (e) => {
    if (focusedElement !== 'results') return;
    e.preventDefault();
    
    const direction = e.key === 'ArrowUp' ? -1 : 1;
    const allResults = [...results, ...groups.flatMap(g => g.results)];
    
    if (selectedResultIndex === null) {
      setSelectedResultIndex(direction === 1 ? 0 : allResults.length - 1);
    } else {
      const newIndex = selectedResultIndex + direction;
      if (newIndex >= 0 && newIndex < allResults.length) {
        setSelectedResultIndex(newIndex);
      }
    }
  });

  useHotkeys('enter', () => {
    if (focusedElement === 'results' && selectedResultIndex !== null) {
      const allResults = [...results, ...groups.flatMap(g => g.results)];
      const selectedResult = allResults[selectedResultIndex];
      if (selectedResult) {
        handleResultSelect(selectedResult);
      }
    }
  });

  const observer = useRef<IntersectionObserver>();
  const lastResultRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, loadMore]);

  const handleEditHistoryEntry = async (entryId: string, newQuery: string) => {
    await updateHistoryEntry(entryId, { query: newQuery });
  };

  const handleSaveSearch = async () => {
    if (!newSavedSearchName.trim()) return;
    await saveSearch(newSavedSearchName);
    setNewSavedSearchName('');
  };

  const handleUpdateSavedSearch = async (id: string) => {
    if (!editingSavedSearchName.trim()) return;
    await updateSavedSearch(id, editingSavedSearchName);
    setEditingSavedSearchId(null);
    setEditingSavedSearchName('');
  };

  const handleUseSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowHistory(false);
  };

  const handleAddTag = () => {
    if (newTag && !filters.tags?.includes(newTag)) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), newTag],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFilters({
      ...filters,
      tags: filters.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setFilters({
      ...filters,
      dateRange: dates,
    });
  };

  const handleResultSelect = (result: any) => {
    console.log('Selected result:', result);
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleVisualizationFilterChange = (filters: any) => {
    setVisualizationFilters(filters);
    // Apply filters to search results
    setFilters(prev => ({
      ...prev,
      ...filters
    }));
  };

  const handleCollaborationUpdate = (updates: any) => {
    // Handle updates from collaboration component
    console.log('Collaboration updates:', updates);
  };

  const handleLoadSearch = (search: any) => {
    setQuery(search.query);
    setFilters(search.filters);
    setShowHistory(false);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.text);
      search(suggestion.text, filters);
    } else if (suggestion.type === 'filter') {
      setFilters(prev => ({ ...prev, ...suggestion.filters }));
      search(query, { ...filters, ...suggestion.filters });
    } else if (suggestion.type === 'related') {
      setQuery(suggestion.text);
      search(suggestion.text, filters);
    }
  };

  const handleSettingsUpdate = (newSettings: any) => {
    setSettings(newSettings);
    // Apply settings changes
    if (newSettings.appearance.theme !== settings.appearance.theme) {
      document.documentElement.classList.toggle('dark', newSettings.appearance.theme === 'dark');
    }
    if (newSettings.layout.type !== settings.layout.type) {
      // Update layout
    }
    if (newSettings.layout.density !== settings.layout.density) {
      // Update density
    }
  };

  const handleAccessibilitySettingsChange = (newSettings: any) => {
    setAccessibilitySettings(newSettings);
  };

  const handleInsightSelect = (insight: SavedSearch) => {
    setQuery(insight.query);
    setFilters(insight.filters);
    setShowAnalytics(false);
  };

  const handleCustomizationUpdate = (updates: any) => {
    // Handle updates from customization component
    console.log('Customization updates:', updates);
  };

  const handleIntegrationUpdate = (updates: any) => {
    // Handle updates from integration component
    console.log('Integration updates:', updates);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setShowFilters(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
      setShowFilters(false);
    }
  };

  const handleFilterChange = (filters: SearchFilter[]) => {
    setFilters(filters);
    handleSearch(query, filters);
  };

  const handleHistorySelect = (entry: SearchHistoryEntry) => {
    setQuery(entry.query);
    setFilters(entry.filters);
    handleSearch(entry.query, entry.filters);
  };

  const handleSavedSearchSelect = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    handleSearch(savedSearch.query, savedSearch.filters);
  };

  const handleAnalyticsSelect = (analytics: SearchAnalytics) => {
    setQuery(analytics.query);
    setFilters(analytics.filters);
    handleSearch(analytics.query, analytics.filters);
  };

  const loadSearchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/results`);
      if (!response.ok) throw new Error('Failed to load search results');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load search results');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const loadSearchFilters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/filters`);
      if (!response.ok) throw new Error('Failed to load search filters');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load search filters');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/settings`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load settings');
      return {
        autoSave: true,
        autoRefresh: true,
        defaultSort: 'score',
        defaultFilters: [],
        maxResults: 100,
        highlightMatches: true,
        showMetadata: true,
        showScore: true,
        showTimestamp: true
      };
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [resultsData, filtersData, settingsData] = await Promise.all([
          loadSearchResults(),
          loadSearchFilters(),
          loadSettings()
        ]);
        setSearchResults(resultsData);
        setSearchFilters(filtersData);
        setSettings(settingsData);
        setError(null);
      } catch (error) {
        console.error('Failed to initialize search data:', error);
        setError('Failed to load search data');
      }
    };
    initializeData();
  }, [loadSearchResults, loadSearchFilters, loadSettings]);

  const handleAddFilter = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFilter),
      });
      if (!response.ok) throw new Error('Failed to add filter');
      const updatedFilters = await loadSearchFilters();
      setSearchFilters(updatedFilters);
      setNewFilter({});
      setShowFilterModal(false);
      toast.success('Filter added successfully');
    } catch (error) {
      toast.error('Failed to add filter');
    } finally {
      setLoading(false);
    }
  }, [searchId, newFilter, loadSearchFilters]);

  const handleUpdateFilter = useCallback(async (filterId: string, updates: Partial<SearchFilter>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/filters/${filterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update filter');
      const updatedFilters = await loadSearchFilters();
      setSearchFilters(updatedFilters);
      toast.success('Filter updated successfully');
    } catch (error) {
      toast.error('Failed to update filter');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadSearchFilters]);

  const handleRemoveFilter = useCallback(async (filterId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/filters/${filterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove filter');
      const updatedFilters = await loadSearchFilters();
      setSearchFilters(updatedFilters);
      toast.success('Filter removed successfully');
    } catch (error) {
      toast.error('Failed to remove filter');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadSearchFilters]);

  const handleUpdateSettings = useCallback(async (updates: Partial<SearchSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useHotkeys('ctrl+enter, cmd+enter', () => {
    if (searchInputRef.current === document.activeElement) {
      handleAddFilter();
    }
  }, [handleAddFilter]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4" role="search" aria-label="Search interface">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search... (Press Ctrl+K or Cmd+K to focus)"
              className="pl-10"
              aria-label="Search input"
              role="searchbox"
              tabIndex={focusedElement === 'search' ? 0 : -1}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            aria-expanded={showFilters}
            aria-controls="filters-panel"
            tabIndex={focusedElement === 'filters' ? 0 : -1}
          >
            <Filter size={16} />
            Filters
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              aria-expanded={showHistory}
              aria-controls="history-modal"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(true)}
              aria-expanded={showAnalytics}
              aria-controls="analytics-modal"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowShare(!showShare)}
            className="flex items-center gap-2"
            aria-expanded={showShare}
            aria-controls="share-panel"
            tabIndex={focusedElement === 'filters' ? 0 : -1}
          >
            <Share2 size={16} />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCollaboration(!showCollaboration)}
            className="flex items-center gap-2"
            aria-expanded={showCollaboration}
            aria-controls="collaboration-panel"
            tabIndex={focusedElement === 'filters' ? 0 : -1}
          >
            <Users size={16} />
            Collaborate
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisualization(true)}
              aria-expanded={showVisualization}
              aria-controls="visualization-modal"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Visualize
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(true)}
              aria-expanded={showExport}
              aria-controls="export-modal"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowIntegration(true)}
              variant="outline"
            >
              <Plug className="h-4 w-4 mr-2" />
              Integrations
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="p-4" ref={filterRef} role="region" aria-label="Search filters">
            <Tabs defaultValue="sort" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sort">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </TabsTrigger>
                <TabsTrigger value="filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sort" className="space-y-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <RadioGroup
                    value={filters.sortBy || 'relevance'}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="relevance" id="sort-relevance" />
                      <Label htmlFor="sort-relevance">Relevance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="date" id="sort-date" />
                      <Label htmlFor="sort-date">Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="name" id="sort-name" />
                      <Label htmlFor="sort-name">Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="size" id="sort-size" />
                      <Label htmlFor="sort-size">Size</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <RadioGroup
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="asc" id="order-asc" />
                      <Label htmlFor="order-asc">Ascending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="desc" id="order-desc" />
                      <Label htmlFor="order-desc">Descending</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>

              <TabsContent value="filter" className="space-y-4">
                <div className="space-y-2">
                  <Label>Content Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-thread"
                        checked={!filters.type || filters.type === 'thread'}
                        onCheckedChange={(checked) => {
                          const types = filters.type ? filters.type.split(',') : [];
                          if (checked) {
                            types.push('thread');
                          } else {
                            const index = types.indexOf('thread');
                            if (index > -1) types.splice(index, 1);
                          }
                          setFilters({ ...filters, type: types.join(',') || undefined });
                        }}
                      />
                      <Label htmlFor="type-thread" className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Threads
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-file"
                        checked={!filters.type || filters.type === 'file'}
                        onCheckedChange={(checked) => {
                          const types = filters.type ? filters.type.split(',') : [];
                          if (checked) {
                            types.push('file');
                          } else {
                            const index = types.indexOf('file');
                            if (index > -1) types.splice(index, 1);
                          }
                          setFilters({ ...filters, type: types.join(',') || undefined });
                        }}
                      />
                      <Label htmlFor="type-file" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Files
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-folder"
                        checked={!filters.type || filters.type === 'folder'}
                        onCheckedChange={(checked) => {
                          const types = filters.type ? filters.type.split(',') : [];
                          if (checked) {
                            types.push('folder');
                          } else {
                            const index = types.indexOf('folder');
                            if (index > -1) types.splice(index, 1);
                          }
                          setFilters({ ...filters, type: types.join(',') || undefined });
                        }}
                      />
                      <Label htmlFor="type-folder" className="flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        Folders
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DatePicker
                    value={filters.dateRange}
                    onChange={(value) => setFilters({ ...filters, dateRange: value })}
                    mode="range"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Size Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-size">Min Size</Label>
                      <Input
                        id="min-size"
                        type="number"
                        value={filters.minSize}
                        onChange={(e) => setFilters({ ...filters, minSize: Number(e.target.value) })}
                        placeholder="Min size in bytes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-size">Max Size</Label>
                      <Input
                        id="max-size"
                        type="number"
                        value={filters.maxSize}
                        onChange={(e) => setFilters({ ...filters, maxSize: Number(e.target.value) })}
                        placeholder="Max size in bytes"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Relevance Threshold</Label>
                  <Slider
                    value={[filters.relevanceThreshold || 0]}
                    onValueChange={([value]) => setFilters({ ...filters, relevanceThreshold: value })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag) {
                          setFilters({
                            ...filters,
                            tags: [...(filters.tags || []), newTag],
                          });
                          setNewTag('');
                        }
                      }}
                    />
                    <Button onClick={() => {
                      if (newTag) {
                        setFilters({
                          ...filters,
                          tags: [...(filters.tags || []), newTag],
                        });
                        setNewTag('');
                      }
                    }}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          onClick={() => {
                            setFilters({
                              ...filters,
                              tags: filters.tags?.filter((t) => t !== tag),
                            });
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={filters.author || ''}
                    onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                    placeholder="Filter by author..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium">Search History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <SearchHistory
                  searchId={searchId}
                  onLoadSearch={handleLoadSearch}
                />
              </div>
            </div>
          </div>
        )}

        {showAnalytics && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium">Search Analytics</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalytics(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <SearchAnalytics
                  searchId={searchId}
                  onInsightSelect={handleInsightSelect}
                />
              </div>
            </div>
          </div>
        )}

        {showShare && (
          <ShareSearch
            searchQuery={query}
            filters={filters}
            results={[...results, ...groups.flatMap(g => g.results)]}
            onShare={(shareData) => {
              console.log('Shared search:', shareData);
              setShowShare(false);
            }}
          />
        )}

        {showCollaboration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium">Search Collaboration</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCollaboration(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 h-[calc(100%-4rem)] overflow-auto">
                <SearchCollaboration
                  searchId={searchId}
                  query={query}
                  filters={filters}
                  results={results}
                  onUpdate={handleCollaborationUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <SearchVisualization
            results={[...results, ...groups.flatMap(g => g.results)]}
            onFilterChange={handleVisualizationFilterChange}
          />
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div 
          ref={resultsRef}
          className="space-y-6"
          role="listbox"
          aria-label="Search results"
          tabIndex={focusedElement === 'results' ? 0 : -1}
        >
          {isLoading ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              Loading results...
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <Card key={group.type} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(group.type)}
                    role="button"
                    aria-expanded={expandedGroups[group.type]}
                    aria-controls={`group-${group.type}`}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{group.title}</h3>
                      <Badge variant="outline">{group.count} results</Badge>
                    </div>
                    {expandedGroups[group.type] ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  {expandedGroups[group.type] && (
                    <div id={`group-${group.type}`} className="border-t">
                      <div className="space-y-4 p-4">
                        {group.results.map((result, index) => (
                          <div
                            key={result.id}
                            ref={index === group.results.length - 1 ? lastResultRef : undefined}
                            role="option"
                            aria-selected={selectedResultIndex === index}
                            tabIndex={focusedElement === 'results' ? 0 : -1}
                          >
                            <SearchResult
                              result={result}
                              query={query}
                              onSelect={handleResultSelect}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {results.length > 0 && (
                <Card>
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-4">All Results</h3>
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div
                          key={result.id}
                          ref={index === results.length - 1 ? lastResultRef : undefined}
                          role="option"
                          aria-selected={selectedResultIndex === index + groups.flatMap(g => g.results).length}
                          tabIndex={focusedElement === 'results' ? 0 : -1}
                        >
                          <SearchResult
                            result={result}
                            query={query}
                            onSelect={handleResultSelect}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {isLoadingMore && (
                <div className="text-center py-4" role="status" aria-live="polite">
                  Loading more results...
                </div>
              )}

              {!isLoading && !isLoadingMore && results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found. Try adjusting your search criteria.
                </div>
              )}
            </>
          )}
        </div>

        {/* Save Search */}
        <div className="flex space-x-2">
          <Input
            type="text"
            value={newSavedSearchName}
            onChange={(e) => setNewSavedSearchName(e.target.value)}
            placeholder="Name for saved search"
            className="flex-1"
          />
          <Button
            onClick={handleSaveSearch}
            disabled={!newSavedSearchName.trim()}
          >
            Save Search
          </Button>
        </div>

        {/* Saved Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedSearches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-4 border rounded-lg">
                  {editingSavedSearchId === search.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingSavedSearchName}
                        onChange={(e) => setEditingSavedSearchName(e.target.value)}
                        placeholder="Search name"
                      />
                      <Button onClick={() => handleUpdateSavedSearch(search.id)}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSavedSearchId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="font-medium">{search.name}</h3>
                        <p className="text-sm text-gray-500">{search.query}</p>
                        <p className="text-xs text-gray-400">
                          Updated {formatDistanceToNow(new Date(search.updatedAt))} ago
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleUseSavedSearch(search)}>
                          Use
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSavedSearchId(search.id);
                            setEditingSavedSearchName(search.name);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteSavedSearch(search.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {savedSearches.length === 0 && (
                <p className="text-center text-gray-500">No saved searches</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <div className="flex-1 overflow-auto">
            {results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {/* ... existing results display code ... */}
                </div>
                <div className="space-y-4">
                  <SearchCustomization onUpdate={handleSettingsUpdate} />
                  <SearchSuggestions
                    query={query}
                    filters={filters}
                    onSelect={handleSuggestionSelect}
                  />
                  <SearchHistory onLoadSearch={handleLoadSearch} />
                  <SearchCollaboration
                    searchId={searchId}
                    query={query}
                    filters={filters}
                    results={results}
                    onUpdate={handleCollaborationUpdate}
                  />
                  <SearchExport
                    results={results}
                    query={query}
                    filters={filters}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results found. Try adjusting your search criteria.
              </div>
            )}
            {showNotifications && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Search Notifications</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4 overflow-y-auto">
                    <SearchNotifications
                      searchId={searchId}
                      query={query}
                      filters={filters}
                    />
                  </div>
                </div>
              </div>
            )}
            {showExport && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">Export & Share</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExport(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <SearchExport
                      searchId={searchId}
                      query={query}
                      filters={filters}
                      results={results}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessibility Modal */}
      {showAccessibility && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Accessibility Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccessibility(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto">
              <SearchAccessibility
                searchId={searchId}
                onShortcutChange={(shortcuts) => {
                  // Handle shortcut changes
                }}
                onSettingsChange={handleAccessibilitySettingsChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Notifications Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(true)}
        className="ml-2"
        aria-expanded={showNotifications}
        aria-controls="notifications-modal"
      >
        <Bell className="h-4 w-4 mr-2" />
        Notifications
      </Button>

      {/* Add Accessibility Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAccessibility(true)}
        className="ml-2"
        aria-expanded={showAccessibility}
        aria-controls="accessibility-modal"
      >
        <Settings className="h-4 w-4 mr-2" />
        Accessibility
      </Button>

      {showVisualization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">Search Visualization</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVisualization(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <SearchVisualization
                searchId={searchId}
                results={results}
                onFilterChange={handleVisualizationFilterChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Customization Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCustomization(true)}
        className="ml-2"
        aria-expanded={showCustomization}
        aria-controls="customization-modal"
      >
        <Settings className="h-4 w-4 mr-2" />
        Customize
      </Button>

      {/* Add Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">Search Customization</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomization(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <SearchCustomization
                searchId={searchId}
                onUpdate={handleCustomizationUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {showIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">Search Integration</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIntegration(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <SearchIntegration
                searchId={searchId}
                onUpdate={handleIntegrationUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 