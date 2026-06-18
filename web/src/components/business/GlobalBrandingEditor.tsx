'use client';

import React from 'react';
import { Card, Button, Input } from 'shared/components';
import { useConfirm } from 'shared/hooks/useConfirm';
import { Palette, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface GlobalBranding {
  logo?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

interface GlobalBrandingEditorProps {
  branding: GlobalBranding;
  onChange: (branding: GlobalBranding) => void;
  className?: string;
}

// ============================================================================
// PRESET COLORS
// ============================================================================

const COLOR_PRESETS = {
  professional: {
    primaryColor: '#1E40AF',
    secondaryColor: '#64748B',
    accentColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
  },
  vibrant: {
    primaryColor: '#EC4899',
    secondaryColor: '#F59E0B',
    accentColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  modern: {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  elegant: {
    primaryColor: '#000000',
    secondaryColor: '#4B5563',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
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
      <label className="block text-sm font-medium text-v-text-secondary mb-1">{label}</label>
      {description && <p className="text-xs text-v-text-muted mb-2">{description}</p>}
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded border border-v-border cursor-pointer"
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

export default function GlobalBrandingEditor({
  branding,
  onChange,
  className = '',
}: GlobalBrandingEditorProps) {
  const { confirm, ConfirmDialog } = useConfirm();

  const handleApplyPreset = async (presetName: keyof typeof COLOR_PRESETS) => {
    const ok = await confirm({
      title: `Apply "${presetName}" preset?`,
      description: 'This will override your current color settings.',
      variant: 'standard',
      confirmLabel: 'Apply',
    });
    if (ok) {
      onChange({ ...branding, ...COLOR_PRESETS[presetName] });
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset branding to defaults?',
      description: 'This will remove all custom branding settings.',
      variant: 'destructive',
      confirmLabel: 'Reset',
    });
    if (ok) {
      onChange({
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        accentColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
      });
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-v-text-primary">Global Business Branding</h3>
          <p className="text-sm text-v-text-secondary mt-1">
            These settings apply across your entire business workspace - front page, dashboards, emails, and reports
          </p>
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

      <div className="space-y-6">
        {/* Logo Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-v-text-primary">Company Logo</h4>
              <p className="text-sm text-v-text-secondary">Your logo appears throughout the platform</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-v-text-secondary mb-2">Logo URL</label>
              <Input
                type="url"
                value={branding.logoUrl || branding.logo || ''}
                onChange={(e) => onChange({ ...branding, logoUrl: e.target.value, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {(branding.logoUrl || branding.logo) && (
              <div>
                <label className="block text-sm font-medium text-v-text-secondary mb-2">Preview</label>
                <div className="p-4 bg-v-background rounded-lg border border-v-border">
                  <img
                    src={branding.logoUrl || branding.logo}
                    alt="Company Logo"
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Color Presets */}
        <Card className="p-6">
          <h4 className="font-semibold text-v-text-primary mb-3">Quick Color Presets</h4>
          <p className="text-sm text-v-text-secondary mb-4">Choose a preset to quickly apply a coordinated color scheme</p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(COLOR_PRESETS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => handleApplyPreset(name as keyof typeof COLOR_PRESETS)}
                className="p-3 border-2 border-v-border rounded-lg hover:border-blue-400 transition-colors text-left"
              >
                <div className="flex space-x-1 mb-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primaryColor }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondaryColor }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accentColor }} />
                </div>
                <p className="text-xs font-medium text-v-text-primary capitalize">{name}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Brand Colors */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-v-text-primary">Brand Colors</h4>
              <p className="text-sm text-v-text-secondary">Define your company's color palette</p>
            </div>
          </div>

          <div className="space-y-6">
            <ColorPicker
              label="Primary Color"
              description="Main brand color for buttons, links, and key elements"
              value={branding.primaryColor || '#3B82F6'}
              onChange={(value) => onChange({ ...branding, primaryColor: value })}
            />
            <ColorPicker
              label="Secondary Color"
              description="Supporting color for secondary elements"
              value={branding.secondaryColor || '#8B5CF6'}
              onChange={(value) => onChange({ ...branding, secondaryColor: value })}
            />
            <ColorPicker
              label="Accent Color"
              description="Highlight color for calls-to-action and important elements"
              value={branding.accentColor || '#10B981'}
              onChange={(value) => onChange({ ...branding, accentColor: value })}
            />
            <ColorPicker
              label="Background Color"
              description="Main background color for pages"
              value={branding.backgroundColor || '#FFFFFF'}
              onChange={(value) => onChange({ ...branding, backgroundColor: value })}
            />
            <ColorPicker
              label="Text Color"
              description="Primary text color"
              value={branding.textColor || '#1F2937'}
              onChange={(value) => onChange({ ...branding, textColor: value })}
            />
          </div>
        </Card>

        {/* Typography */}
        <Card className="p-6">
          <h4 className="font-semibold text-v-text-primary mb-4">Typography</h4>
          <div>
            <label className="block text-sm font-medium text-v-text-secondary mb-2">Font Family</label>
            <select
              value={branding.fontFamily || 'Inter'}
              onChange={(e) => onChange({ ...branding, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-v-border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter (Default)</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
              <option value="Raleway">Raleway</option>
              <option value="Nunito">Nunito</option>
            </select>

            {/* Font Preview */}
            <div className="mt-4 p-4 bg-v-background rounded-lg">
              <p className="text-xs text-v-text-secondary mb-2">Preview:</p>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: branding.fontFamily || 'Inter' }}
              >
                Your Business Name
              </h3>
              <p
                className="text-sm text-v-text-secondary"
                style={{ fontFamily: branding.fontFamily || 'Inter' }}
              >
                This is how your text will appear with the selected font across all business pages.
              </p>
            </div>
          </div>
        </Card>

        {/* Advanced: Custom CSS */}
        <Card className="p-6">
          <h4 className="font-semibold text-v-text-primary mb-2">Advanced: Custom CSS</h4>
          <p className="text-sm text-v-text-secondary mb-4">
            Add custom CSS for advanced styling (optional - for developers only)
          </p>
          <textarea
            value={branding.customCSS || ''}
            onChange={(e) => onChange({ ...branding, customCSS: e.target.value })}
            placeholder="/* Custom CSS here */"
            rows={6}
            className="w-full px-3 py-2 border border-v-border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
          />
        </Card>

        {/* Live Preview */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <h4 className="font-semibold text-v-text-primary mb-4">Live Preview</h4>
          <div
            className="p-6 rounded-lg shadow-lg"
            style={{
              backgroundColor: branding.backgroundColor || '#FFFFFF',
              color: branding.textColor || '#1F2937',
              fontFamily: branding.fontFamily || 'Inter',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: branding.primaryColor || '#3B82F6' }}
            >
              Welcome to Your Business
            </h2>
            <p className="mb-4">
              This is a preview of how your branding will look across the platform.
            </p>
            <div className="flex space-x-3">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: branding.primaryColor || '#3B82F6' }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: branding.secondaryColor || '#8B5CF6' }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: branding.accentColor || '#10B981' }}
              >
                Accent Button
              </button>
            </div>
          </div>
        </Card>
      </div>
      <ConfirmDialog />
    </div>
  );
}

