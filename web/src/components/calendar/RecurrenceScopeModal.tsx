'use client';

import React from 'react';
import { Modal, Button } from 'shared/components';

export type RecurrenceScope = 'THIS' | 'SERIES';

export interface RecurrenceScopeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (scope: RecurrenceScope) => void;
  title: string;
  description?: string;
}

/**
 * Replaces native confirm() for recurring-event scope (THIS vs entire series).
 */
export function RecurrenceScopeModal({
  open,
  onClose,
  onSelect,
  title,
  description,
}: RecurrenceScopeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="small">
      {description ? (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            onSelect('THIS');
            onClose();
          }}
        >
          This occurrence only
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            onSelect('SERIES');
            onClose();
          }}
        >
          Entire series
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
