'use client';

import React from 'react';
import { EmptyState } from 'shared/components';

interface BusinessOperationsEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/** Canonical empty state for Business Operations modules (BO-1B). */
export function BusinessOperationsEmptyState({
  icon,
  title,
  description,
}: BusinessOperationsEmptyStateProps) {
  return <EmptyState icon={icon} title={title} description={description} />;
}
