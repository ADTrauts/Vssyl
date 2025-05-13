'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/chat-context';
import { UIProvider } from '@/context/ui-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <UIProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </UIProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 