'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MapPin, Plus, Check, ShieldCheck, X, ThumbsDown, Info } from 'lucide-react';
import { Spinner } from 'shared/components';
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
// Suggestion Card (reusable)
// ============================================================================

function SuggestionCard({
  listing,
  reason,
  isFollowing,
  actionLoading,
  onToggleFollow,
  onDismiss,
}: {
  listing: PlaceListingWithBusiness;
  reason: string;
  isFollowing: boolean;
  actionLoading: boolean;
  onToggleFollow: () => void;
  onDismiss: (reason: string) => void;
}) {
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.borderColor = '#C7D2FE';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
      }}
    >
      {listing.coverImage ? (
        <div style={{ height: 72, overflow: 'hidden' }}>
          <img src={listing.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: 4, background: listing.nodeColor || '#6366f1' }} />
      )}
      <div style={{ padding: 16 }}>
        {/* Dismiss / not interested */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
          <button
            onClick={() => setShowWhyTooltip(!showWhyTooltip)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5 }}
            aria-label="Why this suggestion"
          >
            <Info size={14} />
          </button>
          <button
            onClick={() => onDismiss('not_interested')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5 }}
            aria-label="Not interested"
          >
            <ThumbsDown size={14} />
          </button>
          <button
            onClick={() => onDismiss('dismissed')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5 }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Why tooltip */}
        {showWhyTooltip && (
          <div style={{
            position: 'absolute', top: 30, right: 10, zIndex: 10,
            background: '#1F2937', color: '#fff', fontSize: 12, padding: '6px 10px',
            borderRadius: 6, maxWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {reason}
          </div>
        )}

        {/* Business info — thumb: avatar, then cover, then logo */}
        <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 10 }}>
          {(listing.avatarImage ?? listing.coverImage ?? listing.business.logo) ? (
            <img src={listing.avatarImage ?? listing.coverImage ?? listing.business.logo ?? ''} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: listing.nodeColor || '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16,
            }}>
              {(listing.displayName || listing.business.name).charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.displayName || listing.business.name}
              </span>
              {listing.business.einVerified && (
                <span title="Verified"><ShieldCheck size={14} color="#16a34a" /></span>
              )}
            </div>
            {listing.shortDescription && (
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.shortDescription}
              </p>
            )}
          </div>
        </div>

        {/* Reason chip */}
        <div style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 8,
          background: '#F3F4F6', color: '#6B7280', display: 'inline-block', marginBottom: 10,
        }}>
          {reason}
        </div>

        {/* Follow button */}
        <button
          onClick={onToggleFollow}
          disabled={actionLoading}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 8,
            border: isFollowing ? '1px solid #E5E7EB' : '1px solid #4F46E5',
            background: isFollowing ? '#F9FAFB' : '#4F46E5',
            color: isFollowing ? '#374151' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {actionLoading ? (
            <Spinner size={14} />
          ) : isFollowing ? (
            <><Check size={14} /> On Your Main Street</>
          ) : (
            <><Plus size={14} /> Add to Main Street</>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Listing Card (for search results, same style as before)
// ============================================================================

function ListingCard({
  listing,
  isFollowing,
  actionLoading,
  onToggleFollow,
}: {
  listing: PlaceListingWithBusiness;
  isFollowing: boolean;
  actionLoading: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#C7D2FE'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }}
    >
      {listing.coverImage ? (
        <div style={{ height: 80, overflow: 'hidden' }}>
          <img src={listing.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: 4, background: listing.nodeColor || '#6366f1' }} />
      )}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 12 }}>
          {(listing.avatarImage ?? listing.coverImage ?? listing.business.logo) ? (
            <img src={listing.avatarImage ?? listing.coverImage ?? listing.business.logo ?? ''} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 8, background: listing.nodeColor || '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18,
            }}>
              {(listing.displayName || listing.business.name).charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.displayName || listing.business.name}
              </span>
              {listing.business.einVerified && <span title="Verified"><ShieldCheck size={16} color="#16a34a" /></span>}
            </div>
            {listing.shortDescription && (
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.shortDescription}
              </p>
            )}
          </div>
        </div>
        {listing.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {listing.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#4B5563' }}>{tag}</span>
            ))}
          </div>
        )}
        <button
          onClick={onToggleFollow}
          disabled={actionLoading}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: isFollowing ? '1px solid #E5E7EB' : '1px solid #4F46E5',
            background: isFollowing ? '#F9FAFB' : '#4F46E5',
            color: isFollowing ? '#374151' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {actionLoading ? <Spinner size={14} /> : isFollowing ? <><Check size={14} /> On Your Main Street</> : <><Plus size={14} /> Add to Main Street</>}
        </button>
      </div>
    </div>
  );
}

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
      } catch {
        // Silently fail
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
    } catch { /* */ } finally { setSearchLoading(false); }
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
    setActionLoadingId(businessId);
    if (isFollowingBiz(businessId)) {
      const nodeId = getNodeId(businessId);
      if (nodeId) await removeNode(nodeId);
    } else {
      await addNode('BUSINESS', businessId, listing.displayName || listing.business.name);
    }
    setActionLoadingId(null);
  };

  const handleDismiss = async (businessId: string, reason: string) => {
    if (!token) return;
    try {
      await dismissSuggestion(businessId, reason, token);
      setLocalSuggestions(prev => prev.filter(s => s.listing.business.id !== businessId));
      setForYouSuggestions(prev => prev.filter(s => s.listing.business.id !== businessId));
    } catch { /* */ }
  };

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12, marginBottom: 24,
      }}>
        <Search size={20} color="#9CA3AF" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search businesses, restaurants, services..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#111827', background: 'transparent' }}
          aria-label="Search businesses"
        />
        {(searchQuery || isSearching) && (
          <button type="button" onClick={clearSearch} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 18 }}>
            &times;
          </button>
        )}
      </form>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => handleCategoryClick(null)}
          style={{
            padding: '6px 16px', borderRadius: 20,
            border: activeCategory === null ? '2px solid #4F46E5' : '2px solid #E5E7EB',
            background: activeCategory === null ? '#EEF2FF' : '#fff',
            color: activeCategory === null ? '#4338CA' : '#374151',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >All</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(activeCategory === cat.value ? null : cat.value)}
            style={{
              padding: '6px 16px', borderRadius: 20,
              border: activeCategory === cat.value ? `2px solid ${cat.color}` : '2px solid #E5E7EB',
              background: activeCategory === cat.value ? `${cat.color}12` : '#fff',
              color: activeCategory === cat.value ? cat.color : '#374151',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >{cat.label}</button>
        ))}
      </div>

      {/* SEARCH RESULTS MODE */}
      {isSearching ? (
        searchLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: 48, background: '#F9FAFB', border: '2px dashed #D1D5DB', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No businesses found</p>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Try a different search or category.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{searchTotal} result{searchTotal !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {searchResults.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFollowing={isFollowingBiz(listing.business.id)}
                  actionLoading={actionLoadingId === listing.business.id}
                  onToggleFollow={() => handleToggleFollow(listing)}
                />
              ))}
            </div>
          </>
        )
      ) : (
        /* DISCOVERY MODE (default) */
        suggestionsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {/* For You section */}
            {forYouSuggestions.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>For You</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {forYouSuggestions.map(s => (
                    <SuggestionCard
                      key={s.listing.id}
                      listing={s.listing}
                      reason={s.reason}
                      isFollowing={isFollowingBiz(s.listing.business.id)}
                      actionLoading={actionLoadingId === s.listing.business.id}
                      onToggleFollow={() => handleToggleFollow(s.listing)}
                      onDismiss={(reason) => handleDismiss(s.listing.business.id, reason)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Near You section */}
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                <MapPin size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                Near You
              </h2>
              {locationLabel && (
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{locationLabel}</p>
              )}
              {localSuggestions.length === 0 ? (
                <div style={{
                  padding: 40, background: '#F9FAFB', border: '2px dashed #D1D5DB', borderRadius: 12, textAlign: 'center', color: '#6B7280',
                }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    No local businesses yet
                  </p>
                  <p style={{ fontSize: 14 }}>
                    Businesses near you will appear here as they join Vssyl Place.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {localSuggestions.map(s => (
                    <SuggestionCard
                      key={s.listing.id}
                      listing={s.listing}
                      reason={s.reason}
                      isFollowing={isFollowingBiz(s.listing.business.id)}
                      actionLoading={actionLoadingId === s.listing.business.id}
                      onToggleFollow={() => handleToggleFollow(s.listing)}
                      onDismiss={(reason) => handleDismiss(s.listing.business.id, reason)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Empty state when both are empty */}
            {forYouSuggestions.length === 0 && localSuggestions.length === 0 && (
              <div style={{
                padding: 48, background: '#F9FAFB', border: '2px dashed #D1D5DB',
                borderRadius: 12, textAlign: 'center',
              }}>
                <MapPin size={32} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  No suggestions yet
                </p>
                <p style={{ fontSize: 14, color: '#6B7280' }}>
                  Try searching above, or check back as more businesses join Vssyl Place.
                </p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
