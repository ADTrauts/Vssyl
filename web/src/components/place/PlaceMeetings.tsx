'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card, Button, ConfirmModal, DropdownMenu } from 'shared/components';
import type { ContextMenuItem } from 'shared/components';
import {
  getMeetings, createMeeting, rsvpMeeting, linkMeetingToCalendar,
} from '@/api/placeMeeting';
import type { MeetingPlace } from '@/api/placeMeeting';
import { usePlace } from '../../contexts/PlaceContext';
import { useGlobalTrash } from '@/contexts/GlobalTrashContext';
import { PlaceCalendarLinkModal } from './PlaceCalendarLinkModal';
import { PlaceMeetingsEmptyState } from './PlaceEmptyStates';
import { placeActionError, placeActionSuccess } from './placeUxFeedback';
import {
  MapPin, Calendar, Clock, Plus, Check, X, Users,
  ChevronDown, ChevronUp, MoreHorizontal,
} from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PROPOSED: { bg: 'bg-amber-50', text: 'text-amber-700' },
  CONFIRMED: { bg: 'bg-green-50', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

export default function PlaceMeetings() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { place } = usePlace();
  const { trashItem } = useGlobalTrash();

  const [meetings, setMeetings] = useState<MeetingPlace[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [pendingTrash, setPendingTrash] = useState<{ id: string; name: string } | null>(null);
  const [isTrashing, setIsTrashing] = useState(false);

  const [calendarLinkTarget, setCalendarLinkTarget] = useState<{ id: string; name: string } | null>(null);
  const [isLinkingCalendar, setIsLinkingCalendar] = useState(false);

  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formNote, setFormNote] = useState('');
  const [formBusinessId, setFormBusinessId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchMeetings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getMeetings(token);
      setMeetings(data);
    } catch (error: unknown) {
      setLoadError('Could not load meetings');
      placeActionError('Could not load meetings', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  useEffect(() => {
    const onTrashOrRestore = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: string; type?: string }>).detail;
      if (detail?.moduleId === 'place' && (detail.type === 'meeting' || event.type === 'itemRestored')) {
        void fetchMeetings();
      }
    };
    window.addEventListener('placeItemTrashed', onTrashOrRestore);
    window.addEventListener('itemRestored', onTrashOrRestore);
    return () => {
      window.removeEventListener('placeItemTrashed', onTrashOrRestore);
      window.removeEventListener('itemRestored', onTrashOrRestore);
    };
  }, [fetchMeetings]);

  const handleCreate = async () => {
    if (!token || !formName.trim()) return;
    setCreating(true);
    try {
      await createMeeting({
        locationName: formName.trim(),
        locationAddress: formAddress.trim() || undefined,
        scheduledAt: formDate || undefined,
        duration: formDuration,
        note: formNote.trim() || undefined,
        businessId: formBusinessId || undefined,
      }, token);
      setFormName(''); setFormAddress(''); setFormDate(''); setFormNote(''); setFormBusinessId('');
      setShowCreate(false);
      await fetchMeetings();
      placeActionSuccess('Meeting created');
    } catch (error: unknown) {
      placeActionError('Could not create meeting', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRsvp = async (meetingId: string, status: 'ACCEPTED' | 'DECLINED') => {
    if (!token) return;
    try {
      await rsvpMeeting(meetingId, status, token);
      await fetchMeetings();
      placeActionSuccess(status === 'ACCEPTED' ? 'Invite accepted' : 'Invite declined');
    } catch (error: unknown) {
      placeActionError('Could not update RSVP', error);
    }
  };

  const requestTrashMeeting = (meetingId: string, name: string) => {
    setPendingTrash({ id: meetingId, name });
  };

  const executeTrashMeeting = async () => {
    if (!pendingTrash) return;
    setIsTrashing(true);
    try {
      await trashItem({
        id: pendingTrash.id,
        name: pendingTrash.name,
        type: 'meeting',
        moduleId: 'place',
        moduleName: 'Place',
      });
      setPendingTrash(null);
      await fetchMeetings();
      placeActionSuccess('Meeting moved to trash');
    } catch (error: unknown) {
      placeActionError('Could not move meeting to trash', error);
    } finally {
      setIsTrashing(false);
    }
  };

  const requestLinkCalendar = (meetingId: string, name: string) => {
    setCalendarLinkTarget({ id: meetingId, name });
    setOpenMenuId(null);
  };

  const executeLinkCalendar = async (calendarId: string) => {
    if (!token || !calendarLinkTarget) return;
    setIsLinkingCalendar(true);
    try {
      await linkMeetingToCalendar(calendarLinkTarget.id, calendarId, token);
      setCalendarLinkTarget(null);
      await fetchMeetings();
      placeActionSuccess('Meeting linked to calendar');
    } catch (error: unknown) {
      placeActionError('Could not link meeting to calendar', error);
    } finally {
      setIsLinkingCalendar(false);
    }
  };

  const buildMeetingMenuItems = (
    meeting: MeetingPlace,
    isCreator: boolean,
  ): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    if (!meeting.eventId) {
      items.push({
        label: 'Add to calendar',
        onClick: () => requestLinkCalendar(meeting.id, meeting.locationName),
      });
    }
    if (isCreator && meeting.status !== 'CANCELLED') {
      items.push({
        label: 'Move to trash',
        destructive: true,
        onClick: () => {
          requestTrashMeeting(meeting.id, meeting.locationName);
          setOpenMenuId(null);
        },
      });
    }
    return items;
  };

  const businessNodes = place?.nodes.filter(n => n.nodeType === 'BUSINESS') || [];
  const pendingInvites = meetings.filter(m =>
    m.creatorId !== userId && m.invites.some(i => i.inviteeId === userId && i.status === 'PENDING')
  );
  const activeMeetings = meetings.filter(m => m.status !== 'CANCELLED');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meeting Places</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Coordinate meetups with your connections</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
          {loadError}{' '}
          <button type="button" onClick={() => void fetchMeetings()} className="font-semibold underline">
            Retry
          </button>
        </p>
      )}

      {pendingInvites.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Users className="h-4 w-4 text-amber-600" />
              Pending Invites ({pendingInvites.length})
            </h3>
            <div className="space-y-3">
              {pendingInvites.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.locationName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      From {m.creator.name || 'Unknown'}
                      {m.scheduledAt && ` · ${new Date(m.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    {m.note && <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">&quot;{m.note}&quot;</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleRsvp(m.id, 'ACCEPTED')} className="rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200" title="Accept" aria-label="Accept invite">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleRsvp(m.id, 'DECLINED')} className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200" title="Decline" aria-label="Decline invite">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showCreate && (
        <Card>
          <div className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create a Meeting Place</h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Location Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g., Joe's Pizza, Central Park"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Link to a Place on your Main Street</label>
              <select
                value={formBusinessId}
                onChange={e => setFormBusinessId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
              >
                <option value="">None</option>
                {businessNodes.map(n => (
                  <option key={n.entityId} value={n.entityId}>{n.label || n.entityId}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Duration (min)</label>
                <input
                  type="number"
                  value={formDuration}
                  onChange={e => setFormDuration(parseInt(e.target.value, 10) || 60)}
                  min={15}
                  step={15}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Address</label>
              <input
                type="text"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="Optional address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Note</label>
              <input
                type="text"
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="e.g., Let's grab lunch!"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!formName.trim() || creating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Meeting'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {activeMeetings.length === 0 ? (
        <PlaceMeetingsEmptyState />
      ) : (
        <div className="space-y-3">
          {activeMeetings.map(m => {
            const statusStyle = STATUS_COLORS[m.status] || STATUS_COLORS.PROPOSED;
            const isExpanded = expandedId === m.id;
            const isCreator = m.creatorId === userId;
            const myInvite = m.invites.find(i => i.inviteeId === userId);
            const menuItems = buildMeetingMenuItems(m, isCreator);

            return (
              <Card key={m.id}>
                <div className="p-4">
                  <div
                    className="flex cursor-pointer items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : m.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{m.locationName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                          {m.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        {m.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(m.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {m.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {m.duration} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {m.invites.length + 1}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                      {m.note && <p className="text-sm text-gray-700 dark:text-gray-300">&quot;{m.note}&quot;</p>}
                      {m.locationAddress && (
                        <p className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3" /> {m.locationAddress}
                        </p>
                      )}

                      <div>
                        <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Attendees</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                            {m.creator.name || 'Unknown'} (organizer)
                          </span>
                          {m.invites.map(inv => (
                            <span
                              key={inv.id}
                              className={`rounded-full px-2 py-1 text-xs ${
                                inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                                inv.status === 'DECLINED' ? 'bg-red-50 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {inv.invitee.name || 'Unknown'} ({inv.status.toLowerCase()})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {myInvite && myInvite.status === 'PENDING' && (
                          <>
                            <button type="button" onClick={() => handleRsvp(m.id, 'ACCEPTED')} className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200">
                              <Check className="h-3 w-3" /> Accept
                            </button>
                            <button type="button" onClick={() => handleRsvp(m.id, 'DECLINED')} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200">
                              <X className="h-3 w-3" /> Decline
                            </button>
                          </>
                        )}
                        {m.eventId && (
                          <span className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">
                            <Calendar className="h-3 w-3" /> On calendar
                          </span>
                        )}
                        {menuItems.length > 0 && (
                          <DropdownMenu
                            open={openMenuId === m.id}
                            onOpenChange={open => setOpenMenuId(open ? m.id : null)}
                            items={menuItems}
                            menuLabel="Meeting actions"
                            align="start"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label="Meeting actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId((prev) => (prev === m.id ? null : m.id));
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={pendingTrash !== null}
        onClose={() => setPendingTrash(null)}
        onConfirm={executeTrashMeeting}
        title="Move meeting to trash?"
        description={
          pendingTrash
            ? `Move "${pendingTrash.name}" to trash? You can restore it from the global trash bin.`
            : undefined
        }
        variant="destructive"
        confirmLabel="Move to trash"
        loading={isTrashing}
      />

      <PlaceCalendarLinkModal
        open={calendarLinkTarget !== null}
        onClose={() => setCalendarLinkTarget(null)}
        onConfirm={executeLinkCalendar}
        loading={isLinkingCalendar}
        meetingName={calendarLinkTarget?.name}
      />
    </div>
  );
}
