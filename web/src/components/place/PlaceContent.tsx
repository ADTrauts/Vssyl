'use client';

import React, { useState } from 'react';
import { MapPin, Compass, Users, Settings, Receipt, Zap, BarChart3 } from 'lucide-react';
import { PlaceProvider, usePlace } from '../../contexts/PlaceContext';
import PlaceGraph from './PlaceGraph';
import PlaceExplore from './PlaceExplore';
import PlaceOnboarding from './PlaceOnboarding';
import PlaceMeetings from './PlaceMeetings';
import PlaceActivityFeed from './PlaceActivityFeed';
import PlaceAnalyticsDashboard from './PlaceAnalyticsDashboard';
import PlacePrivacySettings from './PlacePrivacySettings';

function PlaceContentInner() {
  const { place, loading, activeTab, setActiveTab } = usePlace();
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
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

  if (place && !place.isSetupComplete) {
    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        <PlaceOnboarding />
      </div>
    );
  }

  const tabButton = (id: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
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
        color: activeTab === id ? '#4F46E5' : '#6B7280',
        borderBottom: activeTab === id ? '2px solid #4F46E5' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#FAFBFC',
    }}>
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
        {tabButton('my-place', <MapPin size={18} />, 'My Place')}
        {tabButton('explore', <Compass size={18} />, 'Explore')}
        {tabButton('meetings', <Users size={18} />, 'Meetings')}
        {tabButton('feed', <Zap size={18} />, 'Feed')}
        {tabButton('analytics', <BarChart3 size={18} />, 'Insights')}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 4 }}>
          <button
            onClick={() => setActiveTab('my-place')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13, color: '#374151', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
          >
            <Receipt size={16} />
            History
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13, color: '#374151', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
          >
            <Settings size={16} />
            Privacy
          </button>
        </div>
      </nav>

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
        {activeTab === 'my-place' && <PlaceGraph />}
        {activeTab === 'explore' && <PlaceExplore />}
        {activeTab === 'meetings' && <PlaceMeetings />}
        {activeTab === 'feed' && <PlaceActivityFeed />}
        {activeTab === 'analytics' && <PlaceAnalyticsDashboard />}
      </div>

      {showPrivacy && <PlacePrivacySettings onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

export default function PlaceContent() {
  return (
    <PlaceProvider>
      <PlaceContentInner />
    </PlaceProvider>
  );
}
