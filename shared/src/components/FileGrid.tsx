"use client";

import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { File, Folder, GripVertical } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, formatFileSize } from '../utils/format';
import ClassificationBadge from './ClassificationBadge';

export interface FileGridItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: string;
    name: string;
  };
  isShared?: boolean;
  sharedWith?: number; // Number of people this is shared with
  // Classification properties
  classification?: {
    sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    expiresAt?: string;
    notes?: string;
  };
}

interface FileGridProps {
  items: FileGridItem[];
  viewMode: 'list' | 'grid';
  onItemClick?: (item: FileGridItem) => void;
  renderItem?: (item: FileGridItem) => React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  selectedIds?: string[];
  onSelectItem?: (id: string, selected: boolean) => void;
  onContextMenu: (e: React.MouseEvent, item: FileGridItem) => void;
  onReorder?: (newItems: FileGridItem[]) => void;
}

interface FileGridItemDraggableProps {
  item: FileGridItem;
  index: number;
  isSelected: boolean;
  onItemClick?: (item: FileGridItem) => void;
  renderItem?: (item: FileGridItem) => React.ReactNode;
  onSelectItem?: (id: string, selected: boolean) => void;
  draggingCount?: number | null;
  onContextMenu: (e: React.MouseEvent, item: FileGridItem) => void;
}

interface StyleProps {
  [key: string]: React.CSSProperties;
}

const styles: StyleProps = {
  gridItem: {
    position: 'relative',
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  ghostPreview: {
    position: 'absolute',
    top: 2,
    right: 2,
    background: '#2563eb',
    color: '#fff',
    borderRadius: '50%',
    fontSize: 12,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    zIndex: 100,
  },
  dropZone: {
    border: '2px dashed #2563eb',
    borderRadius: 8,
    background: 'rgba(37, 99, 235, 0.05)',
    transition: 'all 0.2s ease',
  },
  dropZoneActive: {
    border: '3px solid #2563eb',
    background: 'rgba(37, 99, 235, 0.15)',
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
};

function FileGridItemDraggable({ 
  item, 
  index, 
  isSelected, 
  onItemClick, 
  renderItem, 
  onSelectItem, 
  draggingCount,
  onContextMenu
}: FileGridItemDraggableProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: item.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ 
    id: item.id,
    disabled: item.type !== 'folder' // Only folders can be drop targets
  });

  const handleItemClick = () => {
    onItemClick?.(item);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectItem?.(item.id, e.target.checked);
  };

  // Combine refs for both drag and drop functionality
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    if (item.type === 'folder') {
      setDropRef(node);
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`relative rounded p-2 transition-all duration-200 ${
        isDragging ? 'bg-blue-100 opacity-50' : ''
      } ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${
        isOver && item.type === 'folder' ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
      style={{
        ...styles.gridItem,
        ...(isOver && item.type === 'folder' ? styles.dropZoneActive : {}),
        position: 'relative',
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e, item);
      }}
    >
      {/* Drag handle in top-right */}
      <div
        {...attributes}
        {...listeners}
        style={{ position: 'absolute', top: 4, right: 4, cursor: 'grab', zIndex: 10 }}
        onClick={e => e.stopPropagation()}
        title="Drag to move or drop on folders"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <GripVertical size={16} />
      </div>
      
      {/* Main clickable area - using button for proper semantics */}
      <button
        className={`w-full h-full cursor-pointer hover:bg-yellow-200 hover:border-2 hover:border-red-500 rounded transition-all duration-200 ${
          isDragging ? 'bg-blue-100 opacity-50' : ''
        }`}
        onClick={(e) => { 
          e.stopPropagation();
          handleItemClick(); 
        }}
        style={{ background: 'none', border: 'none', padding: 0 }}
        type="button"
      >
        <div style={styles.itemContent}>
          {onSelectItem && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { 
                e.stopPropagation(); 
                onSelectItem?.(item.id, e.target.checked); 
              }}
              onClick={(e) => { 
                e.stopPropagation(); 
              }}
              style={{ border: '2px solid red' }}
            />
          )}
          {renderItem ? renderItem(item) : (
            <div className="flex flex-col items-center justify-center p-2 h-28">
              <div className="mb-2">
                {item.type === 'folder' ? <Folder size={40} className="text-blue-500" /> : <File size={40} className="text-gray-500" />}
              </div>
              <span className="w-full text-center text-sm font-medium text-gray-700 truncate">{item.name}</span>
              {/* Classification Badge */}
              {item.classification && (
                <div className="mt-1">
                  <ClassificationBadge
                    sensitivity={item.classification.sensitivity}
                    expiresAt={item.classification.expiresAt}
                    showExpiration={true}
                    size="sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </button>
      
      {isDragging && draggingCount && draggingCount > 1 && (
        <div style={styles.ghostPreview}>
          +{draggingCount}
        </div>
      )}
    </div>
  );
}

export const FileGrid: React.FC<FileGridProps> = ({ 
  items, 
  viewMode, 
  onItemClick, 
  renderItem, 
  onDragEnd, 
  onDragStart,
  selectedIds = [], 
  onSelectItem,
  onContextMenu,
  onReorder
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingCount, setDraggingCount] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    setActiveId(activeId);
    setDraggingId(activeId);
    const isSelected = selectedIds.includes(activeId);
    setDraggingCount(isSelected ? selectedIds.length : 1);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    setDraggingCount(null);
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) {
      onDragEnd?.(event);
      return;
    }

    const draggedItem = items.find(item => item.id === active.id);
    const targetItem = items.find(item => item.id === over.id);

    // Check if this is a cross-folder move (dragging to a folder)
    if (draggedItem && targetItem && targetItem.type === 'folder' && draggedItem.id !== targetItem.id) {
      // This is a cross-folder move - let the parent handle it
      onDragEnd?.(event);
      return;
    }

    // This is a reorder operation within the same container
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder?.(newItems);
    }

    onDragEnd?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual feedback during drag over
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Could add hover effects here
    }
  };

  if (viewMode === 'list') {
    // Render as a list/table
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Classification</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Modified</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Size</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map(item => (
                         <tr 
                            key={item.id} 
                            className={`hover:bg-gray-50 ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}
                            onContextMenu={(e) => {
                                e.stopPropagation();
                                onContextMenu(e, item);
                            }}
                        >
                            <td className="p-3">
                                <input 
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onSelectItem?.(item.id, e.target.checked);
                                    }}
                                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                />
                            </td>
                            <td className="p-3">
                                <button
                                    className="w-full text-left text-sm font-medium text-gray-800 flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onItemClick?.(item);
                                    }}
                                    style={{ background: 'none', border: 'none' }}
                                    type="button"
                                >
                                    {item.type === 'file' ? <File size={20} className="text-gray-500" /> : <Folder size={20} className="text-blue-500" />}
                                    {item.name}
                                </button>
                            </td>
                            <td className="p-3">
                                {item.classification ? (
                                    <ClassificationBadge
                                        sensitivity={item.classification.sensitivity}
                                        expiresAt={item.classification.expiresAt}
                                        showExpiration={true}
                                        size="sm"
                                    />
                                ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-gray-600">{item.updatedAt ? formatDate(item.updatedAt) : '—'}</td>
                            <td className="p-3 text-sm text-gray-600">{item.type === 'file' ? formatFileSize(item.size || 0) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  // Render as a grid
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, index) => (
          <FileGridItemDraggable
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedIds.includes(item.id)}
            onItemClick={onItemClick}
            renderItem={renderItem}
            onSelectItem={onSelectItem}
            draggingCount={draggingCount}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </DndContext>
  );
}; 