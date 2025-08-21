"use client";

import React, { useEffect, useRef } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
  side?: 'left' | 'right';
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({ open, onClose, children, width = 320, side = 'right', className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex"
      aria-modal="true"
      role="dialog"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div
        ref={ref}
        className={className}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [side]: 0,
          width,
          background: '#fff',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          zIndex: 51,
          overflowY: 'auto',
          transition: 'transform 0.3s',
          transform: open ? 'translateX(0)' : side === 'right' ? 'translateX(100%)' : 'translateX(-100%)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Drawer; 