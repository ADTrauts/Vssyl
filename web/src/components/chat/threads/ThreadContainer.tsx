'use client';

import React from 'react';
import { useThread } from '@/contexts/thread-context';
import { InlineThread } from './InlineThread';
import { SidePanelThread } from './SidePanelThread';

export function ThreadContainer() {
  const { activeThread, userType } = useThread();

  if (!activeThread) return null;

  return userType === 'ENTERPRISE' ? (
    <SidePanelThread thread={activeThread} />
  ) : (
    <InlineThread thread={activeThread} />
  );
} 