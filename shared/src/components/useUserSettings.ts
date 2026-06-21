import { useState, useEffect, useCallback } from 'react';

export function useUserSettings(token: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, [token]);

  const updateSetting = useCallback(
    (key: string, value: string) => {
      return fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      })
        .then((res) => res.json())
        .then((data) => {
          const next = data.settings ?? { ...settings, [key]: value };
          setSettings(next);
          return next;
        });
    },
    [token, settings]
  );

  const deleteSetting = useCallback(
    (key: string) => {
      return fetch(`/api/settings/preferences/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(() =>
        setSettings((s) => {
          const copy = { ...s };
          delete copy[key];
          return copy;
        })
      );
    },
    [token]
  );

  return { settings, loading, error, updateSetting, deleteSetting };
}
