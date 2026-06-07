"use client";

import React, { useId, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

type PopoverProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the floating panel */
  panelLabel?: string;
};

/**
 * Low-level floating-content shell — not for action menus (use DropdownMenu).
 * Option A layering: docs/ux/CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md §11
 */
export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  open,
  onOpenChange,
  panelLabel = 'Popover',
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
      zIndex: 50,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  const panel = open ? (
    <div
      ref={panelRef}
      id={panelId}
      role="region"
      aria-label={panelLabel}
      style={panelStyle}
      className="px-v-3 py-v-2 bg-v-surface border border-v-border rounded-v-lg shadow-v-panel min-w-[160px]"
    >
      {content}
    </div>
  ) : null;

  return (
    <span ref={rootRef} className="relative inline-block">
      <span
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? panelId : undefined}
      >
        {children}
      </span>
      {typeof window !== 'undefined' && panel
        ? createPortal(panel, document.body)
        : panel}
    </span>
  );
};
