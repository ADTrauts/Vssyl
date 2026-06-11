'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'shared/components';

export interface CalendarCreateCalendarModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
  loading?: boolean;
}

export function CalendarCreateCalendarModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: CalendarCreateCalendarModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      const frameId = requestAnimationFrame(() => {
        document.getElementById('calendar-create-name')?.focus();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [open]);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    await onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} title="New calendar" size="small">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="calendar-create-name"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Calendar name
        </label>
        <Input
          id="calendar-create-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My calendar"
          disabled={loading}
          autoComplete="off"
          className="w-full"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isValid || loading}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
