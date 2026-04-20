<!--
Settings Product Context
-->

# Settings Product Context

## [2026-04] Profile Settings Navigation + Avatar Reliability Hardening

- `/profile/*` routes now render inside the dashboard shell via `web/src/app/profile/layout.tsx` (`DashboardLayout` wrapper) to keep global header/sidebars consistent.
- `/profile/settings` now uses an internal sidebar IA with section-level navigation (`account`, `photos`, `location`, `preferences`) instead of one long run-on page.
- Profile photo serving was stabilized for production/cloud paths:
  - response URLs use proxy-relative authenticated serve endpoints (`/api/profile-photos/serve/:photoId?type=...`)
  - server-side file path resolution uses storage abstraction (`storageService.extractPathFromUrl`) for provider-safe behavior.
- Personal/business avatar assignment behavior fixed:
  - assigning one slot no longer clears the other slot.
  - server validates slot uniqueness (same photo cannot be used for both).
  - legacy fallback resolves missing photo IDs from library URLs when older records have URL but no `*_photo_id`.

## [2024-06] User Settings Infrastructure

- UserPreference model in Prisma for storing key-value user settings
- API endpoints: `/settings` (GET, PUT), `/settings/:key` (DELETE), all JWT-protected
- useUserSettings React hook in shared UI library for easy integration
- Pattern is extensible for module-specific or system/global settings in the future 