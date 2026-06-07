"use client";

import React, { useId, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MENU_SHELL_CLASS,
  MENU_INNER_CLASS,
  renderMenuItem,
  type ContextMenuItem,
} from './menuShared.js';

export type DropdownMenuAlign = 'start' | 'end';
export type DropdownMenuSide = 'bottom' | 'top';

export interface DropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trigger element (typically a Button) */
  children: React.ReactNode;
  items: ContextMenuItem[];
  align?: DropdownMenuAlign;
  side?: DropdownMenuSide;
  menuLabel?: string;
}

/**
 * Trigger-anchored action menu scaffold (Wave 3A-2).
 * Composes shared menu item styling; no submenu or advanced keyboard nav yet.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  open,
  onOpenChange,
  children,
  items,
  align = 'start',
  side = 'bottom',
  menuLabel = 'Actions menu',
}) => {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? 0;
    const gap = 4;

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 99999,
      minWidth: Math.max(rect.width, 200),
    };

    if (side === 'bottom') {
      style.top = rect.bottom + gap;
    } else {
      style.top = rect.top - menuHeight - gap;
    }

    if (align === 'end') {
      style.right = window.innerWidth - rect.right;
    } else {
      style.left = rect.left;
    }

    setMenuStyle(style);
  }, [align, side]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition, items]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
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

  const handleItemActivate = (item: ContextMenuItem) => {
    if (item.submenu) {
      return;
    }
    item.onClick?.();
    onOpenChange(false);
  };

  const menuPanel =
    open &&
    ((
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={menuLabel}
        tabIndex={-1}
        className={MENU_SHELL_CLASS}
        style={menuStyle}
      >
        <div className={MENU_INNER_CLASS}>
          {items.map((item, idx) =>
            renderMenuItem(item, idx, {
              onActivate: () => handleItemActivate(item),
            })
          )}
        </div>
      </div>
    ) as React.ReactNode);

  return (
    <div ref={rootRef} className="relative inline-block">
      <span
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        {children}
      </span>
      {typeof window !== 'undefined' && menuPanel
        ? createPortal(menuPanel, document.body)
        : menuPanel}
    </div>
  );
};
