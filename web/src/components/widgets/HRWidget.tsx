'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, CalendarOff, ClipboardList, ArrowRight } from 'lucide-react';
import { Spinner } from 'shared/components';

interface HRWidgetProps {
  id: string;
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
  businessId: string | null;
}

interface HRSummary {
  employeeCount: number;
  pendingTimeOffCount: number;
  pendingOnboardingCount: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export default function HRWidget({
  dashboardType,
  businessId,
}: HRWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HRSummary | null>(null);

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
          `/api/hr/dashboard-summary?businessId=${encodeURIComponent(businessId)}`,
          { headers: authHeaders(session.accessToken as string) }
        );
        if (!res.ok) throw new Error('Failed to load HR summary');
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
        <Users className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">HR at a glance</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Add this widget to a business dashboard to see employee count, pending time-off, and onboarding.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading HR summary...</span>
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

  const s = summary ?? { employeeCount: 0, pendingTimeOffCount: 0, pendingOnboardingCount: 0 };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employees</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.employeeCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending time-off</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.pendingTimeOffCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Onboarding tasks</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.pendingOnboardingCount}</span>
        </div>
      </div>
      <a
        href="/work"
        className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
      >
        View HR
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
