'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Clock,
  Star,
  FileText,
  LayoutTemplate,
  CheckSquare,
  Users,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import { Button } from 'shared/components';
import { getNotebookBasePath, notebookViewPath } from './notebookPaths';

export type NotebookView =
  | 'home'
  | 'recent'
  | 'favorites'
  | 'pages'
  | 'templates'
  | 'tasks'
  | 'shared'
  | 'trash';

interface NotebookSidebarProps {
  businessId?: string | null;
}

const NAV: Array<{ id: NotebookView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'pages', label: 'My Pages', icon: FileText },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'shared', label: 'Shared', icon: Users },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

function resolveView(
  pathname: string,
  searchParams: { get: (key: string) => string | null } | null
): NotebookView {
  if (pathname.includes('/page/')) return 'pages';
  const v = searchParams?.get('view');
  if (v && NAV.some((n) => n.id === v)) return v as NotebookView;
  return 'home';
}

function NavLinks({
  base,
  active,
  onNavigate,
}: {
  base: string;
  active: NotebookView;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5 px-2">
      {NAV.map(({ id, label, icon: Icon }) => {
        const href = id === 'home' ? base : notebookViewPath(base, id === 'pages' ? 'pages' : id);
        const isActive = active === id;
        return (
          <li key={id}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NotebookSidebar({ businessId }: NotebookSidebarProps) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const base = getNotebookBasePath(businessId);
  const active = resolveView(pathname, searchParams);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams?.toString()]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 shrink-0">
        <Button type="button" variant="ghost" size="sm" onClick={() => setMobileOpen(true)} aria-label="Open Notebook menu">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notebook</span>
        <span className="w-9" aria-hidden />
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`${
          mobileOpen ? 'flex fixed inset-y-0 left-0 z-50 shadow-xl' : 'hidden'
        } md:flex md:relative w-56 shrink-0 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex-col`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notebook</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Pages & tasks</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden shrink-0"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          <NavLinks base={base} active={active} onNavigate={closeMobile} />
        </nav>
      </aside>
    </>
  );
}
