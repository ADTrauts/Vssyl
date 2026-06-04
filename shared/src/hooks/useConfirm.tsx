"use client";

import React, { useCallback, useState } from 'react';
import { ConfirmModal, type ConfirmVariant } from '../components/ConfirmModal';

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  size?: 'small' | 'medium' | 'large';
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
};

const INITIAL_STATE: ConfirmState = {
  open: false,
  options: { title: '' },
  resolve: null,
};

/**
 * Promise-based confirm helper for future migration off window.confirm().
 * Mount `<ConfirmDialog />` once near the root of a client subtree.
 */
export function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmDialog: React.FC;
} {
  const [state, setState] = useState<ConfirmState>(INITIAL_STATE);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const finish = useCallback((value: boolean) => {
    setState((current) => {
      current.resolve?.(value);
      return INITIAL_STATE;
    });
  }, []);

  const ConfirmDialog: React.FC = () => (
    <ConfirmModal
      open={state.open}
      title={state.options.title}
      description={state.options.description}
      variant={state.options.variant}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      size={state.options.size}
      onClose={() => finish(false)}
      onConfirm={() => finish(true)}
    />
  );

  ConfirmDialog.displayName = 'ConfirmDialog';

  return { confirm, ConfirmDialog };
}
