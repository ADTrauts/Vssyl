'use client';

import React from 'react';

interface AdminPortalPageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared management page header shell (Stage 1A — AP-F-023). */
export function AdminPortalPageShell({
  title,
  description,
  actions,
  children,
}: AdminPortalPageShellProps) {
  return (
    <div className="space-y-v-6">
      <div className="flex items-start justify-between gap-v-4">
        <div>
          <h1 className="text-2xl font-bold text-v-text-primary">{title}</h1>
          {description ? (
            <p className="text-v-text-secondary mt-v-1">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-v-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
