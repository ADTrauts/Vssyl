'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Spinner } from 'shared/components';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download,
  Edit,
  Users as UsersIcon,
  Building2
} from 'lucide-react';
import type { OrgChartStructure, Position as APIPosition } from '@/api/orgChart';

// Local Position type with additional fields for visual rendering
type Position = APIPosition & {
  reportsToId?: string | null;
  employeePositions?: any[];
  title?: string; // DB uses 'title' instead of 'name'
};

interface OrgChartVisualViewProps {
  orgChartData: OrgChartStructure;
  businessId: string;
  onUpdate: () => void;
  onEditPosition?: (position: any) => void;
}

interface TreeNode {
  position: Position;
  children: TreeNode[];
  x: number;
  y: number;
  level: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const LEVEL_HEIGHT = 150;
const SIBLING_SPACING = 40;

export function OrgChartVisualView({ 
  orgChartData, 
  businessId, 
  onUpdate,
  onEditPosition 
}: OrgChartVisualViewProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (orgChartData?.positions) {
      setPositions(orgChartData.positions);
      buildTree(orgChartData.positions);
    }
  }, [orgChartData]);

  // Build hierarchical tree structure
  const buildTree = (positions: Position[]) => {
    // Find root nodes (positions with no reportsTo)
    const roots = positions.filter(p => !p.reportsToId);
    
    if (roots.length === 0) {
      setTreeData(null);
      return;
    }

    // Build tree from first root (typically CEO)
    const tree = buildTreeNode(roots[0], positions, 0);
    calculateNodePositions(tree, 0, 0);
    setTreeData(tree);
  };

  const buildTreeNode = (position: Position, allPositions: Position[], level: number): TreeNode => {
    const children = allPositions
      .filter(p => p.reportsToId === position.id)
      .map(p => buildTreeNode(p, allPositions, level + 1));

    return {
      position,
      children,
      x: 0,
      y: level * LEVEL_HEIGHT,
      level
    };
  };

  // Calculate x,y positions for each node
  const calculateNodePositions = (node: TreeNode, x: number, y: number): number => {
    node.y = y;

    if (node.children.length === 0) {
      node.x = x;
      return x + NODE_WIDTH + SIBLING_SPACING;
    }

    // Calculate positions for children first
    let childX = x;
    node.children.forEach(child => {
      childX = calculateNodePositions(child, childX, y + LEVEL_HEIGHT);
    });

    // Center parent above children
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = (firstChild.x + lastChild.x) / 2;

    return childX;
  };

  // Get tree bounds for centering
  const getTreeBounds = (node: TreeNode | null): { minX: number; maxX: number; minY: number; maxY: number } => {
    if (!node) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    let minX = node.x;
    let maxX = node.x;
    let minY = node.y;
    let maxY = node.y;

    const traverse = (n: TreeNode) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
      n.children.forEach(traverse);
    };

    traverse(node);
    return { minX, maxX, minY, maxY };
  };

  // Render tree connections
  const renderConnections = (node: TreeNode): JSX.Element[] => {
    const lines: JSX.Element[] = [];

    node.children.forEach(child => {
      const startX = node.x + NODE_WIDTH / 2;
      const startY = node.y + NODE_HEIGHT;
      const endX = child.x + NODE_WIDTH / 2;
      const endY = child.y;

      // Curved path for connections
      const midY = (startY + endY) / 2;
      const path = `M ${startX} ${startY} 
                    L ${startX} ${midY} 
                    L ${endX} ${midY} 
                    L ${endX} ${endY}`;

      lines.push(
        <path
          key={`${node.position.id}-${child.position.id}`}
          d={path}
          stroke="#94a3b8"
          strokeWidth="2"
          fill="none"
          className="transition-all duration-200"
        />
      );

      // Recursively render child connections
      lines.push(...renderConnections(child));
    });

    return lines;
  };

  // Render tree nodes
  const renderNodes = (node: TreeNode): JSX.Element[] => {
    const nodes: JSX.Element[] = [];
    const isSelected = selectedNode === node.position.id;
    const isHovered = hoveredNode === node.position.id;
    const employeeCount = node.position.employeePositions?.length || 0;

    nodes.push(
      <g
        key={node.position.id}
        transform={`translate(${node.x}, ${node.y})`}
        onClick={() => setSelectedNode(node.position.id)}
        onMouseEnter={() => setHoveredNode(node.position.id)}
        onMouseLeave={() => setHoveredNode(null)}
        className="cursor-pointer transition-all duration-200"
      >
        {/* Node background */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="8"
          fill="white"
          stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#e2e8f0'}
          strokeWidth={isSelected ? '3' : '2'}
          className="transition-all duration-200"
          style={{
            filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
          }}
        />

        {/* Tier indicator */}
        <rect
          width={NODE_WIDTH}
          height="8"
          rx="8 8 0 0"
          fill={getTierColor(node.position.tier?.level || 1)}
        />

        {/* Position name/title */}
        <text
          x={NODE_WIDTH / 2}
          y={30}
          textAnchor="middle"
          className="font-semibold text-sm fill-gray-900"
          style={{ fontSize: '14px' }}
        >
          {truncateText(node.position.name || node.position.title || 'Untitled', 20)}
        </text>

        {/* Department */}
        {node.position.department && (
          <text
            x={NODE_WIDTH / 2}
            y={48}
            textAnchor="middle"
            className="text-xs fill-gray-600"
            style={{ fontSize: '11px' }}
          >
            {truncateText(node.position.department.name, 22)}
          </text>
        )}

        {/* Employee count */}
        <g transform={`translate(10, ${NODE_HEIGHT - 24})`}>
          <circle r="10" fill="#e0f2fe" />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="text-xs font-medium fill-blue-600"
            style={{ fontSize: '10px' }}
          >
            {employeeCount}
          </text>
        </g>

        {/* Edit button (on hover) */}
        {isHovered && onEditPosition && (
          <g
            transform={`translate(${NODE_WIDTH - 30}, ${NODE_HEIGHT - 24})`}
            onClick={(e) => {
              e.stopPropagation();
              onEditPosition(node.position);
            }}
            className="cursor-pointer"
          >
            <circle r="10" fill="#3b82f6" className="hover:fill-blue-700" />
            <path
              d="M -3 0 L 0 -3 L 3 0 L 0 3 Z"
              fill="white"
              transform="scale(0.6)"
            />
          </g>
        )}
      </g>
    );

    // Recursively render children
    node.children.forEach(child => {
      nodes.push(...renderNodes(child));
    });

    return nodes;
  };

  const getTierColor = (level: number): string => {
    const colors = [
      '#ef4444', // Level 1 - Red (C-Suite)
      '#f97316', // Level 2 - Orange (VP)
      '#eab308', // Level 3 - Yellow (Director)
      '#22c55e', // Level 4 - Green (Manager)
      '#3b82f6', // Level 5 - Blue (Employee)
    ];
    return colors[level - 1] || colors[4];
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Export as SVG
  const handleExport = () => {
    // TODO: Implement SVG export
    alert('Export feature coming soon!');
  };

  if (!orgChartData || !orgChartData.positions || orgChartData.positions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Positions Yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first positions in the Organization Chart tab to see the visual hierarchy.
          </p>
        </div>
      </Card>
    );
  }

  if (!treeData) {
    return (
      <Card className="p-12 text-center">
        <Spinner size={32} />
        <p className="mt-4 text-gray-600">Building organization chart...</p>
      </Card>
    );
  }

  const bounds = getTreeBounds(treeData);
  const viewBoxWidth = (bounds.maxX - bounds.minX) + NODE_WIDTH + 200;
  const viewBoxHeight = (bounds.maxY - bounds.minY) + NODE_HEIGHT + 200;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              className="flex items-center space-x-1"
            >
              <ZoomIn className="w-4 h-4" />
              <span>Zoom In</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              className="flex items-center space-x-1"
            >
              <ZoomOut className="w-4 h-4" />
              <span>Zoom Out</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetView}
              className="flex items-center space-x-1"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Reset View</span>
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{positions.length}</span> positions
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Visual Chart */}
      <Card className="p-0 overflow-hidden">
        <div
          ref={containerRef}
          className={`w-full h-[600px] bg-gray-50 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`${bounds.minX - 100} ${bounds.minY - 100} ${viewBoxWidth} ${viewBoxHeight}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* Render connections first (behind nodes) */}
            <g className="connections">
              {renderConnections(treeData)}
            </g>

            {/* Render nodes */}
            <g className="nodes">
              {renderNodes(treeData)}
            </g>
          </svg>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Tier Levels:</span>
            {[
              { level: 1, name: 'C-Suite', color: '#ef4444' },
              { level: 2, name: 'VP', color: '#f97316' },
              { level: 3, name: 'Director', color: '#eab308' },
              { level: 4, name: 'Manager', color: '#22c55e' },
              { level: 5, name: 'Employee', color: '#3b82f6' },
            ].map(tier => (
              <div key={tier.level} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-xs text-gray-600">{tier.name}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Click nodes to select • Hover to edit • Drag to pan
          </div>
        </div>
      </Card>
    </div>
  );
}

