'use client';

import React from 'react';
import {
  MapPin,
  Compass,
  Users,
  Zap,
  BarChart3,
  Store,
  Receipt,
} from 'lucide-react';
import { EmptyState } from 'shared/components';

export function PlaceGraphEmptyState() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="Your Main Street is empty"
        description="Head to Explore to discover businesses and start building your personal neighborhood."
      />
    </div>
  );
}

export function PlaceExploreSearchEmptyState() {
  return (
    <EmptyState
      icon={<Compass className="h-12 w-12" />}
      title="No businesses found"
      description="Try a different search or category filter."
    />
  );
}

export function PlaceExploreSuggestionsEmptyState() {
  return (
    <EmptyState
      icon={<MapPin className="h-12 w-12" />}
      title="No suggestions yet"
      description="Try searching above, or check back as more businesses join Vssyl Place."
    />
  );
}

export function PlaceMeetingsEmptyState() {
  return (
    <div className="px-4 py-8">
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No meetings yet"
        description="Create a meeting place to coordinate with your connections."
      />
    </div>
  );
}

export function PlaceFeedEmptyState() {
  return (
    <div className="px-4 py-8">
      <EmptyState
        icon={<Zap className="h-12 w-12" />}
        title="Your activity feed is empty"
        description="Follow businesses, connect with people, and your activity will show here."
      />
    </div>
  );
}

export function PlaceInsightsEmptyState() {
  return (
    <div className="px-4 py-8">
      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="No insights yet"
        description="Interact with businesses on your Main Street to see analytics here."
      />
    </div>
  );
}

export function PlaceListingLinksEmptyState() {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400">
      No interaction links yet. Add links below so visitors can order, book, or visit your site.
    </p>
  );
}

export function PlaceProfileNoListingEmptyState() {
  return (
    <div className="p-6">
      <EmptyState
        icon={<Store className="h-12 w-12" />}
        title="No Place listing yet"
        description="This business has not published their storefront on Vssyl Place."
      />
    </div>
  );
}
