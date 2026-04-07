'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card } from 'shared/components';
import { getLocationPrivacy, updateLocationPrivacy } from '@/api/placeMeeting';
import type { LocationPrivacy } from '@/api/placeMeeting';
import { Shield, MapPin, Users } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PlacePrivacySettings({ onClose }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [privacy, setPrivacy] = useState<LocationPrivacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrivacy = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getLocationPrivacy(token);
      setPrivacy(data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchPrivacy(); }, [fetchPrivacy]);

  const handleToggle = async (field: keyof LocationPrivacy, value: boolean) => {
    if (!token || !privacy) return;
    setSaving(true);
    try {
      const updated = await updateLocationPrivacy({ [field]: value }, token);
      setPrivacy(updated);
    } catch { /* */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6" onClick={e => e.stopPropagation()}>
          <Spinner size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Place Privacy</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Control your location and meeting visibility</p>
            </div>
          </div>

          {privacy && (
            <div className="space-y-4">
              <Card>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Share Location with Connections</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Show approximate area to people you&apos;re connected with</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('shareLocationWithConnections', !privacy.shareLocationWithConnections)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      privacy.shareLocationWithConnections ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    aria-label="Toggle location sharing"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        privacy.shareLocationWithConnections ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </Card>

              <Card>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Show on Meeting Places</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Visible to others when viewing shared meeting places</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('showOnMeetingPlaces', !privacy.showOnMeetingPlaces)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      privacy.showOnMeetingPlaces ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    aria-label="Toggle meeting place visibility"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        privacy.showOnMeetingPlaces ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
