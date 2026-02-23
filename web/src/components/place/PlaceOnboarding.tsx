'use client';

import React, { useState } from 'react';
import { MapPin, Compass, ShoppingBag, Utensils, Globe, Truck, Heart, ArrowRight, Check } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';

type Step = 'welcome' | 'interests' | 'complete';

const INTEREST_OPTIONS = [
  { id: 'restaurants', label: 'Restaurants & Dining', icon: Utensils, color: '#E53935' },
  { id: 'retail', label: 'Retail & Shopping', icon: ShoppingBag, color: '#1E88E5' },
  { id: 'grocery', label: 'Grocery & Markets', icon: ShoppingBag, color: '#43A047' },
  { id: 'digital_services', label: 'Digital Services', icon: Globe, color: '#8E24AA' },
  { id: 'delivery', label: 'Delivery & Takeout', icon: Truck, color: '#FB8C00' },
  { id: 'local_services', label: 'Local Services', icon: MapPin, color: '#00ACC1' },
  { id: 'health_wellness', label: 'Health & Wellness', icon: Heart, color: '#EC407A' },
  { id: 'entertainment', label: 'Entertainment', icon: Compass, color: '#7E57C2' },
];

export default function PlaceOnboarding() {
  const { setInterests, completeSetup } = usePlace();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    if (selectedInterests.length > 0) {
      await setInterests(selectedInterests);
    }
    await completeSetup();
    setIsSubmitting(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: 32,
      background: 'linear-gradient(135deg, #F0F4FF 0%, #FAFBFC 50%, #F5F0FF 100%)',
    }}>
      <div style={{
        maxWidth: 600,
        width: '100%',
        background: '#fff',
        borderRadius: 20,
        padding: 48,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {(['welcome', 'interests', 'complete'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                width: step === s ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background: step === s ? '#4F46E5' :
                  (['welcome', 'interests', 'complete'].indexOf(step) > i ? '#A5B4FC' : '#E5E7EB'),
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Welcome step */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏘️</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              Welcome to Your Place
            </h1>
            <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
              Build your personal Main Street — a neighborhood of physical and digital businesses you love.
              Follow local restaurants, shops, online stores, and services all in one beautiful, connected view.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, textAlign: 'left' }}>
              {[
                { icon: MapPin, text: 'Discover local businesses near you' },
                { icon: Compass, text: 'Explore and follow shops, restaurants, and services' },
                { icon: ShoppingBag, text: 'Interact directly — order food, buy items, make reservations' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {React.createElement(item.icon, { size: 20, color: '#4F46E5' })}
                  </div>
                  <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('interests')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 32px',
                background: '#4F46E5',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#4338CA'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#4F46E5'; }}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Interests step */}
        {step === 'interests' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              What interests you?
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, textAlign: 'center' }}>
              Select categories to personalize your neighborhood. You can change these anytime.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 32,
            }}>
              {INTEREST_OPTIONS.map(opt => {
                const selected = selectedInterests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleInterest(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: selected ? `${opt.color}10` : '#fff',
                      border: `2px solid ${selected ? opt.color : '#E5E7EB'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    aria-pressed={selected}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: selected ? `${opt.color}20` : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {React.createElement(opt.icon, { size: 18, color: selected ? opt.color : '#9CA3AF' })}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? '#111827' : '#6B7280' }}>
                      {opt.label}
                    </span>
                    {selected && (
                      <Check size={16} color={opt.color} style={{ marginLeft: 'auto' }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep('welcome')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep('complete')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  background: '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Complete step */}
        {step === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              You&apos;re All Set!
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
              Your neighborhood is ready. Start by exploring businesses near you and adding them to your personal Main Street.
            </p>

            {selectedInterests.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Your interests:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                  {selectedInterests.map(id => {
                    const opt = INTEREST_OPTIONS.find(o => o.id === id);
                    return opt ? (
                      <span key={id} style={{
                        padding: '4px 12px',
                        background: `${opt.color}15`,
                        color: opt.color,
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {opt.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setStep('interests')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 32px',
                  background: isSubmitting ? '#A5B4FC' : '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Setting up...' : 'Enter Your Neighborhood'}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
