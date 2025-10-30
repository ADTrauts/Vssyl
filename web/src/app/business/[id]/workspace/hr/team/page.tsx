/**
 * Manager Team HR Page
 * 
 * Manager view of team HR data
 * Access: Managers with direct reports only
 * Location: /business/[id]/workspace/hr/team
 * 
 * Framework: Displays team member information
 * Features will be implemented incrementally
 */

'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useHRFeatures } from '@/hooks/useHRFeatures';
import Link from 'next/link';

interface TeamMember {
  id: string;
  user: {
    name: string;
    email: string;
    image?: string;
  };
  position: {
    title: string;
  };
}

type PendingRequest = {
  id: string;
  employeePosition: {
    user: { name?: string | null; email: string };
    position: { title: string };
  };
  type: string;
  startDate: string;
  endDate: string;
  requestedAt: string;
  reason?: string;
};

export default function ManagerTeamView() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = (params?.id as string) || '';
  
  const [businessTier, setBusinessTier] = useState<string>('business_advanced');
  const hrFeatures = useHRFeatures(businessTier);
  
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hasDirectReports, setHasDirectReports] = useState(false);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load team members
        const teamRes = await fetch(`/api/hr/team/employees?businessId=${encodeURIComponent(businessId)}`);
        if (teamRes.ok) {
          const teamJson = await teamRes.json();
          setTeamMembers(teamJson.employees || []);
          setHasDirectReports((teamJson.employees || []).length > 0);
        } else {
          setHasDirectReports(false);
        }
        // Load pending approvals
        const penRes = await fetch(`/api/hr/team/time-off/pending?businessId=${encodeURIComponent(businessId)}`);
        if (penRes.ok) {
          const pjson = await penRes.json();
          setPending(pjson.requests || []);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (businessId) load();
  }, [businessId, session]);

  const actOn = async (id: string, decision: 'APPROVE' | 'DENY') => {
    setApproving(id);
    const res = await fetch(`/api/hr/team/time-off/${encodeURIComponent(id)}/approve?businessId=${encodeURIComponent(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    setApproving(null);
    if (!res.ok) { alert('Action failed'); return; }
    setPending((prev) => prev.filter((r) => r.id !== id));
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!hrFeatures.hasHRAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Team HR Not Available</h1>
        <p className="text-gray-600">
          Your company needs Business Advanced or Enterprise tier to access HR features.
        </p>
      </div>
    );
  }
  
  if (!hasDirectReports) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">No Team Members</h1>
        <p className="text-gray-600 mb-4">
          You don't have any direct reports. Team HR features are available when you manage a team.
        </p>
        <Link 
          href={`/business/${businessId}/workspace`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Workspace
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team HR</h1>
        <p className="text-gray-600 mt-2">
          Manage your team's HR information and approvals
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Team Members</div>
          <div className="text-2xl font-bold">{teamMembers.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-2xl font-bold">{pending.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Out Today</div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-gray-500 mt-1">Coming later</div>
        </div>
      </div>
      
      {/* Team Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="border rounded-lg p-6 bg-white">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-gray-600">No team members found</p>
          ) : (
            <div className="divide-y">
              {teamMembers.map((m) => (
                <div key={m.id} className="py-2 text-sm">
                  <div className="font-medium">{m.user?.name || m.user?.email}</div>
                  <div className="text-gray-500">{m.position?.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Time-Off Approvals */}
        <div className="border rounded-lg p-6 bg-white">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="text-lg font-semibold mb-2">Time-Off Approvals</h3>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-600">No pending requests</p>
          ) : (
            <div className="border rounded">
              <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-sm font-medium">
                <div className="col-span-3">Employee</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Dates</div>
                <div className="col-span-2">Submitted</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {pending.map((r) => (
                <div key={r.id} className="grid grid-cols-12 px-3 py-2 border-t text-sm items-center">
                  <div className="col-span-3">
                    <div className="font-medium">{r.employeePosition.user?.name || r.employeePosition.user.email}</div>
                    <div className="text-gray-500">{r.employeePosition.position.title}</div>
                  </div>
                  <div className="col-span-2">{r.type}</div>
                  <div className="col-span-3">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</div>
                  <div className="col-span-2">{new Date(r.requestedAt).toLocaleDateString()}</div>
                  <div className="col-span-2 text-right">
                    <button disabled={approving === r.id} className="text-green-600 hover:underline mr-3 disabled:opacity-50" onClick={() => actOn(r.id, 'APPROVE')}>Approve</button>
                    <button disabled={approving === r.id} className="text-red-600 hover:underline disabled:opacity-50" onClick={() => actOn(r.id, 'DENY')}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Note about manager approvals */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Note for Managers</h3>
        <p className="text-sm text-blue-800">
          Your own time-off requests and HR actions require approval from your manager 
          (the position above you in the org chart). You cannot approve your own requests.
        </p>
      </div>
    </div>
  );
}

