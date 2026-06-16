'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  acknowledgeCommunication,
  getMyFeed,
  getWorkforceAiOverview,
  getWorkforceAiReach,
  listAdminCommunications,
  listCampaigns,
  listPendingAcks,
  recordCommunicationRead,
  type PendingAckItem,
  type WorkforceAiOverview,
  type WorkforceAiReach,
  type WorkforceCampaign,
  type WorkforceCommunicationListItem,
  type WorkforceCommunicationStatus,
  type WorkforceEngagementSource,
} from '@/api/workforceComms';

export function useWorkforceCommsFeed(businessId: string, options?: { limit?: number; enabled?: boolean }) {
  const [communications, setCommunications] = useState<WorkforceCommunicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || options?.enabled === false) return;
    try {
      setLoading(true);
      setError(null);
      const items = await getMyFeed(businessId, options?.limit);
      setCommunications(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [businessId, options?.enabled, options?.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { communications, loading, error, refresh };
}

export function useWorkforceAdminCommunications(
  businessId: string,
  filters?: { status?: WorkforceCommunicationStatus; campaignId?: string; limit?: number },
  enabled = true
) {
  const [communications, setCommunications] = useState<WorkforceCommunicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const items = await listAdminCommunications(businessId, filters);
      setCommunications(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communications');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled, filters?.status, filters?.campaignId, filters?.limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { communications, loading, error, refresh };
}

export function useWorkforceCampaigns(businessId: string, enabled = true) {
  const [campaigns, setCampaigns] = useState<WorkforceCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const items = await listCampaigns(businessId);
      setCampaigns(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { campaigns, loading, error, refresh };
}

export function useWorkforcePendingAcks(businessId: string, enabled = true) {
  const [pending, setPending] = useState<PendingAckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const items = await listPendingAcks(businessId);
      setPending(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending acknowledgements');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { pending, loading, error, refresh };
}

export function useWorkforceAiOverview(businessId: string, enabled = true) {
  const [overview, setOverview] = useState<WorkforceAiOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkforceAiOverview(businessId);
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { overview, loading, error, refresh };
}

export function useWorkforceAiReach(
  businessId: string,
  communicationId: string | null,
  enabled = true
) {
  const [reach, setReach] = useState<WorkforceAiReach | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!businessId || !communicationId || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkforceAiReach(businessId, communicationId);
      setReach(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reach summary');
    } finally {
      setLoading(false);
    }
  }, [businessId, communicationId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { reach, loading, error, refresh };
}

export async function markCommunicationRead(
  businessId: string,
  communicationId: string,
  source: WorkforceEngagementSource = 'HUB'
): Promise<void> {
  await recordCommunicationRead(businessId, communicationId, source);
}

export async function markCommunicationAcknowledged(
  businessId: string,
  communicationId: string
): Promise<void> {
  await acknowledgeCommunication(businessId, communicationId);
}
