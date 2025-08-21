"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from './Toast';

interface ToastContextType {
  showToast: (message: string, options?: { type?: 'info' | 'success' | 'error'; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'error';
    open: boolean;
    duration: number;
  }>({ message: '', type: 'info', open: false, duration: 3000 });

  const showToast = useCallback((message: string, options?: { type?: 'info' | 'success' | 'error'; duration?: number }) => {
    setToast({
      message,
      type: options?.type || 'info',
      open: true,
      duration: options?.duration || 3000,
    });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        open={toast.open}
        onClose={handleClose}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
} 