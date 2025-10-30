/**
 * Employee Self-Service HR Page
 * 
 * Employee view of their own HR data
 * Access: All business employees
 * Location: /business/[id]/workspace/hr/me
 * 
 * Framework: Displays employee's own HR information
 * Features will be implemented incrementally
 */

'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useHRFeatures } from '@/hooks/useHRFeatures';
import Link from 'next/link';

interface EmployeeData {
  id: string;
  user: {
    name: string;
  }
  & { email: string; };
  position: {
    title: string;
    department?: {
      name: string;
    };
  };
  hrProfile?: {
    hireDate?: string;
    employeeType?: string;
  };
}

type MyRequest = { id: string; type: string; startDate: string; endDate: string; status: string; requestedAt: string; managerNote?: string };

enum TimeOffType {
  PTO = 'PTO',
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  UNPAID = 'UNPAID'
}

export default function EmployeeSelfService() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = (params?.id as string) || '';
  
  const [businessTier, setBusinessTier] = useState<string>('business_advanced');
  const hrFeatures = useHRFeatures(businessTier);
  
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [balance, setBalance] = useState<{ pto: number; sick: number; personal: number } | null>(null);
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState<{ type: string; startDate: string; endDate: string; reason: string }>({ type: '', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load profile + balance + my requests
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileRes, balanceRes, requestsRes] = await Promise.all([
          fetch(`/api/hr/me?businessId=${encodeURIComponent(businessId)}`),
          fetch(`/api/hr/me/time-off/balance?businessId=${encodeURIComponent(businessId)}`),
          fetch(`/api/hr/me/time-off/requests?businessId=${encodeURIComponent(businessId)}`)
        ]);
        if (!profileRes.ok) throw new Error('Failed to load profile');
        const profileJson = await profileRes.json();
        setEmployeeData({
          id: profileJson.employee?.id || '1',
          user: { name: session?.user?.name || 'Employee', email: session?.user?.email || 'employee@example.com' } as any,
          position: profileJson.employee?.position || { title: 'Software Engineer', department: { name: 'Engineering' } },
          hrProfile: profileJson.employee?.hrProfile || { hireDate: '2024-01-15', employeeType: 'FULL_TIME' }
        });
        if (balanceRes.ok) {
          const balJson = await balanceRes.json();
          setBalance(balJson.balance);
        } else {
          setBalance({ pto: 0, sick: 0, personal: 0 });
        }
        if (requestsRes.ok) {
          const rjson = await requestsRes.json();
          setRequests(rjson.requests || []);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (businessId) load();
  }, [businessId, session]);
  
  const submitRequest = async () => {
    if (!reqForm.type || !reqForm.startDate || !reqForm.endDate) {
      alert('Type and Dates are required');
      return;
    }
    if (new Date(reqForm.endDate) < new Date(reqForm.startDate)) {
      alert('End date must be after start date');
      return;
    }
    const res = await fetch(`/api/hr/me/time-off/request?businessId=${encodeURIComponent(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: reqForm.type, startDate: reqForm.startDate, endDate: reqForm.endDate, reason: reqForm.reason })
    });
    if (!res.ok) {
      alert('Failed to submit request');
      return;
    }
    const data = await res.json();
    setRequests((prev) => [
      { id: data.request.id, type: data.request.type, startDate: data.request.startDate, endDate: data.request.endDate, status: data.request.status, requestedAt: data.request.requestedAt },
      ...prev
    ]);
    setShowRequest(false);
    setReqForm({ type: '', startDate: '', endDate: '', reason: '' });
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!hrFeatures.hasHRAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">HR Self-Service Not Available</h1>
        <p className="text-gray-600">
          Your company needs Business Advanced or Enterprise tier to access HR features.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My HR</h1>
        <p className="text-gray-600 mt-2">
          View and manage your employee information
        </p>
      </div>
      
      {/* Employee Profile Card */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="font-medium">{employeeData?.user.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{(employeeData as any)?.user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Position</label>
            <p className="font-medium">{employeeData?.position.title}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Department</label>
            <p className="font-medium">{employeeData?.position.department?.name || 'N/A'}</p>
          </div>
          {employeeData?.hrProfile?.hireDate && (
            <div>
              <label className="text-sm text-gray-600">Hire Date</label>
              <p className="font-medium">
                {new Date(employeeData.hrProfile.hireDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {employeeData?.hrProfile?.employeeType && (
            <div>
              <label className="text-sm text-gray-600">Employment Type</label>
              <p className="font-medium">
                {employeeData.hrProfile.employeeType.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Self-Service Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Off */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-3xl">🏖️</div>
              <h3 className="text-lg font-semibold">Time Off</h3>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setShowRequest(true)}>New Request</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
            <div className="border rounded p-3">
              <div className="text-gray-500">PTO Remaining</div>
              <div className="text-xl font-semibold">{balance?.pto ?? 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Sick</div>
              <div className="text-xl font-semibold">{balance?.sick ?? 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Personal</div>
              <div className="text-xl font-semibold">{balance?.personal ?? 0}</div>
            </div>
          </div>
          <div className="border rounded">
            <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-sm font-medium">
              <div className="col-span-3">Type</div>
              <div className="col-span-4">Dates</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2">Submitted</div>
            </div>
            {requests.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">No requests yet</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="grid grid-cols-12 px-3 py-2 border-t text-sm">
                  <div className="col-span-3">{r.type}</div>
                  <div className="col-span-4">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</div>
                  <div className="col-span-3">{r.status}</div>
                  <div className="col-span-2">{new Date(r.requestedAt).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Pay Stubs */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">💵</div>
          <h3 className="text-lg font-semibold mb-2">Pay Stubs</h3>
          <p className="text-gray-600 text-sm mb-4">
            View your pay history and download pay stubs
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Benefits */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">🏥</div>
          <h3 className="text-lg font-semibold mb-2">My Benefits</h3>
          <p className="text-gray-600 text-sm mb-4">
            View and manage your benefits enrollment
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Performance */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">⭐</div>
          <h3 className="text-lg font-semibold mb-2">My Reviews</h3>
          <p className="text-gray-600 text-sm mb-4">
            View your performance reviews and goals
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
      </div>

      {showRequest && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
            <div className="text-lg font-semibold mb-3">New Time-Off Request</div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select className="w-full border rounded px-3 py-2" value={reqForm.type} onChange={(e) => setReqForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="">Select…</option>
                  <option value={TimeOffType.PTO}>PTO</option>
                  <option value={TimeOffType.SICK}>Sick</option>
                  <option value={TimeOffType.PERSONAL}>Personal</option>
                  <option value={TimeOffType.UNPAID}>Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Start Date</label>
                  <input type="date" className="w-full border rounded px-3 py-2" value={reqForm.startDate} onChange={(e) => setReqForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input type="date" className="w-full border rounded px-3 py-2" value={reqForm.endDate} onChange={(e) => setReqForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Reason (optional)</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={reqForm.reason} onChange={(e) => setReqForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded" onClick={() => setShowRequest(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitRequest}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

