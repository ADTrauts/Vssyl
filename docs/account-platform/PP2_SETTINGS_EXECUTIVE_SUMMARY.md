# PP-2 — Settings Platform Executive Summary

**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Date:** 2026-06-19  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Constitutional audit complete — **no implementation, certification, or ledger changes**

---

## Bottom line

A **Settings Platform does not exist** today. Users face **16 settings-relevant hubs**, **~22 API families**, a **broken `/settings` client contract**, and **no preference registry**. Settings should be the **IA + API contract + registry layer** — not the SoR for identity, business entity, AI persona, or module interiors.

**Modernize PP-1 before PP-2 implementation.** PP-2 discovery (this package) can proceed in parallel; **code changes** should follow PP-1 service extraction.

---

## Key metrics

| Metric | Value |
|--------|-------|
| Settings-relevant hubs | **16** (6 personal + 10 business) |
| API route families | **~22** |
| `/api/settings` platform API | **Missing** |
| `useUserSettings` hook | **Broken** (calls `/settings` not mounted) |
| G1–G9 estimate | **~10/27 (~37%)** |
| Blocking findings | **3** |
| Major findings | **6** |

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| 1 | **Does a Settings Platform exist?** | **No** — fragmented hubs and APIs without bounded capability or service |
| 2 | **How many settings hubs?** | **16** settings-relevant user-facing hubs (+ AI and Billing adjacent = 18) |
| 3 | **Who owns preferences?** | **Split** — PREF/Identity implements KV; **Settings owns registry + API contract**; modules/AI own domain keys |
| 4 | **Who owns notification settings?** | **Notifications platform** delivery + metadata · **Settings** orchestrates UI and unified writes · **KV schema** joint |
| 5 | **Who owns privacy settings?** | **PP-1 Security/Privacy slice** SoR (`UserPrivacySettings`) · **Settings** owns hub placement |
| 6 | **Largest architectural weakness?** | **No platform layer** — missing `/api/settings`, no `settingsService`, no registry |
| 7 | **Largest ownership conflict?** | **Business entity settings triplication** (workspace settings vs profile page vs branding page) |
| 8 | **Service extraction required?** | **Yes** — `settingsService`, notification preference adapter, registry; extend `userPreferenceService` |
| 9 | **Certification readiness?** | **NOT READY** (~37%) · ready for **implementation charter after PP-1** |
| 10 | **Likely certification path?** | PP-1 impl → PP-2 impl → matrix re-audit → **L3 WITH FINDINGS** |
| 11 | **Dependencies on PP-1?** | **Hard** — profile service, preference registry, privacy service, domain events |
| 12 | **Dependencies on PP-3?** | **Soft** — billing cross-links only; HR tier gates read entitlements |
| 13 | **Reference capability potential?** | **Possible post-L3** — Settings IA + preference registry pattern — **not today** |
| 14 | **Recommended modernization order?** | 1) PP-1 auth/profile extract 2) Preference registry 3) `/api/settings` 4) Hub IA consolidation 5) Business dedup 6) Theme server KV |
| 15 | **PP-2 or PP-1 first?** | **PP-1 first** — Settings depends on identity/profile services and preference substrate |

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| [PP2_SETTINGS_REALITY_ASSESSMENT.md](./PP2_SETTINGS_REALITY_ASSESSMENT.md) | Full constitutional inventory |
| [PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md](./PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md) | 16-hub inventory + duplications |
| [PP2_SETTINGS_OPERATION_MATRIX.md](./PP2_SETTINGS_OPERATION_MATRIX.md) | 34 operation rows |
| [PP2_SETTINGS_OWNERSHIP_MODEL.md](./PP2_SETTINGS_OWNERSHIP_MODEL.md) | Authoritative boundaries |
| [PP2_SETTINGS_CERTIFICATION_READINESS.md](./PP2_SETTINGS_CERTIFICATION_READINESS.md) | G1–G9 + cert path |
| This summary | Executive brief |

---

## Recommended next steps

| Priority | Action | Authorized by 0B-2? |
|----------|--------|---------------------|
| 1 | **PP-1 Implementation Charter** (council) | No — separate approval |
| 2 | PP-1 phases 1–3 (auth, profile, photo services) | No |
| 3 | **PP-2 Implementation Charter** (after PP-1 foundation) | No |
| 4 | Phase 0B-3 Billing audit (PP-3) | Discovery only — optional parallel |

---

## Stop condition

Phase 0B-2 **complete**. Assessment only. No modernization. No certification. No ledger changes.

**Last updated:** 2026-06-19 (Phase 0B-2)
