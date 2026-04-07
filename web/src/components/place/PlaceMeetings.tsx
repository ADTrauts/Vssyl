'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card } from 'shared/components';
import {
  getMeetings, createMeeting, rsvpMeeting, deleteMeeting, linkMeetingToCalendar,
} from '@/api/placeMeeting';
import type { MeetingPlace } from '@/api/placeMeeting';
import { usePlace } from '../../contexts/PlaceContext';
import {
  MapPin, Calendar, Clock, Plus, Check, X, Users, CalendarPlus,
  ChevronDown, ChevronUp,
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

  const [meetings, setMeetings] = useState<MeetingPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
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
    try {
      const data = await getMeetings(token);
      setMeetings(data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

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
    } catch { /* */ }
    finally { setCreating(false); }
  };

  const handleRsvp = async (meetingId: string, status: 'ACCEPTED' | 'DECLINED') => {
    if (!token) return;
    try {
      await rsvpMeeting(meetingId, status, token);
      await fetchMeetings();
    } catch { /* */ }
  };

  const handleCancel = async (meetingId: string) => {
    if (!token) return;
    try {
      await deleteMeeting(meetingId, token);
      await fetchMeetings();
    } catch { /* */ }
  };

  const handleLinkCalendar = async (meetingId: string) => {
    if (!token) return;
    // For now, prompt user — in the future this will use a calendar picker
    const calendarId = prompt('Enter your calendar ID to link this meeting:');
    if (!calendarId) return;
    try {
      await linkMeetingToCalendar(meetingId, calendarId, token);
      await fetchMeetings();
    } catch { /* */ }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meeting Places</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Coordinate meetups with your connections</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Pending Invites ({pendingInvites.length})
            </h3>
            <div className="space-y-3">
              {pendingInvites.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.locationName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      From {m.creator.name || 'Unknown'}
                      {m.scheduledAt && ` · ${new Date(m.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    {m.note && <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">&quot;{m.note}&quot;</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRsvp(m.id, 'ACCEPTED')} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Accept">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRsvp(m.id, 'DECLINED')} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Decline">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create a Meeting Place</h3>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Location Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g., Joe's Pizza, Central Park"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Link to a Place on your Main Street</label>
              <select
                value={formBusinessId}
                onChange={e => setFormBusinessId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">None</option>
                {businessNodes.map(n => (
                  <option key={n.entityId} value={n.entityId}>{n.label || n.entityId}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={formDuration}
                  onChange={e => setFormDuration(parseInt(e.target.value) || 60)}
                  min={15}
                  step={15}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Address</label>
              <input
                type="text"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="Optional address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Note</label>
              <input
                type="text"
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="e.g., Let's grab lunch!"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreate}
                disabled={!formName.trim() || creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Meeting'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Meeting list */}
      {activeMeetings.length === 0 ? (
        <div className="text-center py-16 text-gray-700 dark:text-gray-300">
          <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-semibold">No meetings yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a meeting place to coordinate with your connections.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeMeetings.map(m => {
            const statusStyle = STATUS_COLORS[m.status] || STATUS_COLORS.PROPOSED;
            const isExpanded = expandedId === m.id;
            const isCreator = m.creatorId === userId;
            const myInvite = m.invites.find(i => i.inviteeId === userId);

            return (
              <Card key={m.id}>
                <div className="p-4">
                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.locationName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {m.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {m.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(m.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {m.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {m.duration} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {m.invites.length + 1}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {m.note && <p className="text-sm text-gray-700 dark:text-gray-300">&quot;{m.note}&quot;</p>}
                      {m.locationAddress && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {m.locationAddress}
                        </p>
                      )}

                      {/* Attendees */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendees</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            {m.creator.name || 'Unknown'} (organizer)
                          </span>
                          {m.invites.map(inv => (
                            <span
                              key={inv.id}
                              className={`text-xs px-2 py-1 rounded-full ${
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {/* RSVP if I'm an invitee with pending status */}
                        {myInvite && myInvite.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleRsvp(m.id, 'ACCEPTED')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => handleRsvp(m.id, 'DECLINED')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </>
                        )}
                        {/* Calendar link */}
                        {!m.eventId && (
                          <button onClick={() => handleLinkCalendar(m.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <CalendarPlus className="w-3 h-3" /> Add to Calendar
                          </button>
                        )}
                        {m.eventId && (
                          <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 bg-green-50 rounded-lg">
                            <Calendar className="w-3 h-3" /> On calendar
                          </span>
                        )}
                        {/* Cancel if creator */}
                        {isCreator && m.status !== 'CANCELLED' && (
                          <button onClick={() => handleCancel(m.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                            <X className="w-3 h-3" /> Cancel Meeting
                          </button>
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
    </div>
  );
}
