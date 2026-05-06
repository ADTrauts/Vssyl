import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  CreditCard,
  Code,
  Lock,
  Settings,
  Activity,
  Eye,
  Package,
  UserCheck,
  DollarSign,
  FileText,
  Key,
  Brain,
  MessageSquare,
  Gauge,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

interface AdminNavSection {
  id: string;
  label: string;
  items: AdminNavItem[];
}

const adminNavigationSections: AdminNavSection[] = [
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/admin-portal/dashboard' },
      { id: 'users', label: 'User Management', icon: Users, path: '/admin-portal/users' },
      { id: 'moderation', label: 'Content Moderation', icon: Shield, path: '/admin-portal/moderation' },
      { id: 'support', label: 'Support', icon: MessageSquare, path: '/admin-portal/support' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    items: [
      { id: 'billing', label: 'Financial Management', icon: CreditCard, path: '/admin-portal/billing' },
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
      { id: 'impersonation', label: 'Impersonation Lab', icon: Eye, path: '/admin-portal/impersonate' },
      { id: 'test-impersonation', label: 'Test Impersonation', icon: UserCheck, path: '/admin-portal/test-impersonation' },
    ],
  },
];

interface AdminNavigationProps {
  collapsed?: boolean;
}

export const AdminNavigation = ({ collapsed = false }: AdminNavigationProps) => {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

  const currentSection = (pathname || '').split('/')[2] || 'dashboard';

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  React.useEffect(() => {
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
  }, [currentSection]);

  return (
    <nav className="flex-1 py-4">
      {adminNavigationSections.map((section) => (
        <div key={section.id} className="mb-4">
          {!collapsed && (
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
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}; 