"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useFocusTrap } from '../utils/focusTrap';

export type ConfirmVariant = 'standard' | 'destructive' | 'informational';

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  trapFocus?: boolean;
}

const DEFAULT_CONFIRM_LABEL: Record<ConfirmVariant, string> = {
  standard: 'Confirm',
  destructive: 'Delete',
  informational: 'Continue',
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'standard',
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  confirmDisabled = false,
  size = 'medium',
  trapFocus = true,
}) => {
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = loading || internalLoading;
  const resolvedConfirmLabel = confirmLabel ?? DEFAULT_CONFIRM_LABEL[variant];

  useFocusTrap(panelRef, open && trapFocus);

  useEffect(() => {
    if (!open) return;

    const focusTarget =
      variant === 'destructive' ? cancelButtonRef : confirmButtonRef;

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        focusTarget.current?.focus();
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [open, variant]);

  const handleConfirm = useCallback(async () => {
    if (isLoading || confirmDisabled) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  }, [confirmDisabled, isLoading, onConfirm]);

  const destructiveConfirmClass =
    variant === 'destructive'
      ? '!bg-v-danger hover:opacity-90 focus:ring-v-danger'
      : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      ariaDescribedBy={description ? descriptionId : undefined}
      panelRef={panelRef}
    >
      {variant === 'destructive' && (
        <div
          className="mb-v-4 rounded-v-button border border-v-danger/40 bg-v-danger/10 px-v-3 py-v-2"
          role="note"
        >
          <p className="text-sm font-medium text-v-text-primary">Please review before continuing.</p>
        </div>
      )}

      {description && (
        <div
          id={descriptionId}
          className="text-sm text-v-text-secondary mb-v-4"
        >
          {description}
        </div>
      )}

      <div
        className="flex justify-end gap-v-3 pt-v-4 border-t border-v-border"
        aria-busy={isLoading}
      >
        <Button
          ref={cancelButtonRef}
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          ref={confirmButtonRef}
          type="button"
          variant="primary"
          onClick={() => void handleConfirm()}
          disabled={isLoading || confirmDisabled}
          className={destructiveConfirmClass}
        >
          {resolvedConfirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
