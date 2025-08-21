'use client';

import React, { createContext, useContext, ReactNode } from 'react';

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

interface BusinessBrandingContextType {
  branding: BusinessBranding | null;
  applyBranding: (branding: BusinessBranding) => void;
  clearBranding: () => void;
  getBrandedStyles: () => React.CSSProperties;
}

const BusinessBrandingContext = createContext<BusinessBrandingContextType | undefined>(undefined);

interface BusinessBrandingProviderProps {
  children: ReactNode;
  initialBranding?: BusinessBranding | null;
}

export function BusinessBrandingProvider({ children, initialBranding }: BusinessBrandingProviderProps) {
  const [branding, setBranding] = React.useState<BusinessBranding | null>(initialBranding || null);

  const applyBranding = (newBranding: BusinessBranding) => {
    setBranding(newBranding);
    
    // Apply custom CSS if provided
    if (newBranding.customCSS) {
      const styleId = 'business-branding-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = newBranding.customCSS;
    }
  };

  const clearBranding = () => {
    setBranding(null);
    
    // Remove custom CSS
    const styleElement = document.getElementById('business-branding-css');
    if (styleElement) {
      styleElement.remove();
    }
  };

  const getBrandedStyles = (): React.CSSProperties => {
    if (!branding) return {};

    return {
      '--business-primary-color': branding.primaryColor || '#3b82f6',
      '--business-secondary-color': branding.secondaryColor || '#1e40af',
      '--business-accent-color': branding.accentColor || '#f59e0b',
      '--business-font-family': branding.fontFamily || 'inherit',
    } as React.CSSProperties;
  };

  const value: BusinessBrandingContextType = {
    branding,
    applyBranding,
    clearBranding,
    getBrandedStyles,
  };

  return (
    <BusinessBrandingContext.Provider value={value}>
      <div style={getBrandedStyles()}>
        {children}
      </div>
    </BusinessBrandingContext.Provider>
  );
}

export function useBusinessBranding() {
  const context = useContext(BusinessBrandingContext);
  if (context === undefined) {
    throw new Error('useBusinessBranding must be used within a BusinessBrandingProvider');
  }
  return context;
}

// Branded components
interface BrandedHeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function BrandedHeader({ title, subtitle, children }: BrandedHeaderProps) {
  const { branding } = useBusinessBranding();

  if (!branding) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </header>
    );
  }

  return (
    <header 
      className="px-6 py-4 border-b"
      style={{
        backgroundColor: branding.primaryColor || '#3b82f6',
        borderColor: branding.secondaryColor || '#1e40af',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {branding.logo && (
            <img 
              src={branding.logo} 
              alt={`${branding.name} logo`}
              className="h-8 w-auto"
            />
          )}
          <div>
            {title && (
              <h1 
                className="text-2xl font-bold"
                style={{ color: '#ffffff' }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p 
                className="mt-1 opacity-90"
                style={{ color: '#ffffff' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}

interface BrandedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BrandedButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled,
  className = ''
}: BrandedButtonProps) {
  const { branding } = useBusinessBranding();

  if (!branding) {
    // Fallback to default button styles
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        {children}
      </button>
    );
  }

  // Branded button styles
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const getBrandedStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: branding.primaryColor || '#3b82f6',
          color: '#ffffff',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: branding.secondaryColor || '#1e40af',
          color: '#ffffff',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: branding.primaryColor || '#3b82f6',
          border: `1px solid ${branding.primaryColor || '#3b82f6'}`,
        };
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={getBrandedStyles()}
    >
      {children}
    </button>
  );
}

interface BrandedCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function BrandedCard({ children, className = '', title }: BrandedCardProps) {
  const { branding } = useBusinessBranding();

  if (!branding) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    );
  }

  return (
    <div 
      className={`border rounded-lg shadow-sm ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderColor: branding.secondaryColor || '#1e40af',
      }}
    >
      {title && (
        <div 
          className="px-6 py-4 border-b"
          style={{
            borderColor: branding.secondaryColor || '#1e40af',
          }}
        >
          <h3 
            className="text-lg font-semibold"
            style={{ color: branding.primaryColor || '#3b82f6' }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
} 