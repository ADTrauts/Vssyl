# Account Platform — Architectural Risk Matrix

**Program:** Account Platform Phase 0A — Reality Assessment & Domain Discovery  
**Date:** 2026-06-19  
**Status:** Discovery only — account-focused risk scoring

**Scoring model** (aligned with [PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md](../platform-portfolio/PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md)):

| Dimension | Weight |
|-----------|--------|
| User impact | 25% |
| Revenue / trust | 20% |
| Constitutional drift | 25% |
| Integration blast radius | 15% |
| Remediation cost (inverted) | 15% |

**Tier:** Critical ≥20 · High 16–19 · Medium 12–15 · Low <12

---

## Account Platform risk matrix

| ID | Area | User | Revenue | Drift | Blast | Cost | **Score** | **Tier** |
|----|------|------|---------|-------|-------|------|-----------|----------|
| **AP-R01** | Settings fragmentation + `/settings` API drift | 5 | 3 | 4 | 5 | 3 | **21.0** | **Critical** |
| **AP-R02** | Identity — no `profileService`; inline `index.ts` routes | 5 | 4 | 4 | 4 | 3 | **20.5** | **Critical** |
| **AP-R03** | Billing dual API (`/payment` + `/billing`) | 3 | 5 | 3 | 4 | 3 | **18.5** | **High** |
| **AP-R04** | Tier SoR drift (`Subscription` vs `Business.tier` vs gating enums) | 4 | 5 | 4 | 5 | 4 | **21.0** | **Critical** |
| **AP-R05** | No MFA; misleading 2FA UI in business settings | 4 | 4 | 4 | 3 | 3 | **18.5** | **High** |
| **AP-R06** | `UserPreference` key sprawl — no registry/validation | 4 | 3 | 3 | 4 | 2 | **17.0** | **High** |
| **AP-R07** | Privacy IA split (`/profile/analytics` not settings hub) | 4 | 4 | 3 | 3 | 2 | **17.0** | **High** |
| **AP-R08** | Appearance/theme localStorage only | 4 | 2 | 3 | 3 | 2 | **15.5** | **Medium** |
| **AP-R09** | Business settings triplication | 4 | 2 | 3 | 3 | 2 | **15.0** | **Medium** |
| **AP-R10** | Fat `billingController` — no PE/activity | 3 | 5 | 4 | 4 | 4 | **19.0** | **High** |
| **AP-R11** | Three notification preference backends | 4 | 2 | 3 | 3 | 3 | **15.5** | **Medium** |
| **AP-R12** | AI identity parallel to user profile | 3 | 3 | 3 | 4 | 3 | **15.5** | **Medium** |
| **AP-R13** | Member graph — no PE on mutations | 3 | 3 | 4 | 3 | 2 | **15.5** | **Medium** |
| **AP-R14** | Legacy photo URL fields + photo ID dual representation | 3 | 2 | 2 | 3 | 2 | **13.0** | **Medium** |
| **AP-R15** | No account security UX (sessions, password change surface) | 4 | 4 | 3 | 2 | 3 | **17.0** | **High** |
| **AP-R16** | `featureGatingService` + simplified duplicate | 2 | 4 | 3 | 4 | 2 | **15.5** | **Medium** |
| **AP-R17** | HR settings href 404 | 3 | 2 | 2 | 2 | 1 | **11.5** | **Low** |
| **AP-R18** | `admin-override` tier bypass without audit trail standard | 2 | 4 | 3 | 3 | 2 | **15.0** | **Medium** |

---

## Risk tier summary

| Tier | Count | Top items |
|------|-------|-----------|
| **Critical** | 3 | Settings fragmentation, Identity service gap, Tier SoR drift |
| **High** | 6 | Billing dual API, MFA gap, KV sprawl, Privacy IA, Fat billing controller, Account security UX |
| **Medium** | 7 | Theme, business settings overlap, notification backends, AI parallel identity, member PE, photo dual fields, gating duplicate |
| **Low** | 1 | HR settings 404 |

---

## Highest-risk areas (account program)

| Rank | Area | Why | Sub-domain |
|------|------|-----|------------|
| 1 | **Tier SoR drift** | Wrong entitlements → revenue loss, feature leakage, HR/AI gating inconsistency | Billing |
| 2 | **Settings fragmentation** | Every user session; API drift causes bugs; blocks coherent account UX | Settings |
| 3 | **Identity service gap** | Foundation for auth, avatars, contacts; inline routes resist certification | Identity |
| 4 | **Billing dual APIs** | `/payment` vs `/billing` entitlement divergence | Billing |
| 5 | **No MFA + misleading UI** | Trust and security posture gap for business accounts | Security |

---

## Highest-value areas (account program)

| Rank | Area | Value driver |
|------|------|--------------|
| 1 | **Billing & entitlements** | Revenue, module gating, AI query packs — platform-wide blast radius |
| 2 | **Settings coherence** | Support burden, user trust, safe AI preference management |
| 3 | **Identity & profile** | Avatar, contacts, personalization — daily active users |
| 4 | **Privacy/GDPR** | Regulatory trust; collective AI learning consent |
| 5 | **Notification preferences** | Cross-module communication safety |

---

## Largest architectural debt (account program)

| Debt | Manifestation | Remediation phase |
|------|---------------|-------------------|
| **No Account Platform runtime boundary** | 20+ route families, no namespace | Phase 0B charter |
| **`/settings` contract drift** | Documented bulk API missing; `useUserSettings` broken | Settings audit PP-2 |
| **Tier enum schizophrenia** | 4+ tier vocabularies | Billing audit PP-3 |
| **Auth/profile in `index.ts`** | God-file routing | Identity audit PP-1 |
| **Preferences without registry** | Ad hoc `UserPreference` keys | Settings + Identity audits |
| **Billing fat controller** | ~900 LOC; no constitutional writes | Billing implementation charter |

---

## Risk heatmap by sub-domain

```
                Low         Medium          High            Critical
Identity        HR 404      photo dual      member PE       no profileService
Settings        —           theme, notif    privacy IA        fragmentation
Billing         —           gating dup      dual API        tier SoR drift
Security        —           —               MFA, acct UX    —
Cross-cut       —           AI parallel     KV sprawl       —
```

---

## Portfolio cross-reference

Account risks **amplify** portfolio risks:

| Portfolio ID | Account mapping |
|--------------|-----------------|
| R-01 Settings | AP-R01 |
| R-02 Identity | AP-R02 |
| R-06 Billing | AP-R03, AP-R04, AP-R10 |
| R-10 Duplicate business settings | AP-R09 |

---

## Related

- [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md](./ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md)
- [PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md](../platform-portfolio/PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md)

**Last updated:** 2026-06-19 (Phase 0A)
