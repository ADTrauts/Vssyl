'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from 'shared/components';
import { useSession } from 'next-auth/react';
import { useTheme } from '../../hooks/useTheme';
import { changeTheme, type ThemePreference } from '../../lib/settingsTheme';
import { toast } from 'react-hot-toast';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function AppearanceSettings() {
  const { data: session } = useSession();
  const { theme } = useTheme();

  const handleChange = async (value: ThemePreference) => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    await changeTheme(token, value);
    toast.success(`Theme changed to ${value}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Choose how Vssyl looks. Your preference is saved to your account and syncs across devices.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = theme === option.value;
          return (
            <Button
              key={option.value}
              variant={selected ? 'primary' : 'secondary'}
              onClick={() => void handleChange(option.value)}
              className="flex items-center justify-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {option.label}
              {selected ? ' ✓' : ''}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
