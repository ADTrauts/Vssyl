import { Dashboard, CreateDashboardRequest, UpdateDashboardRequest, DashboardResponse, DashboardsResponse } from '../../../shared/src/types/dashboard';

// Helper to add Authorization header
function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}` };
}

const API_BASE = '/api/dashboard';

interface AllDashboards {
  personal: Dashboard[];
  business: Dashboard[];
  educational: Dashboard[];
  household: Dashboard[];
}

export async function getDashboards(token: string): Promise<AllDashboards> {
  const res = await fetch(API_BASE, { 
    headers: authHeaders(token) 
  });
  if (!res.ok) throw new Error('Failed to fetch dashboards');
  const data: { dashboards: AllDashboards } = await res.json();
  return data.dashboards;
}

export async function getDashboard(token: string, id: string): Promise<Dashboard> {
  const res = await fetch(`${API_BASE}/${id}`, { 
    headers: authHeaders(token) 
  });
  if (!res.ok) throw new Error('Dashboard not found');
  const data: DashboardResponse = await res.json();
  return data.dashboard;
}

export async function createDashboard(token: string, input: CreateDashboardRequest): Promise<Dashboard> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to create dashboard');
  const data: DashboardResponse = await res.json();
  return data.dashboard;
}

export async function updateDashboard(token: string, id: string, input: UpdateDashboardRequest): Promise<Dashboard> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to update dashboard');
  const data: DashboardResponse = await res.json();
  return data.dashboard;
}

export async function deleteDashboard(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete dashboard');
}

export async function updateDashboardLayout(token: string, id: string, layout: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ layout }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to update dashboard layout');
}

// Dashboard file summary types and functions
export interface DashboardFileSummary {
  fileCount: number;
  folderCount: number;
  totalSize: number;
  hasSharedFiles: boolean;
  topLevelItems: Array<{
    name: string;
    type: 'file' | 'folder';
    size?: number;
  }>;
}

export type FileHandlingAction = 
  | { type: 'move-to-main'; createFolder: boolean; folderName?: string }
  | { type: 'move-to-trash'; retentionDays?: number }
  | { type: 'export'; format: 'zip' | 'tar' };

export async function getDashboardFileSummary(token: string, dashboardId: string): Promise<DashboardFileSummary> {
  const res = await fetch(`${API_BASE}/${dashboardId}/file-summary`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to get dashboard file summary');
  const data: { summary: DashboardFileSummary } = await res.json();
  return data.summary;
}

export async function deleteDashboardWithFiles(
  token: string, 
  dashboardId: string, 
  fileAction?: FileHandlingAction
): Promise<{ deleted: number; migration?: any; message: string }> {
  const res = await fetch(`${API_BASE}/${dashboardId}`, {
    method: 'DELETE',
    body: JSON.stringify({ fileAction }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to delete dashboard');
  return res.json();
}
