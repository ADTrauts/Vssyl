import React from 'react';

type PopoverProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const Popover: React.FC<PopoverProps> = ({ content, children, open, onOpenChange }) => {
  return (
    <span className="relative inline-block">
      <span onClick={() => onOpenChange(!open)}>{children}</span>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-white border rounded shadow-lg min-w-[160px]">
          {content}
        </div>
      )}
    </span>
  );
}; 