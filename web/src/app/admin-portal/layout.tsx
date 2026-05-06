'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, Users, BarChart3, Code, Lock, Settings, Activity, Eye, Home, DollarSign, Package, Key, Brain, MessageSquare, FileText, Gauge, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ImpersonationProvider } from '../../contexts/ImpersonationContext';
import { ImpersonationBanner } from '../../components/admin-portal/ImpersonationBanner';
import AvatarContextMenu from '../../components/AvatarContextMenu';

interface AdminPortalLayoutProps {
  children: React.ReactNode;
}

interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface AdminNavSection {
  id: string;
  label: string;
  items: AdminNavItem[];
}

const AdminPortalLayout = ({ children }: AdminPortalLayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pathname, setPathname] = useState<string>('/admin-portal/dashboard');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Get pathname from Next.js hook - may return null during SSR
  const nextPathname = usePathname();
  
  // Update pathname from window.location on client mount as fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  // Update pathname when Next.js pathname changes (only if valid)
  useEffect(() => {
    if (nextPathname && typeof window !== 'undefined') {
      setPathname(nextPathname);
    }
  }, [nextPathname]);

  // Handle redirects in useEffect to avoid issues during render
  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading, wait
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // Don't render the layout if user is not authenticated or not admin
  // (redirect will happen in useEffect)
  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  const adminNavigationSections: AdminNavSection[] = [
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { id: 'dashboard', label: 'Overview', icon: Home, path: '/admin-portal/dashboard' },
        { id: 'users', label: 'User Management', icon: Users, path: '/admin-portal/users' },
        { id: 'moderation', label: 'Content Moderation', icon: Shield, path: '/admin-portal/moderation' },
        { id: 'support', label: 'Support', icon: MessageSquare, path: '/admin-portal/support' },
      ],
    },
    {
      id: 'commercial',
      label: 'Commercial',
      items: [
        { id: 'billing', label: 'Financial Management', icon: DollarSign, path: '/admin-portal/billing' },
        { id: 'pricing', label: 'Pricing Management', icon: DollarSign, path: '/admin-portal/pricing' },
        { id: 'business-intelligence', label: 'Business Intelligence', icon: Brain, path: '/admin-portal/business-intelligence' },
      ],
    },
    {
      id: 'platform',
      label: 'Platform',
      items: [
        { id: 'analytics', label: 'Platform Analytics', icon: BarChart3, path: '/admin-portal/analytics' },
        { id: 'performance', label: 'Performance & Scalability', icon: Gauge, path: '/admin-portal/performance' },
        { id: 'security', label: 'Security & Compliance', icon: Lock, path: '/admin-portal/security' },
        { id: 'system-logs', label: 'System Logs', icon: FileText, path: '/admin-portal/system-logs' },
        { id: 'system', label: 'System Administration', icon: Settings, path: '/admin-portal/system' },
      ],
    },
    {
      id: 'developer-modules',
      label: 'Developer & Modules',
      items: [
        { id: 'developers', label: 'Developer Management', icon: Code, path: '/admin-portal/developers' },
        { id: 'modules', label: 'Modules', icon: Package, path: '/admin-portal/modules' },
        { id: 'ai-system', label: 'AI System', icon: Brain, path: '/admin-portal/ai-system' },
      ],
    },
    {
      id: 'admin-labs',
      label: 'Admin Labs',
      items: [
        { id: 'overrides', label: 'Admin Overrides', icon: Key, path: '/admin-portal/overrides' },
        { id: 'testing', label: 'Testing & Debug', icon: Activity, path: '/admin-portal/testing' },
        { id: 'impersonate', label: 'Impersonation Lab', icon: Eye, path: '/admin-portal/impersonate' },
      ],
    },
  ];

  const currentSection = (pathname || '').split('/')[2] || 'dashboard';

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  useEffect(() => {
    const activeParentSection = adminNavigationSections.find((section) =>
      section.items.some((item) => item.id === currentSection)
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
  }, [currentSection, adminNavigationSections]);

  return (
    <ImpersonationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-800 dark:bg-gray-900">
        <ImpersonationBanner />
        <header className="bg-gray-900 text-white border-b border-gray-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold">Admin Portal</h1>
                  <p className="text-sm text-gray-400">Platform Administration</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">System Online</span>
              </div>
              <AvatarContextMenu className="text-white" />
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
            <nav className="flex-1 py-4 overflow-y-auto">
              {adminNavigationSections.map((section) => (
                <div key={section.id} className="mb-4">
                  {!sidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <span>{section.label}</span>
                      {collapsedSections[section.id] ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  {!collapsedSections[section.id] && section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Activity className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-2 text-sm">Toggle Sidebar</span>}
              </button>
            </div>
          </aside>
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-800 dark:bg-gray-900">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ImpersonationProvider>
  );
};

export default AdminPortalLayout; 