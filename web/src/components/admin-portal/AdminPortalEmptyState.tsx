'use client';

import React from 'react';
import { EmptyState } from 'shared/components';

interface AdminPortalEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/** Canonical empty state for Admin Portal surfaces (Stage 1A — AP-F-024). */
export function AdminPortalEmptyState({ icon, title, description }: AdminPortalEmptyStateProps) {
  return <EmptyState icon={icon} title={title} description={description} />;
}
