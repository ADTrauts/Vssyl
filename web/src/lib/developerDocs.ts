/**
 * Public URLs for partner/developer documentation.
 * Override in env when docs are hosted elsewhere (e.g. docs subdomain).
 */
const DEFAULT_THIRD_PARTY_MODULE_DEVELOPER_GUIDE =
  'https://github.com/ADTrauts/Vssyl/blob/main/docs/guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md';

export function getThirdPartyModuleDeveloperGuideUrl(): string {
  return (
    process.env.NEXT_PUBLIC_THIRD_PARTY_DEVELOPER_GUIDE_URL ||
    DEFAULT_THIRD_PARTY_MODULE_DEVELOPER_GUIDE
  );
}
