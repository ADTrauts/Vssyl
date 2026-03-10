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
  const size = 56;

  return (
    <div
      role="button"
      aria-label={`Business: ${nodeData.label}${nodeData.verified ? ' (verified)' : ''}`}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Square node — businesses are squares in Mini Metro style; show cover/logo when available */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 8,
            background: nodeData.imageUrl ? 'transparent' : (nodeData.color || '#546E7A'),
            border: '3px solid rgba(255,255,255,0.9)',
            boxShadow: `0 2px 12px ${nodeData.color || '#546E7A'}40, 0 1px 3px rgba(0,0,0,0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          {nodeData.imageUrl ? (
            <img
              src={nodeData.imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ fontSize: 18, color: '#fff', fontWeight: 700, letterSpacing: 1 }}>
              {getInitials(nodeData.label || '')}
            </span>
          )}
        </div>

        {/* Verification badge */}
        {nodeData.verified && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#16a34a',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Verified business"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
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

export default BusinessNode;
