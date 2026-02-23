'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// ============================================================================
// Types
// ============================================================================

export interface PlaceNode {
  id: string;
  placeId: string;
  nodeType: 'BUSINESS' | 'USER' | 'MEETING_PLACE';
  entityId: string;
  positionX: number | null;
  positionY: number | null;
  label: string | null;
  color: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceSettings {
  id: string;
  placeId: string;
  neighborhoodVisibility: string;
  defaultFollowVisibility: boolean;
  layoutMode: string;
  showLabels: boolean;
  highContrastMode: boolean;
  showLocalSuggestions: boolean;
  suggestionRadius: number;
}

export interface PlaceInterest {
  id: string;
  placeId: string;
  category: string;
}

export interface Place {
  id: string;
  userId: string;
  name: string;
  isSetupComplete: boolean;
  nodes: PlaceNode[];
  settings: PlaceSettings | null;
  interests: PlaceInterest[];
  createdAt: string;
  updatedAt: string;
}

interface PlaceContextType {
  place: Place | null;
  loading: boolean;
  error: string | null;
  activeTab: 'my-place' | 'explore';
  setActiveTab: (tab: 'my-place' | 'explore') => void;
  refreshPlace: () => Promise<void>;
  addNode: (nodeType: string, entityId: string, label?: string) => Promise<PlaceNode | null>;
  removeNode: (nodeId: string) => Promise<boolean>;
  updateNodePosition: (nodeId: string, x: number, y: number, pinned?: boolean) => Promise<void>;
  updateSettings: (settings: Partial<PlaceSettings>) => Promise<void>;
  setInterests: (categories: string[]) => Promise<void>;
  completeSetup: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ============================================================================
// Provider
// ============================================================================

export function PlaceProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-place' | 'explore'>('my-place');

  const token = session?.accessToken as string | undefined;

  const refreshPlace = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/place', { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Failed to fetch place');
      const data = await res.json();
      if (data.success) {
        setPlace(data.data);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshPlace();
    } else {
      setLoading(false);
    }
  }, [token, refreshPlace]);

  const addNode = useCallback(async (nodeType: string, entityId: string, label?: string): Promise<PlaceNode | null> => {
    if (!token) return null;
    try {
      const res = await fetch('/api/place/nodes', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ nodeType, entityId, label }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshPlace();
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [token, refreshPlace]);

  const removeNode = useCallback(async (nodeId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/place/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success) {
        await refreshPlace();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [token, refreshPlace]);

  const updateNodePosition = useCallback(async (nodeId: string, x: number, y: number, pinned?: boolean) => {
    if (!token) return;
    try {
      await fetch(`/api/place/nodes/${nodeId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ positionX: x, positionY: y, pinned }),
      });
      setPlace(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          nodes: prev.nodes.map(n =>
            n.id === nodeId ? { ...n, positionX: x, positionY: y, pinned: pinned ?? n.pinned } : n
          ),
        };
      });
    } catch {
      // Silently fail position updates
    }
  }, [token]);

  const updateSettings = useCallback(async (settings: Partial<PlaceSettings>) => {
    if (!token) return;
    try {
      const res = await fetch('/api/place/settings', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setPlace(prev => prev ? { ...prev, settings: data.data } : prev);
      }
    } catch {
      // Silently fail
    }
  }, [token]);

  const setInterestsAction = useCallback(async (categories: string[]) => {
    if (!token) return;
    try {
      await fetch('/api/place/interests', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ categories }),
      });
      await refreshPlace();
    } catch {
      // Silently fail
    }
  }, [token, refreshPlace]);

  const completeSetup = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/place/complete-setup', {
        method: 'POST',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success) {
        setPlace(data.data);
      }
    } catch {
      // Silently fail
    }
  }, [token]);

  return (
    <PlaceContext.Provider
      value={{
        place,
        loading,
        error,
        activeTab,
        setActiveTab,
        refreshPlace,
        addNode,
        removeNode,
        updateNodePosition,
        updateSettings,
        setInterests: setInterestsAction,
        completeSetup,
      }}
    >
      {children}
    </PlaceContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePlace() {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlace must be used within a PlaceProvider');
  }
  return context;
}
