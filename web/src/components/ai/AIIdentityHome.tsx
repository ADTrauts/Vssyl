'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, Button, Spinner, Badge } from 'shared/components';
import {
  Brain,
  MessageSquare,
  BookOpen,
  Sparkles,
  Building2,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  fetchAIIdentitySnapshot,
  type AIIdentityInfluence,
  type AIIdentitySnapshot,
} from '../../api/aiIdentity';
import WorkspaceAIDrawer from './WorkspaceAIDrawer';
import type { AIMoreSection } from '../../lib/aiControlCenterTabs';

interface AIIdentityHomeProps {
  onNavigateToTab: (
    tab: string,
    options?: { section?: AIMoreSection; intel?: string; onboarding?: boolean }
  ) => void;
  /** When parent already loaded snapshot (e.g. for learning badge). */
  snapshot?: AIIdentitySnapshot | null;
  onSnapshotLoaded?: (snapshot: AIIdentitySnapshot) => void;
}

const PERMANENCE_LABEL: Record<AIIdentityInfluence['permanence'], string> = {
  permanent: 'Ongoing',
  learned: 'Learned',
  workspace: 'Workspace',
  session: 'This chat only',
};

const PERMANENCE_COLOR: Record<AIIdentityInfluence['permanence'], 'blue' | 'green' | 'yellow' | 'gray'> = {
  permanent: 'blue',
  learned: 'green',
  workspace: 'yellow',
  session: 'gray',
};

export default function AIIdentityHome({
  onNavigateToTab,
  snapshot: snapshotProp,
  onSnapshotLoaded,
}: AIIdentityHomeProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(!snapshotProp);
  const [snapshot, setSnapshot] = useState<AIIdentitySnapshot | null>(snapshotProp ?? null);
  const [workspaceDrawerOpen, setWorkspaceDrawerOpen] = useState(false);
  const [influenceStackRefreshing, setInfluenceStackRefreshing] = useState(false);
  const influenceSignatureRef = useRef('');

  useEffect(() => {
    if (snapshotProp) {
      setSnapshot(snapshotProp);
      setLoading(false);
      return;
    }
    if (session?.accessToken) {
      void loadIdentity();
    }
  }, [session?.accessToken, snapshotProp]);

  const loadIdentity = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await fetchAIIdentitySnapshot(session.accessToken);
      setSnapshot(data);
      if (data) onSnapshotLoaded?.(data);
    } catch (err) {
      console.error('Failed to load AI identity:', err);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  const influences = snapshot?.influences ?? [];

  useEffect(() => {
    if (influences.length === 0) return;
    const signature = influences.map((i) => i.id).join('|');
    if (influenceSignatureRef.current && influenceSignatureRef.current !== signature) {
      setInfluenceStackRefreshing(true);
      const timer = window.setTimeout(() => setInfluenceStackRefreshing(false), 450);
      influenceSignatureRef.current = signature;
      return () => window.clearTimeout(timer);
    }
    influenceSignatureRef.current = signature;
  }, [influences]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Could not load your AI Identity right now.
        </p>
        <Button variant="secondary" onClick={() => void loadIdentity()}>
          Retry
        </Button>
      </Card>
    );
  }

  const { preview, learning, context, businessOverlay } = snapshot;
  const learningCount = learning.pendingCount;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/30 dark:to-slate-900 border-purple-100 dark:border-purple-900">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Your AI Identity
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
              Here’s how I communicate, what shapes my replies, and what I remember — calm,
              adaptive, and always under your control.
            </p>
          </div>
          <Link href="/ai-chat">
            <Button variant="primary" size="sm" className="shrink-0">
              <MessageSquare className="w-4 h-4 mr-2" />
              Open chat
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Communication style
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('behavior')}
            className="text-gray-700 dark:text-gray-300"
          >
            Adjust
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{snapshot.communicationSummary}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge color="blue" size="sm">
            {preview.communication.tone}
          </Badge>
          <Badge color="gray" size="sm">
            {preview.communication.verbosity}
          </Badge>
          <Badge color="gray" size="sm">
            {preview.response.structure}
          </Badge>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          What shapes your twin right now
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          What will shape my next reply for you — in plain language, not technical settings.
        </p>
        <ul
          className={`ai-identity-influence-stack space-y-3 ${
            influenceStackRefreshing ? 'ai-identity-influence-stack--refresh' : ''
          }`}
        >
          {influences.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                {item.detail && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.detail}
                  </p>
                )}
              </div>
              <Badge size="sm" color={PERMANENCE_COLOR[item.permanence]}>
                {PERMANENCE_LABEL[item.permanence]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        className={`p-5 ${learningCount > 0 ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Learning</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {learningCount > 0
                  ? `${learningCount} thing${learningCount === 1 ? '' : 's'} I’d like you to review`
                  : 'Nothing waiting — I only surface learning when it’s worth your time'}
              </p>
            </div>
          </div>
          <Button
            variant={learningCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onNavigateToTab('learning')}
          >
            {learningCount > 0 ? 'Review learning' : 'View learning'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Context awareness
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
            <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              {context.scope === 'business' && context.businessName
                ? `${context.businessName} workspace`
                : 'Personal'}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {context.memoryFactCount > 0
                ? `${context.memoryFactCount} long-term fact${context.memoryFactCount === 1 ? '' : 's'}`
                : 'No structured memories yet'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
            <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Saved context
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {context.userContextCount + context.learnedContextCount > 0
                ? `${context.userContextCount} you added · ${context.learnedContextCount} from chat`
                : 'Add instructions or facts in Memory'}
            </p>
          </div>
        </div>
        {context.modules.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Modules influencing your twin
            </p>
            <div className="flex flex-wrap gap-2">
              {context.modules.map((m) => (
                <Badge key={m.id} size="sm" color="gray">
                  {m.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
          When you ask, I can bring up recent topics — without showing you the technical recall
          machinery.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-gray-700 dark:text-gray-300"
          onClick={() => onNavigateToTab('memory')}
        >
          Manage memory
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Button>
      </Card>

      {businessOverlay?.active && (
        <Card className="p-5 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <Building2 className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Workspace AI
                {businessOverlay.businessName ? ` · ${businessOverlay.businessName}` : ''}
              </h3>
              {businessOverlay.policySummary.length > 0 ? (
                <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1 list-disc pl-4">
                  {businessOverlay.policySummary.slice(0, 4).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Organization policies apply in this workspace.
                </p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Your AI Identity still shapes how your twin communicates; workspace policies add
                boundaries on top.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setWorkspaceDrawerOpen(true)}
              >
                View workspace policies
              </Button>
            </div>
          </div>
        </Card>
      )}

      <WorkspaceAIDrawer
        open={workspaceDrawerOpen}
        businessId={businessOverlay?.businessId}
        onClose={() => setWorkspaceDrawerOpen(false)}
      />

      {!preview.setup.hasPersonalityProfile && (
        <Card className="p-5 border-dashed border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            A few minutes on your personality profile helps me feel more like you.
          </p>
          <Button variant="secondary" size="sm" onClick={() => onNavigateToTab('behavior')}>
            Set up behavior
          </Button>
        </Card>
      )}
    </div>
  );
}
