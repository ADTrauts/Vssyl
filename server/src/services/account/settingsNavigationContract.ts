/**
 * Settings navigation contract — canonical IA for Account Platform settings.
 * PP-2 Package 2: normalized sections with in-hub vs external link disposition.
 */

export type SettingsNavOwner =
  | 'settings'
  | 'identity'
  | 'notifications'
  | 'ai'
  | 'billing'
  | 'business_administration'
  | 'module';

export type SettingsNavDisposition = 'in_hub' | 'external_link' | 'reference';

export interface SettingsNavigationEntry {
  id: string;
  label: string;
  href: string;
  owner: SettingsNavOwner;
  section: string;
  apiPath?: string;
  description: string;
  disposition: SettingsNavDisposition;
  order: number;
}

export const SETTINGS_CANONICAL_SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'connected_accounts', label: 'Connected Accounts' },
  { id: 'business', label: 'Business Settings' },
] as const;

export const SETTINGS_NAVIGATION_CONTRACT: readonly SettingsNavigationEntry[] = [
  {
    id: 'account',
    label: 'Account',
    href: '/profile/settings?tab=account',
    owner: 'identity',
    section: 'profile',
    apiPath: '/api/profile',
    description: 'Name, email, and account identity',
    disposition: 'in_hub',
    order: 10,
  },
  {
    id: 'photos',
    label: 'Photos',
    href: '/profile/settings?tab=photos',
    owner: 'identity',
    section: 'profile',
    apiPath: '/api/profile-photos',
    description: 'Personal and business avatars',
    disposition: 'in_hub',
    order: 20,
  },
  {
    id: 'location',
    label: 'Location & ID',
    href: '/profile/settings?tab=location',
    owner: 'identity',
    section: 'profile',
    apiPath: '/api/location',
    description: 'Vssyl ID and location information',
    disposition: 'in_hub',
    order: 30,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    href: '/profile/settings?tab=appearance',
    owner: 'settings',
    section: 'appearance',
    apiPath: '/api/settings',
    description: 'Theme and display preferences',
    disposition: 'in_hub',
    order: 40,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    href: '/profile/settings?tab=privacy',
    owner: 'identity',
    section: 'privacy',
    apiPath: '/api/privacy/settings',
    description: 'Privacy visibility and data controls',
    disposition: 'in_hub',
    order: 50,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications/settings',
    owner: 'notifications',
    section: 'notifications',
    apiPath: '/api/notifications/preferences',
    description: 'Notification delivery preferences',
    disposition: 'external_link',
    order: 60,
  },
  {
    id: 'security',
    label: 'Security',
    href: '/profile/settings?tab=security',
    owner: 'identity',
    section: 'security',
    apiPath: '/api/auth',
    description: 'Password, sessions, and account security',
    disposition: 'in_hub',
    order: 70,
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/profile/settings?tab=billing',
    owner: 'billing',
    section: 'billing',
    apiPath: '/api/billing/subscriptions/user',
    description: 'Subscription and payment management',
    disposition: 'in_hub',
    order: 80,
  },
  {
    id: 'connected_accounts',
    label: 'Connected Accounts',
    href: '/profile/settings?tab=connected-accounts',
    owner: 'identity',
    section: 'connected_accounts',
    description: 'Switch between personal and business accounts',
    disposition: 'in_hub',
    order: 90,
  },
  {
    id: 'business_settings',
    label: 'Business Settings',
    href: '/business',
    owner: 'business_administration',
    section: 'business',
    apiPath: '/api/business',
    description: 'Workspace configuration — Business Administration SoR',
    disposition: 'reference',
    order: 100,
  },
  {
    id: 'ai',
    label: 'AI Control Center',
    href: '/ai',
    owner: 'ai',
    section: 'ai',
    apiPath: '/api/ai/autonomy/settings',
    description: 'AI personality and autonomy (cross-link)',
    disposition: 'reference',
    order: 110,
  },
] as const;

export function getInHubNavigation(): SettingsNavigationEntry[] {
  return SETTINGS_NAVIGATION_CONTRACT.filter((e) => e.disposition === 'in_hub').sort(
    (a, b) => a.order - b.order
  );
}

export function getExternalNavigation(): SettingsNavigationEntry[] {
  return SETTINGS_NAVIGATION_CONTRACT.filter((e) => e.disposition === 'external_link').sort(
    (a, b) => a.order - b.order
  );
}
