'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { VLinkEntityType } from '@/api/vlinks';

export interface VLinkDragEntity {
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string;
  title?: string;
  dashboardId?: string;
  businessId?: string | null;
  householdId?: string | null;
}

interface VLinkDragContextValue {
  pendingEntity: VLinkDragEntity | null;
  setPendingEntity: (entity: VLinkDragEntity | null) => void;
  connectModalOpen: boolean;
  openConnectModal: (entity: VLinkDragEntity) => void;
  closeConnectModal: () => void;
}

const VLinkDragContext = createContext<VLinkDragContextValue | null>(null);

export function VLinkDragProvider({ children }: { children: React.ReactNode }) {
  const [pendingEntity, setPendingEntity] = useState<VLinkDragEntity | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const openConnectModal = useCallback((entity: VLinkDragEntity) => {
    setPendingEntity(entity);
    setConnectModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setConnectModalOpen(false);
    setPendingEntity(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingEntity,
      setPendingEntity,
      connectModalOpen,
      openConnectModal,
      closeConnectModal,
    }),
    [pendingEntity, connectModalOpen, openConnectModal, closeConnectModal]
  );

  return <VLinkDragContext.Provider value={value}>{children}</VLinkDragContext.Provider>;
}

export function useVLinkDrag() {
  const ctx = useContext(VLinkDragContext);
  if (!ctx) {
    throw new Error('useVLinkDrag must be used within VLinkDragProvider');
  }
  return ctx;
}

export const VLINK_DRAG_MIME = 'application/x-vssyl-vlink-drag';

export function parseVLinkDropPayload(dataTransfer: DataTransfer): VLinkDragEntity | null {
  const raw = dataTransfer.getData('application/json') || dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      id?: string;
      moduleId?: string;
      type?: string;
      metadata?: { dashboardId?: string; businessId?: string; householdId?: string };
    };
    if (!parsed.id || !parsed.moduleId) return null;
    let entityType: VLinkEntityType = 'MODULE_ENTITY';
    if (parsed.moduleId === 'drive') {
      entityType = parsed.type === 'folder' ? 'FOLDER' : 'FILE';
    } else if (parsed.moduleId === 'calendar') {
      entityType = 'CALENDAR_EVENT';
    }
    return {
      entityType,
      entityId: parsed.id,
      moduleId: parsed.moduleId,
      dashboardId: parsed.metadata?.dashboardId,
      businessId: parsed.metadata?.businessId ?? null,
      householdId: parsed.metadata?.householdId ?? null,
    };
  } catch {
    return null;
  }
}

export function isVLinkSidebarDrag(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes(VLINK_DRAG_MIME);
}
