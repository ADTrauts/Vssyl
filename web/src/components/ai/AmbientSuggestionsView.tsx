'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card, Button, Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';
import {
  getSuggestions,
  acceptSuggestion,
  dismissSuggestion,
  type AISuggestionItem,
} from '../../api/aiSuggestions';
import { useDashboard } from '../../contexts/DashboardContext';
import { resolveBusinessIdFromDashboard } from '../../lib/resolveBusinessIdFromDashboard';
import AmbientSuggestionCard from './AmbientSuggestionCard';

export default function AmbientSuggestionsView() {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentDashboard, getDashboardType } = useDashboard();
  const [pending, setPending] = useState<AISuggestionItem[]>([]);
  const [history, setHistory] = useState<AISuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const businessId = resolveBusinessIdFromDashboard(
    currentDashboard,
    currentDashboard ? getDashboardType(currentDashboard) : 'personal'
  );

  const tenantOptions = useMemo(
    () => ({
      dashboardId: currentDashboard?.id,
      businessId,
    }),
    [currentDashboard?.id, businessId]
  );

  const loadSuggestions = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [pendingItems, historyItems] = await Promise.all([
        getSuggestions(session.accessToken, { ...tenantOptions, scope: 'pending' }),
        getSuggestions(session.accessToken, { ...tenantOptions, scope: 'history' }),
      ]);
      setPending(pendingItems);
      setHistory(historyItems);
    } catch {
      setPending([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, tenantOptions]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const handleAccept = async (s: AISuggestionItem) => {
    if (!session?.accessToken) return;
    setBusyId(s.id);
    try {
      const result = await acceptSuggestion(s.id, session.accessToken, tenantOptions);
      setPending((prev) => prev.filter((x) => x.id !== s.id));
      setHistory((prev) =>
        [{ ...s, status: 'ACCEPTED' as const }, ...prev].slice(0, 20)
      );
      toast.success('Suggestion accepted');
      if (result.actionUrl) {
        router.push(result.actionUrl);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept');
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (
    s: AISuggestionItem,
    options?: { doNotShowAgain?: boolean; reason?: string }
  ) => {
    if (!session?.accessToken) return;
    setBusyId(s.id);
    try {
      await dismissSuggestion(s.id, session.accessToken, {
        ...tenantOptions,
        doNotShowAgain: options?.doNotShowAgain,
        reason: options?.reason,
      });
      setPending((prev) => prev.filter((x) => x.id !== s.id));
      setHistory((prev) =>
        [{ ...s, status: 'DISMISSED' as const }, ...prev].slice(0, 20)
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to dismiss');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Contextual suggestions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
            Optional, explainable ideas based on your recent workspace activity. Nothing runs
            automatically — accept to open chat or a module, or dismiss to hide.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadSuggestions()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <Card className="p-6 text-center">
            <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No pending suggestions right now. Keep working — I&apos;ll surface ideas when
              correlated activity appears.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <AmbientSuggestionCard
                key={s.id}
                suggestion={s}
                busy={busyId === s.id}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Recent history ({history.length})
        </h3>
        {history.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Accepted, dismissed, and expired suggestions will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((s) => (
              <AmbientSuggestionCard
                key={s.id}
                suggestion={s}
                showStatus
                busy={busyId === s.id}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
