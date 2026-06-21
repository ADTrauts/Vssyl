/**
 * Authoritative settings hub inventory (PP-2 Package 2).
 * Documents canonical, duplicate, and deprecated entry points.
 */

export type HubDisposition = 'canonical' | 'duplicate' | 'deprecated' | 'reference';

export interface SettingsHubEntry {
  id: string;
  label: string;
  path: string;
  disposition: HubDisposition;
  canonicalTarget?: string;
  owner: string;
  scope: 'personal' | 'business' | 'module' | 'operator';
  notes?: string;
}

export const SETTINGS_HUB_INVENTORY: readonly SettingsHubEntry[] = [
  {
    id: 'personal-settings-hub',
    label: 'Personal Settings Hub',
    path: '/profile/settings',
    disposition: 'canonical',
    owner: 'settings',
    scope: 'personal',
    notes: 'Unified IA — account, photos, location, appearance, privacy, security',
  },
  {
    id: 'profile-legacy',
    label: 'Legacy Profile Page',
    path: '/profile',
    disposition: 'duplicate',
    canonicalTarget: '/profile/settings?tab=account',
    owner: 'identity',
    scope: 'personal',
    notes: 'Name edit only — redirects to canonical hub',
  },
  {
    id: 'analytics-privacy',
    label: 'Analytics & Privacy',
    path: '/profile/analytics',
    disposition: 'duplicate',
    canonicalTarget: '/profile/settings?tab=privacy',
    owner: 'identity',
    scope: 'personal',
    notes: 'Privacy tab canonical in settings hub; analytics remains here',
  },
  {
    id: 'notification-settings',
    label: 'Notification Settings',
    path: '/notifications/settings',
    disposition: 'canonical',
    owner: 'notifications',
    scope: 'personal',
    notes: 'Dedicated page — linked from settings hub; writes via notification adapter',
  },
  {
    id: 'avatar-theme',
    label: 'Avatar Menu Theme',
    path: 'AvatarContextMenu',
    disposition: 'reference',
    canonicalTarget: '/profile/settings?tab=appearance',
    owner: 'settings',
    scope: 'personal',
    notes: 'Quick-access theme toggle; persists via settings API',
  },
  {
    id: 'avatar-settings-dup',
    label: 'Avatar duplicate Settings label',
    path: 'AvatarContextMenu',
    disposition: 'deprecated',
    canonicalTarget: '/profile/settings',
    owner: 'settings',
    scope: 'personal',
    notes: 'Removed in Package 2 — single Settings entry',
  },
  {
    id: 'ai-control-center',
    label: 'AI Control Center',
    path: '/ai',
    disposition: 'reference',
    owner: 'ai',
    scope: 'personal',
    notes: 'Cross-link from settings hub — AI Platform SoR',
  },
  {
    id: 'billing-modal',
    label: 'Billing Modal',
    path: 'BillingModal',
    disposition: 'reference',
    canonicalTarget: '/profile/settings?tab=billing',
    owner: 'billing',
    scope: 'personal',
    notes: 'PP-3 scope — linked from settings hub',
  },
  {
    id: 'dashboard-sidebar-customize',
    label: 'Dashboard Sidebar Customize',
    path: '/dashboard',
    disposition: 'reference',
    owner: 'dashboard',
    scope: 'personal',
    notes: 'Dashboard module — not settings SoR',
  },
  {
    id: 'business-workspace-settings',
    label: 'Workspace Settings',
    path: '/business/[id]/workspace/settings',
    disposition: 'canonical',
    owner: 'business_administration',
    scope: 'business',
    notes: 'BA mega-hub — profile/branding tabs duplicate standalone pages',
  },
  {
    id: 'business-profile-page',
    label: 'Business Profile Page',
    path: '/business/[id]/profile',
    disposition: 'duplicate',
    canonicalTarget: '/business/[id]/workspace/settings?tab=profile',
    owner: 'business_administration',
    scope: 'business',
  },
  {
    id: 'business-branding-page',
    label: 'Business Branding Page',
    path: '/business/[id]/branding',
    disposition: 'duplicate',
    canonicalTarget: '/business/[id]/workspace/settings?tab=branding',
    owner: 'business_administration',
    scope: 'business',
  },
  {
    id: 'business-webhooks',
    label: 'Webhooks',
    path: '/business/[id]/workspace/settings/webhooks',
    disposition: 'canonical',
    owner: 'business_administration',
    scope: 'business',
  },
  {
    id: 'module-settings',
    label: 'Module Settings Editor',
    path: '/business/[id]/modules',
    disposition: 'reference',
    owner: 'module',
    scope: 'module',
  },
  {
    id: 'hr-admin-settings',
    label: 'HR Admin Settings',
    path: '/api/hr/admin/settings',
    disposition: 'reference',
    owner: 'module',
    scope: 'business',
  },
  {
    id: 'place-privacy',
    label: 'Place Privacy Settings',
    path: 'PlacePrivacySettings',
    disposition: 'reference',
    owner: 'module',
    scope: 'module',
  },
] as const;

export function listCanonicalPersonalHubs(): SettingsHubEntry[] {
  return SETTINGS_HUB_INVENTORY.filter(
    (h) => h.scope === 'personal' && h.disposition === 'canonical'
  );
}

export function listDuplicateHubs(): SettingsHubEntry[] {
  return SETTINGS_HUB_INVENTORY.filter((h) => h.disposition === 'duplicate');
}

export function getHubInventorySummary(): {
  total: number;
  canonical: number;
  duplicate: number;
  deprecated: number;
  reference: number;
  personalBefore: number;
  personalAfter: number;
} {
  const canonical = SETTINGS_HUB_INVENTORY.filter((h) => h.disposition === 'canonical').length;
  const duplicate = SETTINGS_HUB_INVENTORY.filter((h) => h.disposition === 'duplicate').length;
  const deprecated = SETTINGS_HUB_INVENTORY.filter((h) => h.disposition === 'deprecated').length;
  const reference = SETTINGS_HUB_INVENTORY.filter((h) => h.disposition === 'reference').length;
  return {
    total: SETTINGS_HUB_INVENTORY.length,
    canonical,
    duplicate,
    deprecated,
    reference,
    personalBefore: 6,
    personalAfter: 2,
  };
}
