'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getBusinessProfile } from '@/api/placeListing';
import type { PlaceListingWithBusiness } from '@/api/placeListing';
import { trackClick } from '@/api/placeTransaction';
import { usePlace } from '../../contexts/PlaceContext';
import { Spinner } from 'shared/components';
import { X, ExternalLink, ShieldCheck, MapPin, Users, Plus, Check, Eye, EyeOff } from 'lucide-react';

interface BusinessProfilePanelProps {
  businessId: string;
  onClose: () => void;
}

export default function BusinessProfilePanel({ businessId, onClose }: BusinessProfilePanelProps) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const { place, addNode, removeNode } = usePlace();

  const [profile, setProfile] = useState<PlaceListingWithBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [followVisible, setFollowVisible] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  const isFollowing = place?.nodes.some(n => n.nodeType === 'BUSINESS' && n.entityId === businessId);
  const existingNode = place?.nodes.find(n => n.nodeType === 'BUSINESS' && n.entityId === businessId);

  useEffect(() => {
    if (!token || !businessId) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessProfile(businessId, token!);
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError('Could not load this business');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [businessId, token]);

  // Fetch follow visibility when following changes
  useEffect(() => {
    if (!token || !isFollowing) return;
    fetch(`/api/place/follow-visibility/${businessId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.success && data.data) setFollowVisible(data.data.isVisible); })
      .catch(() => {});
  }, [token, businessId, isFollowing]);

  const handleToggleVisibility = async () => {
    if (!token) return;
    setVisibilityLoading(true);
    try {
      const res = await fetch(`/api/place/follow-visibility/${businessId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !followVisible }),
      });
      const data = await res.json();
      if (data.success) setFollowVisible(data.data.isVisible);
    } catch {
      // Silently fail
    }
    setVisibilityLoading(false);
  };

  const handleFollow = async () => {
    setActionLoading(true);
    await addNode('BUSINESS', businessId, profile?.displayName || profile?.business.name);
    setActionLoading(false);
  };

  const handleUnfollow = async () => {
    if (!existingNode) return;
    setActionLoading(true);
    await removeNode(existingNode.id);
    setActionLoading(false);
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Profile</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 transition-colors">
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size={32} />
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
          </div>
        )}

        {!loading && !error && !profile && (
          <div className="p-6 text-center text-gray-700 dark:text-gray-300">
            <p>This business has not set up their Place listing yet.</p>
          </div>
        )}

        {profile && (
          <div className="p-5 space-y-5">
            {/* Cover image (Place listing hero) */}
            {profile.coverImage && (
              <div className="-mx-5 -mt-5 mb-2">
                <img
                  src={profile.coverImage}
                  alt=""
                  className="w-full h-32 object-cover border-b border-gray-100"
                />
              </div>
            )}
            {/* Logo / name — thumbnail uses avatar, then cover, then business logo */}
            <div className="flex items-start gap-4">
              {(profile.avatarImage ?? profile.coverImage ?? profile.business.logo) ? (
                <img src={profile.avatarImage ?? profile.coverImage ?? profile.business.logo ?? ''} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-slate-700 ring-2 ring-white shadow" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                  {(profile.displayName || profile.business.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{profile.displayName || profile.business.name}</h3>
                  {profile.business.einVerified && (
                    <span title="Verified business"><ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" /></span>
                  )}
                </div>
                {profile.shortDescription && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{profile.shortDescription}</p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
              {profile.business.industry && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.business.industry}
                </span>
              )}
              {profile.followerCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {profile.followerCount} {profile.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              )}
            </div>

            {/* Category badge */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
                {profile.category.replace('_', ' ')}
              </span>
              {profile.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{tag}</span>
              ))}
            </div>

            {/* Follow / unfollow */}
            <button
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {actionLoading ? (
                <Spinner size={16} />
              ) : isFollowing ? (
                <><Check className="w-4 h-4" /> On Your Main Street</>
              ) : (
                <><Plus className="w-4 h-4" /> Add to My Main Street</>
              )}
            </button>

            {/* Per-business follow visibility toggle */}
            {isFollowing && (
              <button
                onClick={handleToggleVisibility}
                disabled={visibilityLoading}
                className="w-full py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                {followVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {followVisible ? 'Follow visible to others' : 'Follow hidden from others'}
                <span className="text-gray-600 dark:text-gray-400">— tap to toggle</span>
              </button>
            )}

            {/* Interaction Links */}
            {profile.interactionLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Interact</h4>
                {profile.interactionLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    onClick={() => {
                      if (token) {
                        trackClick({
                          businessId,
                          interactionLinkId: link.id,
                          externalService: link.type,
                          url: link.url,
                        }, token);
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{link.label}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{link.type.replace('_', ' ')}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Business description */}
            {profile.business.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">About</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.business.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
