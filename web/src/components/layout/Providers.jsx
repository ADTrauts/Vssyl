'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/ui-context';
import { FontProvider } from '@/components/layout/FontProvider';
import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <UIProvider>
          <FontProvider>
            {children}
            <Toaster />
          </FontProvider>
        </UIProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 