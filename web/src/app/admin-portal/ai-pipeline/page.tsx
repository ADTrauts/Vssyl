'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  FlaskConical,
  ListChecks,
  Target,
  Database,
  Wrench,
  ShieldAlert,
  History,
  FileDown,
} from 'lucide-react';

const cards = [
  {
    title: 'Response Diagnostics',
    description: 'Inspect pipeline traces, intents, grounding, and quality warnings.',
    path: '/admin-portal/ai-pipeline/diagnostics',
    icon: ListChecks,
    color: 'indigo',
  },
  {
    title: 'AI Test Lab',
    description: 'Dry-run prompts through the live twin pipeline without side effects.',
    path: '/admin-portal/ai-pipeline/test-lab',
    icon: FlaskConical,
    color: 'purple',
  },
  {
    title: 'Intent catalog',
    description: 'Edit pipeline intent definitions and grounding flags.',
    path: '/admin-portal/ai-pipeline/intents',
    icon: Target,
    color: 'blue',
  },
  {
    title: 'Grounding rules',
    description: 'Required and optional context sources per intent.',
    path: '/admin-portal/ai-pipeline/grounding',
    icon: ShieldAlert,
    color: 'amber',
  },
  {
    title: 'Context sources',
    description: 'Platform context sources and twin wiring status.',
    path: '/admin-portal/ai-pipeline/sources',
    icon: Database,
    color: 'green',
  },
  {
    title: 'Tool policies',
    description: 'When tools are considered or required by intent.',
    path: '/admin-portal/ai-pipeline/tools',
    icon: Wrench,
    color: 'orange',
  },
  {
    title: 'Quality & enforcement',
    description: 'Weak phrases, grounding enforcement modes, and at-risk trends.',
    path: '/admin-portal/ai-pipeline/quality',
    icon: ShieldAlert,
    color: 'red',
  },
  {
    title: 'Policy audit log',
    description: 'History of admin edits to pipeline policies.',
    path: '/admin-portal/ai-pipeline/audit',
    icon: History,
    color: 'slate',
  },
  {
    title: 'Compliance & export',
    description: 'Retention, JSON/CSV export, and purge expired diagnostics.',
    path: '/admin-portal/ai-pipeline/compliance',
    icon: FileDown,
    color: 'teal',
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
};

export default function AiPipelineHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
          <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Pipeline</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-1">
            Inspect grounding, retrieval, tools, and response quality for the Digital Life Twin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const colors = colorMap[card.color] ?? colorMap.indigo;
          return (
            <Link
              key={card.path}
              href={card.path}
              className="block border border-gray-200 dark:border-slate-700 rounded-lg p-5 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{card.title}</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Related:{' '}
        <Link href="/admin-portal/ai-context" className="text-indigo-600 hover:underline">
          Context Debug
        </Link>{' '}
        ·{' '}
        <Link href="/admin-portal/ai-system" className="text-indigo-600 hover:underline">
          AI System
        </Link>
      </p>
    </div>
  );
}
