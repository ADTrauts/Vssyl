'use client';

import { useState, useCallback, useRef } from 'react';
import type { WidgetLayoutUpdate } from '../components/dashboard/DashboardGrid';

interface UseGridOptions {
  onSavePositions: (positions: WidgetLayoutUpdate[]) => Promise<void>;
}

export function useDashboardGrid({ onSavePositions }: UseGridOptions) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdatesRef = useRef<WidgetLayoutUpdate[] | null>(null);

  const handleLayoutChange = useCallback(async (updates: WidgetLayoutUpdate[]) => {
    pendingUpdatesRef.current = updates;

    try {
      setIsSaving(true);
      await onSavePositions(updates);
    } catch (err) {
      console.error('Failed to save widget positions:', err);
    } finally {
      setIsSaving(false);
    }
  }, [onSavePositions]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  return {
    isEditMode,
    isSaving,
    toggleEditMode,
    enterEditMode,
    exitEditMode,
    handleLayoutChange,
  };
}
