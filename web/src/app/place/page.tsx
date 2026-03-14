'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Compass, Users, Settings, Receipt, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePlace } from '../../contexts/PlaceContext';
import PlaceGraph from '../../components/place/PlaceGraph';
import PlaceExplore from '../../components/place/PlaceExplore';
import PlaceOnboarding from '../../components/place/PlaceOnboarding';
import PlaceMeetings from '../../components/place/PlaceMeetings';
import PlaceActivityFeed from '../../components/place/PlaceActivityFeed';
import PlaceAnalyticsDashboard from '../../components/place/PlaceAnalyticsDashboard';
import PlacePrivacySettings from '../../components/place/PlacePrivacySettings';

const PLACE_TABS = ['my-place', 'explore', 'meetings', 'feed', 'analytics'] as const;

export default function PlacePage() {
  const searchParams = useSearchParams();
  const { place, loading, activeTab, setActiveTab } = usePlace();
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Deep link: sync tab and highlight from URL on load
  useEffect(() => {
    if (!searchParams) return;
    const tab = searchParams.get('tab');
    if (tab && (PLACE_TABS as readonly string[]).includes(tab)) {
      setActiveTab(tab as (typeof PLACE_TABS)[number]);
    }
  }, [searchParams, setActiveTab]);

  const highlightBusinessId = searchParams?.get('highlight') ?? undefined;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 64px)',
        marginTop: 64,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #E5E7EB',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6B7280', fontSize: 14 }}>Loading your neighborhood...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show onboarding if Place isn't set up yet
  if (place && !place.isSetupComplete) {
    return (
      <div style={{ marginTop: 64, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        <PlaceOnboarding />
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 64,
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#FAFBFC',
    }}>
      {/* Sub-tab navigation */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '0 24px',
          borderBottom: '1px solid #E5E7EB',
          background: '#fff',
          flexShrink: 0,
        }}
        role="tablist"
        aria-label="Place navigation"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'my-place'}
          onClick={() => setActiveTab('my-place')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'my-place' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'my-place' ? '2px solid #4F46E5' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <MapPin size={18} />
          My Place
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'explore'}
          onClick={() => setActiveTab('explore')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'explore' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'explore' ? '2px solid #4F46E5' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <Compass size={18} />
          Explore
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'meetings'}
          onClick={() => setActiveTab('meetings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'meetings' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'meetings' ? '2px solid #4F46E5' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <Users size={18} />
          Meetings
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'feed'}
          onClick={() => setActiveTab('feed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'feed' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'feed' ? '2px solid #4F46E5' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <Zap size={18} />
          Feed
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'analytics' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'analytics' ? '2px solid #4F46E5' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          <BarChart3 size={18} />
          Insights
        </button>

        {/* Right-side actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 4 }}>
          <Link
            href="/place/transactions"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13, color: '#374151', borderRadius: 8, textDecoration: 'none' }}
            className="hover:bg-gray-100 transition-colors"
          >
            <Receipt size={16} />
            History
          </Link>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13, color: '#374151', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
            className="hover:bg-gray-100 transition-colors"
          >
            <Settings size={16} />
            Privacy
          </button>
        </div>
      </nav>

      {/* Tab content */}
      <div
        role="tabpanel"
        style={{ flex: 1, overflow: activeTab === 'my-place' ? 'hidden' : 'auto' }}
        aria-label={
          activeTab === 'my-place' ? 'My Place neighborhood view' :
          activeTab === 'explore' ? 'Explore businesses' :
          activeTab === 'meetings' ? 'Meeting places' :
          activeTab === 'feed' ? 'Activity feed' : 'Analytics insights'
        }
      >
        {activeTab === 'my-place' && <PlaceGraph highlightBusinessId={highlightBusinessId} />}
        {activeTab === 'explore' && <PlaceExplore />}
        {activeTab === 'meetings' && <PlaceMeetings />}
        {activeTab === 'feed' && <PlaceActivityFeed />}
        {activeTab === 'analytics' && <PlaceAnalyticsDashboard />}
      </div>

      {showPrivacy && <PlacePrivacySettings onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}
