'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, UserPlus, Clock, ArrowRight } from 'lucide-react';
import { Spinner } from 'shared/components';

interface SchedulingWidgetProps {
  id: string;
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
  businessId: string | null;
}

interface SchedulingSummary {
  publishedSchedulesCount: number;
  openShiftsCount: number;
  upcomingShiftsCount: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export default function SchedulingWidget({
  dashboardType,
  businessId,
}: SchedulingWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SchedulingSummary | null>(null);

  const isBusiness = dashboardType === 'business' && businessId;

  useEffect(() => {
    if (!session?.accessToken || !isBusiness || !businessId) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/scheduling/dashboard-summary?businessId=${encodeURIComponent(businessId)}`,
          { headers: authHeaders(session.accessToken as string) }
        );
        if (!res.ok) throw new Error('Failed to load scheduling summary');
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [session?.accessToken, businessId, isBusiness]);

  if (!isBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <Clock className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-700 font-medium">Scheduling at a glance</p>
        <p className="text-xs text-gray-600 mt-1">
          Add this widget to a business dashboard to see schedules, open shifts, and upcoming shifts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-sm text-gray-600">Loading scheduling...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const s = summary ?? {
    publishedSchedulesCount: 0,
    openShiftsCount: 0,
    upcomingShiftsCount: 0,
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Published schedules</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{s.publishedSchedulesCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Open shifts</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{s.openShiftsCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Upcoming (7 days)</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{s.upcomingShiftsCount}</span>
        </div>
      </div>
      <a
        href="/work"
        className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
      >
        View Scheduling
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
