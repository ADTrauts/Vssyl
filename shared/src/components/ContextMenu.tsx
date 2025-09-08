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
  onSubmenuMouseEnter?: () => void;
  onSubmenuMouseLeave?: () => void;
}

interface Position {
  x: number;
  y: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  open, 
  onClose, 
  anchorPoint, 
  items, 
  onSubmenuMouseEnter, 
  onSubmenuMouseLeave 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuIdx, setSubmenuIdx] = useState<number | null>(null);
  const [submenuPos, setSubmenuPos] = useState<Position | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);

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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  // Submenu positioning with overflow protection
  const handleMouseEnter = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    // Clear any existing timeout
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }

    const item = items[idx];
    if (item.submenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      
      // Calculate optimal submenu position with a small gap for easier mouse movement
      let x = rect.right + 4;
      let y = rect.top;
      
      // Estimate submenu width (approximate)
      const submenuWidth = 200;
      const submenuHeight = item.submenu.length * 40; // approximate height per item
      
      // Check if submenu would overflow on the right
      if (x + submenuWidth > innerWidth) {
        x = rect.left - submenuWidth - 4; // Position to the left with gap
      }
      
      // Check if submenu would overflow on the bottom
      if (y + submenuHeight > innerHeight) {
        y = Math.max(8, innerHeight - submenuHeight - 8); // Adjust upward with padding
      }
      
      setSubmenuIdx(idx);
      setSubmenuPos({ x, y });
    } else {
      // Only close submenu if hovering over a different item
      if (submenuIdx !== null) {
        setSubmenuIdx(null);
        setSubmenuPos(null);
      }
    }
  };

  const handleMouseLeave = () => {
    // Don't close submenu immediately - use a delay to allow mouse movement to submenu
    if (!isSubmenuHovered) {
      submenuTimeoutRef.current = setTimeout(() => {
        setSubmenuIdx(null);
        setSubmenuPos(null);
      }, 300); // 300ms delay
    }
  };

  const handleSubmenuMouseEnter = () => {
    setIsSubmenuHovered(true);
    // Clear any pending timeout
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
  };

  const handleSubmenuMouseLeave = () => {
    setIsSubmenuHovered(false);
    // Close submenu after a short delay
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuIdx(null);
      setSubmenuPos(null);
    }, 100);
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
      className={`fixed z-[99999] bg-white dark:bg-slate-800 border rounded-lg shadow-xl py-2 min-w-[200px] ${
        onSubmenuMouseEnter ? 'border-red-500 border-2' : 'border-gray-200 dark:border-slate-600'
      }`}
      style={{
        top: pos.y,
        left: pos.x,
        outline: 'none',
        boxShadow: isDark 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      role="menu"
      tabIndex={-1}
      aria-label="Context menu"
      onKeyDown={handleKeyDown}
      onMouseEnter={onSubmenuMouseEnter}
      onMouseLeave={onSubmenuMouseLeave || handleMouseLeave}
    >
      <div className="flex flex-col gap-0 px-1 py-1">
        {items.map((item, idx) =>
          item.divider ? (
            <div key={idx} className="my-1 border-t border-gray-200 dark:border-gray-600" />
          ) : (
            <button
              key={item.label || idx}
              className={`flex items-center w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 focus:bg-gray-50 dark:focus:bg-slate-700 focus:outline-none transition-colors duration-150 
                ${item.disabled ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
              aria-disabled={item.disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!item.disabled && item.onClick) {
                  item.onClick();
                }
                if (!item.submenu) {
                  onClose();
                }
              }}
              onMouseEnter={e => handleMouseEnter(idx, e)}
              disabled={item.disabled}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>}
              {item.submenu && <ChevronRightIcon className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500" />}
            </button>
          )
        )}
        {/* Submenu - Direct rendering instead of recursive ContextMenu */}
        {submenuIdx !== null && items[submenuIdx]?.submenu && submenuPos && (
          <div
            className="fixed z-[99999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl py-2 min-w-[200px]"
            style={{
              top: submenuPos.y,
              left: submenuPos.x,
              zIndex: 99999,
              pointerEvents: 'auto',
            }}
            onMouseEnter={handleSubmenuMouseEnter}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            <div className="flex flex-col gap-0 px-1 py-1">
              {items[submenuIdx].submenu!.map((subItem, subIdx) => (
                <button
                  key={subItem.label || subIdx}
                  className={`flex items-center w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 focus:bg-gray-50 dark:focus:bg-slate-700 focus:outline-none transition-colors duration-150 
                    ${subItem.disabled ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!subItem.disabled && subItem.onClick) {
                      subItem.onClick();
                    }
                    onClose();
                  }}
                  disabled={subItem.disabled}
                >
                  {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                  <span className="flex-1">{subItem.label}</span>
                  {subItem.shortcut && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{subItem.shortcut}</span>}
                </button>
              ))}
            </div>
          </div>
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