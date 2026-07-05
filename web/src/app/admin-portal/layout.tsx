'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ImpersonationProvider } from '../../contexts/ImpersonationContext';
import { ImpersonationBanner } from '../../components/admin-portal/ImpersonationBanner';
import { PlatformHealthIndicator } from '../../components/admin-portal/PlatformHealthIndicator';
import { OperatorGlobalSearch } from '../../components/admin-portal/OperatorGlobalSearch';
import AvatarContextMenu from '../../components/AvatarContextMenu';
import { isAdminPortalDebugEnabled } from '../../lib/adminPortalDebugGate';
import {
  buildPlatformControllerNavigationSections,
  resolvePlatformControllerActiveNavId,
  type PlatformControllerNavSection,
} from '../../config/platformControllerNavigation';

interface AdminPortalLayoutProps {
  children: React.ReactNode;
}

const AdminPortalLayout = ({ children }: AdminPortalLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pathname, setPathname] = useState<string>('/admin-portal/dashboard');
  const [urlHash, setUrlHash] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const nextPathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      setUrlHash(window.location.hash.replace('#', ''));
    }
  }, []);

  useEffect(() => {
    if (nextPathname && typeof window !== 'undefined') {
      setPathname(nextPathname);
    }
  }, [nextPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => setUrlHash(window.location.hash.replace('#', ''));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/forbidden');
      return;
    }
  }, [session, status, router]);

  const adminNavigationSections: PlatformControllerNavSection[] = useMemo(() => {
    const debugEnabled = isAdminPortalDebugEnabled();
    return buildPlatformControllerNavigationSections()
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.debugGated || debugEnabled),
      }))
      .filter((section) => section.items.length > 0);
  }, []);

  const activeNavId = resolvePlatformControllerActiveNavId(pathname || '', urlHash);

  useEffect(() => {
    const initialCollapsed: Record<string, boolean> = {};
    for (const section of adminNavigationSections) {
      if (section.defaultCollapsed) {
        initialCollapsed[section.id] = true;
      }
    }
    setCollapsedSections((prev) => ({ ...initialCollapsed, ...prev }));
  }, [adminNavigationSections]);

  useEffect(() => {
    const activeParentSection = adminNavigationSections.find((section) =>
      section.items.some((item) => item.id === activeNavId),
    );

    if (activeParentSection) {
      setCollapsedSections((prev) => {
        if (!prev[activeParentSection.id]) {
          return prev;
        }

        return {
          ...prev,
          [activeParentSection.id]: false,
        };
      });
    }
  }, [activeNavId, adminNavigationSections]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-v-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Loading Platform Controller…</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-v-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <ImpersonationProvider>
      <div className="min-h-screen bg-v-background">
        <ImpersonationBanner />
        <header className="bg-v-surface text-v-text-primary border-b border-v-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold">Platform Controller</h1>
                  <p className="text-sm text-v-text-muted">Operational control plane</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <OperatorGlobalSearch />
              <PlatformHealthIndicator />
              <AvatarContextMenu className="text-white" />
            </div>
          </div>
        </header>
        <div className="flex">
          <aside
            className={`bg-v-surface text-v-text-primary flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
          >
            <nav className="flex-1 py-4 overflow-y-auto">
              {adminNavigationSections.map((section) => (
                <div key={section.id} className="mb-4">
                  {!sidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-v-text-muted hover:text-v-text-primary transition-colors"
                    >
                      <span>{section.label}</span>
                      {collapsedSections[section.id] ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  {!collapsedSections[section.id] &&
                    section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNavId === item.id;
                      return (
                        <Link
                          key={item.id}
                          href={item.path}
                          className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-v-text-muted hover:bg-v-surface-muted hover:text-white'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                      );
                    })}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-v-border">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 text-v-text-muted hover:text-white transition-colors"
              >
                <Activity className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-2 text-sm">Toggle Sidebar</span>}
              </button>
            </div>
          </aside>
          <main className="flex-1 overflow-auto bg-v-background">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </ImpersonationProvider>
  );
};

export default AdminPortalLayout;
