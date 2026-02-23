'use client';

import React from 'react';
import { MapPin, Compass } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';
import PlaceGraph from '../../components/place/PlaceGraph';
import PlaceExplore from '../../components/place/PlaceExplore';
import PlaceOnboarding from '../../components/place/PlaceOnboarding';

export default function PlacePage() {
  const { place, loading, activeTab, setActiveTab } = usePlace();

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
      </nav>

      {/* Tab content */}
      <div
        role="tabpanel"
        style={{ flex: 1, overflow: 'hidden' }}
        aria-label={activeTab === 'my-place' ? 'My Place neighborhood view' : 'Explore businesses'}
      >
        {activeTab === 'my-place' ? <PlaceGraph /> : <PlaceExplore />}
      </div>
    </div>
  );
}
