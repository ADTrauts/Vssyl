"use client";

import React, { useState } from 'react';

type AccordionItem = {
  title: string;
  content: React.ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  multiple?: boolean;
};

export const Accordion: React.FC<AccordionProps> = ({ items, multiple = false }) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggle = (idx: number) => {
    if (multiple) {
      setOpenIndexes(openIndexes.includes(idx)
        ? openIndexes.filter(i => i !== idx)
        : [...openIndexes, idx]);
    } else {
      setOpenIndexes(openIndexes[0] === idx ? [] : [idx]);
    }
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="mb-2 border rounded">
          <button
            className="w-full text-left px-4 py-2 font-semibold bg-gray-100 hover:bg-gray-200 rounded-t"
            onClick={() => toggle(idx)}
          >
            {item.title}
          </button>
          {openIndexes.includes(idx) && (
            <div className="px-4 py-2 bg-white rounded-b border-t">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 