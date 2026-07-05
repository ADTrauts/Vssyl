'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import {
  OPERATIONS_PLATFORM_NAME,
} from '../../lib/operationsPlatformBranding';
import { buildPlatformControllerNavigationSections } from '../../config/platformControllerNavigation';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Operations Overview',
  analytics: 'Platform Analytics',
  businesses: 'Businesses',
  'email-operations': 'Email Operations',
  users: 'Users',
  billing: 'Financial Management',
  support: 'Support',
  modules: 'Modules',
  security: 'Security & Compliance',
  system: 'System Administration',
  impersonate: 'Impersonation',
  'feature-flags': 'Feature Flags',
  'ai-pipeline': 'AI Pipeline',
  'platform-programs': 'Platform Programs',
  'platform-adoption': 'Platform Adoption',
};

function resolveLabel(segment: string): string {
  const sections = buildPlatformControllerNavigationSections();
  for (const section of sections) {
    const item = section.items.find((i) => i.id === segment || i.path.endsWith(`/${segment}`));
    if (item) return item.label;
  }
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ');
}

export function AdminPortalBreadcrumbs() {
  const pathname = usePathname() ?? '/admin-portal/dashboard';
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: Array<{ label: string; href: string }> = [];
  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    if (segments[i] === 'admin-portal') {
      crumbs.push({ label: OPERATIONS_PLATFORM_NAME, href: '/admin-portal/dashboard' });
      continue;
    }
    crumbs.push({ label: resolveLabel(segments[i]), href: path });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-v-text-muted mb-4">
      <Link href="/admin-portal/dashboard" className="hover:text-v-text-primary flex items-center">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, idx) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="w-3.5 h-3.5" />
          {idx === crumbs.length - 2 ? (
            <span className="text-v-text-primary font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-v-text-primary">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
