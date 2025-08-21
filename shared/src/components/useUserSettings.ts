import { useState, useEffect, useCallback } from 'react';

export function useUserSettings(token: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    setLoading(true);
    fetch('/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, [token]);

  // Update a setting
  const updateSetting = useCallback((key: string, value: string) => {
    return fetch('/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    })
      .then(res => res.json())
      .then(() => setSettings(s => ({ ...s, [key]: value })));
  }, [token]);

  // Delete a setting
  const deleteSetting = useCallback((key: string) => {
    return fetch(`/settings/${key}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setSettings(s => {
        const copy = { ...s };
        delete copy[key];
        return copy;
      }));
  }, [token]);

  return { settings, loading, error, updateSetting, deleteSetting };
} 