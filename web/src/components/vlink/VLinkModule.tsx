'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Spinner } from 'shared/components';
import { Plus, Search, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDashboard } from '@/contexts/DashboardContext';
import * as vlinksAPI from '@/api/vlinks';
import type { VLinkScope, VLinkSummary } from '@/api/vlinks';
import { VLinkCard } from './VLinkCard';
import { VLinkDetailView } from './VLinkDetailView';

type HubFilter = 'recent' | 'personal' | 'business' | 'household' | 'shared' | 'archived' | 'suggestions';

interface VLinkModuleProps {
  dashboardId?: string | null;
  initialVLinkId?: string | null;
}

export function VLinkModule({ dashboardId, initialVLinkId }: VLinkModuleProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentDashboardId } = useDashboard();
  const effectiveDashboardId = dashboardId || currentDashboardId;

  const [vlinks, setVlinks] = useState<VLinkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HubFilter>('recent');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialVLinkId ?? null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params: Parameters<typeof vlinksAPI.listVLinks>[1] = {
        dashboardId: effectiveDashboardId ?? undefined,
        archived: filter === 'archived',
        sharedWithMe: filter === 'shared',
      };
      if (filter === 'personal') params.scope = 'PERSONAL';
      if (filter === 'business') params.scope = 'BUSINESS';
      if (filter === 'household') params.scope = 'HOUSEHOLD';
      const res = await vlinksAPI.listVLinks(session.accessToken, params);
      setVlinks(res.vlinks);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load vlinks');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, effectiveDashboardId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (initialVLinkId) setSelectedId(initialVLinkId);
  }, [initialVLinkId]);

  const filtered = vlinks.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.title.toLowerCase().includes(q) || v.publicCode.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;
    setCreating(true);
    try {
      const created = await vlinksAPI.createVLink(session.accessToken, {
        title: 'New V_Link',
        scope: 'PERSONAL',
        dashboardId: effectiveDashboardId,
      });
      toast.success(`Created ${created.publicCode}`);
      setSelectedId(created.id);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  if (selectedId && session?.accessToken) {
    return (
      <VLinkDetailView
        vlinkId={selectedId}
        token={session.accessToken}
        onBack={() => {
          setSelectedId(null);
          router.push('/vlink');
        }}
        onRefresh={load}
      />
    );
  }

  const filters: { id: HubFilter; label: string }[] = [
    { id: 'recent', label: 'Recent' },
    { id: 'personal', label: 'Personal' },
    { id: 'business', label: 'Business' },
    { id: 'household', label: 'Household' },
    { id: 'shared', label: 'Shared with Me' },
    { id: 'archived', label: 'Archived' },
    { id: 'suggestions', label: 'AI Suggested' },
  ];

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Link2 className="text-indigo-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">V_Link</h1>
        </div>
        <Button variant="primary" onClick={handleCreate} disabled={creating}>
          <Plus size={16} className="mr-1 inline" />
          Create vlink
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === f.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          className="pl-9"
          placeholder="Search title or VL- code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filter === 'suggestions' ? (
        <p className="text-sm text-gray-700">AI suggested links appear here when available.</p>
      ) : loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vlink) => (
            <VLinkCard key={vlink.id} vlink={vlink} onOpen={setSelectedId} />
          ))}
          {filtered.length === 0 && <p className="text-gray-700 col-span-full">No vlinks found.</p>}
        </div>
      )}
    </div>
  );
}
