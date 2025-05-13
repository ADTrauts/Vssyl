'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Category,
  Workspace,
  CategoryContextValue,
  CategoryType,
  MemberRole,
  CategorySettings,
} from '@/types/category';

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createCategory = useCallback(async (data: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  }) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      const category = await response.json();
      setCategories(prev => [...prev, category]);
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (
    id: string,
    data: Partial<Category>
  ) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const category = await response.json();
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, ...category } : c))
      );
      if (activeCategory?.id === id) {
        setActiveCategory({ ...activeCategory, ...category });
      }
      return category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }, [activeCategory]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      setCategories(prev => prev.filter(c => c.id !== id));
      if (activeCategory?.id === id) {
        setActiveCategory(null);
        setActiveWorkspace(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }, [activeCategory]);

  const createWorkspace = useCallback(async (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    categoryId: string;
  }) => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create workspace');
      const workspace = await response.json();
      setCategories(prev =>
        prev.map(c =>
          c.id === data.categoryId
            ? { ...c, workspaces: [...c.workspaces, workspace] }
            : c
        )
      );
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }, []);

  const updateWorkspace = useCallback(async (
    id: string,
    data: Partial<Workspace>
  ) => {
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update workspace');
      const workspace = await response.json();
      setCategories(prev =>
        prev.map(c => ({
          ...c,
          workspaces: c.workspaces.map(w =>
            w.id === id ? { ...w, ...workspace } : w
          ),
        }))
      );
      if (activeWorkspace?.id === id) {
        setActiveWorkspace({ ...activeWorkspace, ...workspace });
      }
      return workspace;
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }, [activeWorkspace]);

  const deleteWorkspace = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete workspace');
      setCategories(prev =>
        prev.map(c => ({
          ...c,
          workspaces: c.workspaces.filter(w => w.id !== id),
        }))
      );
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(null);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }, [activeWorkspace]);

  const inviteMember = useCallback(async (
    categoryId: string,
    email: string,
    role?: MemberRole
  ) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) throw new Error('Failed to invite member');
      const member = await response.json();
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? { ...c, members: [...c.members, member] }
            : c
        )
      );
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  }, []);

  const updateMemberRole = useCallback(async (
    categoryId: string,
    userId: string,
    role: MemberRole
  ) => {
    try {
      const response = await fetch(
        `/api/categories/${categoryId}/members/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      );
      if (!response.ok) throw new Error('Failed to update member role');
      const member = await response.json();
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? {
                ...c,
                members: c.members.map(m =>
                  m.userId === userId ? { ...m, role } : m
                ),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }, []);

  const removeMember = useCallback(async (
    categoryId: string,
    userId: string
  ) => {
    try {
      const response = await fetch(
        `/api/categories/${categoryId}/members/${userId}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to remove member');
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? {
                ...c,
                members: c.members.filter(m => m.userId !== userId),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }, []);

  const updateSettings = useCallback(async (
    categoryId: string,
    settings: Partial<CategorySettings>
  ) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      const updatedSettings = await response.json();
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? { ...c, settings: { ...c.settings, ...updatedSettings } }
            : c
        )
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, []);

  const value: CategoryContextValue = {
    categories,
    activeCategory,
    activeWorkspace,
    setActiveCategory,
    setActiveWorkspace,
    createCategory,
    updateCategory,
    deleteCategory,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateSettings,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
} 