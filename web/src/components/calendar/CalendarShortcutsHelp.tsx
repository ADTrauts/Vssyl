'use client';

import React, { useEffect, useState } from 'react';
import { HelpCircle, Keyboard } from 'lucide-react';
import { Button, Modal } from 'shared/components';

function ShortcutRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-slate-700">{keys}</kbd>
    </div>
  );
}

export function CalendarShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (target?.isContentEditable) return;
      const isHelpKey =
        e.key === '?' || (e.shiftKey && (e.key === '/' || e.code === 'Slash'));
      if (isHelpKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Calendar Keyboard Shortcuts" size="medium">
        <Keyboard className="mb-2 h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          View and action shortcuts are active when focus is not in a text field. Press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-slate-700">?</kbd> to
          toggle this panel from any calendar view.
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Views</h3>
            <div className="space-y-2">
              <ShortcutRow label="Day view" keys="D" />
              <ShortcutRow label="Week view" keys="W" />
              <ShortcutRow label="Month view" keys="M" />
              <ShortcutRow label="Year view" keys="Y" />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
            <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Actions</h3>
            <div className="space-y-2">
              <ShortcutRow label="New event" keys="N" />
              <ShortcutRow label="Show this help" keys="?" />
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-slate-700">
          <Button variant="primary" size="sm" onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
