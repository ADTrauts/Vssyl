'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HomeIcon, 
  FolderIcon, 
  UserGroupIcon, 
  ClockIcon, 
  TrashIcon, 
  PlusIcon, 
  ArrowUpTrayIcon,
  BriefcaseIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Pin, Download } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../../contexts/DashboardContext';
import FolderTree from '../../components/drive/FolderTree';
import { useDroppable } from '@dnd-kit/core';
import { useDriveWebSocket } from '../../hooks/useDriveWebSocket';
import { useTheme } from '../../hooks/useTheme';
import { DropdownMenu, ContextMenuItem } from 'shared/components';

interface DriveSidebarProps {
  onNewFolder: () => void;
  onFileUpload: () => void;
  onFolderUpload: () => void;
  onTrashDrop?: () => void;
  onContextSwitch?: (dashboardId: string) => void;
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string;
  lockedDashboardId?: string;
}

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  isExpanded: boolean;
  level: number;
  path: string;
  hasChildren: boolean;
  isLoading: boolean;
}

interface ContextDrive {
  id: string;
  name: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  dashboardId: string;
  type: 'personal' | 'business' | 'educational' | 'household';
  active: boolean;
  href: string;
}

interface UtilityFolder {
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  label: string;
  href: string;
  isTrash?: boolean;
}

interface StyleProps {
  [key: string]: React.CSSProperties;
}

// Utility folders (always present)
const utilityFolders: UtilityFolder[] = [
  { icon: UserGroupIcon, label: 'Shared with me', href: '/drive/shared' },
  { icon: ClockIcon, label: 'Recent', href: '/drive/recent' },
  { icon: Pin, label: 'Pinned', href: '/drive/starred' },
  { icon: TrashIcon, label: 'Trash', href: '/drive/trash', isTrash: true },
];

// Helper functions
const getContextIcon = (type: string) => {
  switch (type) {
    case 'household': return HomeIcon;
    case 'business': return BriefcaseIcon;
    case 'educational': return AcademicCapIcon;
    default: return FolderIcon;
  }
};

const getContextColor = (type: string, active: boolean = false, isDark: boolean = false) => {
  if (isDark) {
    const darkColors = {
      household: { bg: active ? '#422006' : 'transparent', text: active ? '#fde68a' : '#cbd5e1', border: '#f59e0b' },
      business: { bg: active ? '#172554' : 'transparent', text: active ? '#bfdbfe' : '#cbd5e1', border: '#3b82f6' },
      educational: { bg: active ? '#022c22' : 'transparent', text: active ? '#a7f3d0' : '#cbd5e1', border: '#10b981' },
      personal: { bg: active ? '#0c4a6e' : 'transparent', text: active ? '#bae6fd' : '#cbd5e1', border: '#6366f1' }
    };
    return darkColors[type as keyof typeof darkColors] || darkColors.personal;
  }

  const colors = {
    household: { bg: active ? '#fef3c7' : 'transparent', text: active ? '#92400e' : '#6b7280', border: '#f59e0b' },
    business: { bg: active ? '#dbeafe' : 'transparent', text: active ? '#1e40af' : '#6b7280', border: '#3b82f6' },
    educational: { bg: active ? '#d1fae5' : 'transparent', text: active ? '#065f46' : '#6b7280', border: '#10b981' },
    personal: { bg: active ? '#e0f2fe' : 'transparent', text: active ? '#0369a1' : '#6b7280', border: '#6366f1' }
  };
  return colors[type as keyof typeof colors] || colors.personal;
};

const styles: StyleProps = {
  sidebar: {
    width: 260,
    background: '#f8fafc',
    padding: 16,
    borderRight: '1px solid #e5e7eb',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
  },
  newButton: {
    width: '100%',
    height: 40,
    background: '#e0f2fe',
    color: '#0369a1',
    border: 'none',
    borderRadius: 8,
    padding: '0 12px',
    fontWeight: 600,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
    marginTop: 16,
  },
  driveSection: {
    marginBottom: 12,
  },
  utilitySection: {
    flex: 1,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '12px 0',
  },
  driveItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  utilityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'background 0.2s',
  },
};

