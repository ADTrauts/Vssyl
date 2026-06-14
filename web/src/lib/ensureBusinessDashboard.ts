/**
 * Canonical client helper for business workspace dashboard scope.
 * Wave 1B — single ownership path for dashboardId binding.
 */

export interface BusinessDashboardRecord {
  id: string;
  name?: string;
  businessId?: string | null;
}

type DashboardListItem = {
  id?: string;
  name?: string;
  businessId?: string | null;
};

function flattenDashboards(dashboardsData: {
  dashboards?: {
    personal?: DashboardListItem[];
    business?: DashboardListItem[];
    educational?: DashboardListItem[];
    household?: DashboardListItem[];
  };
}): DashboardListItem[] {
  const buckets = dashboardsData.dashboards;
  if (!buckets) return [];
  return [
    ...(buckets.personal ?? []),
    ...(buckets.business ?? []),
    ...(buckets.educational ?? []),
    ...(buckets.household ?? []),
  ];
}

export async function ensureBusinessDashboard(
  accessToken: string,
  businessId: string,
  businessName?: string
): Promise<BusinessDashboardRecord> {
  const dashboardsResponse = await fetch('/api/dashboard', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!dashboardsResponse.ok) {
    const errorText = await dashboardsResponse.text();
    throw new Error(`Failed to load dashboards: ${dashboardsResponse.status} - ${errorText}`);
  }

  const dashboardsData = await dashboardsResponse.json();
  if (!dashboardsData || typeof dashboardsData !== 'object') {
    throw new Error('Invalid dashboard response format');
  }

  const allDashboards = flattenDashboards(dashboardsData);
  let businessDashboard = allDashboards.find((d) => d.businessId === businessId);

  if (!businessDashboard) {
    const createResponse = await fetch('/api/dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: businessName ? `${businessName} Workspace` : 'Business Workspace',
        businessId,
        layout: {},
        preferences: {},
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create business dashboard: ${createResponse.status} - ${errorText}`);
    }

    const createResponseData = await createResponse.json();
    businessDashboard = createResponseData?.dashboard ?? createResponseData;
  }

  if (!businessDashboard?.id) {
    throw new Error('Business dashboard response missing id');
  }

  return {
    id: businessDashboard.id,
    name: businessDashboard.name,
    businessId: businessDashboard.businessId ?? businessId,
  };
}
