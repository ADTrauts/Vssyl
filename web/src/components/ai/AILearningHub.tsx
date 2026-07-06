'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, Button, Spinner, Badge } from 'shared/components';
import { Sparkles, MessageSquare, Settings2, BarChart3, ChevronRight, ArrowRight } from 'lucide-react';
import {
  fetchPendingLearnings,
  reviewPendingLearning,
  type PendingLearningItem,
} from '../../api/aiContextLearning';
import {
  fetchLearningWhatChanged,
  type LearningWhatChangedSummary,
} from '../../api/aiLearningWhatChanged';
import {
  getUserPrivacySettings,
  updateUserPrivacySettings,
} from '../../api/privacy';
import PersonalLearningEventsReview from './PersonalLearningEventsReview';

interface AILearningHubProps {
  /** Called after the user saves or dismisses learning (refresh identity home). */
  onLearningChanged?: () => void;
}

export default function AILearningHub({ onLearningChanged }: AILearningHubProps) {
  const { data: session } = useSession();
  const [pendingContext, setPendingContext] = useState<PendingLearningItem[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [whatChanged, setWhatChanged] = useState<LearningWhatChangedSummary | null>(null);
  const [loadingWhatChanged, setLoadingWhatChanged] = useState(true);
  const [collectiveOptIn, setCollectiveOptIn] = useState(false);
  const [loadingCollective, setLoadingCollective] = useState(true);
  const [savingCollective, setSavingCollective] = useState(false);

  const loadWhatChanged = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadingWhatChanged(true);
    try {
      const summary = await fetchLearningWhatChanged(session.accessToken);
      setWhatChanged(summary);
    } catch {
      setWhatChanged(null);
    } finally {
      setLoadingWhatChanged(false);
    }
  }, [session?.accessToken]);

  const loadCollectiveSetting = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadingCollective(true);
    try {
      const res = await getUserPrivacySettings(session.accessToken);
      setCollectiveOptIn(res.data.allowCollectiveLearning === true);
    } catch {
      setCollectiveOptIn(false);
    } finally {
      setLoadingCollective(false);
    }
  }, [session?.accessToken]);

  const loadPendingContext = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadingContext(true);
    try {
      const items = await fetchPendingLearnings(session.accessToken);
      setPendingContext(items);
    } catch {
      setPendingContext([]);
    } finally {
      setLoadingContext(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void loadPendingContext();
    void loadWhatChanged();
    void loadCollectiveSetting();
  }, [loadPendingContext, loadWhatChanged, loadCollectiveSetting]);

  const handleCollectiveToggle = async () => {
    if (!session?.accessToken || savingCollective) return;
    const next = !collectiveOptIn;
    setSavingCollective(true);
    try {
      await updateUserPrivacySettings(session.accessToken, {
        allowCollectiveLearning: next,
      });
      setCollectiveOptIn(next);
    } catch (err) {
      console.error('Failed to update collective learning preference:', err);
    } finally {
      setSavingCollective(false);
    }
  };

  const handleLearningChanged = useCallback(() => {
    onLearningChanged?.();
    void loadWhatChanged();
  }, [loadWhatChanged, onLearningChanged]);

  const handleReviewContext = async (id: string, action: 'promote' | 'dismiss') => {
    if (!session?.accessToken) return;
    setBusyId(id);
    try {
      await reviewPendingLearning(session.accessToken, id, action);
      setPendingContext((prev) => prev.filter((p) => p.id !== id));
      handleLearningChanged();
    } catch (err) {
      console.error('Failed to review pending learning:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Learning
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
          When I notice something worth learning, I wait here for you. Save what fits your AI
          Identity — or choose not now. I won’t nag you.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">What changed</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          After you save a learning, this shows what was added to your AI Identity.
        </p>
        {loadingWhatChanged ? (
          <div className="flex justify-center py-6">
            <Spinner size={24} />
          </div>
        ) : whatChanged ? (
          <Card className="p-4 border-purple-100 dark:border-purple-900/50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 text-sm">
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-gray-500 dark:text-gray-400 line-through truncate">
                  {whatChanged.beforeSummary}
                </p>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {whatChanged.afterSummary}
                  </p>
                </div>
                {whatChanged.preferenceShiftNote ? (
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {whatChanged.preferenceShiftNote}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {new Date(whatChanged.appliedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Nothing saved yet. Approve a suggestion below to see what updates in your AI Identity.
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Suggested for review
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Observations from chat or repeated contextual suggestions. I don&apos;t use these until
          you save them to AI Identity.
        </p>
        {loadingContext ? (
          <div className="flex justify-center py-8">
            <Spinner size={28} />
          </div>
        ) : pendingContext.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Nothing waiting. Keep chatting — I’ll only surface suggestions that matter.
          </Card>
        ) : (
          <ul className="space-y-3">
            {pendingContext.map((item) => {
              const fromSuggestions = item.tags?.includes('ambient_suggestion') ?? false;
              return (
              <li key={item.id}>
                <Card className="p-4 border-amber-100 dark:border-amber-900/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {item.title}
                        </p>
                        {fromSuggestions && (
                          <Badge size="sm" color="blue">
                            From suggestions
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busyId === item.id}
                        onClick={() => void handleReviewContext(item.id, 'promote')}
                      >
                        Save to AI Identity
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === item.id}
                        onClick={() => void handleReviewContext(item.id, 'dismiss')}
                      >
                        Not now
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          Learned behaviors
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Broader behavior changes I inferred from how you work. Save to AI Identity when they feel
          right.
        </p>
        <PersonalLearningEventsReview embedded onReviewed={handleLearningChanged} />
      </section>

      <Card className="p-5 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex gap-3">
          <Settings2 className="w-5 h-5 text-purple-600 shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Chat-only style adjustments
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              When you ask for a different tone or length in chat, your twin may adapt for that
              conversation only. You will see a banner in chat offering to save the style to AI
              Identity — temporary by default.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Community learning (optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
              Off by default. When enabled, anonymized patterns may contribute to platform-wide
              insights — and you may receive collective suggestions. Your personal data is never
              shared verbatim.
            </p>
          </div>
          {loadingCollective ? (
            <Spinner size={22} />
          ) : (
            <Button
              variant={collectiveOptIn ? 'primary' : 'secondary'}
              size="sm"
              disabled={savingCollective}
              onClick={() => void handleCollectiveToggle()}
            >
              {collectiveOptIn ? 'Enabled' : 'Enable'}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-5 border-purple-100 dark:border-purple-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-3">
            <BarChart3 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Advanced insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Analytics, patterns, and suggestions — optional depth beyond everyday learning review.
              </p>
            </div>
          </div>
          <Link
            href="/ai?tab=more&section=insights"
            className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline shrink-0"
          >
            Open Insights
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
