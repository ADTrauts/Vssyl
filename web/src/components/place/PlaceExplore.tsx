'use client';

import React from 'react';
import { Search, MapPin, Utensils, ShoppingBag, Globe, Truck } from 'lucide-react';

const CATEGORIES = [
  { id: 'restaurants', label: 'Restaurants', icon: Utensils, color: '#E53935' },
  { id: 'retail', label: 'Retail & Shops', icon: ShoppingBag, color: '#1E88E5' },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBag, color: '#43A047' },
  { id: 'digital', label: 'Digital Services', icon: Globe, color: '#8E24AA' },
  { id: 'delivery', label: 'Delivery & Food', icon: Truck, color: '#FB8C00' },
  { id: 'local', label: 'Local Services', icon: MapPin, color: '#00ACC1' },
];

export default function PlaceExplore() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      {/* Search bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        background: '#fff',
        border: '2px solid #E5E7EB',
        borderRadius: 12,
        marginBottom: 32,
      }}>
        <Search size={20} color="#9CA3AF" />
        <input
          type="text"
          placeholder="Search businesses, restaurants, services..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 16,
            color: '#111827',
            background: 'transparent',
          }}
          aria-label="Search businesses"
        />
      </div>

      {/* Category grid */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
        Browse Categories
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 24,
              background: '#fff',
              border: '2px solid #E5E7EB',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = cat.color;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${cat.color}20`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
            aria-label={`Browse ${cat.label}`}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${cat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {React.createElement(cat.icon, { size: 24, color: cat.color })}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Local suggestions placeholder */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
        <MapPin size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
        Near You
      </h2>
      <div style={{
        padding: 40,
        background: '#F9FAFB',
        border: '2px dashed #D1D5DB',
        borderRadius: 12,
        textAlign: 'center',
        color: '#6B7280',
      }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Local businesses will appear here
        </p>
        <p style={{ fontSize: 14 }}>
          We&apos;ll show businesses near your location to help you discover your local community.
        </p>
      </div>
    </div>
  );
}
