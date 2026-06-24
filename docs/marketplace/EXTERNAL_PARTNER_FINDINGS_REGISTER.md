# External Partner — Findings Register

**Program:** Marketplace & Module Ecosystem — Phase 1C  
**Date:** 2026-06-24  
**Status:** Active register  
**Related:** [EXTERNAL_PARTNER_DEVELOPER_JOURNEY.md](./EXTERNAL_PARTNER_DEVELOPER_JOURNEY.md), [EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md](./EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md)

---

## 1. Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks external full-capability pilot without platform hand-holding |
| **P1** | Causes significant delay or support burden |
| **P2** | Advisory; workaround exists |

| Severity | Meaning |
|----------|---------|
| **Major** | Prevents E2E success for target pilot |
| **Minor** | Friction only |
| **Advisory** | Quality / ops improvement |

---

## 2. Documentation gaps

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-01 | Major | P0 | No full-capability reference manifest | ✅ `docs/guides/full-capability-partner-module.json` (1C-A) |
| EP-04 | Major | P0 | Phase 1B delegate contracts live in `docs/marketplace/` only | ✅ `PARTNER_DEVELOPER_GUIDE.md` + capability guides (1C-A) |
| EP-02 | Major | P0 | Delegate capabilities require platform ops flags + allowlist | ✅ `PARTNER_OPERATOR_RUNBOOK.md` + Partner guide §12 (1C-A) |
| EP-18 | Major | P0 | Partner cannot pre-validate delegate manifest locally | ✅ `PARTNER_VALIDATION_STRATEGY.md` (1C-A); CLI deferred |
| EP-08 | Major | P1 | Rulebook omits delegate gates | ✅ Updated rulebook (1C-A) |
| EP-13 | Minor | P2 | Developer guide stale | ✅ Updated 2026-06-24 (1C-A) |

---

## 3. Tooling & example gaps

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-14 | Major | P1 | No sample partner server for JWT-verified search delegate | Reference implementation repo or doc snippet |
| EP-15 | Major | P1 | No iframe starter for workspace bridge init | HTML/JS template in test-modules |
| EP-16 | Major | P1 | No activity ingest client example | Snippet in implementation guide |
| EP-17 | Minor | P2 | Fixture build script requires monorepo clone | Publish standalone zip samples |

---

## 4. Onboarding gaps

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-03 | Minor | P1 | Developer portal landing does not foreground submission workflow | UX copy / link to submit flow |
| EP-06 | Major | P1 | Artifact upload returns 503 without GCS — not obvious to external dev | Environment matrix + partner dev setup guide |
| EP-07 | Major | P1 | GCS bucket CORS for browser PUT/fetch not in developer quick-start | Pipeline doc summary + checklist |
| EP-10 | Minor | P1 | Paid business module path requires Stripe — underdocumented for partners | Business billing partner guide |

---

## 5. Runtime & operational gaps

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-02 | Major | P0 | Delegate capabilities require platform ops flags + allowlist | ✅ `PARTNER_OPERATOR_RUNBOOK.md` (1C-A) |
| EP-11 | Minor | P1 | Search delegate failure returns empty results — partner unaware | Partner observability doc / webhook (future) |
| EP-09 | Advisory | P2 | Docker sandbox not available on Cloud Run | Already in environment matrix — reinforce in review checklist |
| F-02* | Major | P1 | In-memory jti/idempotency (from 1B-G) | Redis backing — ops phase |
| F-03* | Major | P1 | Flags default OFF (from 1B-G) | Documented enablement — EP-02 |

\*Carried from RD-MP-1B-G-001

---

## 6. Certification gaps

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-18 | Major | P0 | Partner cannot pre-validate delegate manifest locally without repo test command | Publish `npx`/CLI or documented curl to certification preview API (future) |
| EP-19 | Minor | P1 | Validator v1.4.0 knowledge not in rulebook version note | Rulebook header + gate table |
| EP-20 | Advisory | P2 | Warning vs error distinction for delegate items unclear to partners | Admin feedback template |

---

## 7. Security (pilot workflow)

| ID | Severity | Priority | Finding | Remediation |
|----|----------|----------|---------|-------------|
| EP-21 | Advisory | P1 | Partner JWT verification docs exist but not in external corpus | Include in Search/Activity implementation guides |
| EP-22 | Advisory | P2 | Partner SoR tenant scoping not auditable (MS-01) | Security questionnaire for external pilot |
| EP-12 | Major | P1 | Activity ingest actor.userRef + idempotency easy to misconfigure | Worked example + common errors |

**Security walkthrough verdict:** Platform-side controls **hold** through pilot workflow; partner-side mistakes are **likely without examples** — documentation issue, not architecture flaw.

---

## 8. Consolidated priority queue

### P0 — Before external pilot execution

1. **EP-04** — Partner-facing delegate documentation index  
2. **EP-01** — Full capability reference manifest  
3. **EP-02** — Operator + partner go-live checklist (flags/allowlist)  
4. **EP-18** — Pre-submit validation story (minimum: documented manifest lint rules)

### P1 — During first external pilot

5. **EP-14, EP-15, EP-16** — Implementation examples  
6. **EP-06, EP-07** — GCS dev/prod setup  
7. **EP-05, EP-08** — Certification comprehensibility  
8. **EP-12** — Activity ingest examples  

### P2 — Post-pilot hardening

9. F-02 Redis stores  
10. EP-11 partner observability  
11. EP-03 developer portal UX  

---

## 9. Finding counts

| Category | Major | Minor | Advisory |
|----------|-------|-------|----------|
| Documentation | 4 | 1 | 1 |
| Tooling | 3 | 1 | 0 |
| Onboarding | 2 | 2 | 0 |
| Runtime / ops | 2 | 1 | 2 |
| Certification | 1 | 1 | 1 |
| Security | 1 | 0 | 2 |
| **Total new (EP-*)** | **13** | **6** | **6** |

---

## 10. Open / closed

| ID | Status |
|----|--------|
| F-01 (no external E2E) | **Open** — 1C-B pilot next; docs ready (1C-A) |
| EP-01, EP-02, EP-04, EP-18 | **Closed** (1C-A) |
| EP-05 – EP-22 | **Open** — P1/P2 remediation |

---

**Last updated:** 2026-06-24
