'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Spinner } from 'shared/components';
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  fetchSupportedWebhookEvents,
  listWebhookSubscriptions,
  testWebhookSubscription,
  type WebhookSubscriptionRow,
} from '../../api/webhookSubscriptions';

interface Props {
  businessId: string;
  token: string;
  canManage: boolean;
}

export default function WebhookSubscriptionsShell({ businessId, token, canManage }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscriptionRow[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, eventsRes] = await Promise.all([
        listWebhookSubscriptions(token, businessId),
        fetchSupportedWebhookEvents(token),
      ]);
      setSubscriptions(listRes.subscriptions);
      setEventTypes(eventsRes.eventTypes);
      if (selectedEvents.length === 0 && eventsRes.eventTypes.length > 0) {
        setSelectedEvents([eventsRes.eventTypes[0]]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, [token, businessId, selectedEvents.length]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleEvent = (eventType: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventType) ? prev.filter((e) => e !== eventType) : [...prev, eventType]
    );
  };

  const handleCreate = async () => {
    if (!url.trim() || selectedEvents.length === 0) {
      setError('URL and at least one event type are required.');
      return;
    }
    setBusy(true);
    setError(null);
    setRevealedSecret(null);
    try {
      const result = await createWebhookSubscription(token, businessId, {
        url: url.trim(),
        eventTypes: selectedEvents,
        description: description.trim() || undefined,
      });
      setRevealedSecret(result.signingSecret);
      setUrl('');
      setDescription('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteWebhookSubscription(token, businessId, id);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await testWebhookSubscription(token, businessId, id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Spinner size={16} />
        Loading webhook subscriptions…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Register HTTPS endpoints to receive signed outbound events (module install, file share).
        Partner modules must use webhook executors — no in-process third-party code.
      </p>

      {error && <Alert>{error}</Alert>}

      {revealedSecret && (
        <Alert>
          <p className="font-medium">Signing secret (copy now — shown once):</p>
          <code className="block mt-2 break-all text-sm">{revealedSecret}</code>
        </Alert>
      )}

      {canManage && (
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add subscription</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Endpoint URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
              placeholder="https://partner.example.com/webhooks/vssyl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Event types</p>
            <div className="flex flex-wrap gap-3">
              {eventTypes.map((eventType) => (
                <label key={eventType} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(eventType)}
                    onChange={() => toggleEvent(eventType)}
                  />
                  {eventType}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={busy}>
            Create subscription
          </Button>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Active subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No subscriptions yet.</p>
        ) : (
          <ul className="space-y-3">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 break-all">{sub.url}</p>
                  <p className="text-xs text-gray-500 mt-1">{sub.eventTypes.join(', ')}</p>
                  {sub.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sub.description}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => void handleTest(sub.id)} disabled={busy}>
                      Test
                    </Button>
                    <Button variant="secondary" onClick={() => void handleDelete(sub.id)} disabled={busy}>
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/business/${businessId}/workspace/settings`} className="text-blue-600 hover:underline">
          ← Back to business settings
        </Link>
      </p>
    </div>
  );
}
