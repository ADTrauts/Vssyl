'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Spinner } from 'shared/components';
import { ArrowLeft, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as vlinksAPI from '@/api/vlinks';
import type {
  VLinkActivityRow,
  VLinkEntityRow,
  VLinkEntityType,
  VLinkSummary,
} from '@/api/vlinks';
import { VLinkShareModal } from './VLinkShareModal';

type DetailTab = 'overview' | 'files' | 'calendar' | 'chats' | 'tasks' | 'activity' | 'ai' | 'people';

interface VLinkDetailViewProps {
  vlinkId: string;
  token: string;
  onBack: () => void;
  onRefresh?: () => void;
}

export function VLinkDetailView({ vlinkId, token, onBack, onRefresh }: VLinkDetailViewProps) {
  const [vlink, setVlink] = useState<VLinkSummary | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [entities, setEntities] = useState<VLinkEntityRow[]>([]);
  const [activity, setActivity] = useState<VLinkActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [titleEdit, setTitleEdit] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await vlinksAPI.getVLink(token, vlinkId);
      setVlink(detail);
      setTitleEdit(detail.title);
      const [entityRows, activityRows] = await Promise.all([
        vlinksAPI.listVLinkEntities(token, vlinkId),
        vlinksAPI.listVLinkActivity(token, vlinkId),
      ]);
      setEntities(entityRows);
      setActivity(activityRows);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load vlink');
    } finally {
      setLoading(false);
    }
  }, [token, vlinkId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTitle = async () => {
    if (!vlink || titleEdit === vlink.title) return;
    try {
      await vlinksAPI.updateVLink(token, vlinkId, { title: titleEdit });
      toast.success('Title updated');
      await load();
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filterEntities = (type: VLinkEntityType) => entities.filter((e) => e.entityType === type);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: 'Files' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'chats', label: 'Chats' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'activity', label: 'Activity' },
    { id: 'ai', label: 'AI' },
    { id: 'people', label: 'People' },
  ];

  if (loading || !vlink) {
    return (
      <div className="p-8">
        <Spinner />
      </div>
    );
  }

  const renderEntityList = (rows: VLinkEntityRow[]) => (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className={`border rounded p-3 text-sm ${
            row.access === 'restricted' ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-800'
          }`}
        >
          {row.access === 'restricted' ? (
            <span>Restricted {row.title ?? 'item'} — you don&apos;t have access</span>
          ) : (
            <a href={row.url ?? '#'} className="text-indigo-700 hover:underline">
              {row.title ?? row.entityId}
            </a>
          )}
        </li>
      ))}
      {rows.length === 0 && <p className="text-gray-600 text-sm">No linked items.</p>}
    </ul>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-700 hover:text-gray-900">
          <ArrowLeft size={20} />
        </button>
        <Link2 className="text-indigo-600" size={22} />
        <div className="flex-1 min-w-0">
          <Input value={titleEdit} onChange={(e) => setTitleEdit(e.target.value)} onBlur={saveTitle} />
          <p className="text-xs text-gray-600 mt-1">{vlink.publicCode} · {vlink.scope}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
          Share
        </Button>
      </div>

      <div className="flex gap-1 px-6 pt-3 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
              tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'overview' && (
          <div className="space-y-4 max-w-2xl">
            <p className="text-gray-800">{vlink.description ?? 'No description.'}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-gray-600">Linked (accessible)</div>
                <div className="font-semibold text-gray-900">
                  {Object.values(vlink.entityCounts.accessible).reduce((a, b) => a + b, 0)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-gray-600">Restricted</div>
                <div className="font-semibold text-gray-900">{vlink.entityCounts.restricted}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-gray-600">Child vlinks</div>
                <div className="font-semibold text-gray-900">{vlink.childVLinkCount}</div>
              </div>
            </div>
          </div>
        )}
        {tab === 'files' && renderEntityList(filterEntities('FILE').concat(filterEntities('FOLDER')))}
        {tab === 'calendar' && renderEntityList(filterEntities('CALENDAR_EVENT'))}
        {tab === 'chats' && <p className="text-gray-700 text-sm">Chat integration coming in a future phase.</p>}
        {tab === 'tasks' && <p className="text-gray-700 text-sm">Task integration coming soon.</p>}
        {tab === 'activity' && (
          <ul className="space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="border-b pb-2 text-gray-800">
                <span className="font-medium">{a.action}</span>
                <span className="text-gray-600 ml-2">{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
            {activity.length === 0 && <p className="text-gray-600">No activity yet.</p>}
          </ul>
        )}
        {tab === 'ai' && (
          <p className="text-gray-700 text-sm">
            Confirmed vlinks can ground AI context in a later release. Suggestions require your approval.
          </p>
        )}
        {tab === 'people' && (
          <div>
            <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
              Manage access
            </Button>
          </div>
        )}
      </div>

      <VLinkShareModal open={shareOpen} onClose={() => setShareOpen(false)} token={token} vlinkId={vlinkId} />
    </div>
  );
}
