'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Link2 } from 'lucide-react';
import { VLINK_DRAG_MIME } from '@/contexts/VLinkDragContext';

export function VLinkSidebarButton() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname?.startsWith('/vlink');

  return (
    <button
      type="button"
      draggable
      className={`flex items-center justify-center w-10 h-10 my-1 rounded-lg transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'
      }`}
      style={{
        background: active ? '#4f46e5' : 'transparent',
        color: active ? '#fff' : '#cbd5e1',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        width: 40,
        height: 40,
        margin: '8px 0',
        borderRadius: 8,
      }}
      onClick={() => router.push('/vlink')}
      onDragStart={(e) => {
        e.dataTransfer.setData(VLINK_DRAG_MIME, '1');
        e.dataTransfer.effectAllowed = 'link';
      }}
      title="V_Link — click to open, drag onto items to link"
      aria-label="Open V_Link"
    >
      <Link2 size={22} />
    </button>
  );
}
