'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from 'shared/components';
import { PlaceFeedEmptyState } from './PlaceEmptyStates';
import { placeActionError } from './placeUxFeedback';
import { getActivityFeed } from '@/api/placeAnalytics';
import type { FeedItem } from '@/api/placeAnalytics';
import {
  Store, UserPlus, MapPin, ShoppingBag, ExternalLink,
  Users, Sparkles, Heart, Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  FOLLOWED_BUSINESS: <Store className="w-4 h-4 text-indigo-600" />,
  UNFOLLOWED_BUSINESS: <Store className="w-4 h-4 text-gray-400" />,
  ADDED_CONNECTION: <UserPlus className="w-4 h-4 text-blue-600" />,
  MEETING_CREATED: <MapPin className="w-4 h-4 text-amber-600" />,
  MEETING_CONFIRMED: <MapPin className="w-4 h-4 text-green-600" />,
  TRANSACTION_COMPLETED: <ShoppingBag className="w-4 h-4 text-green-600" />,
  EXTERNAL_CLICK: <ExternalLink className="w-4 h-4 text-blue-600" />,
  COMMUNITY_JOINED: <Users className="w-4 h-4 text-purple-600" />,
  PLACE_SETUP_COMPLETE: <Sparkles className="w-4 h-4 text-indigo-600" />,
  INTEREST_ADDED: <Heart className="w-4 h-4 text-pink-600" />,
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PlaceActivityFeed() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getActivityFeed({ limit: 50 }, token);
      setItems(result.data);
      setTotal(result.pagination.total);
    } catch (error: unknown) {
      setLoadError('Could not load activity feed');
      placeActionError('Could not load activity feed', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p>
        <button type="button" onClick={() => void fetchFeed()} className="mt-2 text-sm font-semibold text-indigo-600 underline">
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return <PlaceFeedEmptyState />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-1">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{total} activit{total !== 1 ? 'ies' : 'y'}</p>
      {items.map(item => (
        <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            {ICON_MAP[item.type] || <Zap className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.user.name || 'User'}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{relativeTime(item.createdAt)}</span>
              {item.isPrivate && (
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">private</span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{item.title}</p>
            {item.description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
