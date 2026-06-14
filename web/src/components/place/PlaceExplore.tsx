'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { Spinner, ConfirmModal, Button } from 'shared/components';
import { PlaceDiscoveryCard } from './PlaceDiscoveryCard';
import { placeActionError } from './placeUxFeedback';
import {
  PlaceExploreSearchEmptyState,
  PlaceExploreSuggestionsEmptyState,
} from './PlaceEmptyStates';
import {
  explorePlaces,
  getLocalSuggestions,
  getForYouSuggestions,
  dismissSuggestion,
} from '@/api/placeListing';
import type { PlaceListingWithBusiness, SuggestionItem } from '@/api/placeListing';
import { usePlace } from '../../contexts/PlaceContext';

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'RESTAURANT', label: 'Restaurants & Dining', color: '#E53935' },
  { value: 'RETAIL', label: 'Retail & Shopping', color: '#1E88E5' },
  { value: 'GROCERY', label: 'Grocery & Markets', color: '#43A047' },
  { value: 'DIGITAL_SERVICE', label: 'Digital Services', color: '#8E24AA' },
  { value: 'DELIVERY', label: 'Delivery Services', color: '#FB8C00' },
  { value: 'LOCAL_SERVICE', label: 'Local Services', color: '#00ACC1' },
  { value: 'HEALTH_WELLNESS', label: 'Health & Wellness', color: '#EC407A' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', color: '#7E57C2' },
];

// ============================================================================
// Main Explore Component
// ============================================================================

