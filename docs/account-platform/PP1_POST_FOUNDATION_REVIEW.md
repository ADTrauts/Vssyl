# PP-1 — Post-Foundation Review

**Program:** Account Platform — Post-Foundation Certification Readiness Reassessment  
**Date:** 2026-06-20  
**Type:** Governance review only — no implementation  
**Baseline:** [PP1_FOUNDATION_STATUS.md](./PP1_FOUNDATION_STATUS.md) · [PP1_PHASE1_ARCHITECTURE.md](./PP1_PHASE1_ARCHITECTURE.md)

---

## Scope

Reassess PP-1 Identity & Profile after completion of:

- PP-1 Phase 1 (Identity Foundation)
- PP-2 Phase 1 (Settings substrate — closes PP1-F12)
- PP-3 Packages 1–2 (no direct PP-1 code changes; dependency verification only)

---

## Foundation artifacts (verified)

| Service / artifact | Status |
|------------------|--------|
| `authService` | ✅ |
| `profileService` | ✅ |
| `profilePhotoService` | ✅ |
| `privacyService` | ✅ |
| `connectionService` | ✅ |
| `identityActivityService` | ✅ |
| Auth routes extracted (`routes/auth.ts`) | ✅ |
| Policy Engine on identity writes | ✅ |
| Normalized activity (profile, privacy, photo, connection) | ✅ |
| Unit + partial integration tests | ✅ Partial |

---

## Findings register (PP1-F01 through PP1-F06)

| ID | Severity | Finding | Status | Evidence / remaining gap |
|----|----------|---------|--------|--------------------------|
| **PP1-F01** | Major | No `profileService` | **Closed** | `server/src/services/account/profileService.ts` |
| **PP1-F02** | Major | Auth routes inline in `index.ts` | **Closed** | `routes/auth.ts` + `authController.ts` |
| **PP1-F03** | Major | MFA not implemented | **Open** | No TOTP/WebAuthn path; G8 gap |
| **PP1-F04** | Major | Photo logic in controller only | **Partial** | `profilePhotoService` exists; multer/storage wiring remains in controller |
| **PP1-F05** | Major | Connection mutations without PE | **Closed** | `connectionService` + `connection:*` actions |
| **PP1-F06** | Major | Privacy updates without PE/activity | **Closed** | `privacyService` + `identityActivityService` |

### Related advisories (outside F01–F06)

| ID | Status | Notes |
|----|--------|-------|
| PP1-F07 | Open | Notification pref fragmentation — PP-2 Package 2 adapter |
| PP1-F08 | Open | No session management UX — PP-1 Phase 1B |
| PP1-F09 | Open | Legacy photo URL dual fields |
| PP1-F10 | Open | Misleading 2FA UI (business settings) |
| PP1-F11 | Open | No Global Trash handler for photos |
| PP1-F12 | **Closed** | `useUserSettings` drift — fixed by PP-2 `/api/settings` |

---

## G1–G9 readiness estimate

| Gate | Pre Phase 1 (0B-1) | Post all foundations | Notes |
|------|-------------------|----------------------|-------|
| G1 Authorization | 1 | **3** | PE on profile, privacy, photo, connection, preference |
| G2 Auditability | 1 | **3** | Activity + preference domain events |
| G3 Service boundaries | 1 | **3** | Account services extracted |
| G4 API coherence | 2 | **3** | Auth/profile namespaces clean |
| G5 Ownership | 1 | **3** | Ownership model + runtime alignment |
| G6 Test evidence | 1 | **2** | Unit + partial integration; matrix not complete |
| G7 Documentation | 2 | **3** | Architecture + status + post-foundation docs |
| G8 Production safety | 2 | **2** | MFA still missing |
| G9 UX consistency | 2 | **2** | Privacy path split; settings hubs fragmented (PP-2) |
| **Total** | **~12/27 (~44%)** | **~22/27 (~81%)** | |

*Governance estimate — not evaluator-certified. Operation matrix re-audit not performed.*

---

## PP-1 readiness determination

| Dimension | Status |
|-----------|--------|
| Phase 1 foundation charter | ✅ Complete |
| F01–F06 majors (pre-cert gate) | **4 closed · 1 partial · 1 open** |
| Hard dependencies for PP-2 / PP-3 | ✅ Met |
| L3 WITH FINDINGS candidate | **Yes — earliest certifiable sub-domain in Account Platform** |
| Plain L3 candidate | **No** — MFA (F03) and G6 gaps |
| Phase 1B required before next package? | **No** |

---

## Remaining PP-1 work (not authorized)

| Package | Items | Blocks certification? |
|---------|-------|----------------------|
| Phase 1B | MFA, session revoke UX, change-password API | F03 is major; acceptable as WITH FINDINGS advisory if documented |
| Remainder | Photo controller thinning, Global Trash photos, full auth integration suite | Partial closure of F04; G6 |
| Pre-cert | Operation matrix re-audit | Required before evaluation packet |

---

**Last updated:** 2026-06-20 (Post-Foundation Reassessment)
