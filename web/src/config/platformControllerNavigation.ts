import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Archive,
  BarChart3,
  Brain,
  Cloud,
  Code,
  DollarSign,
  Eye,
  FileText,
  Gauge,
  Home,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Package,
  Scale,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { isAdminPortalDebugEnabled } from '../lib/adminPortalDebugGate';

export interface PlatformControllerNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /** Hidden from sidebar unless debug gate passes */
  debugGated?: boolean;
}

export interface PlatformControllerNavSection {
  id: string;
  label: string;
  items: PlatformControllerNavItem[];
  /** Collapsed by default in sidebar */
  defaultCollapsed?: boolean;
}

/** Canonical Platform Controller sidebar (Phase 1B). */
export function buildPlatformControllerNavigationSections(): PlatformControllerNavSection[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Platform Overview', icon: Home, path: '/admin-portal/dashboard' },
        { id: 'analytics', label: 'Platform Analytics', icon: BarChart3, path: '/admin-portal/analytics' },
      ],
    },
    {
      id: 'platform-programs',
      label: 'Platform Programs',
      items: [
        {
          id: 'platform-programs',
          label: 'Platform Programs',
          icon: Layers,
          path: '/admin-portal/platform-programs',
        },
      ],
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      items: [
        { id: 'modules', label: 'Modules', icon: Package, path: '/admin-portal/modules' },
        { id: 'developers', label: 'Developers', icon: Code, path: '/admin-portal/developers' },
      ],
    },
    {
      id: 'ai-diagnostics',
      label: 'AI & Diagnostics',
      items: [
        { id: 'ai-pipeline', label: 'AI Pipeline', icon: Brain, path: '/admin-portal/ai-pipeline' },
        {
          id: 'diagnostics',
          label: 'Diagnostics',
          icon: Activity,
          path: '/admin-portal/ai-pipeline/diagnostics',
        },
        { id: 'system-logs', label: 'System Logs', icon: FileText, path: '/admin-portal/system-logs' },
        {
          id: 'performance',
          label: 'Performance',
          icon: Gauge,
          path: '/admin-portal/performance',
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { id: 'users', label: 'Users', icon: Users, path: '/admin-portal/users' },
        { id: 'moderation', label: 'Moderation', icon: Shield, path: '/admin-portal/moderation' },
        { id: 'support', label: 'Support', icon: MessageSquare, path: '/admin-portal/support' },
        { id: 'impersonate', label: 'Impersonation', icon: Eye, path: '/admin-portal/impersonate' },
      ],
    },
    {
      id: 'providers',
      label: 'Providers',
      items: [
        {
          id: 'providers',
          label: 'Provider Governance',
          icon: Cloud,
          path: '/admin-portal/ai-pipeline#provider-governance',
        },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      items: [
        { id: 'security', label: 'Security & Compliance', icon: Lock, path: '/admin-portal/security' },
      ],
    },
    {
      id: 'billing',
      label: 'Billing',
      items: [
        { id: 'billing', label: 'Financial Management', icon: DollarSign, path: '/admin-portal/billing' },
        { id: 'pricing', label: 'Pricing', icon: DollarSign, path: '/admin-portal/pricing' },
      ],
    },
    {
      id: 'configuration',
      label: 'Configuration',
      items: [
        { id: 'system', label: 'System Administration', icon: Settings, path: '/admin-portal/system' },
        { id: 'governance', label: 'Governance', icon: Scale, path: '/admin-portal/governance' },
        { id: 'retention', label: 'Data Retention', icon: Archive, path: '/admin-portal/retention' },
      ],
    },
    {
      id: 'operator-labs',
      label: 'Operator Labs',
      defaultCollapsed: true,
      items: [
        { id: 'overrides', label: 'Admin Overrides', icon: Key, path: '/admin-portal/overrides' },
        {
          id: 'testing',
          label: 'Testing & Debug',
          icon: Activity,
          path: '/admin-portal/testing',
          debugGated: true,
        },
        {
          id: 'seed-modules',
          label: 'Seed Modules',
          icon: Package,
          path: '/admin-portal/seed-modules',
          debugGated: true,
        },
      ],
    },
  ];
}

/** Visible nav items after debug gating (for IA audits). */
export function getVisiblePlatformControllerNavItems(
  sections: PlatformControllerNavSection[] = buildPlatformControllerNavigationSections(),
): PlatformControllerNavItem[] {
  const debugEnabled = isAdminPortalDebugEnabled();
  return sections.flatMap((section) =>
    section.items.filter((item) => !item.debugGated || debugEnabled),
  );
}

/** Unique sidebar destinations (excludes duplicate section labels). */
export function countPlatformControllerNavDestinations(): number {
  return getVisiblePlatformControllerNavItems().length;
}

/**
 * Resolve active nav item id from pathname and optional hash.
 */
export function resolvePlatformControllerActiveNavId(
  pathname: string,
  hash?: string,
): string {
  const normalized = pathname.replace(/\/$/, '') || '/admin-portal/dashboard';

  if (normalized.includes('/platform-programs')) return 'platform-programs';
  if (hash === '#provider-governance' || hash === 'provider-governance') return 'providers';
  if (normalized.includes('/ai-pipeline/diagnostics')) return 'diagnostics';
  if (normalized.includes('/ai-pipeline/test-lab')) return 'diagnostics';
  if (normalized.includes('/ai-pipeline')) return 'ai-pipeline';
  if (normalized.includes('/system-logs')) return 'system-logs';
  if (normalized.includes('/performance')) return 'performance';
  if (normalized.includes('/modules')) return 'modules';
  if (normalized.includes('/developers')) return 'developers';

  const segment = normalized.split('/')[2] || 'dashboard';
  return segment;
}

/** Nav must not expose legacy AI System launcher or duplicate debug impersonation routes. */
export const PLATFORM_CONTROLLER_REMOVED_NAV_IDS = [
  'ai-system',
  'test-impersonation',
  'impersonation-test',
] as const;
