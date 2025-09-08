'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminApiService } from '../lib/adminApiService';

interface ImpersonationSession {
  id: string;
  targetUser: {
    id: string;
    email: string;
    name: string;
  };
  startedAt: string;
  reason?: string;
  duration?: number;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  currentSession: ImpersonationSession | null;
  startImpersonation: (userId: string, reason?: string) => Promise<boolean>;
  endImpersonation: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

interface ImpersonationProviderProps {
  children: ReactNode;
}

export const ImpersonationProvider: React.FC<ImpersonationProviderProps> = ({ children }) => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null);

  const refreshSession = async () => {
    try {
      const response = await adminApiService.getCurrentImpersonation();
      if (response.error) {
        console.error('Error fetching impersonation session:', response.error);
        return;
      }

      if (response.data?.active) {
        setIsImpersonating(true);
        setCurrentSession(response.data.impersonation);
      } else {
        setIsImpersonating(false);
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error refreshing impersonation session:', error);
      setIsImpersonating(false);
      setCurrentSession(null);
    }
  };

  const startImpersonation = async (userId: string, reason?: string): Promise<boolean> => {
    try {
      // First check if we're already impersonating
      const currentResponse = await adminApiService.getCurrentImpersonation();
      if (currentResponse.data?.active) {
        console.log('Already impersonating a user, ending current session first');
        await endImpersonation();
      }

      const response = await adminApiService.startImpersonation(userId, reason);
      if (response.error) {
        console.error('Error starting impersonation:', response.error);
        return false;
      }

      await refreshSession();
      return true;
    } catch (error) {
      console.error('Error starting impersonation:', error);
      return false;
    }
  };

  const endImpersonation = async (): Promise<boolean> => {
    try {
      const response = await adminApiService.endImpersonation();
      if (response.error) {
        console.error('Error ending impersonation:', response.error);
        return false;
      }

      setIsImpersonating(false);
      setCurrentSession(null);
      return true;
    } catch (error) {
      console.error('Error ending impersonation:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <ImpersonationContext.Provider value={{
      isImpersonating,
      currentSession,
      startImpersonation,
      endImpersonation,
      refreshSession,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}; 