'use client';

import React from 'react';
import { EmptyState } from 'shared/components';

interface BusinessAdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/** Canonical empty state for Business Administration surfaces (BA-1E). */
export function BusinessAdminEmptyState({ icon, title, description }: BusinessAdminEmptyStateProps) {
  return <EmptyState icon={icon} title={title} description={description} />;
}
