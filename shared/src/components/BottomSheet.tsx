import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, children, height = 400, className }) => {
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
      className="fixed inset-0 z-50 flex items-end"
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
          left: 0,
          right: 0,
          bottom: 0,
          height,
          background: '#fff',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.15)',
          zIndex: 51,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflowY: 'auto',
          transition: 'transform 0.3s',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#ccc', borderRadius: 2, margin: '8px auto' }} />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet; 