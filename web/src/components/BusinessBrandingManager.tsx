'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Palette, Upload, Save, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Alert, Spinner } from 'shared/components';
import { updateBusiness } from '../api/business';

interface BusinessBranding {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

interface BusinessBrandingManagerProps {
  businessId: string;
  currentBranding?: BusinessBranding;
  onBrandingUpdate?: (branding: BusinessBranding) => void;
}

export default function BusinessBrandingManager({ 
  businessId, 
  currentBranding,
  onBrandingUpdate 
}: BusinessBrandingManagerProps) {
  const { data: session } = useSession();
  const [branding, setBranding] = useState<BusinessBranding>({
    id: businessId,
    name: currentBranding?.name || '',
    logo: currentBranding?.logo || '',
    primaryColor: currentBranding?.primaryColor || '#3b82f6',
    secondaryColor: currentBranding?.secondaryColor || '#1e40af',
    accentColor: currentBranding?.accentColor || '#f59e0b',
    fontFamily: currentBranding?.fontFamily || '',
    customCSS: currentBranding?.customCSS || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (field: keyof BusinessBranding, value: string) => {
    setBranding(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would upload to a file service
      // For now, we'll create a mock URL
      const mockLogoUrl = URL.createObjectURL(file);
      
      setBranding(prev => ({
        ...prev,
        logo: mockLogoUrl
      }));
    } catch (err) {
      setError('Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }

      const response = await updateBusiness(businessId, {
        branding: branding
      }, session.accessToken);

      if (response.success) {
        setSuccess('Branding updated successfully');
        onBrandingUpdate?.(branding);
      } else {
        throw new Error('Failed to update branding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBranding({
      id: businessId,
      name: currentBranding?.name || '',
      logo: currentBranding?.logo || '',
      primaryColor: currentBranding?.primaryColor || '#3b82f6',
      secondaryColor: currentBranding?.secondaryColor || '#1e40af',
      accentColor: currentBranding?.accentColor || '#f59e0b',
      fontFamily: currentBranding?.fontFamily || '',
      customCSS: currentBranding?.customCSS || '',
    });
    setError(null);
    setSuccess(null);
  };

  const getPreviewStyles = () => {
    return {
      '--business-primary-color': branding.primaryColor,
      '--business-secondary-color': branding.secondaryColor,
      '--business-accent-color': branding.accentColor,
      '--business-font-family': branding.fontFamily || 'inherit',
    } as React.CSSProperties;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Branding</h2>
          <p className="text-gray-600 mt-1">
            Customize the appearance of your business workspace
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert type="success" title="Success">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Configuration */}
        <div className="space-y-6">
          {/* Logo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
            <div className="space-y-4">
              {branding.logo && (
                <div className="flex items-center space-x-4">
                  <img 
                    src={branding.logo} 
                    alt="Business logo" 
                    className="h-16 w-16 object-contain border border-gray-200 rounded"
                  />
                  <Button
                    onClick={() => setBranding(prev => ({ ...prev, logo: '' }))}
                    variant="secondary"
                  >
                    Remove Logo
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Upload Logo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={branding.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    placeholder="#f59e0b"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={branding.fontFamily}
                onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Default (System)</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
          </Card>

          {/* Custom CSS */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Styles
              </label>
              <textarea
                value={branding.customCSS}
                onChange={(e) => handleColorChange('customCSS', e.target.value)}
                placeholder="/* Add custom CSS here */"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use CSS variables like --business-primary-color in your custom styles
              </p>
            </div>
          </Card>
        </div>

        {/* Preview */}
        {previewMode && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div style={getPreviewStyles()} className="space-y-4">
                {/* Preview Header */}
                <div 
                  className="px-4 py-3 rounded-t-lg"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  <div className="flex items-center space-x-3">
                    {branding.logo && (
                      <img 
                        src={branding.logo} 
                        alt="Logo" 
                        className="h-6 w-auto"
                      />
                    )}
                    <h3 
                      className="font-semibold"
                      style={{ color: '#ffffff' }}
                    >
                      {branding.name || 'Business Name'}
                    </h3>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-4 space-y-4">
                  <div className="flex space-x-3">
                    <button
                      className="px-4 py-2 rounded-md font-medium text-white"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-md font-medium text-white"
                      style={{ backgroundColor: branding.secondaryColor }}
                    >
                      Secondary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-md font-medium border"
                      style={{ 
                        color: branding.primaryColor,
                        borderColor: branding.primaryColor
                      }}
                    >
                      Outline Button
                    </button>
                  </div>

                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      borderColor: branding.secondaryColor,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: branding.primaryColor }}
                    >
                      Sample Card
                    </h4>
                    <p className="text-gray-600 text-sm">
                      This is how your branded components will look with the selected colors and styling.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: branding.accentColor }}
                    />
                    <span className="text-sm text-gray-600">
                      Accent color indicator
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          onClick={handleReset}
          variant="secondary"
          disabled={loading}
        >
          Reset to Default
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? <Spinner size={16} /> : <Save className="w-4 h-4" />}
            <span>Save Branding</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 