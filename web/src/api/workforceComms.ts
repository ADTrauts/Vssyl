import { authenticatedApiCall } from '@/lib/apiUtils';

export type WorkforceCommunicationType =
  | 'ANNOUNCEMENT'
  | 'DEPARTMENT_BROADCAST'
  | 'LEADERSHIP_MESSAGE'
  | 'SCHEDULE_NOTICE'
  | 'HR_BROADCAST'
  | 'POLICY_COMPLIANCE'
  | 'EMERGENCY_ALERT';

export type WorkforceCommunicationStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'EXPIRED'
  | 'CANCELLED';

export type WorkforcePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type WorkforceAudienceType =
  | 'BUSINESS'
  | 'DEPARTMENT'
  | 'EMPLOYEE_POSITION'
  | 'POSITION'
  | 'TIER'
  | 'MANAGER_SUBTREE'
  | 'BUSINESS_ROLE'
  | 'CUSTOM_GROUP';

export type WorkforceCampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type WorkforceEngagementSource =
  | 'HUB'
  | 'FRONT_PAGE'
  | 'NOTIFICATION'
  | 'EMAIL'
  | 'MOBILE';

export interface WorkforceAudienceSpec {
  departmentIds?: string[];
  positionIds?: string[];
  employeePositionIds?: string[];
  tierIds?: string[];
  managerEmployeePositionId?: string;
  roles?: Array<'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'MEMBER'>;
  userIds?: string[];
}

export interface WorkforceCommunicationListItem {
  id: string;
  businessId: string;
  createdById: string;
  title: string;
  summary: string | null;
  body?: string;
  communicationType: WorkforceCommunicationType;
  priority: WorkforcePriority;
  status: WorkforceCommunicationStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  requiresAck: boolean;
  requiresRead: boolean;
  showOnFrontPage: boolean;
  showInHubFeed: boolean;
  campaignId: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  audience?: {
    id: string;
    audienceType: WorkforceAudienceType;
    audienceSpec: WorkforceAudienceSpec | null;
  } | null;
  campaign?: { id: string; name: string; status: WorkforceCampaignStatus } | null;
  _count?: {
    audienceResolutions: number;
    readReceipts: number;
    acknowledgements: number;
  };
}

export interface WorkforceCommunicationDetail extends WorkforceCommunicationListItem {
  attachments?: Array<{
    id: string;
    label: string | null;
    fileId: string | null;
    url: string | null;
    mimeType: string | null;
    sortOrder: number;
  }>;
}

export interface WorkforceCampaign {
  id: string;
  businessId: string;
  createdById: string;
  name: string;
  description: string | null;
  status: WorkforceCampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { communications: number };
}

export interface PendingAckItem {
  id: string;
  title: string;
  summary: string | null;
  priority: WorkforcePriority;
  publishedAt: string | null;
  expiresAt: string | null;
}

export interface WorkforceAiOverview {
  moduleId: string;
  publishedCount: number;
  draftCount: number;
  pendingAckCount: number;
  recentPublished: Array<{
    id: string;
    title: string;
    communicationType: WorkforceCommunicationType;
    priority: WorkforcePriority;
    publishedAt: string | null;
    requiresAck: boolean;
  }>;
}

export interface WorkforceAiReach {
  moduleId: string;
  communicationId: string;
  status: WorkforceCommunicationStatus;
  requiresAck: boolean;
  publishedAt: string | null;
  resolutionCount: number;
  readCount: number;
  ackCount: number;
  readRate: number;
  ackRate: number;
}

export interface CreateCommunicationInput {
  title: string;
  body: string;
  communicationType: WorkforceCommunicationType;
  summary?: string;
  priority?: WorkforcePriority;
  requiresAck?: boolean;
  requiresRead?: boolean;
  showOnFrontPage?: boolean;
  showInHubFeed?: boolean;
  campaignId?: string;
  scheduledAt?: string;
  expiresAt?: string;
  audienceType?: WorkforceAudienceType;
  audienceSpec?: WorkforceAudienceSpec;
}

export interface UpdateCommunicationInput extends Partial<CreateCommunicationInput> {}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
}

function buildQuery(businessId: string, extra?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams({ businessId });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
  }
  return params.toString();
}

export async function listAdminCommunications(
  businessId: string,
  filters?: { status?: WorkforceCommunicationStatus; campaignId?: string; limit?: number }
): Promise<WorkforceCommunicationListItem[]> {
  const query = buildQuery(businessId, filters);
  const data = await authenticatedApiCall<{ communications: WorkforceCommunicationListItem[] }>(
    `/api/workforce-comms/admin/communications?${query}`
  );
  return data.communications;
}

export async function getAdminCommunication(
  businessId: string,
  communicationId: string
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}?${query}`
  );
  return data.communication;
}

export async function createCommunicationDraft(
  businessId: string,
  input: CreateCommunicationInput
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications?${query}`,
    { method: 'POST', body: JSON.stringify(input) }
  );
  return data.communication;
}

