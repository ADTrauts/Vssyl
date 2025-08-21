'use client';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Calendar } from '../api/calendar';
import { getUserPreference, setUserPreference } from '../api/user';

type OverlayMode = 'ALL_TABS' | 'CURRENT_TAB';

interface CalendarContextType {
  calendarsById: Record<string, Calendar>;
  setCalendars: (cals: Calendar[]) => void;
  visibleCalendarIds: Set<string>;
  toggleCalendarVisibility: (id: string) => void;
  overlayMode: OverlayMode;
  setOverlayMode: (m: OverlayMode) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [calendarsById, setCalendarsById] = useState<Record<string, Calendar>>({});
  const [visibleCalendarIds, setVisible] = useState<Set<string>>(new Set());
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('ALL_TABS');
  const initializedRef = useRef(false);
  
  const authToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('token');
      return stored || null;
    } catch { return null; }
  }, []);

  const setCalendars = (cals: Calendar[]) => {
    const next: Record<string, Calendar> = {};
    cals.forEach(c => { next[c.id] = c; });
    setCalendarsById(next);
    // Initialize visibility from server preference, fallback to localStorage, then all
    if (!initializedRef.current) {
      const hydrate = async () => {
        let ids: string[] | null = null;
        if (authToken) {
          try {
            const pref = await getUserPreference('calendar:visible', authToken);
            if (pref) {
              const parsed: string[] = JSON.parse(pref);
              ids = parsed.filter((id) => next[id]);
            }
          } catch {}
        }
        if (!ids) {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('calendar:visible') : null;
          if (stored) {
            try { ids = JSON.parse(stored); } catch { ids = null; }
          }
        }
        if (!ids) ids = cals.map(c => c.id);
        setVisible(new Set(ids.filter((id) => next[id])));
        initializedRef.current = true;
      };
      void hydrate();
    } else {
      // If calendars change later, ensure visibility only includes existing ids
      setVisible(prev => new Set(Array.from(prev).filter(id => next[id])));
    }
  };

  const toggleCalendarVisibility = (id: string) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Persist visibility
  useEffect(() => {
    if (visibleCalendarIds.size > 0) {
      const arr = Array.from(visibleCalendarIds);
      try {
        localStorage.setItem('calendar:visible', JSON.stringify(arr));
        if (authToken) void setUserPreference('calendar:visible', JSON.stringify(arr), authToken);
      } catch {}
    }
  }, [visibleCalendarIds, authToken]);

  const value = useMemo<CalendarContextType>(() => ({
    calendarsById,
    setCalendars,
    visibleCalendarIds,
    toggleCalendarVisibility,
    overlayMode,
    setOverlayMode
  }), [calendarsById, visibleCalendarIds, overlayMode]);

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarContext must be used within CalendarProvider');
  return ctx;
}

