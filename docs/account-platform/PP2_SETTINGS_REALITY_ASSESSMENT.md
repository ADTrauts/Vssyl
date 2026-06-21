# PP-2 — Settings Platform Reality Assessment

**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Assessment date:** 2026-06-19  
**Authority:** Phase 0A Hybrid model · PP-1 Identity & Profile audit  
**Status:** Constitutional audit — discovery only

**Prior baselines:** [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md) · [PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md](./PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md)

**Excluded:** Identity/profile runtime ownership (PP-1) · Billing/entitlements (PP-3) · BA business profile writes · AI personality · Dashboard widget grid

---

## Executive finding

A **Settings Platform does not exist** as a coherent platform capability. Settings today are a **scatter of hubs, route families, and persistence stores** with no unified namespace, no `settingsService`, no preference registry, and a **broken client contract** (`useUserSettings` → `/settings` not mounted).

**Settings Platform** should be defined as the **governance + IA + API contract layer** that coordinates how users discover and mutate preferences across domains — **not** the SoR for identity, business entity, AI persona, or module interiors.

**Recommendation:** PP-2 modernization **after PP-1** (service extraction + preference registry foundation). PP-2 charter targets hub consolidation, `/api/settings` contract, and cross-domain preference orchestration.

---

## A. Settings Architecture

### What Settings Platform owns (target)

| Concern | Target ownership |
|---------|------------------|
| Settings hub IA (personal account) | Unified navigation linking domain slices |
| Platform settings API contract | `/api/settings` bulk + typed sections |
| Preference key registry | Canonical keys, validation, prefixes |
| Appearance/theme persistence | Server-backed user preference (migrate from localStorage) |
| Cross-hub discoverability | Avatar menu, profile settings, notifications — single map |
| Notification preference **coordination** | Not delivery — unify write path via preference service |
| Module settings **discovery** | Index of per-module settings entry points |

### What Settings Platform does not own (SoR stays elsewhere)

| Concern | Owner |
|---------|-------|
| User credentials, name, photos | PP-1 Identity/Profile |
| `UserPrivacySettings` rows | PP-1 Security/Privacy slice |
| AI personality, autonomy, provider | AI Platform |
| Business entity profile/branding | Business Administration L3 |
| Module `configured` JSON interiors | Each module |
| Billing subscriptions | PP-3 |
| Dashboard layout JSON | Dashboard Wave 3 |
| Notification delivery pipeline | Notifications platform L2 |

### Persistence inventory

| Store | Used for | Settings relationship |
|-------|----------|----------------------|
| `UserPreference` KV | Generic, notification, email, some AI keys | **Primary substrate** — needs registry |
| `UserPrivacySettings` | Privacy toggles | PP-1 SoR; PP-2 links in hub |
| `PushSubscription` | Push endpoints | PP-2 coordinates with Notifications |
| `localStorage` (`theme`) | Appearance | **PP-2 migration target** |
| `Dashboard.preferences` / layout | Sidebar/grid | Dashboard module — out of scope |
| `ModuleInstallation.configured` | Per-module JSON | Module-owned; PP-2 indexes |
| `Business` + branding JSON | Business settings | BA-owned; PP-2 cross-links only |
| `HRModuleSettings` | HR module config | HR module + BA context |
| `Place` settings models | Place privacy | Place module |
| `AIAutonomySettings` / `AIPersonalityProfile` | AI settings | AI Platform |

### Services (current)

| Service | Exists? | Role |
|---------|---------|------|
| `userPreferenceService` | Yes (2 functions) | Generic get/set only |
| `settingsService` | **No** | **Required for PP-2** |
| `notificationPreferenceAdapter` | **No** | Unify notification KV writes |
| Notification delivery | `notificationService` | Notifications platform — not Settings |

### Maturity: **L1**

| Signal | Rating |
|--------|--------|
| Functional hubs | Yes — many work independently |
| Unified platform | **No** |
| API namespace | **Missing** |
| Operation matrix (prior) | **None** — PP-2 creates first |
| Ledger row | **None** |

---

## B. Settings Fragmentation

See [PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md](./PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md) for full hub inventory.

**Summary:** **15 primary user-facing settings hubs** (personal + business); **~22 API families** touching settings-like mutations; **3 notification backends**; **triplicated business business-entity editing**.

---

## C. Preference Ownership (authoritative PP-2)

See [PP2_SETTINGS_OWNERSHIP_MODEL.md](./PP2_SETTINGS_OWNERSHIP_MODEL.md).

