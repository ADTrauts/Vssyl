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
          className="mt-1 p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
          aria-label="Back to AI Pipeline"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-gray-700 dark:text-gray-300 mt-1">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
