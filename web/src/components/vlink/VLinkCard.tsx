'use client';

import React from 'react';
import { Link2 } from 'lucide-react';
import type { VLinkSummary } from '@/api/vlinks';

interface VLinkCardProps {
  vlink: VLinkSummary;
  onOpen: (id: string) => void;
}

export function VLinkCard({ vlink, onOpen }: VLinkCardProps) {
  const accessibleTotal = Object.values(vlink.entityCounts.accessible).reduce((a, b) => a + b, 0);
  const restricted = vlink.entityCounts.restricted;

  return (
    <button
      type="button"
      onClick={() => onOpen(vlink.id)}
      className="text-left w-full border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{vlink.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{vlink.publicCode}</p>
        </div>
        <Link2 size={18} className="text-indigo-600 shrink-0" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{vlink.scope}</span>
        {vlink.childVLinkCount > 0 && (
          <span className="bg-gray-100 px-2 py-0.5 rounded">{vlink.childVLinkCount} nested</span>
        )}
        <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">{accessibleTotal} linked</span>
        {restricted > 0 && (
          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded">+{restricted} restricted</span>
        )}
      </div>
    </button>
  );
}
