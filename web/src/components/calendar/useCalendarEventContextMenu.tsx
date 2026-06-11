'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ContextMenu, type ContextMenuItem } from 'shared/components';
import type { EventItem } from '../../api/calendar';

export function useCalendarEventContextMenu(handlers: {
  onView?: (ev: EventItem) => void;
  onEdit: (ev: EventItem) => void;
}) {
  const [anchor, setAnchor] = useState<{ ev: EventItem; x: number; y: number } | null>(null);

  const openContextMenu = useCallback((e: React.MouseEvent, ev: EventItem) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchor({ ev, x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setAnchor(null), []);

  const items: ContextMenuItem[] = useMemo(() => {
    if (!anchor) return [];
    const ev = anchor.ev;
    const rows: ContextMenuItem[] = [];
    if (handlers.onView) {
      rows.push({
        label: 'View details',
        onClick: () => {
          handlers.onView!(ev);
          close();
        },
      });
    }
    rows.push({
      label: 'Edit event',
      onClick: () => {
        handlers.onEdit(ev);
        close();
      },
    });
    return rows;
  }, [anchor, handlers, close]);

  const contextMenu =
    anchor && items.length > 0 ? (
      <ContextMenu
        open
        onClose={close}
        anchorPoint={{ x: anchor.x, y: anchor.y }}
        items={items}
        menuLabel={`Event actions for ${anchor.ev.title}`}
      />
    ) : null;

  return { openContextMenu, contextMenu };
}
