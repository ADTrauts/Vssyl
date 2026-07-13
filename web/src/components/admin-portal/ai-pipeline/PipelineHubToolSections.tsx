'use client';

import React from 'react';
import Link from 'next/link';
import {
  ListChecks,
  FlaskConical,
  Target,
  ShieldAlert,
  Database,
  Wrench,
  History,
  FileDown,
  Cloud,
  GitBranch,
  ClipboardCheck,
  Route,
  Library,
  BarChart3,
  Play,
} from 'lucide-react';

interface ToolCard {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SECTIONS: Array<{ title: string; description: string; cards: ToolCard[] }> = [
  {
    title: 'Observe',
    description: 'Inspect traces, executions, and dry-run the live twin pipeline.',
    cards: [
      {
        title: 'Execution Explorer',
        description: 'Canonical AIExecutionRecord timeline, tools, and explainability.',
        path: '/admin-portal/ai-pipeline/executions',
        icon: GitBranch,
        color: 'indigo',
      },
      {
        title: 'Response Diagnostics',
        description: 'Pipeline traces, intents, grounding, and evidence.',
        path: '/admin-portal/ai-pipeline/diagnostics',
        icon: ListChecks,
        color: 'indigo',
      },
      {
        title: 'AI Test Lab',
        description: 'Dry-run prompts without side effects.',
        path: '/admin-portal/ai-pipeline/test-lab',
        icon: FlaskConical,
        color: 'purple',
      },
      {
        title: 'Replay Preparation',
        description: 'Preview replay config — execution disabled.',
        path: '/admin-portal/ai-pipeline/replay',
        icon: Play,
        color: 'purple',
      },
    ],
  },
  {
    title: 'Improve',
    description: 'Evaluate, diagnose root causes, route corrections, and track regressions.',
    cards: [
      {
        title: 'Evaluations',
        description: 'Operator evaluation queue and workflow.',
        path: '/admin-portal/ai-pipeline/evaluations',
        icon: ClipboardCheck,
        color: 'blue',
      },
      {
        title: 'Corrections',
        description: 'Correction routing proposals (observe-only).',
        path: '/admin-portal/ai-pipeline/corrections',
        icon: Route,
        color: 'amber',
      },
      {
        title: 'Regressions',
        description: 'Regression library — CI deferred.',
        path: '/admin-portal/ai-pipeline/regressions',
        icon: Library,
        color: 'green',
      },
      {
        title: 'Platform Metrics',
        description: 'Intelligence platform quality metrics.',
        path: '/admin-portal/ai-pipeline/metrics',
        icon: BarChart3,
        color: 'teal',
      },
    ],
  },
  {
    title: 'Configure',
    description: 'Intent, grounding, sources, and tool policies.',
    cards: [
      {
        title: 'Intent Catalog',
        description: 'Intent definitions and grounding flags.',
        path: '/admin-portal/ai-pipeline/intents',
        icon: Target,
        color: 'blue',
      },
      {
        title: 'Grounding Rules',
        description: 'Required and optional sources per intent.',
        path: '/admin-portal/ai-pipeline/grounding',
        icon: ShieldAlert,
        color: 'amber',
      },
      {
        title: 'Context Sources',
        description: 'Platform sources and twin wiring.',
        path: '/admin-portal/ai-pipeline/sources',
        icon: Database,
        color: 'green',
      },
      {
        title: 'Tool Policies',
        description: 'Tool availability by intent.',
        path: '/admin-portal/ai-pipeline/tools',
        icon: Wrench,
        color: 'orange',
      },
    ],
  },
  {
    title: 'Govern',
    description: 'Quality, enforcement, audit, and compliance.',
    cards: [
      {
        title: 'Quality & Enforcement',
        description: 'Weak phrases, enforcement, at-risk trends.',
        path: '/admin-portal/ai-pipeline/quality',
        icon: ShieldAlert,
        color: 'red',
      },
      {
        title: 'Policy Audit Log',
        description: 'Admin edits to pipeline policies.',
        path: '/admin-portal/ai-pipeline/audit',
        icon: History,
        color: 'slate',
      },
      {
        title: 'Compliance & Export',
        description: 'Retention, export, and purge.',
        path: '/admin-portal/ai-pipeline/compliance',
        icon: FileDown,
        color: 'teal',
      },
      {
        title: 'Provider Governance',
        description: 'OpenAI and Anthropic usage from official admin APIs.',
        path: '/admin-portal/ai-pipeline#provider-governance',
        icon: Cloud,
        color: 'blue',
      },
    ],
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

export default function PipelineHubToolSections() {
  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-semibold text-v-text-primary">{section.title}</h2>
          <p className="text-sm text-v-text-muted mb-3">{section.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.cards.map((card) => {
              const Icon = card.icon;
              const colors = colorMap[card.color] ?? colorMap.indigo;
              return (
                <Link
                  key={card.path}
                  href={card.path}
                  className="block border border-v-border rounded-lg p-4 bg-v-surface hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-v-text-primary">{card.title}</h3>
                      <p className="text-sm text-v-text-secondary mt-1">{card.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
