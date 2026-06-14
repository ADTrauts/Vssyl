'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlace } from '../../contexts/PlaceContext';
import PlaceGraph from './PlaceGraph';
import PlaceExplore from './PlaceExplore';
import PlaceOnboarding from './PlaceOnboarding';
import PlaceMeetings from './PlaceMeetings';
import PlaceActivityFeed from './PlaceActivityFeed';
import PlaceAnalyticsDashboard from './PlaceAnalyticsDashboard';
import PlacePrivacySettings from './PlacePrivacySettings';
import { PlacePageShell, PLACE_TABS, type PlaceTabId } from './PlacePageShell';
import { Spinner } from 'shared/components';

export interface PlaceConsumerExperienceProps {
  /** Dashboard embed — no global header offset */
  embedded?: boolean;
  /** Deep link: open business panel on graph */
  highlightBusinessId?: string;
}

/**
 * Single canonical consumer Place experience (Wave 6B-C).
 * Used by `/place` route and dashboard `PlaceContent` embed.
 */
export function PlaceConsumerExperience({
  embedded = false,
  highlightBusinessId: highlightProp,
}: PlaceConsumerExperienceProps) {
  const searchParams = useSearchParams();
  const { place, loading, activeTab, setActiveTab, refreshPlace } = usePlace();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const highlightBusinessId =
    highlightProp ?? searchParams?.get('highlight') ?? undefined;

  useEffect(() => {
    if (!searchParams) return;
    const tab = searchParams.get('tab');
    if (tab && (PLACE_TABS as readonly string[]).includes(tab)) {
      setActiveTab(tab as PlaceTabId);
    }
  }, [searchParams, setActiveTab]);

  useEffect(() => {
    const refreshOnTrash = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: string }>).detail;
      if (detail?.moduleId === 'place' || event.type === 'itemRestored') {
        void refreshPlace();
      }
    };
    window.addEventListener('placeItemTrashed', refreshOnTrash);
    window.addEventListener('itemRestored', refreshOnTrash);
    return () => {
      window.removeEventListener('placeItemTrashed', refreshOnTrash);
      window.removeEventListener('itemRestored', refreshOnTrash);
    };
  }, [refreshPlace]);

  const loadingShell = (
    <div
      className={`flex items-center justify-center bg-gray-50 dark:bg-slate-900 ${
        embedded ? 'h-full' : 'mt-16'
      }`}
      style={embedded ? undefined : { height: 'calc(100vh - 64px)' }}
    >
      <div className="text-center">
        <Spinner size={40} />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading your neighborhood...</p>
      </div>
    </div>
  );

  if (loading) {
    return loadingShell;
  }

  if (place && !place.isSetupComplete) {
    return (
      <div
        className={`overflow-auto bg-gray-50 dark:bg-slate-900 ${embedded ? 'h-full' : 'mt-16'}`}
        style={embedded ? undefined : { height: 'calc(100vh - 64px)' }}
      >
        <PlaceOnboarding />
      </div>
    );
  }

  return (
    <>
      <PlacePageShell
        activeTab={activeTab as PlaceTabId}
        onTabChange={tab => setActiveTab(tab)}
        onPrivacyOpen={() => setShowPrivacy(true)}
        embedded={embedded}
      >
        {activeTab === 'my-place' && <PlaceGraph highlightBusinessId={highlightBusinessId} />}
        {activeTab === 'explore' && <PlaceExplore />}
        {activeTab === 'meetings' && <PlaceMeetings />}
        {activeTab === 'feed' && <PlaceActivityFeed />}
        {activeTab === 'analytics' && <PlaceAnalyticsDashboard />}
      </PlacePageShell>

      {showPrivacy && <PlacePrivacySettings onClose={() => setShowPrivacy(false)} />}
    </>
  );
}

export default PlaceConsumerExperience;
