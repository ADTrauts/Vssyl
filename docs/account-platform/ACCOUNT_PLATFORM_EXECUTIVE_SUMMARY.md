# Account Platform — Executive Summary

**Program:** Account Platform Phase 0A — Reality Assessment & Domain Discovery  
**Date:** 2026-06-19  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Discovery complete — **no implementation, certification, or ledger changes**

---

## Bottom line

Vssyl has **account-adjacent capabilities** but **no bounded Account Platform** today. Identity, Settings, and Billing are **fragmented L1–L2 subsystems** sharing `User` and `UserPreference` substrate without unified ownership, API contract, or certification.

**Recommendation:** **Option C — Hybrid** — govern as one **Account Platform program** with **three certifiable sub-domains** (Identity, Settings, Billing) and explicit exclusions (Business Administration profile, AI persona, Dashboard layout).

**Next step:** Phase 0B audits (PP-1 → PP-2 → PP-3) — discovery only charters, not implementation.

---

## Scope assessed

| In scope | Out of scope |
|----------|--------------|
| Identity, profile, photos, contacts | Business profile (BA L3) |
| Preferences, personalization (account slice) | AI persona/autonomy (AI Platform) |
| Settings hubs and API fragmentation | Dashboard widget grid (Wave 3) |
| Billing, subscriptions, entitlements | Admin Portal operator ops (L3) |
| Account security, privacy, notification prefs | Certification execution |

---

## Key metrics

| Metric | Value |
|--------|-------|
| Settings hubs (user-facing) | **12–14** |
| Settings-like API families | **20+** |
| Open constitutional audits | **0** (none started) |
| Ledger rows | **0** |
| Critical risks (account) | **3** (settings, identity, tier SoR) |
| MFA | **Not implemented** |
| `/settings` bulk API | **Documented but missing** |

---

## Topology decision

| Option | Verdict |
|--------|---------|
| A — Three independent domains | **Insufficient** — perpetuates drift |
| B — Single unified domain | **Over-scoped** — merges certified adjacent domains |
| **C — Hybrid program umbrella** | **Recommended** |

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| 1 | **Does an Account Platform already exist?** | **No** — capabilities exist; no bounded platform domain, service layer, audit, or ledger row |
| 2 | **Identity maturity?** | **L1** — inline `/api/profile` in `index.ts`; no `profileService`; photos L1–L2 |
| 3 | **Profile maturity?** | **L1 personal / L2 business** — personal fragmented; business profile is BA L3 (separate) |
| 4 | **Settings maturity?** | **L1** — 12–14 hubs; API drift; no ownership model |
| 5 | **Billing maturity?** | **L2 backend / L1 UX** — Stripe, services, webhooks; modal-only user surface |
| 6 | **Entitlement maturity?** | **L2 fragmented** — dual SoR (`Subscription` vs `Business.tier`); dual gating services |
| 7 | **Security maturity?** | **L1–L2** — JWT + refresh + password reset work; **no MFA**; no account security UX |
| 8 | **Single domain or multiple domains?** | **Hybrid** — one program; three certifiable sub-domains + cross-cutting Security/Preferences |
| 9 | **Highest-risk area?** | **Tier SoR drift** (entitlement correctness / revenue) — tied with Settings fragmentation and Identity service gap |
| 10 | **Highest-value area?** | **Billing & entitlements** — revenue, module gating, AI query packs |
| 11 | **Largest architectural debt?** | **No platform boundary** + `/settings` contract drift + tier enum schizophrenia + auth/profile in `index.ts` |
| 12 | **Certification candidates?** | **Billing** (audit-ready); **Privacy** (bundled); then **Identity** and **Settings** post-charter; umbrella row later |
| 13 | **Recommended modernization order?** | **Identity audit (PP-1) → Settings audit (PP-2) → Billing audit (PP-3)** — discovery first, then implementation charters |
| 14 | **What should be modernized next?** | **Account Platform Phase 0B** — Identity & Profile platform audit (PP-1) as first account workstream |
| 15 | **What should NOT be modernized next?** | Dashboard Wave 3; AI Platform full L3; ledger updates; implementation without audits; merging BA business profile; archived programs (Admin Portal, BO, WS, CG, BA) |

---

## Modernization sequence (account program)

| Phase | Workstream | Type |
|-------|------------|------|
| **0A** | Reality assessment (this package) | ✅ Complete |
| **0B-1** | Identity & Profile audit (PP-1) | Discovery + operation matrix draft |
| **0B-2** | Settings Platform audit (PP-2) | Discovery + IA charter |
| **0B-3** | Billing platform audit (PP-3) | Discovery + tier SoR decision |
| **1A+** | Implementation charters (post-council) | **Not authorized by 0A** |

**Parallel (non-blocking):** Dashboard Wave 3 audit; Analytics scope decision — separate programs.

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md) | Full inventory A–G |
| [ACCOUNT_PLATFORM_DOMAIN_MAP.md](./ACCOUNT_PLATFORM_DOMAIN_MAP.md) | Topology and boundaries |
| [ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md](./ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md) | SoR and ownership |
| [ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md](./ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md) | Risk scoring |
| [ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md](./ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md) | Gate posture |
| This summary | Executive brief |

---

## Stop condition

Phase 0A **complete**. Assessment only. No modernization. No certification. No implementation packages. No ledger changes.

**Last updated:** 2026-06-19 (Phase 0A)
