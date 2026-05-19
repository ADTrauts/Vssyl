/**
 * Employee read-only Workspace AI policy digest (from GET .../employee-access).
 */

export interface WorkspaceAIPolicyDigest {
  businessId: string;
  businessName?: string;
  workspaceAIName?: string;
  description?: string;
  securityLevel: string;
  complianceMode: boolean;
  policyLines: string[];
  voiceHints: string[];
  allowEmployeeInteraction: boolean;
  personalIdentityNote: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchWorkspaceAIPolicyDigest(
  token: string,
  businessId: string
): Promise<WorkspaceAIPolicyDigest | null> {
  const res = await fetch(`/api/business-ai/${businessId}/employee-access`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success?: boolean;
    data?: { policyDigest?: WorkspaceAIPolicyDigest | null };
  };
  return json.success && json.data?.policyDigest ? json.data.policyDigest : null;
}
