'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, CheckCircle2, Circle, Users, Package, CreditCard } from 'lucide-react';

interface BusinessWorkspaceHubPanelProps {
  businessName?: string;
  businessId?: string;
  isAdmin?: boolean;
}

const SETUP_ITEMS = [
  {
    id: 'drive',
    label: 'Upload your first file in File Hub',
    href: (businessId: string) => `/business/${businessId}/workspace/drive`,
    adminOnly: false,
  },
  {
    id: 'apps',
    label: 'Discover and install applications',
    href: (businessId: string) => `/business/${businessId}/modules?tab=marketplace`,
    adminOnly: true,
  },
  {
    id: 'invite',
    label: 'Invite your first teammate',
    href: (businessId: string) => `/business/${businessId}/members`,
    adminOnly: true,
  },
  {
    id: 'billing',
    label: 'Review billing and plan options',
    href: () => '/billing',
    adminOnly: true,
  },
] as const;

/**
 * Shell-owned hub — orientation and lightweight setup guidance for business workspaces.
 */
export function BusinessWorkspaceHubPanel({
  businessName,
  businessId,
  isAdmin = false,
}: BusinessWorkspaceHubPanelProps) {
  const visibleItems = SETUP_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <LayoutDashboard className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
          <h1 className="text-2xl font-bold text-v-text-primary">
            {businessName ? `${businessName} Workspace` : 'Business Workspace'}
          </h1>
          <p className="mt-2 text-v-text-secondary">
            {isAdmin
              ? 'This is your team workspace. Complete the setup checklist below, then open an application from the sidebar.'
              : 'This is your team workspace. Open an application from the sidebar to get started.'}
          </p>
        </div>

        {businessId && visibleItems.length > 0 && (
          <div className="rounded-xl border border-v-border bg-v-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-v-text-muted mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Setup checklist
            </h2>
            <ul className="space-y-3">
              {visibleItems.map((item) => {
                const href = item.href(businessId);
                const Icon =
                  item.id === 'invite'
                    ? Users
                    : item.id === 'apps'
                      ? Package
                      : item.id === 'billing'
                        ? CreditCard
                        : Circle;
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className="flex items-start gap-3 text-sm text-v-text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-v-text-muted" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!isAdmin && (
              <p className="mt-4 text-xs text-v-text-muted">
                Application installation is managed by your workspace administrator.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessWorkspaceHubPanel;
