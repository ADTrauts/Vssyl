'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface UserNodeData {
  label: string;
  entityId: string;
  nodeType: string;
  color: string;
  pinned: boolean;
  [key: string]: unknown;
}

const UserNode = memo(function UserNode({ data }: NodeProps) {
  const nodeData = data as unknown as UserNodeData;
  const size = 48;

  return (
    <div
      role="button"
      aria-label={`Connection: ${nodeData.label}`}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      {/* Circle node — users are circles in Mini Metro style */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: nodeData.color || '#00ACC1',
          border: '3px solid rgba(255,255,255,0.9)',
          boxShadow: `0 2px 12px ${nodeData.color || '#00ACC1'}40, 0 1px 3px rgba(0,0,0,0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: 18, color: '#fff', fontWeight: 700 }}>
          {(nodeData.label || '?')[0].toUpperCase()}
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#374151',
          maxWidth: 70,
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

export default UserNode;
