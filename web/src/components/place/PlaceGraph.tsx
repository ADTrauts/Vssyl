'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  ConnectionMode,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePlace, PlaceNode as PlaceNodeData } from '../../contexts/PlaceContext';
import BusinessNode from './nodes/BusinessNode';
import UserNode from './nodes/UserNode';
import BusinessProfilePanel from './BusinessProfilePanel';

const nodeTypes: NodeTypes = {
  business: BusinessNode,
  user: UserNode,
};

// Mini Metro color palette
const COLORS = {
  restaurant: '#E53935',
  retail: '#1E88E5',
  grocery: '#43A047',
  digital: '#8E24AA',
  service: '#FB8C00',
  default: '#546E7A',
  user: '#00ACC1',
};

function getCategoryColor(label?: string | null): string {
  if (!label) return COLORS.default;
  const lower = label.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('food')) return COLORS.restaurant;
  if (lower.includes('retail') || lower.includes('store') || lower.includes('shop')) return COLORS.retail;
  if (lower.includes('grocery') || lower.includes('market')) return COLORS.grocery;
  if (lower.includes('digital') || lower.includes('online') || lower.includes('tech')) return COLORS.digital;
  if (lower.includes('service')) return COLORS.service;
  return COLORS.default;
}

function placeNodesToFlowNodes(placeNodes: PlaceNodeData[]): Node[] {
  return placeNodes.map((pn, i) => {
    const isUser = pn.nodeType === 'USER';
    const angle = (2 * Math.PI * i) / Math.max(placeNodes.length, 1);
    const radius = 200 + Math.random() * 100;

    return {
      id: pn.id,
      type: isUser ? 'user' : 'business',
      position: {
        x: pn.positionX ?? Math.cos(angle) * radius + 400,
        y: pn.positionY ?? Math.sin(angle) * radius + 300,
      },
      data: {
        label: pn.label || pn.entityId,
        entityId: pn.entityId,
        nodeType: pn.nodeType,
        color: pn.color || (isUser ? COLORS.user : getCategoryColor(pn.label)),
        pinned: pn.pinned,
        verified: pn.verified,
      },
      draggable: true,
    };
  });
}

function generateEdges(nodes: Node[]): Edge[] {
  const centerNodeId = '__center__';
  return nodes.map(node => ({
    id: `e-center-${node.id}`,
    source: centerNodeId,
    target: node.id,
    style: { stroke: '#B0BEC5', strokeWidth: 1.5, opacity: 0.4 },
    animated: false,
  }));
}

export default function PlaceGraph() {
  const { place, updateNodePosition } = usePlace();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const initialNodes = useMemo(() => {
    if (!place?.nodes.length) return [];
    const placeFlowNodes = placeNodesToFlowNodes(place.nodes);

    // Add invisible center node for radial layout
    const centerNode: Node = {
      id: '__center__',
      type: 'default',
      position: { x: 400, y: 300 },
      data: { label: '' },
      style: { width: 0, height: 0, border: 'none', background: 'transparent', padding: 0 },
      selectable: false,
      draggable: false,
    };

    return [centerNode, ...placeFlowNodes];
  }, [place?.nodes]);

  const initialEdges = useMemo(() => {
    if (!place?.nodes.length) return [];
    const flowNodes = placeNodesToFlowNodes(place.nodes);
    return generateEdges(flowNodes);
  }, [place?.nodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when place data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    for (const change of changes) {
      if (change.type === 'position' && change.position && change.dragging === false && change.id !== '__center__') {
        updateNodePosition(change.id, change.position.x, change.position.y, true);
      }
    }
  }, [onNodesChange, updateNodePosition]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id === '__center__') return;
    const data = node.data as Record<string, string>;
    if (data.nodeType === 'BUSINESS') {
      setSelectedBusinessId(data.entityId);
    }
  }, []);

  const isEmpty = !place?.nodes.length;

  if (isEmpty) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        color: '#374151',
      }}>
        <div style={{ fontSize: 64, opacity: 0.3 }}>🏘️</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Your Main Street is Empty</h2>
        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 400, textAlign: 'center' }}>
          Head over to the <strong>Explore</strong> tab to discover local businesses and start building your personal neighborhood.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} role="application" aria-label="Your neighborhood map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#EBEEE9' }}
      >
        {/* Major road grid — wide blocks like a real street map */}
        <Background id="major-roads" variant={BackgroundVariant.Lines} gap={200} size={2} color="#D9DDD6" />
        {/* Minor road grid — smaller lanes between major roads */}
        <Background id="minor-roads" variant={BackgroundVariant.Lines} gap={100} size={1} color="#E2E5DF" />
        {/* Small intersection dots at the grid intersections */}
        <Background id="intersections" variant={BackgroundVariant.Dots} gap={200} size={3} color="#D0D4CC" />
        <Controls
          showInteractive={false}
          style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        />
        <MiniMap
          nodeColor={(node) => (node.data as Record<string, string>)?.color || '#546E7A'}
          maskColor="rgba(255, 255, 255, 0.7)"
          style={{ borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
      </ReactFlow>

      {selectedBusinessId && (
        <BusinessProfilePanel
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}
    </div>
  );
}
