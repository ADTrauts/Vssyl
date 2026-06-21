'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Camera,
  Globe,
  Palette,
  Shield,
  Bell,
  CreditCard,
  Link2,
  ExternalLink,
} from 'lucide-react';
import type { SettingsNavigationEntry } from '../../api/settings';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  account: User,
  photos: Camera,
  location: Globe,
  appearance: Palette,
  privacy: Shield,
  notifications: Bell,
  security: Shield,
  billing: CreditCard,
  connected_accounts: Link2,
};

interface SettingsNavSidebarProps {
  navigation: SettingsNavigationEntry[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export default function SettingsNavSidebar({
  navigation,
  activeTab,
  onSelectTab,
}: SettingsNavSidebarProps) {
  const router = useRouter();

  const inHub = navigation
    .filter((item) => item.disposition === 'in_hub')
    .sort((a, b) => a.order - b.order);

  const external = navigation
    .filter((item) => item.disposition === 'external_link')
    .sort((a, b) => a.order - b.order);

  const handleNav = (item: SettingsNavigationEntry) => {
    if (item.disposition === 'external_link') {
      router.push(item.href);
      return;
    }
    const tab = new URL(item.href, 'http://local').searchParams.get('tab') ?? item.id;
    onSelectTab(tab);
  };

  const tabForItem = (item: SettingsNavigationEntry): string => {
    return new URL(item.href, 'http://local').searchParams.get('tab') ?? item.id;
  };

  return (
    <nav className="space-y-1">
      {inHub.map((item) => {
        const Icon = ICONS[item.id] ?? User;
        const tab = tabForItem(item);
        const selected = activeTab === tab;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
              selected
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}

      {external.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-slate-600">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            More settings
          </p>
          {external.map((item) => {
            const Icon = ICONS[item.id] ?? ExternalLink;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
