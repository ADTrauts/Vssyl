'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Avatar, Badge, Spinner } from 'shared/components';
import { 
  Folder, 
  File, 
  Upload, 
  Search, 
  MoreVertical, 
  Grid, 
  List,
  Download,
  Share,
  Trash2,
  Star,
  Eye,
  Pin,
  SlidersHorizontal,
  MessageSquare,
  Brain,
  HelpCircle,
  Keyboard,
  CheckSquare,
  Square,
  Check,
  Link2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDashboard } from '../../contexts/DashboardContext';
import { useGlobalSearch } from '../../contexts/GlobalSearchContext';
import { ShareModal, ShareLinkModal, Modal } from 'shared/components';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import DriveDetailsPanel from '../drive/DriveDetailsPanel';
import { useDriveWebSocket } from '../../hooks/useDriveWebSocket';
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  toggleFileStarred,
  toggleFolderStarred,
  File as DriveFile,
  Folder as DriveFolder,
  downloadFile,
  shareItemByEmail,
  listFilePermissions,
  grantFilePermission,
  updateFilePermission,
  revokeFilePermission,
  listFolderPermissions,
  grantFolderPermission,
  updateFolderPermission,
  revokeFolderPermission,
  shareFolderByEmail,
  searchUsers,
  getBusinessMembers,
  moveFile,
  moveFolder
} from '@/api/drive';
import { VLinkIndicator, VLinkCornerMarker } from '@/components/vlink/VLinkIndicator';
import { getVLinksForEntity } from '@/api/vlinks';
import {
  isVLinkSidebarDrag,
  parseVLinkDropPayload,
  useVLinkDrag,
  type VLinkDragEntity,
} from '@/contexts/VLinkDragContext';
import {
  isExternalFileDragTransfer,
  resolveDriveUploadFolderId,
} from '@/lib/driveDragDrop';

interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedAt: string;
  createdBy: string;
  permissions: string[];
  starred?: boolean;
  shared?: boolean;
  mimeType?: string;
  thumbnail?: string;
  url?: string;
}

interface DriveModuleProps {
  className?: string;
  refreshTrigger?: number;
  dashboardId?: string | null;
  selectedFolderId?: string | null;
  selectedFileId?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
  onRegisterDragEndHandler?: (handler: (event: DragEndEvent | null) => Promise<void>) => void;
}

function isTempUploadId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('temp-upload-');
}

const EMPTY_IMAGE_DATA_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

function getFileThumbnailUrl(item: DriveItem): string {
  if (isTempUploadId(item.id)) return EMPTY_IMAGE_DATA_URL;
  return `/api/drive/files/${item.id}/download`;
}

function driveItemToVLinkEntity(
  item: DriveItem,
  dashboardId: string | null | undefined,
  businessId: string | null | undefined,
  householdId: string | null | undefined
): VLinkDragEntity {
  return {
    entityType: item.type === 'folder' ? 'FOLDER' : 'FILE',
    entityId: item.id,
    moduleId: 'drive',
    title: item.name,
    dashboardId: dashboardId ?? undefined,
    businessId: businessId ?? null,
    householdId: householdId ?? null,
  };
}

// Root drop zone component for moving items back to root
function RootDropZone({ 
  currentFolder 
}: { 
  currentFolder: string | null; 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'drive-root',
    disabled: !currentFolder, // Only active when in a folder
  });

  if (!currentFolder) return null;

  return (
    <div
      ref={setNodeRef}
      className={`mb-4 p-4 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {isOver ? 'Drop here to move to root' : 'Drag items here to move to root'}
      </div>
    </div>
  );
}


// Draggable and droppable item component - Memoized for performance
const DraggableItem = React.memo(function DraggableItem({
  item,
  isSelected,
  isDragging,
  isFocused = false,
  onClick,
  onContextMenu,
  getFileIcon,
  formatFileSize,
  formatDate,
  handleStar,
  handleShare,
  handleDownload,
  viewMode = 'grid',
  dashboardId,
  onSidebarVLinkDragOver,
  onSidebarVLinkDrop,
}: {
  item: DriveItem;
  isSelected: boolean;
  isDragging: boolean;
  isFocused?: boolean;
  onClick: (event?: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  getFileIcon: (item: DriveItem) => React.ReactNode;
  formatFileSize: (size: number) => string;
  formatDate: (date: string) => string;
  handleStar: (id: string) => void;
  handleShare: (id: string) => void;
  handleDownload: (id: string) => void;
  viewMode?: 'grid' | 'list';
  dashboardId?: string | null;
  onSidebarVLinkDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onSidebarVLinkDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingItem } = useDraggable({
    id: item.id,
    disabled: false,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item.id,
    disabled: item.type !== 'folder', // Only folders can be drop targets
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDraggingItem ? 0.5 : 1,
  } : undefined;

  // Combine refs for both drag and drop functionality
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    if (item.type === 'folder') {
      setDropRef(node);
    }
  };

  // Track if a drag occurred to prevent click events after drag
  const hasDraggedRef = React.useRef(false);

  // Reset drag flag after a short delay
  React.useEffect(() => {
    if (isDraggingItem) {
      hasDraggedRef.current = true;
    } else if (hasDraggedRef.current) {
      // Reset after drag ends
      const timer = setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDraggingItem]);

  // Handle click with drag detection
  const handleClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onClick(e);
  };

  // Native HTML5 drag removed — internal moves/trash use dnd-kit (see handleDragEnd).

  if (viewMode === 'list') {
    return (
      <div
        ref={combinedRef}
        style={style}
        onDragOver={onSidebarVLinkDragOver}
        onDrop={onSidebarVLinkDrop}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''
        } ${isFocused && !isSelected ? 'ring-2 ring-blue-300 ring-offset-2' : ''} ${
          isOver && item.type === 'folder' ? 'bg-blue-100 border-2 border-blue-400 border-dashed' : ''
        } ${isDraggingItem ? 'opacity-50 cursor-move' : ''}`}
        onClick={handleClick}
        onContextMenu={onContextMenu}
        {...(attributes as unknown as Record<string, unknown>)}
        {...(listeners as unknown as Record<string, unknown>)}
        aria-label={`${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`}
        aria-selected={isSelected}
      >
        <Card className="p-4 relative">
          <VLinkCornerMarker
            entityType={item.type === 'folder' ? 'FOLDER' : 'FILE'}
            entityId={item.id}
          />
          {/* Pin indicator - Always visible in top left when pinned, clickable to unpin */}
          {item.starred && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStar(item.id);
              }}
              className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Unpin"
              aria-label={`Unpin ${item.name}`}
            >
              <Pin className="w-4 h-4 text-yellow-500 fill-current" />
            </button>
          )}
          
          <div className="flex items-center space-x-4">
            <div className={`flex-shrink-0 ${item.mimeType?.startsWith('image/') ? 'w-16 h-16' : ''}`}>
              {item.mimeType?.startsWith('image/') ? (
                <div className="relative w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                  <img
                    src={getFileThumbnailUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-icon');
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="fallback-icon hidden absolute inset-0 items-center justify-center bg-gray-50 dark:bg-slate-800 text-2xl">🖼️</div>
                </div>
              ) : (
                getFileIcon(item)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1 min-w-0">
                <span className="truncate">{item.name}</span>
                <VLinkIndicator
                  entityType={item.type === 'folder' ? 'FOLDER' : 'FILE'}
                  entityId={item.id}
                  className="flex-shrink-0"
                />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Modified {formatDate(item.modifiedAt)} by {item.createdBy}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {item.shared && <Share className="w-4 h-4 text-blue-500" />}
              <div className="flex items-center space-x-1">
                {!item.starred && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStar(item.id);
                    }}
                  >
                    <Pin className="w-4 h-4 text-gray-400" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(item.id);
                  }}
                >
                  <Share className="w-4 h-4 text-gray-400" />
                </Button>
                {item.type === 'file' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.id);
                    }}
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={combinedRef}
      style={style}
      onDragOver={onSidebarVLinkDragOver}
      onDrop={onSidebarVLinkDrop}
      className={`group relative cursor-pointer hover:shadow-md transition-shadow rounded-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isFocused && !isSelected ? 'ring-2 ring-blue-300 ring-offset-2' : ''} ${
        isOver && item.type === 'folder' ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      } ${isDraggingItem ? 'opacity-50 cursor-move' : ''}`}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...(listeners as unknown as Record<string, unknown>)}
      aria-label={`${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`}
      aria-selected={isSelected}
    >
      <VLinkCornerMarker
        entityType={item.type === 'folder' ? 'FOLDER' : 'FILE'}
        entityId={item.id}
      />
      <Card className="p-4">
        {/* Pin indicator - Always visible in top left when pinned, clickable to unpin */}
        {item.starred && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStar(item.id);
            }}
            className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            title="Unpin"
          >
            <Pin className="w-4 h-4 text-yellow-500 fill-current" />
          </button>
        )}
        
        {/* Quick Actions - Show on hover, positioned on left side */}
        <div className={`absolute ${item.starred ? 'top-8' : 'top-2'} left-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-start space-y-1 z-10`}>
          {/* Only show pin button when item is NOT pinned */}
          {!item.starred && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStar(item.id);
              }}
              className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pin"
              aria-label={`Pin ${item.name}`}
            >
              <Pin className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {item.type === 'file' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(item.id);
                }}
                className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Share"
                aria-label={`Share ${item.name}`}
              >
                <Share className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(item.id);
                }}
                className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Download"
                aria-label={`Download ${item.name}`}
              >
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </>
          )}
        </div>
        
        <div className="text-center">
          <div className={`flex justify-center mb-2 ${item.mimeType?.startsWith('image/') ? 'w-full' : ''}`}>
            {getFileIcon(item)}
          </div>
          <p
            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center justify-center gap-1 flex-wrap px-1"
            title={item.name}
          >
            <span className="truncate max-w-full">{item.name}</span>
            <VLinkIndicator
              entityType={item.type === 'folder' ? 'FOLDER' : 'FILE'}
              entityId={item.id}
              className="flex-shrink-0"
            />
          </p>
          {item.type === 'file' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(item.size || 0)}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(item.modifiedAt)}
          </p>
        </div>
      </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these props change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.modifiedAt === nextProps.item.modifiedAt &&
    prevProps.item.starred === nextProps.item.starred &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.dashboardId === nextProps.dashboardId
  );
});

