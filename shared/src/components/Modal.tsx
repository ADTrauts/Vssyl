"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  headerActions?: React.ReactNode;
  /** Links dialog to description copy (ConfirmModal) */
  ariaDescribedBy?: string;
  /** Ref on panel for focus trap targeting (ConfirmModal) */
  panelRef?: React.Ref<HTMLDivElement>;
}

const sizeClasses = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  xlarge: 'max-w-5xl',
} as const;

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  size = 'medium',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  headerActions,
  ariaDescribedBy,
  panelRef,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frameId = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);
      const previous = previousFocusRef.current;
      if (
        previous &&
        typeof previous.focus === 'function' &&
        document.contains(previous)
      ) {
        previous.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 py-v-5"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={panelRef}
        className={`bg-v-surface border border-v-border rounded-v-modal shadow-v-modal p-v-6 relative z-[10000] w-full mx-v-4 my-v-8 max-h-[calc(100vh-4rem)] overflow-y-auto ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between mb-v-4">
          <div className="flex-1">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-v-text-primary"
              >
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-v-2">
            {headerActions}
            <button
              ref={closeButtonRef}
              type="button"
              className="text-v-text-secondary hover:text-v-text-primary v-focus-ring focus:outline-none rounded-v-button p-v-1"
              onClick={onClose}
              aria-label="Close modal"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-v-2">{children}</div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return ReactDOM.createPortal(modalContent, document.body);
};
