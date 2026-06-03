module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      colors: {
        // Brand colors from shared/src/styles/theme.ts
        brand: {
          'accent-red': 'var(--accent-red)',
          'primary-green': 'var(--primary-green)', 
          'highlight-yellow': 'var(--highlight-yellow)',
          'secondary-purple': 'var(--secondary-purple)',
          'info-blue': 'var(--info-blue)',
          'neutral-dark': 'var(--neutral-dark)',
          'neutral-mid': 'var(--neutral-mid)',
          'neutral-light': 'var(--neutral-light)',
        },
        // Semantic colors
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Vssyl UX tokens (docs/ux/DESIGN_TOKENS.md) — additive; legacy keys unchanged
        v: {
          background: 'var(--v-color-background)',
          surface: 'var(--v-color-surface)',
          'surface-muted': 'var(--v-color-surface-muted)',
          border: 'var(--v-color-border)',
          'border-strong': 'var(--v-color-border-strong)',
          'text-primary': 'var(--v-color-text-primary)',
          'text-secondary': 'var(--v-color-text-secondary)',
          'text-muted': 'var(--v-color-text-muted)',
          primary: 'var(--v-color-primary)',
          'primary-hover': 'var(--v-color-primary-hover)',
          'primary-soft': 'var(--v-color-primary-soft)',
          success: 'var(--v-color-success)',
          warning: 'var(--v-color-warning)',
          danger: 'var(--v-color-danger)',
          info: 'var(--v-color-info)',
        },
      },
      spacing: {
        'v-1': 'var(--v-space-1)',
        'v-2': 'var(--v-space-2)',
        'v-3': 'var(--v-space-3)',
        'v-4': 'var(--v-space-4)',
        'v-5': 'var(--v-space-5)',
        'v-6': 'var(--v-space-6)',
        'v-8': 'var(--v-space-8)',
        'v-10': 'var(--v-space-10)',
        'v-12': 'var(--v-space-12)',
        'v-16': 'var(--v-space-16)',
      },
      borderRadius: {
        'v-none': 'var(--v-radius-none)',
        'v-sm': 'var(--v-radius-sm)',
        'v-md': 'var(--v-radius-md)',
        'v-lg': 'var(--v-radius-lg)',
        'v-xl': 'var(--v-radius-xl)',
        'v-2xl': 'var(--v-radius-2xl)',
        'v-full': 'var(--v-radius-full)',
        'v-button': 'var(--v-radius-button)',
        'v-card': 'var(--v-radius-card)',
        'v-panel': 'var(--v-radius-panel)',
        'v-modal': 'var(--v-radius-modal)',
      },
      boxShadow: {
        'v-none': 'var(--v-shadow-none)',
        'v-subtle': 'var(--v-shadow-subtle)',
        'v-card': 'var(--v-shadow-card)',
        'v-panel': 'var(--v-shadow-panel)',
        'v-overlay': 'var(--v-shadow-overlay)',
        'v-modal': 'var(--v-shadow-modal)',
      },
      fontSize: {
        'v-display': [
          'var(--v-font-display-size)',
          {
            lineHeight: 'var(--v-font-display-line-height)',
            fontWeight: 'var(--v-font-display-weight)',
          },
        ],
        'v-heading': [
          'var(--v-font-heading-size)',
          {
            lineHeight: 'var(--v-font-heading-line-height)',
            fontWeight: 'var(--v-font-heading-weight)',
          },
        ],
        'v-body': [
          'var(--v-font-body-size)',
          {
            lineHeight: 'var(--v-font-body-line-height)',
            fontWeight: 'var(--v-font-body-weight)',
          },
        ],
        'v-caption': [
          'var(--v-font-caption-size)',
          {
            lineHeight: 'var(--v-font-caption-line-height)',
            fontWeight: 'var(--v-font-caption-weight)',
          },
        ],
      },
    },
  },
  plugins: [],
}; 