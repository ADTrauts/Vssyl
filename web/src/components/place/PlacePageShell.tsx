'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Compass,
  Users,
  Settings,
  Receipt,
  Zap,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { Button } from 'shared/components';

export const PLACE_TABS = ['my-place', 'explore', 'meetings', 'feed', 'analytics'] as const;
export type PlaceTabId = (typeof PLACE_TABS)[number];

const TAB_CONFIG: { id: PlaceTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'my-place', label: 'My Place', icon: <MapPin size={18} aria-hidden /> },
  { id: 'explore', label: 'Explore', icon: <Compass size={18} aria-hidden /> },
  { id: 'meetings', label: 'Meetings', icon: <Users size={18} aria-hidden /> },
  { id: 'feed', label: 'Feed', icon: <Zap size={18} aria-hidden /> },
  { id: 'analytics', label: 'Insights', icon: <BarChart3 size={18} aria-hidden /> },
];

function tabPanelLabel(tab: PlaceTabId): string {
  switch (tab) {
    case 'my-place':
      return 'My Place neighborhood view';
    case 'explore':
      return 'Explore businesses';
    case 'meetings':
      return 'Meeting places';
    case 'feed':
      return 'Activity feed';
    case 'analytics':
      return 'Analytics insights';
  }
}

function getTabLabel(tab: PlaceTabId): string {
  return TAB_CONFIG.find(t => t.id === tab)?.label ?? 'Place';
}

export interface PlacePageShellProps {
  activeTab: PlaceTabId;
  onTabChange: (tab: PlaceTabId) => void;
  onPrivacyOpen: () => void;
  /** When true, shell fills parent (dashboard embed); when false, accounts for global header offset */
  embedded?: boolean;
  children: React.ReactNode;
}

/**
 * Canonical consumer Place shell (Wave 6B-C).
 * Desktop: horizontal tab bar. Mobile: MOB-001 collapsible nav sheet (Calendar 3C-7B pattern).
 */
export function PlacePageShell({
  activeTab,
  onTabChange,
  onPrivacyOpen,
  embedded = false,
  children,
}: PlacePageShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const selectTab = useCallback(
    (tab: PlaceTabId) => {
      onTabChange(tab);
      closeMobileNav();
    },
    [onTabChange, closeMobileNav]
  );

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, closeMobileNav]);

  const rootClass = embedded
    ? 'flex h-full min-h-0 flex-col bg-gray-50 dark:bg-slate-900'
    : 'mt-16 flex flex-col bg-gray-50 dark:bg-slate-900';
  const heightStyle = embedded ? undefined : { height: 'calc(100vh - 64px)' };

  const utilityLinks = (
    <>
      <Link
        href="/place/transactions"
        onClick={closeMobileNav}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
      >
        <Receipt size={16} aria-hidden />
        Transaction history
      </Link>
      <button
        type="button"
        onClick={() => {
          onPrivacyOpen();
          closeMobileNav();
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
      >
        <Settings size={16} aria-hidden />
        Privacy settings
      </button>
    </>
  );

  return (
    <div className={rootClass} style={heightStyle}>
      {/* Mobile nav bar (MOB-001) */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open Place navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {getTabLabel(activeTab)}
        </span>
      </div>

      {/* Desktop tab bar */}
      <nav
        className="hidden shrink-0 items-center gap-0 border-b border-gray-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 md:flex lg:px-6"
        role="tablist"
        aria-label="Place navigation"
      >
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors lg:px-5 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 pr-1">
          <Link
            href="/place/transactions"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            <Receipt size={16} aria-hidden />
            <span className="hidden lg:inline">History</span>
          </Link>
          <button
            type="button"
            onClick={onPrivacyOpen}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            aria-label="Open privacy settings"
          >
            <Settings size={16} aria-hidden />
            <span className="hidden lg:inline">Privacy</span>
          </button>
        </div>
      </nav>

      {/* Mobile nav sheet */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close Place navigation"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        className={`w-[min(280px,85vw)] shrink-0 border-r border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${
          mobileNavOpen
            ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-xl md:hidden'
            : 'hidden'
        }`}
        aria-label="Place navigation menu"
        aria-hidden={!mobileNavOpen}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 z-10"
          onClick={closeMobileNav}
          aria-label="Close Place navigation"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="space-y-1 overflow-y-auto pt-8" role="tablist" aria-label="Place sections">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 dark:border-slate-700">
          {utilityLinks}
        </div>
      </aside>

      <div
        role="tabpanel"
        aria-label={tabPanelLabel(activeTab)}
        className={`min-h-0 flex-1 ${activeTab === 'my-place' ? 'overflow-hidden' : 'overflow-auto'}`}
      >
        {children}
      </div>
    </div>
  );
}
