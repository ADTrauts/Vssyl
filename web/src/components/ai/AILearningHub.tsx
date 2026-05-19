'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, Button, Spinner } from 'shared/components';
import { Sparkles, MessageSquare, Settings2, BarChart3, ChevronRight } from 'lucide-react';
import {
  fetchPendingLearnings,
  reviewPendingLearning,
  type PendingLearningItem,
} from '../../api/aiContextLearning';
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
  }, [loadPendingContext]);

  const handleReviewContext = async (id: string, action: 'promote' | 'dismiss') => {
    if (!session?.accessToken) return;
    setBusyId(id);
    try {
      await reviewPendingLearning(session.accessToken, id, action);
      setPendingContext((prev) => prev.filter((p) => p.id !== id));
      onLearningChanged?.();
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
          When I notice something worth remembering, I wait here for you. Save what fits your AI
          Identity — or choose not now. I won’t nag you.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Suggested from chat
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Observations from our recent conversations. I don’t use these until you save them to AI
          Identity.
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
            {pendingContext.map((item) => (
              <li key={item.id}>
                <Card className="p-4 border-amber-100 dark:border-amber-900/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {item.title}
                      </p>
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
            ))}
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
        <PersonalLearningEventsReview embedded onReviewed={onLearningChanged} />
      </section>

      <Card className="p-5 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex gap-3">
          <Settings2 className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
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
