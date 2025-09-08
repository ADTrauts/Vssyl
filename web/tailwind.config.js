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
      },
    },
  },
  plugins: [],
}; 