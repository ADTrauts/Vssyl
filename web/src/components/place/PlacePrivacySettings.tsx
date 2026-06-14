'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card } from 'shared/components';
import { getLocationPrivacy, updateLocationPrivacy } from '@/api/placeMeeting';
import type { LocationPrivacy } from '@/api/placeMeeting';
import { Shield, MapPin, Users, X } from 'lucide-react';
import { placeActionError } from './placeUxFeedback';

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
    } catch (error: unknown) {
      placeActionError('Could not load privacy settings', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPrivacy(); }, [fetchPrivacy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleToggle = async (field: keyof LocationPrivacy, value: boolean) => {
    if (!token || !privacy) return;
    setSaving(true);
    try {
      const updated = await updateLocationPrivacy({ [field]: value }, token);
      setPrivacy(updated);
    } catch (error: unknown) {
      placeActionError('Could not save privacy setting', error);
    } finally {
      setSaving(false);
    }
  };

  const overlay = (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      aria-label="Close privacy settings"
      onClick={onClose}
    />
  );

  if (loading) {
    return (
      <>
        {overlay}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="place-privacy-title"
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div
            className="pointer-events-auto rounded-xl bg-white p-6 dark:bg-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <Spinner size={24} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {overlay}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-privacy-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900"
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 id="place-privacy-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Place Privacy
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Control your location and meeting visibility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                aria-label="Close privacy settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {privacy && (
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Share Location with Connections
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Show approximate area to people you&apos;re connected with
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('shareLocationWithConnections', !privacy.shareLocationWithConnections)}
                      disabled={saving}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        privacy.shareLocationWithConnections ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                      aria-label="Toggle location sharing"
                      aria-pressed={privacy.shareLocationWithConnections}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          privacy.shareLocationWithConnections ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Show on Meeting Places
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Visible to others when viewing shared meeting places
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('showOnMeetingPlaces', !privacy.showOnMeetingPlaces)}
                      disabled={saving}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        privacy.showOnMeetingPlaces ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                      aria-label="Toggle meeting place visibility"
                      aria-pressed={privacy.showOnMeetingPlaces}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
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
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
