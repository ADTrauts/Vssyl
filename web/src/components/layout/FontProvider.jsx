'use client';

import { Inter } from 'next/font/google';
import { createContext, useContext } from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const FontContext = createContext();

export function FontProvider({ children }) {
  return (
    <FontContext.Provider value={{ font: inter }}>
      <style>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
} 