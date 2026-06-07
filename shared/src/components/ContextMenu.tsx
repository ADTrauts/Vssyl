"use client";

import React, { useRef, useEffect, useCallback, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  MENU_SHELL_CLASS,
  MENU_INNER_CLASS,
  renderMenuItem,
  type ContextMenuItem,
} from './menuShared.js';

export type { ContextMenuItem } from './menuShared.js';

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  anchorPoint: { x: number; y: number };
  items: ContextMenuItem[];
  /** Accessible name when default "Context menu" is insufficient */
  menuLabel?: string;
  onSubmenuMouseEnter?: () => void;
  onSubmenuMouseLeave?: () => void;
}

interface Position {
  x: number;
  y: number;
}

const MENU_FIXED_CLASS = `fixed z-[99999] ${MENU_SHELL_CLASS}`;

export const ContextMenu: React.FC<ContextMenuProps> = ({
  open,
  onClose,
  anchorPoint,
  items,
  menuLabel = 'Context menu',
  onSubmenuMouseEnter,
  onSubmenuMouseLeave,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [submenuIdx, setSubmenuIdx] = useState<number | null>(null);
  const [submenuPos, setSubmenuPos] = useState<Position | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector(
        '[role="menuitem"]:not([aria-disabled="true"])'
      ) as HTMLElement;
      first?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const itemsEls = menuRef.current?.querySelectorAll(
        '[role="menuitem"]:not([aria-disabled="true"])'
      );
      if (!itemsEls || itemsEls.length === 0) return;

      const active = document.activeElement;
      const idx = Array.from(itemsEls).indexOf(active as Element);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          (itemsEls[(idx + 1) % itemsEls.length] as HTMLElement).focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          (itemsEls[(idx - 1 + itemsEls.length) % itemsEls.length] as HTMLElement).focus();
          break;
        case 'ArrowRight':
          if (submenuIdx !== null && items[submenuIdx].submenu) {
            setSubmenuIdx(idx);
          }
          break;
        case 'Enter':
        case ' ':
          (active as HTMLElement).click();
          break;
      }
    },
    [items, submenuIdx]
  );

  const [pos, setPos] = useState<Position>(anchorPoint);
  useEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    if (!menu) return;

    const { innerWidth, innerHeight } = window;
    const rect = menu.getBoundingClientRect();
    let x = anchorPoint.x;
    let y = anchorPoint.y;

    if (x + rect.width > innerWidth) x = innerWidth - rect.width - 8;
    if (y + rect.height > innerHeight) y = innerHeight - rect.height - 8;

    setPos({ x, y });
  }, [anchorPoint, open]);

  useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }

    const item = items[idx];
    if (item.submenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      let x = rect.right + 4;
      let y = rect.top;

      const submenuWidth = 200;
      const submenuHeight = item.submenu.length * 40;

      if (x + submenuWidth > innerWidth) {
        x = rect.left - submenuWidth - 4;
      }

      if (y + submenuHeight > innerHeight) {
        y = Math.max(8, innerHeight - submenuHeight - 8);
      }

      setSubmenuIdx(idx);
      setSubmenuPos({ x, y });
    } else if (submenuIdx !== null) {
      setSubmenuIdx(null);
      setSubmenuPos(null);
    }
  };

  const handleMouseLeave = () => {
    if (!isSubmenuHovered) {
      submenuTimeoutRef.current = setTimeout(() => {
        setSubmenuIdx(null);
        setSubmenuPos(null);
      }, 300);
    }
  };

  const handleSubmenuMouseEnter = () => {
    setIsSubmenuHovered(true);
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
  };

  const handleSubmenuMouseLeave = () => {
    setIsSubmenuHovered(false);
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuIdx(null);
      setSubmenuPos(null);
    }, 100);
  };

  const handleItemActivate = (item: ContextMenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.submenu) {
      onClose();
    }
  };

  if (!open) return null;

  const menuContent = (
    <div
      ref={menuRef}
      id={menuId}
      className={MENU_FIXED_CLASS}
      style={{
        top: pos.y,
        left: pos.x,
        outline: 'none',
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      role="menu"
      tabIndex={-1}
      aria-label={menuLabel}
      onKeyDown={handleKeyDown}
      onMouseEnter={onSubmenuMouseEnter}
      onMouseLeave={onSubmenuMouseLeave || handleMouseLeave}
    >
      <div className={MENU_INNER_CLASS}>
        {items.map((item, idx) =>
          renderMenuItem(item, idx, {
            submenuOpen: submenuIdx === idx,
            onMouseEnter: handleMouseEnter,
            onActivate: () => handleItemActivate(item),
          })
        )}
        {submenuIdx !== null && items[submenuIdx]?.submenu && submenuPos && (
          <div
            className={MENU_FIXED_CLASS}
            style={{
              top: submenuPos.y,
              left: submenuPos.x,
              zIndex: 99999,
              pointerEvents: 'auto',
            }}
            role="menu"
            aria-label="Submenu"
            onMouseEnter={handleSubmenuMouseEnter}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            <div className={MENU_INNER_CLASS}>
              {items[submenuIdx].submenu!.map((subItem, subIdx) =>
                renderMenuItem(subItem, subIdx, {
                  inSubmenu: true,
                  onActivate: () => {
                    if (subItem.onClick) {
                      subItem.onClick();
                    }
                    onClose();
                  },
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return menuContent;
  }

  return createPortal(menuContent, document.body);
};
