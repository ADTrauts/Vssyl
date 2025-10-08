'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  HomeIcon, 
  FolderIcon, 
  UserGroupIcon, 
  ClockIcon, 
  StarIcon, 
  TrashIcon, 
  PlusIcon, 
  ArrowUpTrayIcon,
  BriefcaseIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useDashboard } from '../../contexts/DashboardContext';
import FolderTree from '../components/drive/FolderTree';

interface DriveSidebarProps {
  onNewFolder: () => void;
  onFileUpload: () => void;
  onFolderUpload: () => void;
  onTrashDrop?: () => void;
  onContextSwitch?: (dashboardId: string) => void;
  onFolderSelect?: (folder: any) => void;
  selectedFolderId?: string;
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

interface DropdownItemProps {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface StyleProps {
  [key: string]: React.CSSProperties;
}

// Utility folders (always present)
const utilityFolders: UtilityFolder[] = [
  { icon: UserGroupIcon, label: 'Shared with me', href: '/drive/shared' },
  { icon: ClockIcon, label: 'Recent', href: '/drive/recent' },
  { icon: StarIcon, label: 'Starred', href: '/drive/starred' },
  { icon: TrashIcon, label: 'Trash', href: '/drive/trash', isTrash: true },
];

const dropdownItems: DropdownItemProps[] = [
  { icon: FolderIcon, label: 'New folder' },
  { icon: ArrowUpTrayIcon, label: 'File upload' },
  { icon: ArrowUpTrayIcon, label: 'Folder upload' },
  { icon: FolderIcon, label: 'Google Docs', disabled: true },
  { icon: FolderIcon, label: 'Google Sheets', disabled: true },
  { icon: FolderIcon, label: 'Google Slides', disabled: true },
  { icon: FolderIcon, label: 'Google Forms', disabled: true },
  { icon: FolderIcon, label: 'More', disabled: true },
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

const getContextColor = (type: string, active: boolean = false) => {
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
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    width: '100%',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    zIndex: 100,
    maxHeight: 320,
    overflowY: 'auto',
  },
  dropdownItem: {
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: 15,
    color: '#222',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  selectedFolderId
}: DriveSidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Folder tree state
  const [folderTrees, setFolderTrees] = useState<Record<string, FolderNode[]>>({});
  const [expandedDrives, setExpandedDrives] = useState<Set<string>>(new Set());
  
  // Get dashboard context
  const { 
    allDashboards, 
    currentDashboard, 
    getDashboardType, 
    getDashboardDisplayName 
  } = useDashboard();

  // Generate context drives based on user's dashboards
  const generateContextDrives = (): ContextDrive[] => {
    if (!allDashboards || allDashboards.length === 0) {
      return [{
        id: 'my-drive',
        name: 'My Drive',
        icon: FolderIcon,
        dashboardId: 'personal',
        type: 'personal',
        active: true,
        href: '/drive'
      }];
    }

    return allDashboards.map(dashboard => {
      const dashboardType = getDashboardType(dashboard);
      const dashboardDisplayName = getDashboardDisplayName(dashboard);
      const isActive = currentDashboard?.id === dashboard.id;
      

      
      return {
        id: `${dashboard.id}-drive`,
        name: `${dashboardDisplayName} Drive`,
        icon: getContextIcon(dashboardType),
        dashboardId: dashboard.id,
        type: dashboardType as 'personal' | 'business' | 'educational' | 'household',
        active: isActive,
        href: `/drive?dashboard=${dashboard.id}`
      };
    });
  };

  const contextDrives = generateContextDrives();

  // API functions for folder management
  const loadRootFolders = useCallback(async (driveId: string) => {
    try {
      const response = await fetch(`/api/drive/folders?driveId=${driveId}&parentId=null`);
      if (!response.ok) throw new Error('Failed to load folders');
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
        [driveId]: folderNodes
      }));
    } catch (error) {
      console.error('Failed to load root folders:', error);
    }
  }, []);

  const loadSubfolders = useCallback(async (driveId: string, folderId: string) => {
    try {
      const response = await fetch(`/api/drive/folders?driveId=${driveId}&parentId=${folderId}`);
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
        const currentTree = prev[driveId] || [];
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
          [driveId]: updateTree(currentTree)
        };
      });
    } catch (error) {
      console.error('Failed to load subfolders:', error);
    }
  }, []);

  const handleFolderExpand = useCallback(async (driveId: string, folderId: string) => {
    // Set loading state
    setFolderTrees(prev => {
      const currentTree = prev[driveId] || [];
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
        [driveId]: updateTree(currentTree)
      };
    });

    // Load subfolders
    await loadSubfolders(driveId, folderId);
  }, [loadSubfolders]);

  const handleFolderSelect = useCallback((folder: FolderNode) => {
    if (onFolderSelect) {
      onFolderSelect(folder);
    }
  }, [onFolderSelect]);

  const handleDriveExpand = useCallback(async (driveId: string) => {
    if (expandedDrives.has(driveId)) {
      // Collapse drive
      setExpandedDrives(prev => {
        const newSet = new Set(prev);
        newSet.delete(driveId);
        return newSet;
      });
    } else {
      // Expand drive
      setExpandedDrives(prev => new Set([...prev, driveId]));
      if (!folderTrees[driveId]) {
        await loadRootFolders(driveId);
      }
    }
  }, [expandedDrives, folderTrees, loadRootFolders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownItemClick = (index: number) => {
    setDropdownOpen(false);
    switch (index) {
      case 0:
        onNewFolder();
        break;
      case 1:
        onFileUpload();
        break;
      case 2:
        onFolderUpload();
        break;
    }
  };

  const handleDriveClick = (drive: ContextDrive, event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextSwitch) {
      onContextSwitch(drive.dashboardId);
    }
  };

  const handleDriveExpandClick = (drive: ContextDrive, event: React.MouseEvent) => {
    event.stopPropagation();
    handleDriveExpand(drive.id);
  };

  return (
    <aside style={styles.sidebar}>
      {/* New Button */}
      <div style={{ marginBottom: 4, position: 'relative' }}>
        <button
          ref={buttonRef}
          style={styles.newButton}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
          onClick={() => setDropdownOpen(v => !v)}
        >
          <PlusIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>New</span>
        </button>
        {dropdownOpen && (
          <div ref={dropdownRef} style={styles.dropdown}>
            {dropdownItems.map((item, index) => (
              <button
                key={item.label}
                style={{
                  ...styles.dropdownItem,
                  opacity: item.disabled ? 0.5 : 1,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={() => !item.disabled && handleDropdownItemClick(index)}
                disabled={item.disabled}
                onMouseEnter={e => !item.disabled && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <item.icon style={{ width: 20, height: 20 }} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Drives Section */}
      <section style={styles.driveSection}>
        <h3 style={styles.sectionHeader}>Your Drives</h3>
        {contextDrives.map((drive) => {
          const colorScheme = getContextColor(drive.type, drive.active);
          const isExpanded = expandedDrives.has(drive.id);
          const hasFolders = folderTrees[drive.id] && folderTrees[drive.id].length > 0;
          
          return (
            <div key={drive.id}>
              <div
                style={{
                  ...styles.driveItem,
                  background: colorScheme.bg,
                  color: colorScheme.text,
                  fontWeight: drive.active ? 600 : 500,
                  borderLeft: drive.active ? `3px solid ${colorScheme.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={(e) => handleDriveClick(drive, e)}
                onMouseEnter={e => !drive.active && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => !drive.active && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <drive.icon style={{ width: 20, height: 20 }} />
                  <span>{drive.name}</span>
                </div>
                {hasFolders && (
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
                )}
              </div>
              
              {/* Folder Tree */}
              {isExpanded && hasFolders && (
                <div style={{ marginLeft: 16, marginTop: 4 }}>
                  <FolderTree
                    folders={folderTrees[drive.id] || []}
                    onFolderSelect={handleFolderSelect}
                    onFolderExpand={(folderId) => handleFolderExpand(drive.id, folderId)}
                    selectedFolderId={selectedFolderId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Divider */}
      <hr style={styles.divider} />

      {/* Utility Folders Section */}
      <section style={styles.utilitySection}>
        <h3 style={styles.sectionHeader}>Quick Access</h3>
        {utilityFolders.map((folder) => (
          <Link key={folder.label} href={folder.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                ...styles.utilityItem,
                background: folder.isTrash ? '#fee2e2' : 'transparent',
                color: folder.isTrash ? '#b91c1c' : '#374151',
                fontWeight: 500,
                border: folder.isTrash ? '2px solid #ef4444' : undefined,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = folder.isTrash ? '#fecaca' : '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = folder.isTrash ? '#fee2e2' : 'transparent')}
            >
              <folder.icon style={{ width: 20, height: 20 }} />
              <span>{folder.label}</span>
            </div>
          </Link>
        ))}
      </section>
    </aside>
  );
} 