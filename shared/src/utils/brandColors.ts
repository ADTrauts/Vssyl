/**
 * Brand Colors Utility
 * Provides consistent access to brand colors defined in theme.ts
 * and integrates with CSS variables for theme support
 */

import { COLORS } from '../styles/theme';

export { COLORS };

/**
 * Get brand color CSS variable name
 */
export const getBrandColorVar = (colorKey: keyof typeof COLORS): string => {
  const varMap: Record<keyof typeof COLORS, string> = {
    accentRed: '--accent-red',
    primaryGreen: '--primary-green',
    highlightYellow: '--highlight-yellow',
    secondaryPurple: '--secondary-purple',
    infoBlue: '--info-blue',
    neutralDark: '--neutral-dark',
    neutralMid: '--neutral-mid',
    neutralLight: '--neutral-light',
  };
  
  return `var(${varMap[colorKey]})`;
};

/**
 * Get brand color value (fallback to hex if CSS var not available)
 */
export const getBrandColor = (colorKey: keyof typeof COLORS): string => {
  if (typeof window !== 'undefined') {
    try {
      const computedValue = getComputedStyle(document.documentElement)
        .getPropertyValue(getBrandColorVar(colorKey).slice(4, -1)); // Remove 'var(' and ')'
      
      if (computedValue && computedValue.trim()) {
        return computedValue.trim();
      }
    } catch (error) {
      // Fallback if getComputedStyle fails
      console.warn(`Failed to get computed style for ${colorKey}:`, error);
    }
  }
  
  // Fallback to theme.ts values
  return COLORS[colorKey];
};

/**
 * Brand color Tailwind classes
 */
export const brandColorClasses = {
  text: {
    accentRed: 'text-brand-accent-red',
    primaryGreen: 'text-brand-primary-green',
    highlightYellow: 'text-brand-highlight-yellow',
    secondaryPurple: 'text-brand-secondary-purple',
    infoBlue: 'text-brand-info-blue',
    neutralDark: 'text-brand-neutral-dark',
    neutralMid: 'text-brand-neutral-mid',
    neutralLight: 'text-brand-neutral-light',
  },
  bg: {
    accentRed: 'bg-brand-accent-red',
    primaryGreen: 'bg-brand-primary-green',
    highlightYellow: 'bg-brand-highlight-yellow',
    secondaryPurple: 'bg-brand-secondary-purple',
    infoBlue: 'bg-brand-info-blue',
    neutralDark: 'bg-brand-neutral-dark',
    neutralMid: 'bg-brand-neutral-mid',
    neutralLight: 'bg-brand-neutral-light',
  },
  border: {
    accentRed: 'border-brand-accent-red',
    primaryGreen: 'border-brand-primary-green',
    highlightYellow: 'border-brand-highlight-yellow',
    secondaryPurple: 'border-brand-secondary-purple',
    infoBlue: 'border-brand-info-blue',
    neutralDark: 'border-brand-neutral-dark',
    neutralMid: 'border-brand-neutral-mid',
    neutralLight: 'border-brand-neutral-light',
  },
};

/**
 * Semantic color utilities based on design patterns
 */
export const semanticColors = {
  primary: getBrandColorVar('infoBlue'), // Blue for primary buttons
  secondary: getBrandColorVar('primaryGreen'), // Green for secondary elements  
  accent: getBrandColorVar('accentRed'),
  warning: getBrandColorVar('highlightYellow'),
  muted: getBrandColorVar('neutralLight'),
};

/**
 * Component-specific color schemes
 */
export const componentColors = {
  button: {
    primary: {
      bg: semanticColors.primary,
      text: '#ffffff',
      hover: getBrandColor('primaryGreen'), // Slightly darker
    },
    secondary: {
      bg: semanticColors.secondary,
      text: '#ffffff',
      hover: getBrandColor('infoBlue'),
    },
    accent: {
      bg: semanticColors.accent,
      text: '#ffffff', 
      hover: getBrandColor('accentRed'),
    },
  },
  card: {
    background: 'var(--card)',
    foreground: 'var(--card-foreground)',
    border: 'var(--border)',
  },
  input: {
    background: 'var(--input)',
    border: 'var(--border)',
    ring: 'var(--ring)',
  },
};

/**
 * Theme-aware color utilities
 */
export const getThemeAwareColor = (lightColor: string, darkColor: string): string => {
  if (typeof window !== 'undefined') {
    try {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? darkColor : lightColor;
    } catch (error) {
      console.warn('Failed to check theme:', error);
    }
  }
  return lightColor;
};

/**
 * Business branding integration
 * Allows override of brand colors with business-specific colors
 */
export const getBusinessAwareColor = (
  brandColorKey: keyof typeof COLORS,
  businessColor?: string
): string => {
  return businessColor || getBrandColor(brandColorKey);
};
