# PP-1 — Identity & Profile Executive Summary

**Program:** Account Platform Phase 0B-1 — Identity & Profile Platform Audit  
**Date:** 2026-06-19  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Constitutional audit complete — **no implementation, certification, or ledger changes**

---

## Bottom line

**Identity** and **Profile** are **not coherent platform capabilities** today. Auth works at **L1–L2** but lives in `index.ts`. Profile has **no service layer** — name updates are inline Prisma; photos are a **750 LOC controller**; connections lack Policy Engine on mutations.

**Mandatory before certification:** Service extraction (`authService`, `profileService`, `profilePhotoService`, `privacyService`, `connectionService`).

**Likely first certification:** **Platform capability L3 WITH FINDINGS** (~18–22/27) — not plain L3 (MFA gap).

---

## Scope

| Included | Excluded |
|----------|----------|
| Identity, profile, avatars, contacts, user metadata | Business profile (BA L3) |
| Account preferences slice, privacy, notification prefs schema | AI personality (AI Platform) |
| Account security (auth, recovery, MFA gap) | Billing (PP-3) |
| | Dashboard / workspace layout |

---

## Key metrics

| Metric | Value |
|--------|-------|
| G1–G9 estimate | **~12/27 (~44%)** |
| Operation matrix C / P / N | **4 / 28 / 7** |
| Open majors (audit) | **6** (PP1-F01–F06) |
| MFA | **Not implemented** |
| `profileService` | **Missing** |
| Auth routes in `index.ts` | **7 endpoints inline** |

---

## Topology (PP-1 within Account Platform)

```
Account Platform (Hybrid program)
└── PP-1 Identity & Profile ← this audit
    ├── Identity: auth, sessions, Vssyl ID
    ├── Profile: name, photos, connections
    ├── Security/Privacy slice
    └── Preferences KV slice (registry)
```

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| 1 | **Identity coherent platform capability?** | **No** — functional auth kernel without bounded service module or audit history |
| 2 | **Profile coherent platform capability?** | **No** — scattered routes/controllers; no profile service |
| 3 | **Who owns avatars/photos?** | **Profile slice** (target) — today `profilePhotoController` + `UserProfilePhoto` SoR; de facto controller-owned |
| 4 | **Who owns preferences?** | **Split** — Identity/PREF owns `UserPreference` registry + generic API; consumers (AI, notifications) use keys |
| 5 | **Who owns notification preferences?** | **Settings IA (PP-2)** for hub placement · **Notifications platform** for delivery · **KV schema** shared via `notification_*` keys |
| 6 | **Who owns privacy settings?** | **Security/Privacy slice (PP-1)** — `UserPrivacySettings` SoR via `privacyController`; PP-2 owns hub linkage |
| 7 | **Largest architectural weakness?** | **No service layer** — inline `index.ts` auth/profile + fat controllers (photos, member, privacy) |
| 8 | **Largest security weakness?** | **No MFA** + no account security UX (sessions, password change) + misleading 2FA UI elsewhere |
| 9 | **Service extraction required?** | **Yes — mandatory** — 5 new/extended services before certification review |
| 10 | **Certification readiness?** | **NOT READY** (~44% gates) · **READY FOR IMPLEMENTATION CHARTER** |
| 11 | **Likely certification path?** | Implementation charter → service extraction → matrix re-audit → **L3 WITH FINDINGS** evaluation |
| 12 | **Reference capability candidate?** | **Possible post-L3** — "Reference Candidate — Identity Foundation" (photo library + Vssyl ID patterns) — **not today** |
| 13 | **Recommended modernization sequence?** | 1) Auth extract → 2) `profileService` → 3) `profilePhotoService` → 4) `privacyService` → 5) `connectionService` → 6) preference registry |
| 14 | **Dependencies on PP-2 Settings?** | **Soft** — PP-1 can certify independently; PP-2 needs PP-1 `profileService` + preference registry; privacy IA unification is advisory on PP-1 cert |
| 15 | **Dependencies on PP-3 Billing?** | **None for certification** — `stripeCustomerId` on User is read-only for PP-1; BillingModal is UX cross-link only |

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| [PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md](./PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md) | Full constitutional inventory |
| [PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md](./PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md) | 39 operation rows audited |
| [PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md](./PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md) | Authoritative boundaries |
| [PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md](./PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md) | Extraction map |
| [PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md](./PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md) | G1–G9 + cert path |
| This summary | Executive brief |

---

## Recommended next step

**Account Platform PP-1 Implementation Charter** (council approval required) — service extraction phases 1–6 from service boundary analysis. **Not authorized by Phase 0B-1.**

**Parallel (optional):** Account Platform Phase 0B-2 — Settings Platform audit (PP-2).

---

## Stop condition

Phase 0B-1 **complete**. Assessment only. No modernization. No certification. No ledger changes.

**Last updated:** 2026-06-19 (Phase 0B-1)
