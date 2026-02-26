'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface HouseholdNodeData {
  label: string;
  entityId: string;
  nodeType: string;
  color: string;
  pinned: boolean;
  [key: string]: unknown;
}

const HouseholdNode = memo(function HouseholdNode({ data }: NodeProps) {
  const nodeData = data as unknown as HouseholdNodeData;
  const size = 52;

  return (
    <div
      role="button"
      aria-label={`Home: ${nodeData.label}`}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      {/* Pentagon-ish house shape via clip-path */}
      <div
        style={{
          width: size,
          height: size,
          background: nodeData.color || '#8D6E63',
          clipPath: 'polygon(50% 0%, 100% 35%, 100% 100%, 0% 100%, 0% 35%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(0 2px 8px ${nodeData.color || '#8D6E63'}40)`,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {/* House icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginTop: 6 }}
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#374151',
          maxWidth: 80,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        {nodeData.label}
      </div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
});

export default HouseholdNode;
