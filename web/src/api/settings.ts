import { authenticatedApiCall } from '../lib/apiUtils';

export interface SettingsNavigationEntry {
  id: string;
  label: string;
  href: string;
  owner: string;
  section: string;
  apiPath?: string;
  description: string;
  disposition: 'in_hub' | 'external_link' | 'reference';
  order: number;
}

export interface SettingsSectionsResponse {
  success: boolean;
  sections: Array<{
    id: string;
    label: string;
    owner: string;
    keys: string[];
    readOnly: boolean;
  }>;
  navigation: SettingsNavigationEntry[];
  canonicalSections: Array<{ id: string; label: string }>;
  hubInventory: Array<{
    id: string;
    label: string;
    path: string;
    disposition: string;
    canonicalTarget?: string;
    owner: string;
    scope: string;
  }>;
  hubSummary: {
    total: number;
    canonical: number;
    duplicate: number;
    personalBefore: number;
    personalAfter: number;
  };
}

export interface SettingsBulkResponse {
  success: boolean;
  settings: Record<string, string>;
}

export async function getSettingsSections(): Promise<SettingsSectionsResponse> {
  return authenticatedApiCall<SettingsSectionsResponse>('/api/settings/sections', {
    method: 'GET',
  });
}

export async function getSettings(): Promise<SettingsBulkResponse> {
  return authenticatedApiCall<SettingsBulkResponse>('/api/settings', {
    method: 'GET',
  });
}

export async function updateSetting(key: string, value: string): Promise<SettingsBulkResponse> {
  return authenticatedApiCall<SettingsBulkResponse>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ key, value }),
  });
}
