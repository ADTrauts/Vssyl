'use client';

import { useState, useCallback } from 'react';

interface Workspace {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
}

export const useWorkspace = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  const addWorkspace = useCallback((workspace: Omit<Workspace, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newWorkspace = { ...workspace, id };
    setWorkspaces(prev => [...prev, newWorkspace]);
    return id;
  }, []);

  const removeWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => prev.filter(workspace => workspace.id !== id));
    if (activeWorkspace?.id === id) {
      setActiveWorkspace(null);
    }
  }, [activeWorkspace]);

  const setWorkspaceActive = useCallback((id: string) => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      setActiveWorkspace(workspace);
      setWorkspaces(prev =>
        prev.map(w => ({
          ...w,
          isActive: w.id === id,
        }))
      );
    }
  }, [workspaces]);

  return {
    workspaces,
    activeWorkspace,
    addWorkspace,
    removeWorkspace,
    setWorkspaceActive,
  };
}; 