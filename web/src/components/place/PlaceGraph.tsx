'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import HouseholdNode from './nodes/HouseholdNode';
import BusinessProfilePanel from './BusinessProfilePanel';
import HouseholdProfilePanel from './HouseholdProfilePanel';
import { PlaceGraphEmptyState } from './PlaceEmptyStates';

const nodeTypes: NodeTypes = {
  business: BusinessNode,
  user: UserNode,
  household: HouseholdNode,
};

const COLORS = {
  restaurant: '#E53935',
  retail: '#1E88E5',
  grocery: '#43A047',
  digital: '#8E24AA',
  service: '#FB8C00',
  default: '#546E7A',
  user: '#00ACC1',
  household: '#8D6E63',
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

function getFlowNodeType(nodeType: string): string {
  switch (nodeType) {
    case 'USER': return 'user';
    case 'HOUSEHOLD': return 'household';
    default: return 'business';
  }
}

function getDefaultColor(pn: PlaceNodeData): string {
  switch (pn.nodeType) {
    case 'USER': return COLORS.user;
    case 'HOUSEHOLD': return COLORS.household;
    default: return getCategoryColor(pn.label);
  }
}

function placeNodesToFlowNodes(placeNodes: PlaceNodeData[]): Node[] {
  return placeNodes.map((pn, i) => {
    const angle = (2 * Math.PI * i) / Math.max(placeNodes.length, 1);
    const radius = 200 + Math.random() * 100;

    return {
      id: pn.id,
      type: getFlowNodeType(pn.nodeType),
      position: {
        x: pn.positionX ?? Math.cos(angle) * radius + 400,
        y: pn.positionY ?? Math.sin(angle) * radius + 300,
      },
      data: {
        label: pn.label || pn.entityId,
        entityId: pn.entityId,
        nodeType: pn.nodeType,
        color: pn.color || getDefaultColor(pn),
        pinned: pn.pinned,
        verified: pn.verified,
        imageUrl: pn.imageUrl ?? undefined,
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

function nodeTypeLabel(nodeType: string): string {
  switch (nodeType) {
    case 'BUSINESS': return 'Business';
    case 'HOUSEHOLD': return 'Household';
    case 'USER': return 'Connection';
    default: return 'Node';
  }
}

interface PlaceGraphProps {
  highlightBusinessId?: string;
}

export default function PlaceGraph({ highlightBusinessId }: PlaceGraphProps) {
  const { place, updateNodePosition } = usePlace();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [showNodeList, setShowNodeList] = useState(false);
  const hasAppliedHighlight = useRef(false);

  useEffect(() => {
    if (!highlightBusinessId || !place?.nodes.length || hasAppliedHighlight.current) return;
    const hasNode = place.nodes.some(
      (n) => n.nodeType === 'BUSINESS' && n.entityId === highlightBusinessId
    );
    if (hasNode) {
      hasAppliedHighlight.current = true;
      setSelectedBusinessId(highlightBusinessId);
    }
  }, [highlightBusinessId, place?.nodes]);

  const initialNodes = useMemo(() => {
    if (!place?.nodes.length) return [];
    const placeFlowNodes = placeNodesToFlowNodes(place.nodes);

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

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const openNode = useCallback((pn: PlaceNodeData) => {
    if (pn.nodeType === 'BUSINESS') {
      setSelectedHouseholdId(null);
      setSelectedBusinessId(pn.entityId);
    } else if (pn.nodeType === 'HOUSEHOLD') {
      setSelectedBusinessId(null);
      setSelectedHouseholdId(pn.entityId);
    }
    setShowNodeList(false);
  }, []);

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
      setSelectedHouseholdId(null);
      setSelectedBusinessId(data.entityId);
    } else if (data.nodeType === 'HOUSEHOLD') {
      setSelectedBusinessId(null);
      setSelectedHouseholdId(data.entityId);
    }
  }, []);

  const isEmpty = !place?.nodes.length;

  if (isEmpty) {
    return <PlaceGraphEmptyState />;
  }

  const visibleNodes = place?.nodes ?? [];

  return (
    <div
      className="relative h-full w-full bg-[#F0F2EC] dark:bg-slate-900"
      role="application"
      aria-label="Your neighborhood map"
      aria-describedby="place-graph-instructions"
    >
      <p id="place-graph-instructions" className="sr-only">
        Interactive neighborhood map. Use the node list button to open businesses and connections with the keyboard,
        or select nodes on the map. Zoom controls are in the bottom-left corner.
      </p>

      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowNodeList(open => !open)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          aria-expanded={showNodeList}
          aria-controls="place-graph-node-list"
        >
          {showNodeList ? 'Hide node list' : 'Node list'}
        </button>

        {showNodeList && (
          <nav
            id="place-graph-node-list"
            aria-label="Neighborhood nodes"
            className="max-h-48 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          >
            <ul className="space-y-1">
              {visibleNodes.map(pn => (
                <li key={pn.id}>
                  <button
                    type="button"
                    onClick={() => openNode(pn)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-800 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-indigo-950"
                  >
                    <span className="font-medium">{pn.label || pn.entityId}</span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">({nodeTypeLabel(pn.nodeType)})</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid
        snapGrid={[22, 22]}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        className="dark:[--xy-background-color:theme(colors.slate.900)]"
        aria-label="Neighborhood graph canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={2.5} color="#C5CBBA" className="dark:opacity-40" />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border-gray-200 !shadow-md dark:!border-slate-600 dark:!bg-slate-800"
          aria-label="Graph zoom controls"
        />
        <MiniMap
          nodeColor={(node) => (node.data as Record<string, string>)?.color || '#546E7A'}
          maskColor="rgba(255, 255, 255, 0.7)"
          className="!rounded-lg !border !border-gray-200 dark:!border-slate-600 dark:!bg-slate-800"
          aria-label="Graph minimap"
        />
      </ReactFlow>

      {selectedBusinessId && (
        <BusinessProfilePanel
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}

      {selectedHouseholdId && (
        <HouseholdProfilePanel
          householdId={selectedHouseholdId}
          onClose={() => setSelectedHouseholdId(null)}
        />
      )}
    </div>
  );
}
