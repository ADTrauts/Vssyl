'use client';

import React from 'react';

// ============================================================================
// WIDGET TYPES
// ============================================================================

export interface WidgetProps {
  businessId: string;
  userId?: string;
  settings?: Record<string, unknown>;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

export interface WidgetRegistration {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<WidgetProps>;
  defaultSettings?: Record<string, unknown>;
  requiredPermissions?: string[];
}

// ============================================================================
// WIDGET REGISTRY
// ============================================================================

class WidgetRegistryClass {
  private widgets: Map<string, WidgetRegistration> = new Map();

  /**
   * Register a new widget type
   */
  register(registration: WidgetRegistration) {
    if (this.widgets.has(registration.id)) {
      console.warn(`Widget ${registration.id} is already registered. Overwriting...`);
    }
    this.widgets.set(registration.id, registration);
  }

  /**
   * Get a widget registration by ID
   */
  get(widgetType: string): WidgetRegistration | undefined {
    return this.widgets.get(widgetType);
  }

  /**
   * Get all registered widgets
   */
  getAll(): WidgetRegistration[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Check if a widget type is registered
   */
  has(widgetType: string): boolean {
    return this.widgets.has(widgetType);
  }

  /**
   * Render a widget by type
   */
  render(widgetType: string, props: WidgetProps): React.ReactNode {
    const registration = this.get(widgetType);
    
    if (!registration) {
      console.error(`Widget type "${widgetType}" is not registered`);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">Unknown Widget Type</p>
          <p className="text-sm text-red-600 mt-1">
            Widget type "{widgetType}" is not registered in the system.
          </p>
        </div>
      );
    }

    const WidgetComponent = registration.component;
    const settings = { ...registration.defaultSettings, ...props.settings };

    return <WidgetComponent {...props} settings={settings} />;
  }
}

// Export singleton instance
export const WidgetRegistry = new WidgetRegistryClass();

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Widget Container - Standard wrapper for all widgets
 */
interface WidgetContainerProps {
  title: string;
  icon?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  theme?: {
    primaryColor?: string;
    borderRadius?: string;
    cardStyle?: 'flat' | 'shadow' | 'bordered';
  };
}

export function WidgetContainer({
  title,
  icon,
  description,
  children,
  actions,
  className = '',
  theme,
}: WidgetContainerProps) {
  const getCardClass = () => {
    const base = 'bg-white overflow-hidden';
    if (theme?.cardStyle === 'shadow') return `${base} shadow-lg`;
    if (theme?.cardStyle === 'bordered') return `${base} border-2 border-gray-200`;
    return `${base} shadow-md`;
  };

  return (
    <div
      className={`${getCardClass()} ${className}`}
      style={{ borderRadius: theme?.borderRadius || '0.5rem' }}
    >
      {/* Widget Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: theme?.primaryColor || '#1F2937' }}
              >
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>

      {/* Widget Body */}
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * Widget Loading State
 */
export function WidgetLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Widget Error State
 */
export function WidgetError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
        <span className="text-red-600 text-xl">⚠️</span>
      </div>
      <p className="text-sm text-red-600 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Widget Empty State
 */
export function WidgetEmpty({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// ============================================================================
// WIDGET RENDERER COMPONENT
// ============================================================================

interface WidgetRendererProps extends WidgetProps {
  widgetType: string;
  className?: string;
}

export function WidgetRenderer({
  widgetType,
  businessId,
  userId,
  settings,
  theme,
  className = '',
}: WidgetRendererProps) {
  return (
    <div className={className}>
      {WidgetRegistry.render(widgetType, { businessId, userId, settings, theme })}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetRegistry;