export default function DriveSidebar({ 
  onNewFolder, 
  onFileUpload, 
  onFolderUpload, 
  onTrashDrop,
  onContextSwitch,
  onFolderSelect,
  selectedFolderId,
  lockedDashboardId
}: DriveSidebarProps) {
  const { isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const newMenuItems = useMemo((): ContextMenuItem[] => [
    {
      icon: <FolderIcon className="w-5 h-5" />,
      label: 'New folder',
      onClick: onNewFolder,
    },
    {
      icon: <ArrowUpTrayIcon className="w-5 h-5" />,
      label: 'File upload',
      onClick: onFileUpload,
    },
    {
      icon: <ArrowUpTrayIcon className="w-5 h-5" />,
      label: 'Folder upload',
      onClick: onFolderUpload,
    },
  ], [onNewFolder, onFileUpload, onFolderUpload]);

  
  // Folder tree state
  const [folderTrees, setFolderTrees] = useState<Record<string, FolderNode[]>>({});
  const [expandedDrives, setExpandedDrives] = useState<Set<string>>(new Set());
  
  // Get dashboard context
  const { 
    allDashboards,
    dashboards,
    currentDashboard, 
    getDashboardType, 
    getDashboardDisplayName 
  } = useDashboard();

  // Generate context drives based on user's dashboards
  const generateContextDrives = (): ContextDrive[] => {
    const dashboards = allDashboards || [];
    const filteredDashboards = lockedDashboardId
      ? dashboards.filter(dashboard => dashboard.id === lockedDashboardId)
      : dashboards;

    if (filteredDashboards.length === 0) {
      return [{
        id: lockedDashboardId ? `${lockedDashboardId}-drive` : 'my-drive',
        name: lockedDashboardId ? 'Workspace File Hub' : 'My File Hub',
        icon: FolderIcon,
        dashboardId: lockedDashboardId ?? 'personal',
        type: lockedDashboardId ? 'business' : 'personal',
        active: true,
        href: lockedDashboardId ? `/drive?dashboard=${lockedDashboardId}` : '/drive'
      }];
    }

    return filteredDashboards.map(dashboard => {
      const dashboardType = getDashboardType(dashboard);
      const dashboardDisplayName = getDashboardDisplayName(dashboard) || 'Dashboard';
      const isActive = lockedDashboardId
        ? dashboard.id === lockedDashboardId
        : currentDashboard?.id === dashboard.id;

      return {
        id: `${dashboard.id}-drive`,
        name: `${dashboardDisplayName} File Hub`,
        icon: getContextIcon(dashboardType),
        dashboardId: dashboard.id,
        type: dashboardType as 'personal' | 'business' | 'educational' | 'household',
        active: isActive,
        href: `/drive?dashboard=${dashboard.id}`
      };
    });
  };

  const contextDrives = useMemo(() => generateContextDrives(), [
    allDashboards,
    currentDashboard?.id,
    lockedDashboardId,
    getDashboardType,
    getDashboardDisplayName
  ]);

  // Get session for authentication
  const { data: session } = useSession();

  // Root drop zone for moving items back to drive root via sidebar
  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: 'drive-root-sidebar',
    disabled: false,
  });

  // Storage usage state (only for personal drives)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10 * 1024 * 1024 * 1024 }); // 10GB default
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const hoverBg = isDark ? '#334155' : '#f3f4f6';
  const newButtonBg = isDark ? '#1e293b' : '#e0f2fe';
  const newButtonHoverBg = isDark ? '#334155' : '#bae6fd';
  const newButtonText = isDark ? '#bae6fd' : '#0369a1';

  // Calculate total storage across all personal dashboards
  const loadPersonalStorage = useCallback(async () => {
    if (!session?.accessToken) return;
    
    // Only calculate for personal drives
    // Check if current dashboard is personal (not business/enterprise/educational/household)
    const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
    const isPersonalDrive = dashboardType === 'personal';
    
    if (!isPersonalDrive) {
      setStorageUsage({ used: 0, total: 10 * 1024 * 1024 * 1024 });
      return;
    }

    try {
      setIsLoadingStorage(true);
      
      // Get all personal dashboard IDs
      const personalDashboardIds = dashboards?.personal?.map((d: any) => d.id) || [];
      
      if (personalDashboardIds.length === 0) {
        setStorageUsage({ used: 0, total: 10 * 1024 * 1024 * 1024 });
        return;
      }

      // Fetch files from all personal dashboards
      const filePromises = personalDashboardIds.map(async (dashboardId: string) => {
        const response = await fetch(`/api/drive/files?dashboardId=${dashboardId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) return [];
        const files = await response.json();
        return files;
      });

      const allFilesArrays = await Promise.all(filePromises);
      const allFiles = allFilesArrays.flat();
      
      // Calculate total size across all personal dashboards
      const totalSize = allFiles.reduce((sum: number, file: any) => sum + (file.size || 0), 0);
      setStorageUsage({ used: totalSize, total: 10 * 1024 * 1024 * 1024 });
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    } finally {
      setIsLoadingStorage(false);
    }
  }, [session?.accessToken, dashboards, currentDashboard, getDashboardType]);

  useEffect(() => {
    loadPersonalStorage();
  }, [loadPersonalStorage]);

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
  };

  // API functions for folder management
  const loadRootFolders = useCallback(async (dashboardId: string) => {
    try {
      if (!session?.accessToken) {
        console.error('No session token available for folder loading');
        return;
      }
      
      // Don't pass parentId=null - just omit it so the API filters for parentId IS NULL
      const response = await fetch(`/api/drive/folders?dashboardId=${dashboardId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('Failed to load folders:', response.status, response.statusText);
        throw new Error('Failed to load folders');
      }
      const folders = await response.json();
      
      const folderNodes: FolderNode[] = folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        children: [],
        isExpanded: false,
        level: 0,
        path: folder.name,
        hasChildren: folder.hasChildren || false,
        isLoading: false
      }));

      setFolderTrees(prev => ({
        ...prev,
        [dashboardId]: folderNodes
      }));
    } catch (error) {
      console.error('Failed to load root folders:', error);
    }
  }, [session?.accessToken]);

  const loadSubfolders = useCallback(async (dashboardId: string, folderId: string) => {
    try {
      if (!session?.accessToken) {
        console.error('No session token available for subfolder loading');
        return;
      }
      
      const response = await fetch(`/api/drive/folders?dashboardId=${dashboardId}&parentId=${folderId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to load subfolders');
      const folders = await response.json();
      
      const subfolderNodes: FolderNode[] = folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        children: [],
        isExpanded: false,
        level: 1, // Will be adjusted based on parent level
        path: folder.name,
        hasChildren: folder.hasChildren || false,
        isLoading: false
      }));

      // Update the folder tree to include subfolders
      setFolderTrees(prev => {
        const currentTree = prev[dashboardId] || [];
        const updateTree = (nodes: FolderNode[]): FolderNode[] => {
          return nodes.map(node => {
            if (node.id === folderId) {
              return {
                ...node,
                children: subfolderNodes.map(child => ({
                  ...child,
                  level: node.level + 1,
                  path: `${node.path}/${child.name}`
                })),
                hasChildren: subfolderNodes.length > 0,
                isLoading: false
              };
            }
            if (node.children.length > 0) {
              return {
                ...node,
                children: updateTree(node.children)
              };
            }
            return node;
          });
        };
        
        return {
          ...prev,
          [dashboardId]: updateTree(currentTree)
        };
      });
    } catch (error) {
      console.error('Failed to load subfolders:', error);
    }
  }, [session?.accessToken]);

  const handleFolderExpand = useCallback(async (dashboardId: string, folderId: string) => {
    // Set loading state
    setFolderTrees(prev => {
      const currentTree = prev[dashboardId] || [];
      const updateTree = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.map(node => {
          if (node.id === folderId) {
            return { ...node, isLoading: true };
          }
          if (node.children.length > 0) {
            return {
              ...node,
              children: updateTree(node.children)
            };
          }
          return node;
        });
      };
      
      return {
        ...prev,
        [dashboardId]: updateTree(currentTree)
      };
    });

    // Load subfolders
    await loadSubfolders(dashboardId, folderId);
  }, [loadSubfolders]);

  const handleFolderSelect = useCallback((folder: FolderNode) => {
    if (onFolderSelect) {
      // Pass folder ID as string to match DriveModuleWrapper's expected signature
      onFolderSelect(folder.id);
    }
  }, [onFolderSelect]);

  const handleDriveExpand = useCallback(async (dashboardId: string) => {
    if (expandedDrives.has(dashboardId)) {
      // Collapse drive
      setExpandedDrives(prev => {
        const newSet = new Set(prev);
        newSet.delete(dashboardId);
        return newSet;
      });
    } else {
      // Expand drive
      setExpandedDrives(prev => new Set([...Array.from(prev), dashboardId]));
      // Always try to load folders, even if they exist (in case they were deleted/added)
      await loadRootFolders(dashboardId);
    }
  }, [expandedDrives, loadRootFolders]);

  // Auto-expand the locked workspace drive so seeded folders are immediately visible
  useEffect(() => {
    if (!lockedDashboardId) {
      return;
    }
    const hasDrive = contextDrives.some(drive => drive.dashboardId === lockedDashboardId);
    if (hasDrive && !expandedDrives.has(lockedDashboardId)) {
      void handleDriveExpand(lockedDashboardId);
    }
  }, [lockedDashboardId, contextDrives, expandedDrives, handleDriveExpand]);

  // Real-time Drive updates via WebSocket: refresh folder trees on relevant drive events
  useDriveWebSocket({
    enabled: true,
    events: {
      onItemCreated: async (data: Record<string, unknown>) => {
        const dashboardId = data.dashboardId as string | undefined;
        const folderId = data.folderId as string | null | undefined;
        // If folder was created in root or in a visible parent, refresh the tree
        if (dashboardId && (!folderId || folderTrees[dashboardId]?.some(f => f.id === folderId))) {
          await loadRootFolders(dashboardId);
        }
      },
      onItemUpdated: async (data: Record<string, unknown>) => {
        const dashboardId = data.dashboardId as string | undefined;
        if (dashboardId && folderTrees[dashboardId]) {
          await loadRootFolders(dashboardId);
        }
      },
      onItemDeleted: async (data: Record<string, unknown>) => {
        const dashboardId = data.dashboardId as string | undefined;
        if (dashboardId && folderTrees[dashboardId]) {
          await loadRootFolders(dashboardId);
        }
      },
      onItemMoved: async (data: Record<string, unknown>) => {
        const dashboardId = data.dashboardId as string | undefined;
        const previousFolderId = data.previousFolderId as string | null | undefined;
        const folderId = data.folderId as string | null | undefined;
        // Refresh both source and destination folder trees
        if (dashboardId) {
          await loadRootFolders(dashboardId);
          // If moved to/from a subfolder, refresh that subfolder's children
          if (previousFolderId && folderTrees[dashboardId]?.some(f => f.id === previousFolderId)) {
            await loadSubfolders(dashboardId, previousFolderId);
          }
          if (folderId && folderTrees[dashboardId]?.some(f => f.id === folderId)) {
            await loadSubfolders(dashboardId, folderId);
          }
        }
      },
      onItemPinned: async (data: Record<string, unknown>) => {
        const dashboardId = data.dashboardId as string | undefined;
        if (dashboardId && folderTrees[dashboardId]) {
          await loadRootFolders(dashboardId);
        }
      },
    },
  });

  const handleDriveClick = (drive: ContextDrive, event: React.MouseEvent) => {
    event.preventDefault();

    // If the sidebar is locked to a specific workspace, only allow clicking that drive
    if (lockedDashboardId && drive.dashboardId !== lockedDashboardId) {
      return;
    }

    // Switch context / navigate to this drive (root)
    if (onContextSwitch) {
      onContextSwitch(drive.dashboardId);
    }

    // Reset folder selection to root for the active drive
    if (onFolderSelect) {
      onFolderSelect(null);
    }
  };

  const handleDriveExpandClick = (drive: ContextDrive, event: React.MouseEvent) => {
    event.stopPropagation();
    handleDriveExpand(drive.dashboardId);
  };

  return (
    <aside style={{ ...styles.sidebar, background: isDark ? '#0f172a' : styles.sidebar.background, borderRight: isDark ? '1px solid #334155' : styles.sidebar.borderRight }}>
      {/* New Button */}
      <div style={{ marginBottom: 4, display: 'grid', width: '100%' }}>
        <DropdownMenu
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          items={newMenuItems}
          menuLabel="Create new"
          align="start"
          side="bottom"
        >
          <button
            type="button"
            style={{ ...styles.newButton, background: newButtonBg, color: newButtonText }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = newButtonHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = newButtonBg; }}
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <PlusIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span>New</span>
          </button>
        </DropdownMenu>
      </div>

      {/* Context Drives Section */}
      <section style={styles.driveSection}>
        <h3 style={{ ...styles.sectionHeader, color: isDark ? '#94a3b8' : styles.sectionHeader.color }}>Your File Hubs</h3>
        {contextDrives.map((drive) => {
          const colorScheme = getContextColor(drive.type, drive.active, isDark);
          const isExpanded = expandedDrives.has(drive.dashboardId);
          const hasFolders = folderTrees[drive.dashboardId] && folderTrees[drive.dashboardId].length > 0;
          
          const isRootDropTarget = drive.active;

          return (
            <div
              key={drive.id}
              ref={isRootDropTarget ? setRootDropRef : undefined}
            >
              <div
                style={{
                  ...styles.driveItem,
                  background: isRootDropTarget && isOverRoot ? (isDark ? '#1e3a8a' : '#dbeafe') : colorScheme.bg,
                  color: colorScheme.text,
                  fontWeight: drive.active ? 600 : 500,
                  borderLeft: drive.active ? `3px solid ${colorScheme.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={(e) => handleDriveClick(drive, e)}
                onMouseEnter={e => !drive.active && (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={e => !drive.active && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <drive.icon style={{ width: 20, height: 20 }} />
                  <span>{drive.name}</span>
                </div>
                {/* Expand button */}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: colorScheme.text,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={(e) => handleDriveExpandClick(drive, e)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              
              {/* Folder Tree - Show when expanded, even if no folders yet */}
              {isExpanded && (
                <div style={{ marginLeft: 16, marginTop: 4 }}>
                  <FolderTree
                    folders={folderTrees[drive.dashboardId] || []}
                    onFolderSelect={handleFolderSelect}
                    onFolderExpand={(folderId: string) => handleFolderExpand(drive.dashboardId, folderId)}
                    selectedFolderId={selectedFolderId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Divider */}
      <hr style={{ ...styles.divider, borderTop: isDark ? '1px solid #334155' : styles.divider.borderTop }} />

      {/* Utility Folders Section */}
      <section style={styles.utilitySection}>
        <h3 style={{ ...styles.sectionHeader, color: isDark ? '#94a3b8' : styles.sectionHeader.color }}>Quick Access</h3>
        {utilityFolders.map((folder) => (
          <Link key={folder.label} href={folder.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                ...styles.utilityItem,
                background: folder.isTrash ? (isDark ? '#7f1d1d' : '#fee2e2') : 'transparent',
                color: folder.isTrash ? (isDark ? '#fecaca' : '#b91c1c') : (isDark ? '#cbd5e1' : '#374151'),
                fontWeight: 500,
                border: folder.isTrash ? `2px solid ${isDark ? '#ef4444' : '#ef4444'}` : undefined,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = folder.isTrash ? (isDark ? '#991b1b' : '#fecaca') : hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = folder.isTrash ? (isDark ? '#7f1d1d' : '#fee2e2') : 'transparent')}
            >
              <folder.icon style={{ width: 20, height: 20, color: folder.isTrash ? (isDark ? '#fecaca' : '#b91c1c') : (isDark ? '#cbd5e1' : '#374151') }} />
              <span>{folder.label}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Storage Usage - Only show for personal drives, at the bottom */}
      {currentDashboard && getDashboardType(currentDashboard) === 'personal' && (
        <div style={{
          padding: '12px',
          background: isDark ? '#1e293b' : '#f8fafc',
          borderRadius: '8px',
          marginTop: 'auto',
          border: isDark ? '1px solid #334155' : '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download style={{ width: 16, height: 16, color: isDark ? '#94a3b8' : '#6b7280' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#374151' }}>Storage</span>
            </div>
            {!isLoadingStorage && (
              <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#6b7280' }}>
                {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}
              </span>
            )}
          </div>
          {!isLoadingStorage && (
            <>
              <div style={{
                width: '100%',
                background: isDark ? '#334155' : '#e5e7eb',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    background: '#2563eb',
                    height: '100%',
                    borderRadius: '4px',
                    transition: 'width 0.3s',
                    width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%`
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: isDark ? '#94a3b8' : '#9ca3af', marginTop: '4px' }}>
                <span>{((storageUsage.used / storageUsage.total) * 100).toFixed(1)}% used</span>
                <span>{formatFileSize(storageUsage.total - storageUsage.used)} available</span>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
} 