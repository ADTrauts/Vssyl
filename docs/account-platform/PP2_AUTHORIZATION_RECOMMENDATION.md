# PP-2 — Authorization Recommendation

**Program:** Account Platform — Foundation Checkpoint  
**Date:** 2026-06-20  
**Status:** **Governance recommendation** — implementation not authorized by this document alone

**Prerequisites reviewed:** [PP1_STATUS_REVIEW.md](./PP1_STATUS_REVIEW.md) · [PP3_STATUS_REVIEW.md](./PP3_STATUS_REVIEW.md) · [ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md](./ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md)

---

## Recommendation

### ✅ **Authorize PP-2 Settings Platform implementation**

**Sequencing choice:** **A — Start PP-2 Settings Platform now**

Ratified Option C sequence is satisfied:

```
PP-1 Phase 1 ✅  +  PP-3 Package 1 ✅  →  PP-2 (authorized)  →  PP-3 Remainder
```

---

## Options evaluated

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **A. Start PP-2 now** | **✅ Recommended** | All HARD PP-1 dependencies met; PP-3 SOFT entitlement dependency met; no foundation blocker |
| B. PP-1 Phase 1B cleanup first | **Not required** | Remaining PP-1 items (MFA, photo thinning, tests) do not block Settings substrate |
| C. PP-3 Package 2 first | **Rejected** | Violates ratified sequence; billing work does not unblock Settings HARD deps |
| D. PP-1 + PP-3 cleanup in parallel first | **Optional overlay** | May run **non-blocking** hygiene in parallel with PP-2; not a gate |

---

## Settings readiness verification

| Check | Result |
|-------|--------|
| `profileService` exists | ✅ `server/src/services/account/profileService.ts` |
| `privacyService` exists | ✅ `server/src/services/account/privacyService.ts` |
| `userPreferenceService` expansion sufficient as **substrate** | ✅ Validation, PE, domain events, prefix helpers — **full registry is PP-2 deliverable** |
| `entitlementService` exists for tier-gated UI | ✅ `resolveTier()`, `/api/account/tier` |
| Settings API can depend on PP-1/PP-3 foundations | ✅ Hub links to PP-1 services; tier reads via PP-3 resolver |
| Blocking dependency remains | **None identified** |

---

## What PP-2 must implement (expected findings closure)

PP-2's Phase 0B blocking findings are **targets for PP-2 work**, not preconditions:

| ID | Finding | PP-2 deliverable |
|----|---------|------------------|
| **PP2-F01** | No Settings Platform capability | `settingsService` + hub charter |
| **PP2-F02** | `/settings` API contract missing | Mount `/api/settings`; fix `useUserSettings` |
| **PP2-F03** | No preference key registry | Expand registry beyond PP-1 prefixes |
| PP2-F04–F09 | Majors (fragmentation, theme, notifications) | IA consolidation + adapters |

---

## PP-2 implementation boundaries (preserve)

| Do | Do not |
|----|--------|
| Build `settingsService` + `/api/settings` contract | Re-implement `profileService` / `privacyService` |
| Expand preference registry | Own `User` credentials or photos SoR |
| Consolidate settings hub IA | Write `Business` entity fields (BA L3) |
| Server-back theme via `appearance.*` keys | Retire `/api/payment` (PP-3 Package 2) |
| Link/embed billing via IA | Implement billing checkout (PP-3 Remainder) |
| Read tier via `entitlementService` | Duplicate tier resolution logic |

---

## Parallel work (optional, non-blocking)

| Stream | Relationship to PP-2 |
|--------|------------------------|
| PP-1 remainder (MFA, photo trash, controller thinning) | Parallel hygiene |
| PP-3 Package 2 scoping / design | **Wait** for PP-2 IA before billing hub placement |
| PP-1 operation matrix re-audit | Pre-certification; parallel OK |

---

## Authorization conditions

PP-2 charter should include:

1. **Scope:** `settingsService`, `/api/settings`, registry, hub IA, theme migration, notification pref adapter
2. **Dependencies:** Consume PP-1 account services; read entitlements via `entitlementService` only
3. **Out of scope:** Billing UX, payment API retirement, MFA, certification, ledger
4. **Exit criteria:** PP2-F01–F03 closed; `useUserSettings` contract restored; operation matrix published

---

## Required question answers

| # | Question | Answer |
|---|----------|--------|
| 7 | Can PP-2 start? | **Yes** |
| 8 | Should PP-3 Package 2 wait? | **Yes** — after PP-2 per Option C |
| 9 | Recommended next package? | **PP-2 Settings Platform** |

---

**Last updated:** 2026-06-20 (Foundation Checkpoint)
