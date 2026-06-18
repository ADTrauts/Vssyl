'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';

interface PipelineSubpageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function PipelineSubpageShell({ title, description, children }: PipelineSubpageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/admin-portal/ai-pipeline"
          className="mt-1 p-2 rounded-lg border border-v-border hover:bg-v-surface-muted"
          aria-label="Back to AI Pipeline"
        >
          <ArrowLeft className="w-4 h-4 text-v-text-secondary" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-v-text-primary">{title}</h1>
            <p className="text-v-text-secondary mt-1">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
