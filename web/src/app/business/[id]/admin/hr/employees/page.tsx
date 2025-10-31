'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Alert, EmptyState, Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';

type ActiveEmployee = {
  id: string; // employeePositionId
  user: { id: string; name: string | null; email: string; image?: string | null };
  position: { title: string; department?: { name?: string | null } | null; tier?: { name?: string | null } | null };
  hrProfile?: { hireDate?: string | null; employeeType?: string | null; workLocation?: string | null } | null;
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

  const initialTab = (searchParams?.get('status') || 'active').toLowerCase() === 'terminated' ? 'terminated' : 'active';
  const [tab, setTab] = useState<'active' | 'terminated'>(initialTab);
  const [q, setQ] = useState<string>(searchParams?.get('q') || '');
  const [page, setPage] = useState<number>(Number(searchParams?.get('page') || 1));
  const [pageSize] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<{ items: ActiveEmployee[]; count: number }>({ items: [], count: 0 });
  const [terminatedData, setTerminatedData] = useState<{ items: TerminatedEmployee[]; count: number }>({ items: [], count: 0 });
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [showImport, setShowImport] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{ summary: { total: number; created: number; updated: number; skipped: number; errors: number }; results: Array<{ row: number; success: boolean; email: string; name: string; error?: string; action?: string }> } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null); // employeePositionId for detail view
  const [editingId, setEditingId] = useState<string | null>(null); // employeePositionId
  const [form, setForm] = useState<{ hireDate?: string; employeeType?: string; workLocation?: string; emergencyContact?: string; personalInfo?: string }>({});
  const [detailEmployee, setDetailEmployee] = useState<ActiveEmployee | null>(null);
  
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

  const [terminating, setTerminating] = useState<string | null>(null);
  
  const handleTerminate = async (employeePositionId: string) => {
    if (!confirm('Terminate this employee and vacate the position? This action cannot be undone.')) return;
    
    setTerminating(employeePositionId);
    try {
      const res = await fetch(`/api/hr/admin/employees/${encodeURIComponent(employeePositionId)}/terminate?businessId=${encodeURIComponent(businessId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString() })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Termination failed' }));
        throw new Error(errorData.error || `Termination failed (${res.status})`);
      }
      
      // Refresh both tabs since list membership changes
      if (tab === 'active') {
        const next = activeData.items.filter((e) => e.id !== employeePositionId);
        setActiveData((prev) => ({ ...prev, items: next, count: Math.max(0, prev.count - 1) }));
      }
      
      toast.success('Employee terminated successfully. Position is now vacant.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Termination failed';
      toast.error(errorMsg);
      console.error('[HR/employees] Termination error:', err);
    } finally {
      setTerminating(null);
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

  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  const handleExport = async () => {
    try {
      const statusParam = active ? 'ACTIVE' : 'TERMINATED';
      const url = `/api/hr/admin/employees/export?businessId=${encodeURIComponent(businessId)}&status=${statusParam}&q=${encodeURIComponent(q || '')}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `employees-${statusParam.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success('Employees exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };
  
  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch(`/api/hr/admin/employees/import?businessId=${encodeURIComponent(businessId)}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }
      
      setImportResults(data);
      toast.success(`Import completed: ${data.summary.created} created, ${data.summary.updated} updated, ${data.summary.errors} errors`);
      
      // Refresh employee list
      setPage(1);
      
      // Reload data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };
  
  const submitEdit = async () => {
    if (!editingId) return;
    
    setSubmittingEdit(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.hireDate) body.hireDate = form.hireDate;
      if (form.employeeType) body.employeeType = form.employeeType;
      if (form.workLocation) body.workLocation = form.workLocation;
      if (form.emergencyContact) {
        try { 
          body.emergencyContact = JSON.parse(form.emergencyContact); 
        } catch { 
          toast.error('Emergency Contact must be valid JSON');
          return;
        }
      }
      if (form.personalInfo) {
        try { 
          body.personalInfo = JSON.parse(form.personalInfo); 
        } catch { 
          toast.error('Personal Info must be valid JSON');
          return;
        }
      }
      
      const res = await fetch(`/api/hr/admin/employees/${encodeURIComponent(editingId)}?businessId=${encodeURIComponent(businessId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || `Update failed (${res.status})`);
      }
      
      setShowEdit(false);
      setEditingId(null);
      setPage(1);
      toast.success('Employee information updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      toast.error(errorMsg);
      console.error('[HR/employees] Update error:', err);
    } finally {
      setSubmittingEdit(false);
    }
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
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, title..."
            className="border rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {q && (
            <button
              onClick={() => {
                setQ('');
                setPage(1);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            title="Export employees to CSV"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            title="Import employees from CSV"
          >
            📤 Import CSV
          </button>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Error Loading Employees" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="border rounded">
        <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-sm font-medium">
          <div className="col-span-4">Employee</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-3">Department</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Spinner size={32} />
            <span className="ml-3 text-gray-600">Loading employees...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={active ? "👥" : "📦"}
              title={active ? "No Active Employees" : "No Terminated Employees"}
              description={active 
                ? "No active employees found. Employees will appear here once they're added to your organization."
                : "No terminated employees in the archive. Terminated employees will be stored here for record keeping."}
            />
          </div>
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
                  <button
                    onClick={() => {
                      if (active) {
                        setViewingId((record as ActiveEmployee).id);
                        setDetailEmployee(record as ActiveEmployee);
                        setShowDetail(true);
                      }
                    }}
                    className="text-left hover:underline font-medium text-blue-600 hover:text-blue-800"
                    disabled={!active}
                  >
                    {name}
                  </button>
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
                        className="text-red-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                        onClick={() => handleTerminate((record as ActiveEmployee).id)}
                        disabled={terminating === (record as ActiveEmployee).id}
                      >
                        {terminating === (record as ActiveEmployee).id && <Spinner size={12} />}
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
              <button 
                className="px-4 py-2 border rounded disabled:opacity-50" 
                onClick={() => { setShowEdit(false); setEditingId(null); }}
                disabled={submittingEdit}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center gap-2" 
                onClick={submitEdit}
                disabled={submittingEdit}
              >
                {submittingEdit && <Spinner size={16} />}
                {submittingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetail && detailEmployee && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Employee Profile</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setViewingId(null);
                  setDetailEmployee(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-medium">{detailEmployee.user.name || detailEmployee.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{detailEmployee.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Position</label>
                    <p className="font-medium">{detailEmployee.position.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Department</label>
                    <p className="font-medium">{detailEmployee.position.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Organizational Tier</label>
                    <p className="font-medium">{detailEmployee.position.tier?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* HR Information */}
              {detailEmployee.hrProfile && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">HR Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {detailEmployee.hrProfile.hireDate && (
                      <div>
                        <label className="text-sm text-gray-600">Hire Date</label>
                        <p className="font-medium">{new Date(detailEmployee.hrProfile.hireDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {detailEmployee.hrProfile.employeeType && (
                      <div>
                        <label className="text-sm text-gray-600">Employment Type</label>
                        <p className="font-medium">{detailEmployee.hrProfile.employeeType.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    openEdit(detailEmployee);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit HR Information
                </button>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    handleTerminate(detailEmployee.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Terminate Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Import Employees from CSV</h2>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportFile(null);
                  setImportResults(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {!importResults ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="text-4xl">📄</div>
                    <div className="font-semibold">Click to select CSV file</div>
                    <div className="text-sm text-gray-500">
                      {importFile ? importFile.name : 'Required columns: name, email, title, department'}
                    </div>
                  </label>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
                  <div className="font-semibold mb-2">CSV Format Requirements:</div>
                  <div className="space-y-1 text-gray-700">
                    <div>• <strong>Required:</strong> name, email</div>
                    <div>• <strong>Optional:</strong> title, department, hiredate, employeetype, worklocation</div>
                    <div>• First row must contain column headers</div>
                    <div>• Dates should be in YYYY-MM-DD format</div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowImport(false);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                  >
                    {importing && <Spinner size={16} />}
                    {importing ? 'Importing...' : 'Import Employees'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="font-semibold mb-2">Import Summary</div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Rows</div>
                      <div className="text-2xl font-bold">{importResults.summary.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Created</div>
                      <div className="text-2xl font-bold text-green-600">{importResults.summary.created}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Updated</div>
                      <div className="text-2xl font-bold text-blue-600">{importResults.summary.updated}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Errors</div>
                      <div className="text-2xl font-bold text-red-600">{importResults.summary.errors}</div>
                    </div>
                  </div>
                </div>
                
                {importResults.summary.errors > 0 && (
                  <div className="border rounded max-h-60 overflow-y-auto">
                    <div className="bg-gray-50 px-3 py-2 font-semibold text-sm">Errors ({importResults.summary.errors})</div>
                    {importResults.results.filter(r => !r.success).slice(0, 20).map((result, idx) => (
                      <div key={idx} className="px-3 py-2 border-t text-sm">
                        <div className="font-medium">Row {result.row}: {result.name} ({result.email})</div>
                        <div className="text-red-600">{result.error}</div>
                      </div>
                    ))}
                    {importResults.results.filter(r => !r.success).length > 20 && (
                      <div className="px-3 py-2 border-t text-sm text-gray-500">
                        ...and {importResults.results.filter(r => !r.success).length - 20} more errors
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowImport(false);
                      setImportFile(null);
                      setImportResults(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


