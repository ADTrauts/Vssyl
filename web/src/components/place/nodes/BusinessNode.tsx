'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface BusinessNodeData {
  label: string;
  entityId: string;
  nodeType: string;
  color: string;
  pinned: boolean;
  verified?: boolean;
  imageUrl?: string | null;
  [key: string]: unknown;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const BusinessNode = memo(function BusinessNode({ data }: NodeProps) {
  const nodeData = data as unknown as BusinessNodeData;
  const accent = nodeData.color || '#546E7A';

  return (
    <div
      role="button"
      aria-label={`Business: ${nodeData.label}${nodeData.verified ? ' (verified)' : ''}`}
      tabIndex={0}
      className="relative flex cursor-pointer flex-col items-center gap-1.5"
    >
      <div className="relative">
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-[3px] border-white/90 shadow-sm transition-transform group-hover:scale-105 dark:border-slate-200/90"
          style={{
            backgroundColor: nodeData.imageUrl ? 'transparent' : accent,
            boxShadow: `0 2px 12px ${accent}40, 0 1px 3px rgba(0,0,0,0.1)`,
          }}
        >
          {nodeData.imageUrl ? (
            <img src={nodeData.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold tracking-wide text-white">
              {getInitials(nodeData.label || '')}
            </span>
          )}
        </div>

        {nodeData.verified && (
          <div
            className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-green-600 dark:border-slate-900"
            title="Verified business"
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-[80px] truncate text-center text-[11px] font-semibold leading-tight text-gray-700 dark:text-gray-300">
        {nodeData.label}
      </div>

      <Handle type="target" position={Position.Top} className="!h-px !w-px !opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!h-px !w-px !opacity-0" />
    </div>
  );
});

export default BusinessNode;
