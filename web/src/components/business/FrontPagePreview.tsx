'use client';

import React from 'react';
import { Card } from 'shared/components';
import { Eye, Smartphone, Monitor, Tablet } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Widget {
  id: string;
  widgetType: string;
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  order: number;
}

interface ThemeConfig {
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

interface FrontPagePreviewProps {
  widgets: Widget[];
  theme: ThemeConfig;
  welcomeMessage?: string;
  heroImage?: string;
  className?: string;
}

// ============================================================================
// WIDGET PREVIEW
// ============================================================================

function WidgetPreview({ widget, theme }: { widget: Widget; theme: ThemeConfig }) {
  const getWidgetIcon = (type: string) => {
    const icons: Record<string, string> = {
      'ai-assistant': '🤖',
      'company-stats': '📊',
      'personal-stats': '👤',
      'announcements': '📢',
      'quick-actions': '⚡',
      'recent-activity': '📋',
      'upcoming-events': '📅',
      'team-highlights': '⭐',
      'metrics': '📈',
      'tasks': '✓',
    };
    return icons[type] || '📦';
  };

  const getSizeClass = () => {
    const width = widget.position.width;
    if (width <= 4) return 'col-span-1';
    if (width <= 8) return 'col-span-2';
    return 'col-span-3';
  };

  const getCardClass = () => {
    const base = 'p-4 bg-white';
    if (theme.cardStyle === 'shadow') return `${base} shadow-md`;
    if (theme.cardStyle === 'bordered') return `${base} border-2 border-gray-200`;
    return base;
  };

  return (
    <div className={getSizeClass()}>
      <div
        className={getCardClass()}
        style={{
          borderRadius: theme.borderRadius || '0.5rem',
          color: theme.textColor || '#1F2937',
        }}
      >
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">{getWidgetIcon(widget.widgetType)}</span>
          <h4
            className="font-semibold"
            style={{ fontFamily: theme.headingFont || 'Inter' }}
          >
            {widget.title}
          </h4>
        </div>
        {widget.description && (
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: theme.bodyFont || 'Inter' }}
          >
            {widget.description}
          </p>
        )}
        <div className="mt-3 h-20 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-xs text-gray-500">Widget Content</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FrontPagePreview({
  widgets,
  theme,
  welcomeMessage,
  heroImage,
  className = '',
}: FrontPagePreviewProps) {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  const getContainerClass = () => {
    if (viewMode === 'mobile') return 'max-w-sm mx-auto';
    if (viewMode === 'tablet') return 'max-w-3xl mx-auto';
    return 'w-full';
  };

  const getSpacingClass = () => {
    if (theme.spacing === 'compact') return 'space-y-3 p-3';
    if (theme.spacing === 'spacious') return 'space-y-8 p-8';
    return 'space-y-6 p-6';
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            <p className="text-sm text-gray-600">See how your front page will look</p>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'desktop'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'tablet'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'mobile'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="bg-gray-100 rounded-lg p-6 min-h-[600px] overflow-auto">
        <div className={getContainerClass()}>
          <div
            style={{
              backgroundColor: theme.backgroundColor || '#FFFFFF',
              color: theme.textColor || '#1F2937',
            }}
            className="rounded-lg shadow-xl min-h-[500px]"
          >
            {/* Hero Section */}
            {heroImage && (
              <div
                className="h-48 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${heroImage})`,
                  borderTopLeftRadius: theme.borderRadius || '0.5rem',
                  borderTopRightRadius: theme.borderRadius || '0.5rem',
                }}
              />
            )}

            {/* Welcome Message */}
            {welcomeMessage && (
              <div
                className={getSpacingClass()}
                style={{
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{
                    fontFamily: theme.headingFont || 'Inter',
                    color: theme.primaryColor || '#3B82F6',
                  }}
                >
                  Welcome Back!
                </h2>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: theme.bodyFont || 'Inter' }}
                >
                  {welcomeMessage}
                </p>
              </div>
            )}

            {/* Widgets Grid */}
            <div className={getSpacingClass()}>
              {visibleWidgets.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {visibleWidgets.map((widget) => (
                    <WidgetPreview key={widget.id} widget={widget} theme={theme} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No visible widgets</p>
                  <p className="text-sm text-gray-400">Add and enable widgets to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This is a simplified preview. The actual front page will include
          real data, interactive elements, and full functionality.
        </p>
      </div>
    </div>
  );
}