export default function DriveModule({ dashboardId, className = '', refreshTrigger, selectedFolderId, selectedFileId, onFolderSelect, onRegisterDragEndHandler }: DriveModuleProps) {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType } = useDashboard();
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExternalFileDrag, setIsExternalFileDrag] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7d' | '30d' | 'year'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: DriveItem } | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [shareLinkModal, setShareLinkModal] = useState<{ email: string; shareLink: string; itemName: string; itemType: 'file' | 'folder' } | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [detailsPanelCollapsed, setDetailsPanelCollapsed] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<DriveItem | null>(null);
  const [detailsActivityRefreshTick, setDetailsActivityRefreshTick] = useState(0);
  const selectedDetailsIdRef = useRef<string | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [showKeyboardShortcutsHelp, setShowKeyboardShortcutsHelp] = useState(false);
  const itemsListRef = useRef<HTMLDivElement>(null);

  const effectiveDashboardId = dashboardId || currentDashboard?.id || null;
  const { trashItem } = useGlobalTrash();
  const { setFilters: setGlobalSearchFilters } = useGlobalSearch();
  const { openConnectModal } = useVLinkDrag();
  const businessId =
    currentDashboard && 'business' in currentDashboard ? currentDashboard.business?.id ?? null : null;
  const householdId =
    currentDashboard && 'household' in currentDashboard ? currentDashboard.household?.id ?? null : null;

  // Close filter menu when clicking outside
  useEffect(() => {
    if (!showFilterMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!filterMenuRef.current) {
        return;
      }
      if (!filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  // Track pending operations to detect conflicts
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    selectedDetailsIdRef.current = selectedItemForDetails?.id ?? null;
  }, [selectedItemForDetails]);

  // Real-time File Hub updates via WebSocket: reload on relevant File Hub events
  useDriveWebSocket({
    enabled: true,
    events: {
      onItemCreated: async (data: Record<string, unknown>) => {
        // Remove temp items if real item was created
        const itemId = data.itemId as string | undefined;
        if (itemId && itemId.startsWith('temp-')) {
          // This is our optimistic update being confirmed, no need to reload
          return;
        }
        if (itemId && selectedDetailsIdRef.current === itemId) {
          setDetailsActivityRefreshTick((t) => t + 1);
        }
        await loadFilesAndFolders();
      },
      onItemUpdated: async (data: Record<string, unknown>) => {
        const itemId = data.itemId as string | undefined;
        const timestamp = data.timestamp as string | undefined;
        
        // Check for conflicts: if we have a pending operation on this item, it might be a conflict
        if (itemId && pendingOperationsRef.current.has(itemId)) {
          // Conflict detected: another user modified this item while we were editing
          toast.error('This item was modified by another user. Refreshing...', {
            duration: 3000,
          });
          pendingOperationsRef.current.delete(itemId);
        }
        
        if (itemId && selectedDetailsIdRef.current === itemId) {
          setDetailsActivityRefreshTick((t) => t + 1);
        }
        // Refresh to get latest version (last-write-wins)
        await loadFilesAndFolders();
      },
      onItemDeleted: async (data: Record<string, unknown>) => {
        const itemId = data.itemId as string | undefined;
        if (itemId) {
          pendingOperationsRef.current.delete(itemId);
          // Optimistically remove from UI immediately
          setItems(prev => prev.filter(i => i.id !== itemId));
        }
        if (itemId && selectedDetailsIdRef.current === itemId) {
          setDetailsActivityRefreshTick((t) => t + 1);
        }
        // Still reload to ensure consistency
        await loadFilesAndFolders();
      },
      onItemMoved: async (data: Record<string, unknown>) => {
        const itemId = data.itemId as string | undefined;
        if (itemId) {
          pendingOperationsRef.current.delete(itemId);
        }
        if (itemId && selectedDetailsIdRef.current === itemId) {
          setDetailsActivityRefreshTick((t) => t + 1);
        }
        await loadFilesAndFolders();
      },
      onItemPinned: async (data: Record<string, unknown>) => {
        const itemId = data.itemId as string | undefined;
        if (itemId) {
          pendingOperationsRef.current.delete(itemId);
        }
        if (itemId && selectedDetailsIdRef.current === itemId) {
          setDetailsActivityRefreshTick((t) => t + 1);
        }
        await loadFilesAndFolders();
      },
    },
  });


  // Keep global search filters in sync with File Hub filters so AI/global search are File Hub-aware
  useEffect(() => {
    const now = new Date();
    let start: Date | string | undefined;
    let end: Date | string | undefined;

    if (dateRangeFilter === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = now;
    } else if (dateRangeFilter === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
    } else if (dateRangeFilter === 'year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      end = now;
    }

    const driveMimeCategory =
      fileTypeFilter === 'documents' ||
      fileTypeFilter === 'spreadsheets' ||
      fileTypeFilter === 'images' ||
      fileTypeFilter === 'videos'
        ? (fileTypeFilter as 'documents' | 'spreadsheets' | 'images' | 'videos')
        : undefined;

    setGlobalSearchFilters({
      moduleId: 'drive',
      pinned: pinnedOnly || undefined,
      driveMimeCategory,
      ...(start && end
        ? {
            dateRange: {
              start,
              end,
            },
          }
        : {}),
    });
  }, [fileTypeFilter, dateRangeFilter, pinnedOnly, setGlobalSearchFilters]);

  // Load real data from API - memoized to prevent infinite loops
  const loadFilesAndFolders = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    
    // CRITICAL: ONLY use dashboardId - no fallback to currentDashboard
    // BusinessId is NOT a dashboard ID and will cause data leakage
    if (!effectiveDashboardId) {
      console.error('❌ DriveModule: No dashboardId provided! Cannot load drive content.');
      setError('Dashboard context not initialized. Please refresh the page.');
      setLoading(false);
      return;
    }
    
    const contextId = effectiveDashboardId;
    const parentId = currentFolder;
    
      // Normalize file URLs - convert localhost URLs to download endpoint
      const normalizeFileUrl = (url: string | undefined): string => {
        if (!url) return '';
        // If URL is already a relative path, use it as-is
        if (url.startsWith('/')) return url;
        // If URL contains localhost, use download endpoint instead
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          return ''; // Will fallback to download endpoint
        }
        // If URL is a full URL (http/https), use it as-is
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        // Otherwise, treat as relative path
        return url;
      };
    
    // Build API URLs with context and folder
    const filesParams = new URLSearchParams();
    if (contextId) filesParams.append('dashboardId', contextId);
    if (parentId) filesParams.append('folderId', parentId);
    
    const foldersParams = new URLSearchParams();
    if (contextId) foldersParams.append('dashboardId', contextId);
    if (parentId) foldersParams.append('parentId', parentId);

    const filesUrl = `/api/drive/files?${filesParams}`;
    const foldersUrl = `/api/drive/folders?${foldersParams}`;

    try {
      setLoading(true);
      setError(null);


      // Fetch files and folders with context and folder filtering
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(filesUrl, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        }),
        fetch(foldersUrl, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        })
      ]);

      if (!filesResponse.ok) {
        const msg = `Failed to fetch drive files (${filesResponse.status})`;
        console.error('Drive files fetch failed:', { filesUrl, status: filesResponse.status });
        throw new Error(msg);
      }
      if (!foldersResponse.ok) {
        const msg = `Failed to fetch drive folders (${foldersResponse.status})`;
        console.error('Drive folders fetch failed:', { foldersUrl, status: foldersResponse.status });
        throw new Error(msg);
      }

      const filesData = await filesResponse.json();
      const foldersData = await foldersResponse.json();
      
      // API returns arrays directly, not wrapped in objects
      const files = Array.isArray(filesData) ? filesData : (filesData.files || []);
      const folders = Array.isArray(foldersData) ? foldersData : (foldersData.folders || []);
      
      
      // Map files to DriveItem format
      const mappedFiles = files.map((file: any) => ({
        id: file.id,
        name: file.name,
        type: 'file' as const,
        size: file.size,
        modifiedAt: file.updatedAt || file.createdAt,
        createdBy: file.createdBy || 'Unknown',
        permissions: ['view', 'edit'], // Default permissions - fetch from /api/drive/files/:id/permissions when viewing file details
        mimeType: file.type,
        starred: file.starred || false, // Read starred status from API
        shared: false,
        url: normalizeFileUrl(file.url), // Normalize file URL (remove localhost URLs)
        thumbnail: normalizeFileUrl(file.url) // Use normalized URL as thumbnail
      }));

      // Map folders to DriveItem format
      const mappedFolders = folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        modifiedAt: folder.updatedAt || folder.createdAt,
        createdBy: folder.createdBy || 'Unknown',
        permissions: ['view', 'edit'], // Default permissions - fetch from /api/drive/files/:id/permissions when viewing file details
        starred: folder.starred || false, // Read starred status from API
        shared: false
      }));

      // Combine files and folders, deduplicate by ID to prevent duplicate React keys
      const combinedItems = [...mappedFolders, ...mappedFiles];
      const seenIds = new Set<string>();
      const uniqueItems = combinedItems.filter((item: DriveItem) => {
        if (seenIds.has(item.id)) {
          return false;
        }
        seenIds.add(item.id);
        return true;
      });
      setItems(uniqueItems);

      // Storage usage is now calculated in sidebar for all personal drives

    } catch (err) {
      console.error('Error loading drive content:', err);
      console.error('Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        session: !!session,
        hasToken: !!session?.accessToken,
        dashboardId: effectiveDashboardId,
        currentDashboard: currentDashboard?.id,
        currentFolder,
        filesUrl,
        foldersUrl
      });
      setError(`Failed to load drive content: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, effectiveDashboardId, currentFolder]);

  useEffect(() => {
    loadFilesAndFolders();
  }, [loadFilesAndFolders]);

  // Listen to refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadFilesAndFolders();
    }
  }, [refreshTrigger, loadFilesAndFolders]);

  // Sync with sidebar folder selection - only update when selectedFolderId changes
  const prevSelectedFolderRef = React.useRef<string | null | undefined>(undefined);
  
  useEffect(() => {
    // Only update if selectedFolderId actually changed
    if (selectedFolderId !== prevSelectedFolderRef.current) {
      prevSelectedFolderRef.current = selectedFolderId;
      
      if (selectedFolderId === null) {
        // Navigate to root
        setCurrentFolder(null);
        setBreadcrumbs([]);
      } else if (selectedFolderId && selectedFolderId !== currentFolder) {
        // Navigate to selected folder from sidebar
        // Clear breadcrumbs - they will be rebuilt when folder loads
        setBreadcrumbs([]);
        setCurrentFolder(selectedFolderId);
      }
    }
  }, [selectedFolderId, currentFolder]);

  const uploadFolderId = useMemo(
    () => resolveDriveUploadFolderId(currentFolder, selectedFolderId),
    [currentFolder, selectedFolderId]
  );

  const deepLinkFileIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof selectedFileId !== 'string' || !session?.accessToken) return;
    const fileId = selectedFileId;
    if (deepLinkFileIdRef.current === fileId) return;

    let cancelled = false;
    const accessToken = session.accessToken;

    async function openDeepLinkedFile() {
      try {
        const response = await fetch(
          `/api/drive/files?fileId=${encodeURIComponent(fileId)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!response.ok || cancelled) return;

        const data = await response.json();
        const file = data.files?.[0] as DriveFile | undefined;
        if (!file || cancelled) return;

        const driveItem: DriveItem = {
          id: file.id,
          name: file.name,
          type: 'file',
          size: file.size,
          modifiedAt: file.updatedAt || file.createdAt,
          createdBy: 'You',
          permissions: ['view', 'edit'],
          mimeType: file.type,
          starred: file.starred,
          shared: false,
          url: file.url,
        };

        deepLinkFileIdRef.current = fileId;
        if (file.folderId && file.folderId !== currentFolder) {
          setCurrentFolder(file.folderId);
          onFolderSelect?.(file.folderId);
        }
        setSelectedItemForDetails(driveItem);
        setDetailsPanelOpen(true);
        setDetailsPanelCollapsed(false);
        setSelectedItems(new Set([file.id]));
      } catch {
        // Deep link open is best-effort
      }
    }

    void openDeepLinkedFile();
    return () => {
      cancelled = true;
    };
  }, [selectedFileId, session?.accessToken, currentFolder, onFolderSelect]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // File upload handler
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (!files || !session?.accessToken) return;

      // Optimistic update: add temporary files immediately
      const tempFiles: DriveItem[] = Array.from(files).map((file, index) => ({
        id: `temp-upload-${Date.now()}-${index}`,
        name: file.name,
        type: 'file' as const,
        size: file.size,
        modifiedAt: new Date().toISOString(),
        createdBy: 'You',
        permissions: ['view', 'edit'],
        mimeType: file.type,
        starred: false,
        shared: false,
        url: '',
        thumbnail: '',
      }));
      const previousItems = [...items];
      setItems(prev => [...prev, ...tempFiles]);
      setLoading(true);

      try {
        const uploadPromises = Array.from(files).map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          if (effectiveDashboardId) formData.append('dashboardId', effectiveDashboardId);
          if (uploadFolderId) formData.append('folderId', uploadFolderId);

          const response = await fetch('/api/drive/files', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.accessToken}` },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
        });

        await Promise.all(uploadPromises);
        toast.success('Files uploaded successfully');
        // Note: WebSocket will trigger refresh with real file data, replacing temp files
      } catch (error) {
        console.error('Upload failed:', error);
        // Rollback optimistic update on error
        setItems(previousItems);
        toast.error('Failed to upload files. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // Folder creation handler
  const handleCreateFolder = async () => {
    if (!session?.accessToken) return;

    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          name,
          dashboardId: effectiveDashboardId,
          parentId: uploadFolderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      // Refresh content
      await loadFilesAndFolders();
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder. Please try again.');
    } finally {
    setLoading(false);
    }
  };

  // Memoize formatting functions
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const getFileIcon = useCallback((item: DriveItem) => {
    if (item.type === 'folder') {
      return <div className="text-4xl">📁</div>;
    }

    const mimeType = item.mimeType || '';
    
    // For images, show actual thumbnail using download endpoint
    if (mimeType.startsWith('image/')) {
      return (
        <div className="relative w-full h-32 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <img
            src={getFileThumbnailUrl(item)}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-icon');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <div className="fallback-icon hidden absolute inset-0 items-center justify-center bg-gray-50 dark:bg-slate-800 text-4xl">🖼️</div>
        </div>
      );
    }

    // Enhanced file type icons for non-images
    if (mimeType.includes('pdf')) return <div className="text-4xl">📄</div>;
    if (mimeType.includes('word') || mimeType.includes('document')) return <div className="text-4xl">📝</div>;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <div className="text-4xl">📊</div>;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <div className="text-4xl">📈</div>;
    if (mimeType.startsWith('video/')) return <div className="text-4xl">🎥</div>;
    if (mimeType.startsWith('audio/')) return <div className="text-4xl">🎵</div>;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return <div className="text-4xl">📦</div>;
    if (mimeType.includes('text')) return <div className="text-4xl">📋</div>;

    return <div className="text-4xl">📄</div>;
  }, []);

  // Handle item selection with multi-select support
  const handleItemSelect = useCallback((item: DriveItem, itemIndex: number, allItems: DriveItem[], event?: React.MouseEvent) => {
    const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
    const isShift = event?.shiftKey;

    if (isShift && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, itemIndex);
      const end = Math.max(lastSelectedIndex, itemIndex);
      const rangeItems = allItems.slice(start, end + 1);
      
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        rangeItems.forEach(rangeItem => {
          newSelection.add(rangeItem.id);
        });
        return newSelection;
      });
    } else if (isCtrlOrCmd) {
      // Toggle individual selection
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
        return newSelection;
      });
      setLastSelectedIndex(itemIndex);
    } else {
      // Single selection (clear others)
      setSelectedItems(new Set([item.id]));
      setLastSelectedIndex(itemIndex);
    }
  }, [lastSelectedIndex]);

  const handleItemClick = useCallback(async (item: DriveItem, itemIndex: number | undefined, allItems: DriveItem[], event?: React.MouseEvent) => {
    // If Ctrl/Cmd or Shift is pressed, handle selection instead of navigation
    const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
    const isShift = event?.shiftKey;
    
    if (isCtrlOrCmd || isShift) {
      if (itemIndex !== undefined) {
        handleItemSelect(item, itemIndex, allItems, event);
      }
      return;
    }

    // If item is already selected and we click it again (without modifiers), deselect
    if (selectedItems.has(item.id) && selectedItems.size > 1) {
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(item.id);
        return newSelection;
      });
      return;
    }

    // Normal click behavior
    if (item.type === 'folder') {
      // Clear selection when navigating to folder
      setSelectedItems(new Set());
      setLastSelectedIndex(null);
      
      // Prevent duplicate breadcrumbs - check if folder is already in breadcrumbs
      setBreadcrumbs(prev => {
        const isAlreadyInBreadcrumbs = prev.some(crumb => crumb.id === item.id);
        if (isAlreadyInBreadcrumbs) {
          // If already in breadcrumbs, truncate to that point
          const index = prev.findIndex(crumb => crumb.id === item.id);
          return prev.slice(0, index + 1);
        }
        // Otherwise, add to breadcrumbs
        return [...prev, { id: item.id, name: item.name }];
      });
      setCurrentFolder(item.id);
      // Notify parent component about folder selection
      if (onFolderSelect) {
        onFolderSelect(item.id);
      }
    } else {
      // Open details panel for files
      setSelectedItemForDetails(item);
      setDetailsPanelOpen(true);
      setDetailsPanelCollapsed(false);
      
      // Create preview URL for images and PDFs (skip for temp uploads - no backend file yet)
      if (isTempUploadId(item.id)) {
        setPreviewUrl(null);
      } else if (item.mimeType?.startsWith('image/')) {
        if (item.url && !item.url.includes('localhost') && !item.url.includes('127.0.0.1') && item.url.trim() !== '') {
          setPreviewUrl(item.url);
        } else {
          setPreviewUrl(`/api/drive/files/${item.id}/download`);
        }
      } else if (item.mimeType?.includes('pdf')) {
        setPreviewUrl(`/api/drive/files/${item.id}/download`);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [onFolderSelect, selectedItems, handleItemSelect]);

  const handleDelete = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (!confirm(`Are you sure you want to move "${item.name}" to trash?`)) {
      return;
    }

    if (!session?.accessToken) {
      toast.error('Please log in to delete items');
      return;
    }

    // Track pending operation for conflict detection
    pendingOperationsRef.current.add(itemId);

    // Optimistic update: remove item immediately
    const previousItems = [...items];
    setItems(prev => prev.filter(i => i.id !== itemId));

    try {
      // Use global trash API
      await trashItem({
        id: item.id,
        name: item.name,
        type: item.type,
        moduleId: 'drive',
        moduleName: 'File Hub',
        metadata: {
          dashboardId: effectiveDashboardId || undefined,
        },
      });

      toast.success(`${item.name} moved to trash`);
      // Note: WebSocket will trigger refresh, but we already updated optimistically
    } catch (error) {
      console.error('Failed to move item to trash:', error);
      // Rollback optimistic update on error
      setItems(previousItems);
      toast.error(`Failed to move ${item.name} to trash`);
    } finally {
      // Remove from pending operations after a delay to allow WebSocket event to process
      setTimeout(() => {
        pendingOperationsRef.current.delete(itemId);
      }, 1000);
    }
  }, [session, items, effectiveDashboardId, trashItem]);

  const handleShare = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Both files and folders can now be shared
    setShareItem(item);
    setShareModalOpen(true);
  }, [items]);

  const handleDownload = useCallback(async (itemId: string) => {
    if (!session?.accessToken) {
      toast.error('Please log in to download files');
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item || item.type !== 'file') {
      toast.error('Only files can be downloaded');
      return;
    }

    try {
      await downloadFile(session.accessToken, itemId);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  }, [session, items]);

  const handleStar = useCallback(async (itemId: string) => {
    if (!session?.accessToken) {
      toast.error('Please log in to pin items');
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      let updatedItem: DriveFile | DriveFolder;
      if (item.type === 'file') {
        updatedItem = await toggleFileStarred(session.accessToken, itemId);
      } else {
        updatedItem = await toggleFolderStarred(session.accessToken, itemId);
      }

      // Update local state with the response from the server
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, starred: updatedItem.starred } : i
      ));
      
      toast.success(updatedItem.starred ? '📌 Pinned' : 'Unpinned');
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update pin status');
    }
  }, [session, items, loadFilesAndFolders]);

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleSidebarVLinkDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!isVLinkSidebarDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleSidebarVLinkDropForItem = useCallback(
    (item: DriveItem, e: React.DragEvent<HTMLDivElement>) => {
      if (!isVLinkSidebarDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      const parsed = parseVLinkDropPayload(e.dataTransfer);
      if (parsed) {
        openConnectModal(parsed);
        return;
      }
      openConnectModal(driveItemToVLinkEntity(item, effectiveDashboardId, businessId, householdId));
    },
    [openConnectModal, effectiveDashboardId, businessId, householdId]
  );

  const handleViewLinkedVLinks = useCallback(
    async (driveItem: DriveItem) => {
      if (!session?.accessToken) {
        toast.error('Please log in');
        return;
      }
      const entityType = driveItem.type === 'folder' ? 'FOLDER' : 'FILE';
      try {
        const refs = await getVLinksForEntity(session.accessToken, entityType, driveItem.id);
        if (refs.length === 0) {
          toast('No linked V_Links.', { duration: 3000 });
          return;
        }
        toast.success(
          () => (
            <div className="text-sm text-gray-900">
              <div className="font-medium text-gray-900 mb-1">Linked V_Links</div>
              <ul className="space-y-0.5">
                {refs.map((r) => (
                  <li key={r.entityLinkId} className="text-gray-800">
                    {r.title} <span className="text-gray-600">{r.publicCode}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
          { duration: 6000 }
        );
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Could not load V_Links');
      }
    },
    [session?.accessToken]
  );

  const handleDiscussInChat = useCallback((item: DriveItem) => {
    // Navigate to chat with file reference
    const chatUrl = `/chat?fileId=${item.id}&fileName=${encodeURIComponent(item.name)}`;
    window.location.href = chatUrl;
  }, []);

  const handleAskAIAboutFile = useCallback((itemOrId: DriveItem | string, name?: string) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const fileName = typeof itemOrId === 'string' ? (name ?? id) : itemOrId.name;
    const aiChatUrl = `/ai-chat?fileIds=${encodeURIComponent(id)}&fileNames=${encodeURIComponent(fileName)}`;
    window.location.href = aiChatUrl;
  }, []);

  // Bulk operations
  const handleSelectAll = useCallback((allItems: DriveItem[]) => {
    setSelectedItems(new Set(allItems.map(item => item.id)));
    setLastSelectedIndex(allItems.length > 0 ? allItems.length - 1 : null);
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!session?.accessToken || selectedItems.size === 0) return;

      const selectedItemsArray = Array.from(selectedItems);
    const itemsToDelete = items.filter(item => selectedItemsArray.includes(item.id));
    
    if (!confirm(`Are you sure you want to move ${itemsToDelete.length} item(s) to trash?`)) {
      return;
    }

    // Track pending operations
    selectedItemsArray.forEach(id => pendingOperationsRef.current.add(id));

    // Optimistic update
    const previousItems = [...items];
    setItems(prev => prev.filter(i => !selectedItemsArray.includes(i.id)));

    try {
      await Promise.all(
        itemsToDelete.map(item =>
          trashItem({
            id: item.id,
            name: item.name,
            type: item.type,
            moduleId: 'drive',
            moduleName: 'File Hub',
            metadata: {
              dashboardId: effectiveDashboardId || undefined,
            },
          })
        )
      );
      toast.success(`${itemsToDelete.length} item(s) moved to trash`);
      setSelectedItems(new Set());
      setLastSelectedIndex(null);
    } catch (error) {
      console.error('Failed to move items to trash:', error);
      setItems(previousItems);
      toast.error('Failed to move items to trash');
    } finally {
      selectedItemsArray.forEach(id => {
        setTimeout(() => {
          pendingOperationsRef.current.delete(id);
        }, 1000);
      });
    }
  }, [session, selectedItems, items, effectiveDashboardId, trashItem]);

  const handleBulkDownload = useCallback(async () => {
    if (!session?.accessToken || selectedItems.size === 0) return;

      const selectedItemsArray = Array.from(selectedItems);
    const filesToDownload = items.filter(
      item => selectedItemsArray.includes(item.id) && item.type === 'file'
    );

    if (filesToDownload.length === 0) {
      toast.error('Only files can be downloaded');
      return;
    }

    try {
      await Promise.all(filesToDownload.map(file => downloadFile(session.accessToken!, file.id)));
      toast.success(`Download started for ${filesToDownload.length} file(s)`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download files');
    }
  }, [session, selectedItems, items]);

  const handleBulkMove = useCallback(async (targetFolderId: string | null) => {
    if (!session?.accessToken || selectedItems.size === 0) return;

      const selectedItemsArray = Array.from(selectedItems);
    const itemsToMove = items.filter(item => selectedItemsArray.includes(item.id));

    // Track pending operations
    selectedItemsArray.forEach(id => pendingOperationsRef.current.add(id));

    // Optimistic update
    const previousItems = [...items];
    setItems(prev => prev.map(i =>
      selectedItemsArray.includes(i.id) ? { ...i, folderId: targetFolderId } : i
    ));

    try {
      await Promise.all(
        itemsToMove.map(item => {
          if (item.type === 'file') {
            return moveFile(session.accessToken!, item.id, targetFolderId);
          } else {
            return moveFolder(session.accessToken!, item.id, targetFolderId);
          }
        })
      );
      toast.success(`${itemsToMove.length} item(s) moved`);
      setSelectedItems(new Set());
      setLastSelectedIndex(null);
    } catch (error) {
      console.error('Failed to move items:', error);
      setItems(previousItems);
      toast.error('Failed to move items');
    } finally {
      selectedItemsArray.forEach(id => {
        setTimeout(() => {
          pendingOperationsRef.current.delete(id);
        }, 1000);
      });
    }
  }, [session, selectedItems, items]);

  // Drag and drop handlers for file/folder movement
  const handleDragEnd = useCallback(async (event: DragEndEvent | null) => {
    if (!event) return;
    
    const { active, over } = event;
    setDraggingId(null);

    if (!over || active.id === over.id || !session?.accessToken) {
      return;
    }

    const draggedItem = items.find(item => item.id === active.id);
    const targetItem = items.find(item => item.id === over.id);

    if (!draggedItem) return;

    // If dropping on global trash, move item to trash
    if (over.id === 'global-trash-bin') {
      // Track pending operation for conflict detection
      pendingOperationsRef.current.add(draggedItem.id);
      
      // Optimistic update: remove item immediately
      const previousItems = [...items];
      setItems(prev => prev.filter(i => i.id !== draggedItem.id));
      
      try {
        // Use global trash API
        await trashItem({
          id: draggedItem.id,
          name: draggedItem.name,
          type: draggedItem.type,
          moduleId: 'drive',
          moduleName: 'File Hub',
          metadata: {
            dashboardId: effectiveDashboardId || undefined,
          },
        });

        toast.success(`${draggedItem.name} moved to trash`);
        // Note: WebSocket will trigger refresh, but we already updated optimistically
      } catch (error) {
        console.error('Failed to move item to trash:', error);
        // Rollback optimistic update on error
        setItems(previousItems);
        toast.error(`Failed to move ${draggedItem.name} to trash`);
      } finally {
        // Remove from pending operations after a delay to allow WebSocket event to process
        setTimeout(() => {
          pendingOperationsRef.current.delete(draggedItem.id);
        }, 1000);
      }
      return;
    }

    // If dropping on a folder (either in main view or sidebar), move the item to that folder
    if (targetItem && targetItem.type === 'folder' && draggedItem.id !== targetItem.id) {
      pendingOperationsRef.current.add(draggedItem.id);

      const previousItems = [...items];
      setItems((prev) => prev.filter((i) => i.id !== draggedItem.id));

      try {
        if (draggedItem.type === 'file') {
          await moveFile(session.accessToken, draggedItem.id, targetItem.id);
          toast.success(`Moved ${draggedItem.name} to ${targetItem.name}`);
        } else {
          await moveFolder(session.accessToken, draggedItem.id, targetItem.id);
          toast.success(`Moved ${draggedItem.name} to ${targetItem.name}`);
        }
        await loadFilesAndFolders();
      } catch (error) {
        console.error('Failed to move item:', error);
        setItems(previousItems);
        toast.error(`Failed to move ${draggedItem.name}`);
      } finally {
        setTimeout(() => {
          pendingOperationsRef.current.delete(draggedItem.id);
        }, 1000);
      }
      return;
    }

    // Handle sidebar folder drops (folder ID that's not in current items list)
    if (
      typeof over.id === 'string' &&
      !targetItem &&
      over.id !== 'global-trash-bin' &&
      over.id !== 'drive-root' &&
      over.id !== 'drive-root-sidebar'
    ) {
      pendingOperationsRef.current.add(draggedItem.id);

      const previousItems = [...items];
      setItems((prev) => prev.filter((i) => i.id !== draggedItem.id));

      try {
        if (draggedItem.type === 'file') {
          await moveFile(session.accessToken, draggedItem.id, over.id);
          toast.success(`Moved ${draggedItem.name}`);
        } else {
          await moveFolder(session.accessToken, draggedItem.id, over.id);
          toast.success(`Moved ${draggedItem.name}`);
        }
        await loadFilesAndFolders();
      } catch (error) {
        console.error('Failed to move item:', error);
        setItems(previousItems);
        toast.error(`Failed to move ${draggedItem.name}`);
      } finally {
        setTimeout(() => {
          pendingOperationsRef.current.delete(draggedItem.id);
        }, 1000);
      }
      return;
    }

    // If dropping on the root area (not on an item), move to root
    if (over.id === 'drive-root' || over.id === 'drive-root-sidebar') {
      pendingOperationsRef.current.add(draggedItem.id);

      const previousItems = [...items];
      setItems((prev) => prev.filter((i) => i.id !== draggedItem.id));

      try {
        if (draggedItem.type === 'file') {
          await moveFile(session.accessToken, draggedItem.id, null);
        } else {
          await moveFolder(session.accessToken, draggedItem.id, null);
        }
        toast.success(`Moved ${draggedItem.name} to root`);
        await loadFilesAndFolders();
      } catch (error) {
        console.error('Failed to move item:', error);
        setItems(previousItems);
        toast.error(`Failed to move ${draggedItem.name}`);
      } finally {
        setTimeout(() => {
          pendingOperationsRef.current.delete(draggedItem.id);
        }, 1000);
      }
      return;
    }
  }, [items, session, loadFilesAndFolders, effectiveDashboardId, trashItem]);

  // Listen for custom events from GlobalTrashBin when items are trashed (after loadFilesAndFolders is defined)
  useEffect(() => {
    const handleDriveItemTrashed = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const itemData = customEvent.detail;
      if (itemData?.moduleId === 'drive' && itemData?.id) {
        // Optimistically remove from UI immediately
        setItems(prev => prev.filter(i => i.id !== itemData.id));
        // Reload to ensure consistency
        await loadFilesAndFolders();
      }
    };

    const handleItemRestored = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const itemData = customEvent.detail;
      if (itemData?.moduleId === 'drive' && itemData?.id) {
        // Reload files and folders to show the restored item
        await loadFilesAndFolders();
      }
    };

    window.addEventListener('driveItemTrashed', handleDriveItemTrashed);
    window.addEventListener('itemRestored', handleItemRestored);
    return () => {
      window.removeEventListener('driveItemTrashed', handleDriveItemTrashed);
      window.removeEventListener('itemRestored', handleItemRestored);
    };
  }, [loadFilesAndFolders]);

  // Register drag end handler with parent DndContext
  useEffect(() => {
    if (onRegisterDragEndHandler) {
      onRegisterDragEndHandler(handleDragEnd);
    }
  }, [onRegisterDragEndHandler, handleDragEnd]);

  // Drag and drop handlers for file uploads (from file system only)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDragTransfer(e.dataTransfer)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsExternalFileDrag(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDragTransfer(e.dataTransfer)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) {
      return;
    }
    setIsExternalFileDrag(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalFileDrag(false);

    if (!isExternalFileDragTransfer(e.dataTransfer)) {
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0 || !session?.accessToken) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        if (effectiveDashboardId) formData.append('dashboardId', effectiveDashboardId);
        if (uploadFolderId) formData.append('folderId', uploadFolderId);

        const response = await fetch('/api/drive/files', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.accessToken}` },
          body: formData,
        });

        if (!response.ok) {
          toast.error(`Failed to upload ${file.name}`);
        } else {
          toast.success(`Uploaded ${file.name}`);
        }
      }

      await loadFilesAndFolders();
    } catch (error) {
      console.error('Drop upload failed:', error);
      toast.error('Failed to upload files');
    }
  }, [session, effectiveDashboardId, uploadFolderId, loadFilesAndFolders]);

  // Filter and sort items - Memoized for performance
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // File type filter
        if (fileTypeFilter && item.type === 'file') {
          const mimeType = item.mimeType || '';
          if (fileTypeFilter === 'documents' && !mimeType.includes('pdf') && !mimeType.includes('word') && !mimeType.includes('document')) {
            return false;
          }
          if (fileTypeFilter === 'images' && !mimeType.startsWith('image/')) {
            return false;
          }
          if (fileTypeFilter === 'videos' && !mimeType.startsWith('video/')) {
            return false;
          }
          if (fileTypeFilter === 'spreadsheets' && !mimeType.includes('excel') && !mimeType.includes('spreadsheet')) {
            return false;
          }
        }

        // Pinned filter
        if (pinnedOnly && !item.starred) {
          return false;
        }

        // Date range filter (based on modifiedAt)
        if (dateRangeFilter !== 'all') {
          const modifiedTime = new Date(item.modifiedAt).getTime();
          const now = Date.now();
          let cutoffTime: number | null = null;

          if (dateRangeFilter === '7d') {
            cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
          } else if (dateRangeFilter === '30d') {
            cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
          } else if (dateRangeFilter === 'year') {
            cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
          }

          if (cutoffTime !== null && modifiedTime < cutoffTime) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        // Folders always first
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        
        // Then sort by selected criteria
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
            break;
          case 'size':
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case 'type':
            comparison = (a.mimeType || '').localeCompare(b.mimeType || '');
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [items, fileTypeFilter, pinnedOnly, dateRangeFilter, sortBy, sortOrder]);

  // Separate folders and files (Google-style organization) - Memoized
  const folders = useMemo(() => filteredItems.filter(item => item.type === 'folder'), [filteredItems]);
  const files = useMemo(() => filteredItems.filter(item => item.type === 'file'), [filteredItems]);

  // Reset focused index when items change
  useEffect(() => {
    if (focusedItemIndex !== null) {
      const allItems = [...folders, ...files];
      if (focusedItemIndex >= allItems.length) {
        setFocusedItemIndex(null);
      }
    }
  }, [folders, files, focusedItemIndex]);


  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Drive Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={loadFilesAndFolders} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Content Area */}
      <div 
        className={`relative flex-1 space-y-6 p-6 overflow-auto ${isExternalFileDrag ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      {/* External file upload overlay — not shown for internal dnd-kit moves */}
      {isExternalFileDrag && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50 bg-opacity-90">
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <p className="text-xl font-medium text-blue-900">Drop files to upload</p>
            <p className="text-sm text-blue-700 mt-2">
              {uploadFolderId ? 'Upload to current folder' : `Upload to ${currentDashboard?.name || 'My Drive'}`}
            </p>
          </div>
        </div>
      )}

      {/* Header - Only show when at root level */}
      {!currentFolder && breadcrumbs.length === 0 && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentDashboard ? `${currentDashboard.name} Drive` : 'My Drive'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentDashboard 
                ? 'Shared file storage and collaboration' 
                : 'Your personal file storage'}
            </p>
        </div>
        <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm" onClick={handleCreateFolder}>
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
            <Button size="sm" onClick={handleFileUpload}>
            <Upload className="w-4 h-4 mr-2" />
              Upload Files
          </Button>
        </div>
      </div>
      )}


      {/* Bulk Actions Toolbar - Show when items are selected */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const allItems = [...folders, ...files];
                    handleSelectAll(allItems);
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  aria-label="Select all"
                  title="Select all items"
                >
                  <Square className="w-5 h-5 text-blue-600" />
                </button>
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
                </span>
              </div>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Deselect all
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDownload}
                disabled={!items.some(item => selectedItems.has(item.id) && item.type === 'file')}
                title="Download selected files"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
                title="Move selected items to trash"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Share multiple items - for now, share the first one
                  const firstItem = items.find(item => selectedItems.has(item.id));
                  if (firstItem) {
                    handleShare(firstItem.id);
                  }
                }}
                title="Share selected items"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs - Show when navigating folders */}
      {(breadcrumbs.length > 0 || currentFolder) && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => {
              setCurrentFolder(null);
              setBreadcrumbs([]);
            }}
            className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            aria-label="Navigate to Drive root"
          >
            Drive
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <span>/</span>
              <button
                onClick={() => {
                  const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
                  setBreadcrumbs(newBreadcrumbs);
                  setCurrentFolder(crumb.id);
                }}
                className="hover:text-blue-600"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Sort, Filter, and View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'type')}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sort by"
            title="Sort files and folders"
          >
            <option value="name">Name</option>
            <option value="date">Date Modified</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="flex items-center space-x-2 relative" ref={filterMenuRef}>
          {/* Filter dropdown trigger */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilterMenu((prev) => !prev)}
            title="Filters"
            aria-label="Show filters"
            aria-expanded={showFilterMenu}
            aria-haspopup="true"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>

          {/* Filter dropdown menu */}
          {showFilterMenu && (
            <div 
              className="absolute right-0 top-10 z-20 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 space-y-3"
              role="menu"
              aria-label="Filter options"
            >
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All types</option>
                  <option value="documents">Documents</option>
                  <option value="spreadsheets">Spreadsheets</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Date
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as 'all' | '7d' | '30d' | 'year')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Any time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="year">Last year</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-slate-600"
                  checked={pinnedOnly}
                  onChange={(e) => setPinnedOnly(e.target.checked)}
                />
                <span>Pinned only</span>
              </label>
            </div>
          )}

          {/* View mode toggles */}
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            title="List view"
          >
            <List className="w-4 h-4" />
          </Button>
          
          {/* Keyboard Shortcuts Help */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardShortcutsHelp(true)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Root drop zone - for moving items back to root */}
      <RootDropZone currentFolder={currentFolder} />

      {/* Folders Section */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" id="folders-heading">Folders</h2>
            {viewMode === 'grid' ? (
              <div 
                ref={itemsListRef}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                role="list"
                aria-labelledby="folders-heading"
              >
                {folders.map((item, index) => (
                  <div key={`folder-${item.id}`} data-item-index={index}>
                    <DraggableItem
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      isDragging={draggingId === item.id}
                      isFocused={focusedItemIndex === index}
                      onClick={(e) => {
                        setFocusedItemIndex(index);
                        const allItems = [...folders, ...files];
                        handleItemClick(item, index, allItems, e);
                      }}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      getFileIcon={getFileIcon}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      handleStar={handleStar}
                      handleShare={handleShare}
                      handleDownload={handleDownload}
                      onSidebarVLinkDragOver={handleSidebarVLinkDragOver}
                      onSidebarVLinkDrop={(e) => handleSidebarVLinkDropForItem(item, e)}
                      dashboardId={effectiveDashboardId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div 
                ref={itemsListRef}
                className="space-y-2"
                role="list"
                aria-labelledby="folders-heading"
              >
                {folders.map((item, index) => (
                  <div key={`folder-${item.id}`} data-item-index={index}>
                    <DraggableItem
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      isDragging={draggingId === item.id}
                      isFocused={focusedItemIndex === index}
                      onClick={(e) => {
                        setFocusedItemIndex(index);
                        const allItems = [...folders, ...files];
                        handleItemClick(item, index, allItems, e);
                      }}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      getFileIcon={getFileIcon}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      handleStar={handleStar}
                      handleShare={handleShare}
                      handleDownload={handleDownload}
                      viewMode="list"
                      onSidebarVLinkDragOver={handleSidebarVLinkDragOver}
                      onSidebarVLinkDrop={(e) => handleSidebarVLinkDropForItem(item, e)}
                      dashboardId={effectiveDashboardId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Section */}
        {files.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" id="files-heading">Files</h2>
            {viewMode === 'grid' ? (
              <div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                role="list"
                aria-labelledby="files-heading"
              >
                {files.map((item, index) => {
                  const itemIndex = folders.length + index;
                  return (
                    <div key={`file-${item.id}`} data-item-index={itemIndex}>
                      <DraggableItem
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        isDragging={draggingId === item.id}
                        isFocused={focusedItemIndex === itemIndex}
                        onClick={(e) => {
                          setFocusedItemIndex(itemIndex);
                          const allItems = [...folders, ...files];
                          handleItemClick(item, itemIndex, allItems, e);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                        handleStar={handleStar}
                        handleShare={handleShare}
                        handleDownload={handleDownload}
                        onSidebarVLinkDragOver={handleSidebarVLinkDragOver}
                        onSidebarVLinkDrop={(e) => handleSidebarVLinkDropForItem(item, e)}
                        dashboardId={effectiveDashboardId}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div 
                className="space-y-2"
                role="list"
                aria-labelledby="files-heading"
              >
                {files.map((item, index) => {
                  const itemIndex = folders.length + index;
                  return (
                    <div key={`file-${item.id}`} data-item-index={itemIndex}>
                      <DraggableItem
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        isDragging={draggingId === item.id}
                        isFocused={focusedItemIndex === itemIndex}
                        onClick={(e) => {
                          setFocusedItemIndex(itemIndex);
                          const allItems = [...folders, ...files];
                          handleItemClick(item, itemIndex, allItems, e);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                        handleStar={handleStar}
                        handleShare={handleShare}
                        handleDownload={handleDownload}
                        viewMode="list"
                        onSidebarVLinkDragOver={handleSidebarVLinkDragOver}
                        onSidebarVLinkDrop={(e) => handleSidebarVLinkDropForItem(item, e)}
                        dashboardId={effectiveDashboardId}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Empty State */}
      {folders.length === 0 && files.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No files yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by uploading your first file or creating a folder
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button onClick={handleFileUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            <Button variant="secondary" onClick={handleCreateFolder}>
              <Folder className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </div>
        </div>
      )}
      </div>

      {/* Details Panel - Shows when a file is selected */}
      {detailsPanelOpen && (
        <DriveDetailsPanel
          item={selectedItemForDetails}
          activityRefreshTick={detailsActivityRefreshTick}
          isOpen={detailsPanelOpen}
          isCollapsed={detailsPanelCollapsed}
          onClose={() => {
            setDetailsPanelOpen(false);
            setSelectedItemForDetails(null);
            // Clean up blob URL if it exists
            if (previewUrl && previewUrl.startsWith('blob:')) {
              window.URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
          onToggleCollapse={() => setDetailsPanelCollapsed(!detailsPanelCollapsed)}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onAskAI={handleAskAIAboutFile}
          getFileIcon={getFileIcon}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
          aria-label={`Context menu for ${contextMenu.item.name}`}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
            onClick={async () => {
              const allItems = [...folders, ...files];
              const itemIndex = allItems.findIndex(i => i.id === contextMenu.item.id);
              if (contextMenu.item.type === 'folder') {
                handleItemClick(contextMenu.item, itemIndex >= 0 ? itemIndex : undefined, allItems);
              } else {
                await handleItemClick(contextMenu.item, itemIndex >= 0 ? itemIndex : undefined, allItems);
              }
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={contextMenu.item.type === 'folder' ? `Open folder ${contextMenu.item.name}` : `Preview file ${contextMenu.item.name}`}
          >
            <Eye className="w-4 h-4" />
            <span>{contextMenu.item.type === 'folder' ? 'Open' : 'Preview'}</span>
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
            onClick={() => {
              handleStar(contextMenu.item.id);
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={contextMenu.item.starred ? `Unpin ${contextMenu.item.name}` : `Pin ${contextMenu.item.name}`}
          >
            <Pin className="w-4 h-4" />
            <span>{contextMenu.item.starred ? 'Unpin' : 'Pin'}</span>
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
            onClick={() => {
              openConnectModal(
                driveItemToVLinkEntity(
                  contextMenu.item,
                  effectiveDashboardId,
                  businessId,
                  householdId,
                ),
              );
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={`Add ${contextMenu.item.name} to V_Link`}
          >
            <Link2 className="w-4 h-4" />
            <span>Add to V_Link</span>
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
            onClick={() => {
              void handleViewLinkedVLinks(contextMenu.item);
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={`View V_Links linked to ${contextMenu.item.name}`}
          >
            <Link2 className="w-4 h-4 opacity-70" />
            <span>View linked vlinks</span>
          </button>
          {contextMenu.item.type === 'file' && (
            <>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
                onClick={() => {
                  handleShare(contextMenu.item.id);
                  setContextMenu(null);
                }}
                role="menuitem"
                aria-label={`Share ${contextMenu.item.name}`}
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
                onClick={() => {
                  handleDownload(contextMenu.item.id);
                  setContextMenu(null);
                }}
                role="menuitem"
                aria-label={`Download ${contextMenu.item.name}`}
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </>
          )}
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
            onClick={() => {
              handleDiscussInChat(contextMenu.item);
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={`Discuss ${contextMenu.item.name} in chat`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discuss in chat</span>
          </button>
          {contextMenu.item.type === 'file' && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
              onClick={() => {
                handleAskAIAboutFile(contextMenu.item);
                setContextMenu(null);
              }}
              role="menuitem"
              aria-label={`Ask AI about ${contextMenu.item.name}`}
            >
              <Brain className="w-4 h-4" />
              <span>Ask AI about this file</span>
            </button>
          )}
          <div className="border-t border-gray-200 dark:border-slate-700 my-1" role="separator"></div>
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2 focus:outline-none focus:bg-red-50"
            onClick={() => {
              handleDelete(contextMenu.item.id);
              setContextMenu(null);
            }}
            role="menuitem"
            aria-label={`Delete ${contextMenu.item.name}`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && shareItem && session?.accessToken && (
        <ShareModal
          item={{
            id: shareItem.id,
            name: shareItem.name,
            type: shareItem.type
          }}
          onClose={() => {
            setShareModalOpen(false);
            setShareItem(null);
          }}
          onShare={async (email: string, permission: 'view' | 'edit') => {
            try {
              let result;
              if (shareItem.type === 'file') {
                result = await shareItemByEmail(session.accessToken!, shareItem.id, email, permission);
              } else {
                result = await shareFolderByEmail(session.accessToken!, shareItem.id, email, permission);
              }
              
              if (result.shareLink) {
                // User doesn't exist - show share link modal
                setShareLinkModal({
                  email: email,
                  shareLink: result.shareLink,
                  itemName: shareItem.name,
                  itemType: shareItem.type
                });
                // Close the share modal
                setShareModalOpen(false);
                setShareItem(null);
              } else {
                // User exists - shared successfully
                toast.success(result.message);
                setShareModalOpen(false);
                setShareItem(null);
              }
            } catch (error) {
              console.error('Share failed:', error);
              const itemType = shareItem.type === 'file' ? 'file' : 'folder';
              toast.error(error instanceof Error ? error.message : `Failed to share ${itemType}`);
              throw error;
            }
          }}
          onShareWithUser={async (userId: string, permission: 'view' | 'edit') => {
            try {
              const canRead = true;
              const canWrite = permission === 'edit';
              if (shareItem.type === 'file') {
                await grantFilePermission(session.accessToken!, shareItem.id, userId, canRead, canWrite);
                toast.success(
                  (t) => (
                    <div className="flex items-center space-x-2">
                      <span>File shared</span>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          handleDiscussInChat(shareItem);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Discuss in chat
                      </button>
                    </div>
                  ),
                  { duration: 5000 }
                );
              } else {
                await grantFolderPermission(session.accessToken!, shareItem.id, userId, canRead, canWrite);
                toast.success(
                  (t) => (
                    <div className="flex items-center space-x-2">
                      <span>Folder shared</span>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          handleDiscussInChat(shareItem);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Discuss in chat
                      </button>
                    </div>
                  ),
                  { duration: 5000 }
                );
              }
              setShareModalOpen(false);
              setShareItem(null);
            } catch (error) {
              console.error('Share failed:', error);
              const itemType = shareItem.type === 'file' ? 'file' : 'folder';
              toast.error(`Failed to share ${itemType}`);
              throw error;
            }
          }}
          onCopyLink={async () => {
            try {
              // Generate a shareable link
              const itemType = shareItem.type === 'file' ? 'file' : 'folder';
              const shareUrl = `${window.location.origin}/drive/shared?${itemType}=${shareItem.id}`;
              await navigator.clipboard.writeText(shareUrl);
              toast.success('Share link copied to clipboard');
            } catch (error) {
              console.error('Copy failed:', error);
              toast.error('Failed to copy link');
              throw error;
            }
          }}
          shareLink={shareItem ? `${window.location.origin}/drive/shared?${shareItem.type === 'file' ? 'file' : 'folder'}=${shareItem.id}` : undefined}
          onListPermissions={async (itemId: string) => {
            try {
              const permissions = shareItem.type === 'file'
                ? await listFilePermissions(session.accessToken!, itemId)
                : await listFolderPermissions(session.accessToken!, itemId);
              return permissions.map((p: any) => ({
                id: p.id,
                userId: p.userId,
                canRead: p.canRead,
                canWrite: p.canWrite,
                user: {
                  id: p.user.id,
                  name: p.user.name,
                  email: p.user.email
                }
              }));
            } catch (error) {
              console.error('Failed to list permissions:', error);
              return [];
            }
          }}
          onUpdatePermission={async (itemId: string, userId: string, canRead: boolean, canWrite: boolean) => {
            try {
              if (shareItem.type === 'file') {
                await updateFilePermission(session.accessToken!, itemId, userId, canRead, canWrite);
              } else {
                await updateFolderPermission(session.accessToken!, itemId, userId, canRead, canWrite);
              }
              toast.success('Permission updated');
            } catch (error) {
              console.error('Update permission failed:', error);
              toast.error('Failed to update permission');
              throw error;
            }
          }}
          onRevokePermission={async (itemId: string, userId: string) => {
            try {
              if (shareItem.type === 'file') {
                await revokeFilePermission(session.accessToken!, itemId, userId);
              } else {
                await revokeFolderPermission(session.accessToken!, itemId, userId);
              }
              toast.success('Permission revoked');
            } catch (error) {
              console.error('Revoke permission failed:', error);
              toast.error('Failed to revoke permission');
              throw error;
            }
          }}
          onSearchUsers={async (query: string) => {
            try {
              const users = await searchUsers(session.accessToken!, query);
              return users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                connectionStatus: user.connectionStatus || 'none',
                relationshipId: user.relationshipId || null,
                organization: user.organization || null
              }));
            } catch (error) {
              console.error('Search users failed:', error);
              return [];
            }
          }}
          onGetBusinessMembers={async () => {
            try {
              if (!currentDashboard) {
                return [];
              }
              const dashboardType = getDashboardType(currentDashboard);
              if (dashboardType !== 'business') {
                return [];
              }
              const businessDashboard = currentDashboard as { business?: { id: string } };
              if (!businessDashboard.business?.id) {
                return [];
              }
              const members = await getBusinessMembers(session.accessToken!, businessDashboard.business.id);
              return members;
            } catch (error) {
              console.error('Get business members failed:', error);
              return [];
            }
          }}
          currentDashboard={currentDashboard ? {
            id: currentDashboard.id,
            type: (() => {
              const type = getDashboardType(currentDashboard);
              // ShareModal doesn't support 'household', map it to 'personal'
              return type === 'household' ? 'personal' : type as 'personal' | 'business' | 'educational';
            })(),
            businessId: (currentDashboard as { business?: { id: string } }).business?.id
          } : null}
        />
      )}

      {/* Share Link Modal - shown when sharing with non-user email */}
      {shareLinkModal && (
        <ShareLinkModal
          isOpen={!!shareLinkModal}
          onClose={() => {
            setShareLinkModal(null);
          }}
          itemName={shareLinkModal.itemName}
          itemType={shareLinkModal.itemType}
          shareLink={shareLinkModal.shareLink}
          email={shareLinkModal.email}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        open={showKeyboardShortcutsHelp}
        onClose={() => setShowKeyboardShortcutsHelp(false)}
        title="Keyboard Shortcuts"
        size="medium"
      >
        <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-2" aria-hidden="true" />

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Navigation</h3>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Arrow Keys</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">↑ ↓</kbd>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">Navigate through files and folders</p>

              <div className="flex justify-between mt-2">
                <span>Right Arrow / Enter</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">→ / Enter</kbd>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">Open folder or file</p>

              <div className="flex justify-between mt-2">
                <span>Home / End</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">Home / End</kbd>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">Jump to first or last item</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Actions</h3>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>New Folder</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">Ctrl+N</kbd>
              </div>

              <div className="flex justify-between mt-2">
                <span>Search</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">Ctrl+K</kbd>
              </div>

              <div className="flex justify-between mt-2">
                <span>Delete / Trash</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">Delete</kbd>
              </div>

              <div className="flex justify-between mt-2">
                <span>Close / Cancel</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowKeyboardShortcutsHelp(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
