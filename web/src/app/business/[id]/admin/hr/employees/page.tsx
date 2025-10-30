'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

type ActiveEmployee = {
  id: string; // employeePositionId
  user: { id: string; name: string | null; email: string; image?: string | null };
  position: { title: string; department?: { name?: string | null } | null; tier?: { name?: string | null } | null };
  hrProfile?: { hireDate?: string | null } | null;
};

type TerminatedEmployee = {
  id: string; // hrProfile id
  employeePositionId: string;
  terminationDate?: string | null;
  terminationReason?: string | null;
  employeePosition: ActiveEmployee;
};

export default function HREmployeesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = (params?.id as string) || '';

  const initialTab = (searchParams.get('status') || 'active').toLowerCase() === 'terminated' ? 'terminated' : 'active';
  const [tab, setTab] = useState<'active' | 'terminated'>(initialTab);
  const [q, setQ] = useState<string>(searchParams.get('q') || '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const [pageSize] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<{ items: ActiveEmployee[]; count: number }>({ items: [], count: 0 });
  const [terminatedData, setTerminatedData] = useState<{ items: TerminatedEmployee[]; count: number }>({ items: [], count: 0 });
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null); // employeePositionId
  const [form, setForm] = useState<{ hireDate?: string; employeeType?: string; workLocation?: string; emergencyContact?: string; personalInfo?: string }>({});
  
  const statusParam = useMemo(() => (tab === 'terminated' ? 'TERMINATED' : 'ACTIVE'), [tab]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (tab === 'terminated') sp.set('status', 'terminated');
    if (q) sp.set('q', q);
    if (page > 1) sp.set('page', String(page));
    const query = sp.toString();
    router.replace(`/business/${businessId}/admin/hr/employees${query ? `?${query}` : ''}`);
  }, [tab, q, page, businessId, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/hr/admin/employees?businessId=${encodeURIComponent(businessId)}&status=${encodeURIComponent(statusParam)}&page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        if (statusParam === 'ACTIVE') {
          setActiveData({ items: (data.employees as ActiveEmployee[]) || [], count: data.count || 0 });
        } else {
          setTerminatedData({ items: (data.employees as TerminatedEmployee[]) || [], count: data.count || 0 });
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load employees');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId, statusParam, page, pageSize, q]);

  const handleTerminate = async (employeePositionId: string) => {
    if (!confirm('Terminate this employee and vacate the position?')) return;
    const res = await fetch(`/api/hr/admin/employees/${encodeURIComponent(employeePositionId)}/terminate?businessId=${encodeURIComponent(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: new Date().toISOString() })
    });
    if (!res.ok) {
      alert('Termination failed');
      return;
    }
    // Refresh both tabs since list membership changes
    if (tab === 'active') {
      const next = activeData.items.filter((e) => e.id !== employeePositionId);
      setActiveData((prev) => ({ ...prev, items: next, count: Math.max(0, prev.count - 1) }));
    }
  };

  const openEdit = (row: ActiveEmployee) => {
    setEditingId(row.id);
    setForm({
      hireDate: row.hrProfile?.hireDate || '',
      employeeType: '',
      workLocation: '',
      emergencyContact: '',
      personalInfo: ''
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    const body: Record<string, unknown> = {};
    if (form.hireDate) body.hireDate = form.hireDate;
    if (form.employeeType) body.employeeType = form.employeeType;
    if (form.workLocation) body.workLocation = form.workLocation;
    if (form.emergencyContact) {
      try { body.emergencyContact = JSON.parse(form.emergencyContact); } catch { alert('Emergency Contact must be valid JSON'); return; }
    }
    if (form.personalInfo) {
      try { body.personalInfo = JSON.parse(form.personalInfo); } catch { alert('Personal Info must be valid JSON'); return; }
    }
    const res = await fetch(`/api/hr/admin/employees/${encodeURIComponent(editingId)}?businessId=${encodeURIComponent(businessId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) { alert('Update failed'); return; }
    setShowEdit(false);
    setEditingId(null);
    setPage(1);
  };

  const active = tab === 'active';
  const items = active ? activeData.items : terminatedData.items;
  const count = active ? activeData.count : terminatedData.count;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${active ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setTab('active');
              setPage(1);
            }}
          >
            Active
          </button>
          <button
            className={`px-3 py-1 rounded ${!active ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setTab('terminated');
              setPage(1);
            }}
          >
            Terminated
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, title"
          className="border rounded px-3 py-2 w-64"
        />
      </div>

      {error && (
        <div className="mb-3 text-red-600 text-sm">{error}</div>
      )}

      <div className="border rounded">
        <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-sm font-medium">
          <div className="col-span-4">Employee</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-3">Department</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No results</div>
        ) : (
          items.map((row, idx) => {
            const record = active ? (row as ActiveEmployee) : (row as unknown as TerminatedEmployee);
            const ep = active ? (record as ActiveEmployee) : (record as TerminatedEmployee).employeePosition;
            const title = ep.position?.title || '-';
            const dept = ep.position?.department?.name || '-';
            const name = ep.user?.name || ep.user?.email;
            return (
              <div key={idx} className="grid grid-cols-12 px-3 py-2 border-t text-sm items-center">
                <div className="col-span-4">
                  <div className="font-medium">{name}</div>
                  <div className="text-gray-500">{ep.user?.email}</div>
                </div>
                <div className="col-span-3">{title}</div>
                <div className="col-span-3">{dept}</div>
                <div className="col-span-2 text-right">
                  {active ? (
                    <>
                      <button
                        className="text-blue-600 hover:underline mr-3"
                        onClick={() => openEdit(record as ActiveEmployee)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleTerminate((record as ActiveEmployee).id)}
                      >
                        Terminate
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">Archived</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-gray-600">{count} total</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <div className="px-2 py-1">Page {page}</div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={items.length < pageSize}
          >
            Next
          </button>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
            <div className="text-lg font-semibold mb-3">Edit HR Profile</div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm mb-1">Hire Date</label>
                <input type="date" value={form.hireDate || ''} onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Employment Type</label>
                <select value={form.employeeType || ''} onChange={(e) => setForm((f) => ({ ...f, employeeType: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select…</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="SEASONAL">Seasonal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Work Location</label>
                <input value={form.workLocation || ''} onChange={(e) => setForm((f) => ({ ...f, workLocation: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Emergency Contact (JSON)</label>
                <textarea value={form.emergencyContact || ''} onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} placeholder='{"name":"John Doe","phone":"555-1234"}' />
              </div>
              <div>
                <label className="block text-sm mb-1">Personal Info (JSON)</label>
                <textarea value={form.personalInfo || ''} onChange={(e) => setForm((f) => ({ ...f, personalInfo: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} placeholder='{"address":"123 Main St"}' />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded" onClick={() => { setShowEdit(false); setEditingId(null); }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


