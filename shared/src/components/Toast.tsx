"use client";

import React, { useEffect } from 'react';

type ToastProps = {
  message: string;
  type?: 'info' | 'success' | 'error';
  open: boolean;
  onClose: () => void;
  duration?: number;
};

const typeMap = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  error: 'bg-red-600',
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', open, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-2 text-white rounded shadow-lg ${typeMap[type]}`}
      role="alert"
    >
      {message}
      <button className="ml-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}; 