'use client';

import React, { useState, useCallback } from 'react';
import { Card, Button } from 'shared/components';
import { 
  Grid, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff,
  GripVertical,
  Settings as SettingsIcon
} from 'lucide-react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Widget {
  id: string;
  widgetType: string;
  title: string;
  description?: string;
  position: WidgetPosition;
  visible: boolean;
  order: number;
  settings?: Record<string, unknown>;
  visibility?: {
    requiredPermission?: string;
    visibleToRoles?: string[];
    visibleToTiers?: string[];
    visibleToPositions?: string[];
    visibleToDepartments?: string[];
  };
}

interface FrontPageLayoutDesignerProps {
  widgets: Widget[];
  onChange: (widgets: Widget[]) => void;
  onEditWidget: (widget: Widget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onAddWidget: () => void;
  className?: string;
}

// ============================================================================
// SORTABLE WIDGET ITEM
// ============================================================================

interface SortableWidgetProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onResize: (size: 'small' | 'medium' | 'large') => void;
}

function SortableWidget({ widget, onEdit, onDelete, onToggleVisibility, onResize }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getWidgetIcon = (type: string) => {
    const icons: Record<string, string> = {
      'ai-assistant': '🤖',
      'company-stats': '📊',
      'personal-stats': '👤',
      'announcements': '📢',
      'quick-actions': '⚡',
      'recent-activity': '📋',
      'upcoming-events': '📅',
      'team-highlights': '⭐',
      'metrics': '📈',
      'tasks': '✓',
    };
    return icons[type] || '📦';
  };

  const getSizeClass = () => {
    const width = widget.position.width;
    if (width <= 4) return 'col-span-1';
    if (width <= 8) return 'col-span-2';
    return 'col-span-3';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getSizeClass()} ${!widget.visible ? 'opacity-50' : ''}`}
    >
      <Card className={`p-4 h-full border-2 ${isDragging ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-400 transition-colors`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </div>
            <span className="text-2xl">{getWidgetIcon(widget.widgetType)}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900">{widget.title}</h4>
              {widget.description && (
                <p className="text-xs text-gray-500 mt-0.5">{widget.description}</p>
              )}
            </div>
          </div>

          {/* Visibility Toggle */}
          <button
            onClick={onToggleVisibility}
            className="p-1 hover:bg-gray-100 rounded"
            title={widget.visible ? 'Hide widget' : 'Show widget'}
          >
            {widget.visible ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Widget Type Badge */}
        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {widget.widgetType}
          </span>
        </div>

        {/* Permissions Info */}
        {widget.visibility && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium text-gray-700 mb-1">Visible to:</div>
            {widget.visibility.visibleToRoles && widget.visibility.visibleToRoles.length > 0 && (
              <div className="text-gray-600">Roles: {widget.visibility.visibleToRoles.join(', ')}</div>
            )}
            {widget.visibility.visibleToTiers && widget.visibility.visibleToTiers.length > 0 && (
              <div className="text-gray-600">Tiers: {widget.visibility.visibleToTiers.join(', ')}</div>
            )}
            {widget.visibility.visibleToPositions && widget.visibility.visibleToPositions.length > 0 && (
              <div className="text-gray-600">Positions: {widget.visibility.visibleToPositions.join(', ')}</div>
            )}
            {widget.visibility.visibleToDepartments && widget.visibility.visibleToDepartments.length > 0 && (
              <div className="text-gray-600">Depts: {widget.visibility.visibleToDepartments.join(', ')}</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Size Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onResize('small')}
              className={`p-1 rounded hover:bg-gray-100 ${widget.position.width <= 4 ? 'bg-blue-100' : ''}`}
              title="Small (1/3 width)"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onResize('medium')}
              className={`p-1 rounded hover:bg-gray-100 ${widget.position.width > 4 && widget.position.width <= 8 ? 'bg-blue-100' : ''}`}
              title="Medium (2/3 width)"
            >
              <Grid className="w-3 h-3" />
            </button>
            <button
              onClick={() => onResize('large')}
              className={`p-1 rounded hover:bg-gray-100 ${widget.position.width > 8 ? 'bg-blue-100' : ''}`}
              title="Large (full width)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Edit & Delete */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Edit widget"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
              title="Delete widget"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FrontPageLayoutDesigner({
  widgets,
  onChange,
  onEditWidget,
  onDeleteWidget,
  onAddWidget,
  className = '',
}: FrontPageLayoutDesignerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex).map((w, idx) => ({
        ...w,
        order: idx,
      }));

      onChange(reorderedWidgets);
    }

    setActiveId(null);
  };

  const handleToggleVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    onChange(updatedWidgets);
  };

  const handleResize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    const sizeMap = {
      small: { width: 4, height: 4 },
      medium: { width: 8, height: 4 },
      large: { width: 12, height: 4 },
    };

    const updatedWidgets = widgets.map((w) =>
      w.id === widgetId
        ? { ...w, position: { ...w.position, ...sizeMap[size] } }
        : w
    );
    onChange(updatedWidgets);
  };

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Layout Designer</h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag to reorder, resize widgets, and control visibility
          </p>
        </div>
        <Button onClick={onAddWidget} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Widget</span>
        </Button>
      </div>

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onEdit={() => onEditWidget(widget)}
                onDelete={() => onDeleteWidget(widget.id)}
                onToggleVisibility={() => handleToggleVisibility(widget.id)}
                onResize={(size) => handleResize(widget.id, size)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWidget ? (
            <Card className="p-4 shadow-2xl border-2 border-blue-500 opacity-90">
              <div className="flex items-center space-x-2">
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="text-2xl">{activeWidget.widgetType === 'ai-assistant' ? '🤖' : '📦'}</span>
                <span className="font-semibold text-sm">{activeWidget.title}</span>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Grid className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No widgets yet</h4>
          <p className="text-gray-600 mb-4">Add your first widget to get started</p>
          <Button onClick={onAddWidget} className="flex items-center space-x-2 mx-auto">
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-sm text-blue-900 mb-2">Layout Tips:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Drag</strong> widgets to reorder them</li>
          <li>• Use <strong>resize buttons</strong> to change widget width (small/medium/large)</li>
          <li>• <strong>Eye icon</strong> toggles widget visibility on/off</li>
          <li>• <strong>Settings icon</strong> opens detailed widget configuration</li>
          <li>• Widgets with permissions will only show to specific users</li>
        </ul>
      </div>
    </div>
  );
}

