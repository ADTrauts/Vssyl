'use client';

import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface BusinessWorkspaceHubPanelProps {
  businessName?: string;
}

/**
 * Shell-owned hub placeholder — orchestration only, no product metrics.
 */
export function BusinessWorkspaceHubPanel({ businessName }: BusinessWorkspaceHubPanelProps) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <LayoutDashboard className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {businessName ? `${businessName} Workspace` : 'Business Workspace'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select a module from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}

export default BusinessWorkspaceHubPanel;
