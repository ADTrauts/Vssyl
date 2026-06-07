"use client";

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface ContextMenuItem {
  icon?: React.ReactNode;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Destructive actions (delete, trash) — tokenized danger styling */
  destructive?: boolean;
  /** Non-interactive section label row */
  heading?: boolean;
  submenu?: ContextMenuItem[];
  divider?: boolean;
}

/** Shared menu shell classes — used by ContextMenu and DropdownMenu */
export const MENU_SHELL_CLASS =
  'bg-v-surface border border-v-border rounded-v-lg shadow-v-overlay py-v-2 min-w-[200px]';

export const MENU_INNER_CLASS = 'flex flex-col gap-0 px-v-1 py-v-1';

export function getMenuItemClassName(item: ContextMenuItem): string {
  const base =
    'flex items-center w-full text-left px-v-3 py-v-2 rounded-v-md transition-colors duration-150 v-focus-ring focus:outline-none';

  if (item.disabled) {
    return `${base} opacity-50 cursor-not-allowed text-v-text-muted`;
  }

  if (item.destructive) {
    return `${base} text-v-danger hover:bg-v-danger/10 focus:bg-v-danger/10`;
  }

  return `${base} text-v-text-primary hover:bg-v-surface-muted focus:bg-v-surface-muted`;
}

export interface MenuItemRenderOptions {
  inSubmenu?: boolean;
  submenuOpen?: boolean;
  onMouseEnter?: (idx: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onActivate: (item: ContextMenuItem) => void;
}

export function renderMenuItem(
  item: ContextMenuItem,
  idx: number,
  options: MenuItemRenderOptions
): React.ReactNode {
  const { inSubmenu = false, submenuOpen = false, onMouseEnter, onActivate } = options;

  if (item.divider) {
    return (
      <div key={`divider-${idx}`} className="my-v-1 border-t border-v-border" role="separator" />
    );
  }

  if (item.heading && item.label) {
    return (
      <div
        key={`heading-${item.label}-${idx}`}
        role="presentation"
        className="px-v-3 py-v-1 text-v-caption font-medium text-v-text-secondary uppercase tracking-wide"
      >
        {item.label}
      </div>
    );
  }

  const hasSubmenu = Boolean(item.submenu?.length);

  return (
    <button
      key={item.label || idx}
      type="button"
      className={getMenuItemClassName(item)}
      role="menuitem"
      tabIndex={item.disabled ? -1 : 0}
      aria-disabled={item.disabled || undefined}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
      aria-expanded={hasSubmenu ? submenuOpen : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!item.disabled) {
          onActivate(item);
        }
      }}
      onMouseEnter={inSubmenu || !onMouseEnter ? undefined : (e) => onMouseEnter(idx, e)}
      disabled={item.disabled}
    >
      {item.icon && <span className="mr-v-2 shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="ml-v-2 text-v-caption text-v-text-secondary">{item.shortcut}</span>
      )}
      {hasSubmenu && (
        <ChevronRightIcon
          className="w-4 h-4 ml-v-2 text-v-text-secondary shrink-0"
          aria-hidden
        />
      )}
    </button>
  );
}
