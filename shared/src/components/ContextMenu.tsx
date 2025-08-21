"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  icon?: React.ReactNode;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
  divider?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  anchorPoint: { x: number; y: number };
  items: ContextMenuItem[];
}

interface Position {
  x: number;
  y: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, anchorPoint, items }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuIdx, setSubmenuIdx] = useState<number | null>(null);
  const [submenuPos, setSubmenuPos] = useState<Position | null>(null);

  // Close on click outside or Escape
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

  // Focus first menu item and trap focus
  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector('[role="menuitem"]:not([aria-disabled="true"])') as HTMLElement;
      first?.focus();
    }
  }, [open]);

  // Keyboard navigation (arrow keys, submenu)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const itemsEls = menuRef.current?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])');
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
  }, [items, submenuIdx]);

  // Prevent overflow
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

  // Submenu positioning
  const handleMouseEnter = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const item = items[idx];
    if (item.submenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSubmenuIdx(idx);
      setSubmenuPos({ x: rect.right + 2, y: rect.top });
    } else {
      setSubmenuIdx(null);
      setSubmenuPos(null);
    }
  };

  const handleMouseLeave = () => {
    setSubmenuIdx(null);
    setSubmenuPos(null);
  };

  if (!open) return null;

  // Determine theme for border color
  let isDark = false;
  if (typeof window !== 'undefined') {
    isDark = document.documentElement.classList.contains('dark');
  }

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg py-2 min-w-[200px]"
      style={{
        top: pos.y,
        left: pos.x,
        outline: 'none',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
        border: '1.5px solid',
        borderColor: isDark ? '#374151' : '#d1d5db',
        fontFamily: 'monospace, sans-serif', // DEBUG: force font
        fontWeight: 900,
        zIndex: 9999,
      }}
      role="menu"
      tabIndex={-1}
      aria-label="Context menu"
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col gap-0 px-1 py-1">
        {items.map((item, idx) =>
          item.divider ? (
            <div key={idx} className="my-1 border-t border-gray-200 dark:border-gray-600" />
          ) : (
            <button
              key={item.label || idx}
              className={`flex items-center w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none 
                ${item.disabled ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
              aria-disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.onClick) item.onClick();
                if (!item.submenu) onClose();
              }}
              onMouseEnter={e => handleMouseEnter(idx, e)}
              onMouseLeave={handleMouseLeave}
              disabled={item.disabled}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>}
              {item.submenu && <ChevronRightIcon className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500" />}
            </button>
          )
        )}
        {/* Submenu */}
        {submenuIdx !== null && items[submenuIdx]?.submenu && submenuPos && (
          <ContextMenu
            open={true}
            onClose={onClose}
            anchorPoint={submenuPos}
            items={items[submenuIdx].submenu!}
          />
        )}
      </div>
    </div>
  );

  // Render to document body using portal to avoid stacking context issues
  if (typeof window === 'undefined') {
    return menuContent;
  }

  return createPortal(menuContent, document.body);
}; 