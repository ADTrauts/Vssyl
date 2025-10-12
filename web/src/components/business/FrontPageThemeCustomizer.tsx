'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from 'shared/components';
import { Palette, Type, Layout, RotateCcw } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius?: string;
  spacing?: string;
  cardStyle?: 'flat' | 'shadow' | 'bordered';
}

interface FrontPageThemeCustomizerProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
  className?: string;
}

// ============================================================================
// PRESET THEMES
// ============================================================================

const PRESET_THEMES = {
  default: {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: '0.5rem',
    spacing: 'normal',
    cardStyle: 'shadow' as const,
  },
  professional: {
    primaryColor: '#1E40AF',
    secondaryColor: '#64748B',
    accentColor: '#0EA5E9',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: '0.375rem',
    spacing: 'compact',
    cardStyle: 'bordered' as const,
  },
  vibrant: {
    primaryColor: '#EC4899',
    secondaryColor: '#F59E0B',
    accentColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    borderRadius: '1rem',
    spacing: 'spacious',
    cardStyle: 'shadow' as const,
  },
  minimal: {
    primaryColor: '#000000',
    secondaryColor: '#4B5563',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: '0.25rem',
    spacing: 'compact',
    cardStyle: 'flat' as const,
  },
};

// ============================================================================
// COLOR PICKER
// ============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FrontPageThemeCustomizer({
  theme,
  onChange,
  className = '',
}: FrontPageThemeCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout'>('colors');

  const handleApplyPreset = (presetName: keyof typeof PRESET_THEMES) => {
    if (confirm(`Apply the "${presetName}" theme preset? This will override your current settings.`)) {
      onChange(PRESET_THEMES[presetName]);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default theme? This will override all your customizations.')) {
      onChange(PRESET_THEMES.default);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Theme Customization</h3>
          <p className="text-sm text-gray-600 mt-1">Customize colors, fonts, and layout styling</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleReset}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Default</span>
        </Button>
      </div>

      {/* Preset Themes */}
      <Card className="p-4 mb-6">
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Quick Presets</h4>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(PRESET_THEMES).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => handleApplyPreset(name as keyof typeof PRESET_THEMES)}
              className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-left"
            >
              <div className="flex space-x-1 mb-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primaryColor }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondaryColor }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accentColor }} />
              </div>
              <p className="text-xs font-medium text-gray-900 capitalize">{name}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'colors'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'typography'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Typography</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'layout'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Layout className="w-4 h-4" />
            <span>Layout</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <Card className="p-6 space-y-6">
            <ColorPicker
              label="Primary Color"
              description="Main brand color used for buttons and highlights"
              value={theme.primaryColor || '#3B82F6'}
              onChange={(value) => onChange({ ...theme, primaryColor: value })}
            />
            <ColorPicker
              label="Secondary Color"
              description="Supporting color for secondary elements"
              value={theme.secondaryColor || '#8B5CF6'}
              onChange={(value) => onChange({ ...theme, secondaryColor: value })}
            />
            <ColorPicker
              label="Accent Color"
              description="Accent color for calls-to-action and important elements"
              value={theme.accentColor || '#10B981'}
              onChange={(value) => onChange({ ...theme, accentColor: value })}
            />
            <ColorPicker
              label="Background Color"
              description="Main background color"
              value={theme.backgroundColor || '#FFFFFF'}
              onChange={(value) => onChange({ ...theme, backgroundColor: value })}
            />
            <ColorPicker
              label="Text Color"
              description="Primary text color"
              value={theme.textColor || '#1F2937'}
              onChange={(value) => onChange({ ...theme, textColor: value })}
            />
          </Card>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <Card className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
              <select
                value={theme.headingFont || 'Inter'}
                onChange={(e) => onChange({ ...theme, headingFont: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
              <select
                value={theme.bodyFont || 'Inter'}
                onChange={(e) => onChange({ ...theme, bodyFont: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
              </select>
            </div>

            {/* Font Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-3">Preview:</p>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: theme.headingFont || 'Inter' }}
              >
                Heading Example
              </h3>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: theme.bodyFont || 'Inter' }}
              >
                This is how your body text will look with the selected fonts.
                Make sure it's readable and matches your brand.
              </p>
            </div>
          </Card>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <Card className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <select
                value={theme.borderRadius || '0.5rem'}
                onChange={(e) => onChange({ ...theme, borderRadius: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">None (0px)</option>
                <option value="0.25rem">Small (4px)</option>
                <option value="0.375rem">Medium (6px)</option>
                <option value="0.5rem">Normal (8px)</option>
                <option value="0.75rem">Large (12px)</option>
                <option value="1rem">Extra Large (16px)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
              <select
                value={theme.spacing || 'normal'}
                onChange={(e) => onChange({ ...theme, spacing: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Style</label>
              <div className="grid grid-cols-3 gap-3">
                {['flat', 'shadow', 'bordered'].map((style) => (
                  <button
                    key={style}
                    onClick={() => onChange({ ...theme, cardStyle: style as any })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme.cardStyle === style
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 capitalize">{style}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-3">Preview:</p>
              <div
                className={`p-4 bg-white ${
                  theme.cardStyle === 'shadow'
                    ? 'shadow-lg'
                    : theme.cardStyle === 'bordered'
                    ? 'border-2 border-gray-200'
                    : ''
                }`}
                style={{ borderRadius: theme.borderRadius || '0.5rem' }}
              >
                <h4 className="font-semibold mb-2">Card Example</h4>
                <p className="text-sm text-gray-600">
                  This shows how cards will look with your selected style settings.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

