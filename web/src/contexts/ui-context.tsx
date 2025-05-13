'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { File, Folder } from '@/types/api'

export interface FileItem extends File {
  type: 'file';
}

export interface FolderItem extends Folder {
  type: 'folder';
}

export type Item = FileItem | FolderItem;

interface UIContextType {
  // Theme and Layout
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;

  // File Management
  detailsPanel: Item | null;
  openDetailsPanel: (panel: Item) => void;
  closeDetailsPanel: () => void;
  isNewFolderDialogOpen: boolean;
  openNewFolderDialog: () => void;
  closeNewFolderDialog: () => void;
  shareDialog: Item | null;
  openShareDialog: (item: Item) => void;
  closeShareDialog: () => void;
  renameDialog: Item | null;
  openRenameDialog: (item: Item) => void;
  closeRenameDialog: () => void;
}

const UIContext = createContext<UIContextType | null>(null)

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps): React.ReactNode {
  // Theme and Layout State
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // File Management State
  const [detailsPanel, setDetailsPanel] = useState<Item | null>(null)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [shareDialog, setShareDialog] = useState<Item | null>(null)
  const [renameDialog, setRenameDialog] = useState<Item | null>(null)

  // Theme Management
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Theme and Layout Actions
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  // File Management Actions
  const openDetailsPanel = (panel: Item): void => setDetailsPanel(panel)
  const closeDetailsPanel = (): void => setDetailsPanel(null)
  const openNewFolderDialog = (): void => setIsNewFolderDialogOpen(true)
  const closeNewFolderDialog = (): void => setIsNewFolderDialogOpen(false)
  const openShareDialog = (item: Item): void => setShareDialog(item)
  const closeShareDialog = (): void => setShareDialog(null)
  const openRenameDialog = (item: Item): void => setRenameDialog(item)
  const closeRenameDialog = (): void => setRenameDialog(null)

  const value: UIContextType = {
    // Theme and Layout
    theme,
    isSidebarOpen,
    toggleTheme,
    toggleSidebar,

    // File Management
    detailsPanel,
    openDetailsPanel,
    closeDetailsPanel,
    isNewFolderDialogOpen,
    openNewFolderDialog,
    closeNewFolderDialog,
    shareDialog,
    openShareDialog,
    closeShareDialog,
    renameDialog,
    openRenameDialog,
    closeRenameDialog
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextType {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
} 