export async function updateCommunicationDraft(
  businessId: string,
  communicationId: string,
  input: UpdateCommunicationInput
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}?${query}`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
  return data.communication;
}

export async function trashCommunication(
  businessId: string,
  communicationId: string
): Promise<{ trashed: true; communicationId: string }> {
  const query = buildQuery(businessId);
  return authenticatedApiCall<{ trashed: true; communicationId: string }>(
    `/api/workforce-comms/admin/communications/${communicationId}?${query}`,
    { method: 'DELETE' }
  );
}

export async function publishCommunication(
  businessId: string,
  communicationId: string
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}/publish?${query}`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return data.communication;
}

export async function scheduleCommunication(
  businessId: string,
  communicationId: string,
  scheduledAt: string
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}/schedule?${query}`,
    { method: 'POST', body: JSON.stringify({ scheduledAt }) }
  );
  return data.communication;
}

export async function cancelCommunication(
  businessId: string,
  communicationId: string
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}/cancel?${query}`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return data.communication;
}

export async function setCommunicationAudience(
  businessId: string,
  communicationId: string,
  audienceType: WorkforceAudienceType,
  audienceSpec?: WorkforceAudienceSpec
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/admin/communications/${communicationId}/audience?${query}`,
    { method: 'PUT', body: JSON.stringify({ audienceType, audienceSpec }) }
  );
  return data.communication;
}

export async function estimateCommunicationAudience(
  businessId: string,
  communicationId: string,
  audienceType?: WorkforceAudienceType,
  audienceSpec?: WorkforceAudienceSpec
): Promise<{ estimatedCount: number; audienceType: WorkforceAudienceType }> {
  const query = buildQuery(businessId);
  return authenticatedApiCall<{ estimatedCount: number; audienceType: WorkforceAudienceType }>(
    `/api/workforce-comms/admin/communications/${communicationId}/audience/estimate?${query}`,
    { method: 'POST', body: JSON.stringify({ audienceType, audienceSpec }) }
  );
}

export async function listCampaigns(
  businessId: string,
  limit?: number
): Promise<WorkforceCampaign[]> {
  const query = buildQuery(businessId, { limit });
  const data = await authenticatedApiCall<{ campaigns: WorkforceCampaign[] }>(
    `/api/workforce-comms/admin/campaigns?${query}`
  );
  return data.campaigns;
}

export async function getCampaign(
  businessId: string,
  campaignId: string
): Promise<WorkforceCampaign> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ campaign: WorkforceCampaign }>(
    `/api/workforce-comms/admin/campaigns/${campaignId}?${query}`
  );
  return data.campaign;
}

export async function createCampaign(
  businessId: string,
  input: CreateCampaignInput
): Promise<WorkforceCampaign> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ campaign: WorkforceCampaign }>(
    `/api/workforce-comms/admin/campaigns?${query}`,
    { method: 'POST', body: JSON.stringify(input) }
  );
  return data.campaign;
}

export async function updateCampaign(
  businessId: string,
  campaignId: string,
  input: Partial<CreateCampaignInput>
): Promise<WorkforceCampaign> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ campaign: WorkforceCampaign }>(
    `/api/workforce-comms/admin/campaigns/${campaignId}?${query}`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
  return data.campaign;
}

export async function completeCampaign(
  businessId: string,
  campaignId: string
): Promise<WorkforceCampaign> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ campaign: WorkforceCampaign }>(
    `/api/workforce-comms/admin/campaigns/${campaignId}/complete?${query}`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return data.campaign;
}

export async function getMyFeed(
  businessId: string,
  limit?: number
): Promise<WorkforceCommunicationListItem[]> {
  const query = buildQuery(businessId, { limit });
  const data = await authenticatedApiCall<{ communications: WorkforceCommunicationListItem[] }>(
    `/api/workforce-comms/feed?${query}`
  );
  return data.communications;
}

export async function getEmployeeCommunication(
  businessId: string,
  communicationId: string
): Promise<WorkforceCommunicationDetail> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ communication: WorkforceCommunicationDetail }>(
    `/api/workforce-comms/communications/${communicationId}?${query}`
  );
  return data.communication;
}

export async function recordCommunicationRead(
  businessId: string,
  communicationId: string,
  source: WorkforceEngagementSource = 'HUB'
): Promise<void> {
  const query = buildQuery(businessId);
  await authenticatedApiCall(
    `/api/workforce-comms/communications/${communicationId}/read?${query}`,
    { method: 'POST', body: JSON.stringify({ source }) }
  );
}

export async function acknowledgeCommunication(
  businessId: string,
  communicationId: string
): Promise<void> {
  const query = buildQuery(businessId);
  await authenticatedApiCall(
    `/api/workforce-comms/communications/${communicationId}/acknowledge?${query}`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function listPendingAcks(
  businessId: string,
  limit?: number
): Promise<PendingAckItem[]> {
  const query = buildQuery(businessId, { limit });
  const data = await authenticatedApiCall<{ pending: PendingAckItem[] }>(
    `/api/workforce-comms/pending-acks?${query}`
  );
  return data.pending;
}

export async function listFrontPageCommunications(
  businessId: string,
  limit?: number
): Promise<WorkforceCommunicationListItem[]> {
  const query = buildQuery(businessId, { limit });
  const data = await authenticatedApiCall<{ communications: WorkforceCommunicationListItem[] }>(
    `/api/workforce-comms/public/front-page?${query}`
  );
  return data.communications;
}

export async function getWorkforceAiOverview(
  businessId: string
): Promise<WorkforceAiOverview> {
  const query = buildQuery(businessId);
  const data = await authenticatedApiCall<{ success: boolean; overview: WorkforceAiOverview }>(
    `/api/workforce-comms/ai/context/overview?${query}`
  );
  return data.overview;
}

export async function getWorkforceAiReach(
  businessId: string,
  communicationId: string
): Promise<WorkforceAiReach> {
  const query = buildQuery(businessId, { communicationId });
  const data = await authenticatedApiCall<{ success: boolean; reach: WorkforceAiReach }>(
    `/api/workforce-comms/ai/context/reach?${query}`
  );
  return data.reach;
}

export interface WorkforceSummaryReport {
  overview: {
    publishedCount: number;
    draftCount: number;
    scheduledCount: number;
    activeCampaigns: number;
    completedCampaigns: number;
    ackRequiredCount: number;
  };
  engagement: {
    audienceReach: number;
    readCount: number;
    ackCount: number;
    averageReadRate: number;
    averageAckRate: number;
    completionPercentage: number;
  };
  publishTrends: Array<{ date: string; count: number }>;
  activity: { publishedEvents: number };
}

export interface WorkforceCommunicationReportItem {
  id: string;
  title: string;
  communicationType: WorkforceCommunicationType;
  priority: WorkforcePriority;
  publishedAt: string | null;
  requiresAck: boolean;
  requiresRead: boolean;
  campaign: { id: string; name: string } | null;
  reach: number;
  readCount: number;
  ackCount: number;
  readRate: number;
  ackRate: number;
  completionPercentage: number;
}

export interface WorkforceCampaignReportItem {
  id: string;
  name: string;
  status: WorkforceCampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  communicationCount: number;
  publishedCommunicationCount: number;
  reach: number;
  readCount: number;
  ackCount: number;
  readRate: number;
  ackRate: number;
  completionPercentage: number;
}

export interface WorkforceAcknowledgementsReport {
  overview: {
    communicationCount: number;
    totalReach: number;
    totalAcks: number;
    overallAckRate: number;
    overallCompletionPercentage: number;
  };
  items: Array<{
    communicationId: string;
    title: string;
    publishedAt: string | null;
    priority: WorkforcePriority;
    resolutionCount: number;
    ackCount: number;
    ackRate: number;
    completionPercentage: number;
    pendingCount: number;
    pendingUserIds: string[];
  }>;
}

export async function getWorkforceSummaryReport(
  businessId: string,
  options?: { startDate?: string; endDate?: string }
): Promise<WorkforceSummaryReport> {
  const query = buildQuery(businessId, options);
  const data = await authenticatedApiCall<{ report: WorkforceSummaryReport }>(
    `/api/workforce-comms/admin/reports/summary?${query}`
  );
  return data.report;
}

export async function getWorkforceCommunicationsReport(
  businessId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<WorkforceCommunicationReportItem[]> {
  const query = buildQuery(businessId, options);
  const data = await authenticatedApiCall<{
    report: { communications: WorkforceCommunicationReportItem[] };
  }>(`/api/workforce-comms/admin/reports/communications?${query}`);
  return data.report.communications;
}

export async function getWorkforceCampaignsReport(
  businessId: string,
  limit?: number
): Promise<WorkforceCampaignReportItem[]> {
  const query = buildQuery(businessId, { limit });
  const data = await authenticatedApiCall<{
    report: { campaigns: WorkforceCampaignReportItem[] };
  }>(`/api/workforce-comms/admin/reports/campaigns?${query}`);
  return data.report.campaigns;
}

export async function getWorkforceAcknowledgementsReport(
  businessId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<WorkforceAcknowledgementsReport> {
  const query = buildQuery(businessId, options);
  const data = await authenticatedApiCall<{ report: WorkforceAcknowledgementsReport }>(
    `/api/workforce-comms/admin/reports/acknowledgements?${query}`
  );
  return data.report;
}

export async function migrateFrontPageAnnouncements(
  businessId: string,
  dryRun = false
): Promise<{
  result: {
    dryRun: boolean;
    candidateCount: number;
    importCount: number;
    skippedExisting: number;
    imported: string[];
  };
  dryRun: boolean;
}> {
  const query = buildQuery(businessId, { dryRun: dryRun ? 'true' : undefined });
  return authenticatedApiCall(
    `/api/workforce-comms/admin/migrate/front-page?${query}`,
    { method: 'POST', body: JSON.stringify({ dryRun }) }
  );
}