export default function PlaceExplore() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const { place, addNode, removeNode } = usePlace();

  // Search state
  const [searchResults, setSearchResults] = useState<PlaceListingWithBusiness[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Suggestion state
  const [localSuggestions, setLocalSuggestions] = useState<SuggestionItem[]>([]);
  const [forYouSuggestions, setForYouSuggestions] = useState<SuggestionItem[]>([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pendingUnfollow, setPendingUnfollow] = useState<{
    businessId: string;
    nodeId: string;
    name: string;
  } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const closeMobileFilters = useCallback(() => setMobileFiltersOpen(false), []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileFilters();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileFiltersOpen, closeMobileFilters]);

  const activeCategoryLabel = activeCategory
    ? CATEGORIES.find(c => c.value === activeCategory)?.label ?? 'Filtered'
    : 'All categories';

  const selectCategory = (value: string | null) => {
    handleCategoryClick(value);
    closeMobileFilters();
  };

  // Load suggestions on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadSuggestions() {
      setSuggestionsLoading(true);
      try {
        const [localRes, forYouRes] = await Promise.all([
          getLocalSuggestions(token!),
          getForYouSuggestions(token!),
        ]);
        if (!cancelled) {
          setLocalSuggestions(localRes.data);
          setLocationLabel(`${localRes.location.city}, ${localRes.location.region}`);
          setForYouSuggestions(forYouRes.data);
        }
      } catch (error: unknown) {
        placeActionError('Could not load suggestions', error);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }
    loadSuggestions();
    return () => { cancelled = true; };
  }, [token]);

  // Search
  const doSearch = useCallback(async (search?: string, category?: string | null) => {
    if (!token) return;
    setSearchLoading(true);
    setIsSearching(true);
    try {
      const result = await explorePlaces({ search: search || undefined, category: category || undefined, limit: 30 }, token);
      setSearchResults(result.data);
      setSearchTotal(result.pagination.total);
    } catch (error: unknown) {
      placeActionError('Search failed', error);
    } finally { setSearchLoading(false); }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) doSearch(searchQuery, activeCategory);
  };

  const handleCategoryClick = (cat: string | null) => {
    setActiveCategory(cat);
    if (cat || searchQuery.trim()) {
      doSearch(searchQuery, cat);
    } else {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setActiveCategory(null);
  };

  // Follow helpers
  const isFollowingBiz = (businessId: string) =>
    place?.nodes.some(n => n.nodeType === 'BUSINESS' && n.entityId === businessId) ?? false;

  const getNodeId = (businessId: string) =>
    place?.nodes.find(n => n.nodeType === 'BUSINESS' && n.entityId === businessId)?.id;

  const handleToggleFollow = async (listing: PlaceListingWithBusiness) => {
    const businessId = listing.business.id;
    if (isFollowingBiz(businessId)) {
      const nodeId = getNodeId(businessId);
      if (nodeId) {
        setPendingUnfollow({
          businessId,
          nodeId,
          name: listing.displayName || listing.business.name,
        });
      }
      return;
    }
    setActionLoadingId(businessId);
    await addNode('BUSINESS', businessId, listing.displayName || listing.business.name);
    setActionLoadingId(null);
  };

  const executeUnfollow = async () => {
    if (!pendingUnfollow) return;
    setActionLoadingId(pendingUnfollow.businessId);
    try {
      await removeNode(pendingUnfollow.nodeId);
      setPendingUnfollow(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismiss = async (businessId: string, reason: string) => {
    if (!token) return;
    try {
      await dismissSuggestion(businessId, reason, token);
      setLocalSuggestions(prev => prev.filter(s => s.listing.business.id !== businessId));
      setForYouSuggestions(prev => prev.filter(s => s.listing.business.id !== businessId));
    } catch (error: unknown) {
      placeActionError('Could not dismiss suggestion', error);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <form
          onSubmit={handleSearch}
          className="mb-4 flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-800 md:mb-6"
        >
          <Search size={20} className="shrink-0 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search businesses, restaurants, services..."
            className="min-w-0 flex-1 border-none bg-transparent text-base text-gray-900 outline-none dark:text-gray-100"
            aria-label="Search businesses"
          />
          {(searchQuery || isSearching) && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </form>

        {/* Mobile filter bar (MOB-001) */}
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            aria-label="Open category filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{activeCategoryLabel}</span>
        </div>

        {mobileFiltersOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close category filters"
            onClick={closeMobileFilters}
          />
        ) : null}

        <aside
          className={`z-50 w-[min(300px,88vw)] shrink-0 border-r border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${
            mobileFiltersOpen
              ? 'fixed inset-y-0 right-0 flex flex-col shadow-xl md:hidden'
              : 'hidden'
          }`}
          aria-label="Category filters"
          aria-hidden={!mobileFiltersOpen}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeMobileFilters}
              aria-label="Close category filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto">
            <button
              type="button"
              onClick={() => selectCategory(null)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                activeCategory === null
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => selectCategory(activeCategory === cat.value ? null : cat.value)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  activeCategory === cat.value
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
                style={activeCategory === cat.value ? { backgroundColor: `${cat.color}18`, color: cat.color } : undefined}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Desktop category chips */}
        <div className="mb-6 hidden flex-wrap gap-2 md:flex md:mb-7">
          <button
            type="button"
            onClick={() => handleCategoryClick(null)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeCategory === null
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                : 'border-gray-200 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategoryClick(activeCategory === cat.value ? null : cat.value)}
              className="rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors"
              style={{
                borderColor: activeCategory === cat.value ? cat.color : undefined,
                backgroundColor: activeCategory === cat.value ? `${cat.color}12` : undefined,
                color: activeCategory === cat.value ? cat.color : undefined,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isSearching ? (
          searchLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size={32} />
            </div>
          ) : searchResults.length === 0 ? (
            <PlaceExploreSearchEmptyState />
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {searchTotal} result{searchTotal !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map(listing => (
                  <PlaceDiscoveryCard
                    key={listing.id}
                    listing={listing}
                    isFollowing={isFollowingBiz(listing.business.id)}
                    actionLoading={actionLoadingId === listing.business.id}
                    onToggleFollow={() => handleToggleFollow(listing)}
                    variant="search"
                  />
                ))}
              </div>
            </>
          )
        ) : suggestionsLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="flex flex-col gap-9">
            {/* For You section */}
            {forYouSuggestions.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">For You</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {forYouSuggestions.map(s => (
                    <PlaceDiscoveryCard
                      key={s.listing.id}
                      listing={s.listing}
                      reason={s.reason}
                      isFollowing={isFollowingBiz(s.listing.business.id)}
                      actionLoading={actionLoadingId === s.listing.business.id}
                      onToggleFollow={() => handleToggleFollow(s.listing)}
                      onDismiss={(reason) => handleDismiss(s.listing.business.id, reason)}
                      variant="suggestion"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Near You section */}
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                <MapPin size={20} aria-hidden />
                Near You
              </h2>
              {locationLabel && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{locationLabel}</p>
              )}
              {localSuggestions.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-400">
                  <span className="mb-2 block text-base font-semibold text-gray-800 dark:text-gray-200">
                    No local businesses yet
                  </span>
                  Businesses near you will appear here as they join Vssyl Place.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {localSuggestions.map(s => (
                    <PlaceDiscoveryCard
                      key={s.listing.id}
                      listing={s.listing}
                      reason={s.reason}
                      isFollowing={isFollowingBiz(s.listing.business.id)}
                      actionLoading={actionLoadingId === s.listing.business.id}
                      onToggleFollow={() => handleToggleFollow(s.listing)}
                      onDismiss={(reason) => handleDismiss(s.listing.business.id, reason)}
                      variant="suggestion"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Empty state when both are empty */}
            {forYouSuggestions.length === 0 && localSuggestions.length === 0 && (
              <PlaceExploreSuggestionsEmptyState />
            )}
          </div>
        )}
    </div>

    <ConfirmModal
      open={pendingUnfollow !== null}
      onClose={() => setPendingUnfollow(null)}
      onConfirm={executeUnfollow}
      title="Remove from Main Street?"
      description={
        pendingUnfollow
          ? `Remove ${pendingUnfollow.name} from your neighborhood?`
          : undefined
      }
      variant="destructive"
      confirmLabel="Remove"
      loading={pendingUnfollow !== null && actionLoadingId === pendingUnfollow.businessId}
    />
  </>
  );
}
