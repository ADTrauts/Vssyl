import { authenticatedApiCall } from '../lib/apiUtils';

export interface DeveloperStats {
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  activeSubscriptions: number;
  totalDownloads: number;
  averageRating: number;
}

export interface ModuleRevenue {
  moduleId: string;
  moduleName: string;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  lifetimeValue: number;
}

export interface PayoutRequest {
  developerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Get developer dashboard
export const getDeveloperDashboard = async (businessId?: string): Promise<{
  stats: DeveloperStats;
  moduleRevenue: ModuleRevenue[];
  payoutHistory: any[];
}> => {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const response = await authenticatedApiCall<{ dashboard: any }>(`/api/developer/dashboard${qs}`);
  return response.dashboard;
};

// Get developer statistics
export const getDeveloperStats = async (businessId?: string): Promise<DeveloperStats> => {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const response = await authenticatedApiCall<{ stats: DeveloperStats }>(`/api/developer/stats${qs}`);
  return response.stats;
};

// Get module revenue
export const getModuleRevenue = async (businessId?: string): Promise<ModuleRevenue[]> => {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const response = await authenticatedApiCall<{ moduleRevenue: ModuleRevenue[] }>(`/api/developer/revenue${qs}`);
  return response.moduleRevenue;
};

// Get module analytics
export const getModuleAnalytics = async (moduleId: string): Promise<any> => {
  const response = await authenticatedApiCall<{ analytics: any }>(`/api/developer/modules/${moduleId}/analytics`);
  return response.analytics;
};


// Request payout
export const requestPayout = async (amount: number, businessId?: string): Promise<PayoutRequest> => {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const response = await authenticatedApiCall<{ payout: PayoutRequest }>(`/api/developer/payouts${qs}`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response.payout;
};

// Get payout history
export const getPayoutHistory = async (businessId?: string): Promise<any[]> => {
  const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  const response = await authenticatedApiCall<{ payoutHistory: any[] }>(`/api/developer/payouts${qs}`);
  return response.payoutHistory;
};

// Update module pricing
export const updateModulePricing = async (
  moduleId: string,
  basePrice: number,
  enterprisePrice?: number
): Promise<any> => {
  const response = await authenticatedApiCall<{ module: any }>(`/api/developer/modules/${moduleId}/pricing`, {
    method: 'PUT',
    body: JSON.stringify({ basePrice, enterprisePrice }),
  });
  return response.module;
}; 