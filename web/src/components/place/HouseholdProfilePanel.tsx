'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getHousehold, getRoleDisplayName } from '@/api/household';
import type { Household } from '@/api/household';
import { calendarAPI } from '@/api/calendar';
import type { EventItem } from '@/api/calendar';
import { Spinner } from 'shared/components';
import { X, Home, Users, Calendar, Crown, Shield, User } from 'lucide-react';

interface HouseholdProfilePanelProps {
  householdId: string;
  onClose: () => void;
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'OWNER': return <Crown className="w-3.5 h-3.5 text-amber-600" />;
    case 'ADMIN': return <Shield className="w-3.5 h-3.5 text-blue-600" />;
    default: return <User className="w-3.5 h-3.5 text-gray-600" />;
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'OWNER': return 'bg-amber-50 text-amber-800';
    case 'ADMIN': return 'bg-blue-50 text-blue-800';
    case 'ADULT': return 'bg-green-50 text-green-800';
    case 'TEEN': return 'bg-purple-50 text-purple-800';
    case 'CHILD': return 'bg-pink-50 text-pink-800';
    case 'TEMPORARY_GUEST': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function formatEventDate(startAt: string, allDay: boolean): string {
  const date = new Date(startAt);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (allDay) return dayLabel;
  return `${dayLabel} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function HouseholdProfilePanel({ householdId, onClose }: HouseholdProfilePanelProps) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [household, setHousehold] = useState<Household | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !householdId) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHousehold(token!, householdId);
        if (!cancelled) setHousehold(data);
      } catch {
        if (!cancelled) setError('Could not load this household');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [householdId, token]);

  useEffect(() => {
    if (!token || !householdId) return;
    let cancelled = false;

    async function loadEvents() {
      try {
        setEventsLoading(true);
        const now = new Date();
        const twoWeeksOut = new Date(now);
        twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

        const result = await calendarAPI.listEvents({
          start: now.toISOString(),
          end: twoWeeksOut.toISOString(),
          contexts: [`HOUSEHOLD:${householdId}`],
        });

        if (!cancelled && result.success) {
          const sorted = (result.data || []).sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );
          setEvents(sorted.slice(0, 8));
        }
      } catch {
        // Calendar events are supplementary; fail silently
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }
    loadEvents();
    return () => { cancelled = true; };
  }, [householdId, token]);

  const activeMembers = household?.members.filter(m => m.isActive) || [];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-semibold text-gray-900">Household</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size={32} />
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-gray-700">{error}</p>
          </div>
        )}

        {!loading && !error && household && (
          <div className="p-5 space-y-6">
            {/* Household name + type */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
                <Home className="w-7 h-7 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{household.name}</h3>
                {household.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{household.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    household.isPrimary ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {household.isPrimary ? 'Primary Home' : 'Secondary Home'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Users className="w-3 h-3" /> {activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            </div>

            {/* Members */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-700" /> Members
              </h4>
              <div className="space-y-2">
                {activeMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{member.user.email}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {getRoleDisplayName(member.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-700" /> Upcoming Events
              </h4>

              {eventsLoading && (
                <div className="flex items-center justify-center py-6">
                  <Spinner size={20} />
                </div>
              )}

              {!eventsLoading && events.length === 0 && (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No upcoming events</p>
                  <p className="text-xs text-gray-600 mt-0.5">Events from the household calendar will appear here</p>
                </div>
              )}

              {!eventsLoading && events.length > 0 && (
                <div className="space-y-2">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatEventDate(event.startAt, event.allDay)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Created date */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                Created {new Date(household.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
