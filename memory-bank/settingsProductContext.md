<!--
Settings Product Context
-->

# Settings Product Context

## [2024-06] User Settings Infrastructure

- UserPreference model in Prisma for storing key-value user settings
- API endpoints: `/settings` (GET, PUT), `/settings/:key` (DELETE), all JWT-protected
- useUserSettings React hook in shared UI library for easy integration
- Pattern is extensible for module-specific or system/global settings in the future 