| Domain | Owns |
|--------|------|
| **Settings Platform** | Hub IA, `/api/settings` contract, key registry, theme persistence, cross-hub navigation, notification pref **write orchestration** |
| **Identity (PP-1)** | Profile fields, photos, connections — **not** preference registry |
| **Identity/PREF slice** | `userPreferenceService` implementation + registry enforcement |
| **Notifications platform** | Delivery, templates, push transport, module notification metadata |
| **AI Platform** | `AIPersonalityProfile`, `AIAutonomySettings`, AI provider prefs |
| **Business Administration** | `Business` entity settings, branding SoR, org member admin |
| **Modules** | `ModuleInstallation.configured`, domain-specific settings tables |

---

## D. API Audit Summary

### Missing canonical API

| Documented / client | Server reality |
|---------------------|----------------|
| `GET/PUT/DELETE /settings` | **Not mounted** — `useUserSettings.ts` calls `/settings` without `/api` prefix |
| `memory-bank/settingsProductContext.md` | Documents bulk API — **never implemented** |
| Per-key `/api/user/preferences/:key` | **Actual** generic path |

### Settings-related route families

| Prefix | Settings role |
|--------|---------------|
| `/api/user/preferences/:key` | Generic KV |
| `/api/notifications/preferences` | In-app notification prefs |
| `/api/notifications/quiet-hours`, `/do-not-disturb` | DND KV |
| `/api/email-notifications/preferences` | Email pref KV |
| `/api/push-notifications/subscriptions` | Push table |
| `/api/privacy/settings` | Privacy dedicated table |
| `/api/place/settings` | Place module |
| `/api/hr/admin/settings` | HR module |
| `/api/modules/:id/configure` | Module JSON config |
| `/api/dashboard/:id/sidebar-config` | Dashboard shell |
| `/api/ai/preferences`, `/api/ai/autonomy/settings` | AI Platform |
| `/api/business/*` | Business entity (BA) |
| `/api/retention/*`, `/api/governance/*` | Admin governance |

**Constitutional compliance:** **Poor** — inline Prisma in notification/privacy controllers; no PE on preference writes; fragmented events (only generic user pref emits domain event).

---

## E. UX Audit Summary

### Entry points

| Entry | Destination | Coherence issue |
|-------|-------------|-----------------|
| Avatar → "Profile Settings" | `/profile/settings` | OK |
| Avatar → "Settings" | `/profile/settings` | **Duplicate label** |
| Avatar → Theme submenu | localStorage | Not in profile settings despite "coming soon" |
| Avatar → Billing | Modal | PP-3 — not settings hub |
| Profile settings preferences tab | Placeholder + sidebar link | Lists theme/notifications/privacy as "coming soon" while they exist elsewhere |
| `/profile/analytics` privacy tab | Privacy controls | **Not linked** from profile settings |
| `/notifications/settings` | Full notification UI | Separate hub |
| `/ai` | AI control center | Separate hub (AI Platform) |
| Business workspace settings | 6 tabs incl. profile overlap | Triplicates `/business/[id]/profile` |
| Module modals | Per-module config | No central index |

**Coherence level:** **Low (L1)** — users must know product map to find settings.

---

## F. Certification Outlook

| Metric | Value |
|--------|-------|
| G1–G9 (today) | **~10/27 (~37%)** |
| Blocking findings | **3** (no platform, API drift, no ownership enforcement) |
| Major findings | **6** (see readiness doc) |
| Likely path | PP-1 implementation → PP-2 charter → **L3 WITH FINDINGS** |
| Plain L3 | Requires hub consolidation + API contract + registry |

See [PP2_SETTINGS_CERTIFICATION_READINESS.md](./PP2_SETTINGS_CERTIFICATION_READINESS.md).

---

## PP-1 vs PP-2 modernization order

**Modernize PP-1 first.**

| Reason | Detail |
|--------|--------|
| Dependency | PP-2 needs `profileService` + expanded `userPreferenceService` + registry |
| Portfolio chain | Identity → Settings → Billing |
| Foundation | Settings hub displays profile/privacy/notification **links** — needs stable identity reads |
| Risk | PP-2 hub consolidation without services perpetuates inline Prisma behind new UI |

PP-2 can run **discovery-only audits in parallel** (this package); **implementation** should follow PP-1 phases 1–3 minimum.

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [PP2_SETTINGS_OPERATION_MATRIX.md](./PP2_SETTINGS_OPERATION_MATRIX.md) | Operation audit |
| [PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md](./PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md) | Hub inventory |
| [PP2_SETTINGS_OWNERSHIP_MODEL.md](./PP2_SETTINGS_OWNERSHIP_MODEL.md) | Boundaries |
| [PP2_SETTINGS_EXECUTIVE_SUMMARY.md](./PP2_SETTINGS_EXECUTIVE_SUMMARY.md) | 15 questions |

**Last updated:** 2026-06-19 (Phase 0B-2)
