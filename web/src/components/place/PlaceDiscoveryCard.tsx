'use client';

import React, { useState } from 'react';
import { Plus, Check, ShieldCheck, X, ThumbsDown, Info } from 'lucide-react';
import { Spinner } from 'shared/components';
import type { PlaceListingWithBusiness } from '@/api/placeListing';

export interface PlaceDiscoveryCardProps {
  listing: PlaceListingWithBusiness;
  isFollowing: boolean;
  actionLoading: boolean;
  onToggleFollow: () => void;
  reason?: string;
  onDismiss?: (reason: string) => void;
  variant?: 'suggestion' | 'search';
}

export function PlaceDiscoveryCard({
  listing,
  isFollowing,
  actionLoading,
  onToggleFollow,
  reason,
  onDismiss,
  variant = 'search',
}: PlaceDiscoveryCardProps) {
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);
  const isSuggestion = variant === 'suggestion';
  const displayName = listing.displayName || listing.business.name;
  const thumbSrc = listing.avatarImage ?? listing.coverImage ?? listing.business.logo ?? '';
  const accentColor = listing.nodeColor || '#6366f1';

  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
    >
      {listing.coverImage ? (
        <div className={isSuggestion ? 'h-[72px] overflow-hidden' : 'h-20 overflow-hidden'}>
          <img
            src={listing.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-1" style={{ backgroundColor: accentColor }} aria-hidden />
      )}

      <div className="p-4">
        {isSuggestion && onDismiss && (
          <div className="absolute right-2.5 top-2.5 flex gap-1">
            <button
              type="button"
              onClick={() => setShowWhyTooltip(!showWhyTooltip)}
              className="rounded p-0.5 text-gray-400 opacity-60 transition-opacity hover:opacity-100 dark:text-gray-500"
              aria-label="Why this suggestion"
            >
              <Info size={14} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDismiss('not_interested')}
              className="rounded p-0.5 text-gray-400 opacity-60 transition-opacity hover:opacity-100 dark:text-gray-500"
              aria-label="Not interested"
            >
              <ThumbsDown size={14} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDismiss('dismissed')}
              className="rounded p-0.5 text-gray-400 opacity-60 transition-opacity hover:opacity-100 dark:text-gray-500"
              aria-label="Dismiss suggestion"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        )}

        {showWhyTooltip && reason && (
          <div
            role="tooltip"
            className="absolute right-2.5 top-8 z-10 max-w-[200px] rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-slate-950"
          >
            {reason}
          </div>
        )}

        <div className={`flex items-start gap-3 ${isSuggestion ? 'mb-2.5' : 'mb-3'}`}>
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              className={`rounded-lg border border-gray-200 object-cover dark:border-slate-600 ${
                isSuggestion ? 'h-10 w-10' : 'h-11 w-11'
              }`}
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-lg font-bold text-white ${
                isSuggestion ? 'h-10 w-10 text-base' : 'h-11 w-11 text-lg'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-hidden
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                {displayName}
              </span>
              {listing.business.einVerified && (
                <ShieldCheck size={isSuggestion ? 14 : 16} className="shrink-0 text-green-600" aria-label="Verified business" />
              )}
            </div>
            {listing.shortDescription && (
              <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                {listing.shortDescription}
              </p>
            )}
          </div>
        </div>

        {reason && isSuggestion && (
          <span className="mb-2.5 inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-slate-700 dark:text-gray-400">
            {reason}
          </span>
        )}

        {!isSuggestion && listing.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-slate-700 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onToggleFollow}
          disabled={actionLoading}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            isFollowing
              ? 'border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-300'
              : 'border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-600'
          }`}
        >
          {actionLoading ? (
            <Spinner size={14} />
          ) : isFollowing ? (
            <>
              <Check size={14} aria-hidden />
              On Your Main Street
            </>
          ) : (
            <>
              <Plus size={14} aria-hidden />
              Add to Main Street
            </>
          )}
        </button>
      </div>
    </article>
  );
}
