# Admin Portal Modernization Master Plan

**Program:** Admin Portal Modernization Planning Program  
**Status:** Planning documentation — no implementation, no certification  
**Date:** 2026-06-16  
**Constraint:** No code, schema, migrations, implementation, certification awards, or ledger updates

**Audit inputs (accepted facts):** [`ADMIN_PORTAL_EXECUTIVE_SUMMARY.md`](./ADMIN_PORTAL_EXECUTIVE_SUMMARY.md) and companion audit set (10 documents)

**Related planning docs:** [Convergence Program](./ADMIN_PORTAL_CONVERGENCE_PROGRAM.md) · [Control Plane Architecture](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md) · [Modernization Sequence](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md) · [Implementation Packages](./ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md)

---

## Executive summary

Admin Portal will modernize as a **hybrid platform control plane and governance surface** — not as a product module or certified workspace. Modernization follows a **six-stage, safety-first, convergence-first sequence**: close production safety gaps (0E), establish canonical boundaries (0B), rationalize analytics and AI admin (0C/0D), align operator UX (1A), and decompose governance architecture (1B). Strong subsystems (AI Pipeline, module certification gate, billing, user management) are **preserved and extended** — not rewritten.

**Current readiness: NOT READY** (~43%). Target after full program: **READY FOR CERTIFICATION REVIEW** (adapted control-plane framework).

**This document defines strategy only.** No code, schema changes, implementation waves, or certification awards.

---

## Current state (audit evidence — frozen)

| Dimension | Posture | Evidence |
|-----------|---------|----------|
| **Classification** | Hybrid — control plane (~60%) + governance (~25%) + legacy debris (~15%) | Reality Assessment §2 |
| **Scale** | 39 pages, 144 `/api/admin-portal` handlers, 14 API mount prefixes | Surface Inventory §1 |
| **Service architecture** | 4,658-line `AdminService` monolith; fat route files (1,292–1,864 LOC) | Architecture Audit |
| **Client** | 1,998-line `adminApiService.ts` | Surface Inventory §4.5 |
| **Maturity split** | Strong: users, moderation, billing, AI Pipeline, cert gate · Weak: support, modules, BI, performance, ai-learning | Executive Summary §Maturity |
| **Findings** | 30 total — 5 blocking, 12 major, 13 advisory | Findings Register |
| **Readiness** | NOT READY — 9/21 (~43%) on adapted G1–G9 framework | Certification Readiness |
| **Tests** | 7 backend admin test files; 0 frontend admin tests | Reality Assessment §8 |

---

## Modernization philosophy

### What Admin Portal is modernizing toward

A **certifiable platform control plane** with:
- Consistent admin authorization depth
- Canonical API and navigation inventory
- Decomposed domain services with thin routes
- Operator UX aligned to management-shell patterns
- Documented audit taxonomy for privileged mutations
- Production-safe surfaces (no mock fallbacks, no debug leakage)

### What Admin Portal is not becoming

- A product module (no manifest, workspace landing, or `dashboardId` scope)
- A certified workspace (no `PlatformShell` product surface)
- A replacement for module-owned business admin (`/business/[id]/admin/*`)
- A unified analytics product (module-owned analytics remain separate)

---

## Six modernization principles

### 1. Safety-first

Stage **0E Compliance & Safety** must complete before architectural decomposition. Unauthenticated routes, raw SQL migration ops, and mock fallbacks create operational risk that no service extraction can offset.

**Findings:** AP-F-001, AP-F-002, AP-F-005, AP-F-012, AP-F-020, AP-F-021

### 2. Boundary-before-build

Publish canonical control-plane inventory (operation matrix, mount map, nav source) before decomposing `AdminService`. Building services against fragmented boundaries recreates the monolith in smaller pieces.

**Findings:** AP-F-003, AP-F-006, AP-F-009 through AP-F-011, AP-F-015

### 3. Converge, don't invent

Admin Portal consumes proven platform patterns from File Hub, Chat, Calendar, Notifications, and Business Operations — thin controllers, service extraction, operation matrices, management shells, integration test discipline. See [Convergence Program](./ADMIN_PORTAL_CONVERGENCE_PROGRAM.md).

### 4. Preserve strengths

Do not rewrite mature subsystems:
- **AI Pipeline** — 45 handlers, documented phases 1–5 (`AI_PIPELINE_ADMIN_TOOLS.md`)
- **Module certification gate** — `moduleApprovalCertificationGate` on approval/promote
- **Billing / Stripe sync** — production-grade with integration paths
- **User management / moderation** — tested integration paths

Modernization **instruments and boundaries** these — does not replace them.

### 5. Control-plane certification (adapted G1–G9)

Certification uses adapted Platform Control Plane gates — not the 15-item module L3 checklist. Module gates (trash, V-Link portal-wide, `emitModuleActivityEvent`, workspace landing) are N/A by design.

### 6. Evolution, not greenfield

39 existing pages modernize in place. Retire duplicates (`/modules/admin`, debug pages, centralized-ai scaffold) — do not build parallel admin surfaces.

---

## Six-stage modernization model

| Stage | Name | Convergence | Primary findings | Duration |
|-------|------|-------------|------------------|----------|
| **0E** | Compliance & Safety | AP-CO-01 | AP-F-001,002,005,012,020,021 | 1–2 sprints |
| **0B** | Boundary & Registry | AP-CO-02 | AP-F-003,006,009–011,015,017–019,022,028 | 1–2 sprints |
| **0C** | Analytics Rationalization | AP-CO-03 | AP-F-007 | 1 sprint |
| **0D** | AI Administration | AP-CO-04 | AP-F-008,029; partial 030 | 1–2 sprints |
| **1A** | Operator UX Shell | AP-CO-05 | AP-F-023–026 | 2–3 sprints |
| **1B** | Governance Architecture | AP-CO-06 | AP-F-004,013,014,016,027,030 | 3–5 sprints |
| **—** | Readiness Re-evaluation | — | All 30 verified closed or waived | 1 sprint |

```
Stage 0E (Compliance) ──must be first──┐
                                       ├──► Stage 0B (Boundary)
                                       │         ├──► Stage 0C (Analytics) ──┐
                                       │         ├──► Stage 0D (AI Admin) ───┼──► Stage 1B
                                       │         └──► Stage 1A (UX Shell) ───┘
                                       └──────────────────────────────────────────► Stage 1B
                                                              Readiness Re-evaluation
```

**Detail:** [Modernization Sequence](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md)

---

## Dependency model

### Stage dependencies

| Stage | Requires | Blocks |
|-------|----------|--------|
| 0E | Audit program complete | 0B, 1B |
| 0B | 0E complete (or P0 patches shipped) | 0C, 0D, 1A, 1B |
| 0C | 0B boundary map | 1B (analytics service extraction) |
| 0D | 0B complete | 1B (AI pipeline service extraction) |
| 1A | 0B stable | Readiness (advisory G9) |
| 1B | 0E + 0B + (0C ∥ 0D) | Readiness re-evaluation |

### Critical path

**0E → 0B → 1B** — longest pole; determines fastest path to READY FOR CERTIFICATION REVIEW.

### Parallelization allowed

| Parallel tracks | Condition |
|-----------------|-----------|
| 0C ∥ 0D | After 0B exit |
| 1A ∥ 0C/0D | After 0B exit; 1A does not block 1B |
| 0C + 0D → 1B | 1B waits for both 0C and 0D exit |

---

## Risk model

| Risk class | Description | Mitigation stage |
|------------|-------------|------------------|
| **P0 — Production safety** | Unauth mutations, migration delete, mock fallbacks | 0E |
| **P1 — Boundary drift** | 14 API mounts, duplicate nav, phantom registry | 0B |
| **P1 — Operator confusion** | Analytics triplication, AI scaffold false maturity | 0C, 0D |
| **P2 — Architecture debt** | 4,658-line monolith, no audit taxonomy | 1B |
| **P2 — UX inconsistency** | No management shell, token drift | 1A |
| **P3 — Test gaps** | No AI pipeline HTTP tests, no frontend tests | 1B |

### Risk if stages skipped

| Skipped | Consequence |
|---------|-------------|
| 0E | Operators act on fake data; abuse vectors remain; certification blocked |
| 0B | Service decomposition targets wrong boundaries; duplicates persist |
| 0C/0D | AI System hub remains misleading; centralized-ai creates false readiness |
| 1A | G9 fails; operator experience below reference (advisory for L3) |
| 1B | G3/G6 fail; certification review cannot proceed |

---

## Convergence overview

Six convergence initiatives (AP-CO-01 through AP-CO-06) map one-to-one to implementation packages. Each resolves findings across multiple surfaces simultaneously rather than page-by-page fixes.

| ID | Initiative | Stage |
|----|------------|-------|
| AP-CO-01 | Admin Auth & Production Safety | 0E |
| AP-CO-02 | Control Plane Boundary & Registry | 0B |
| AP-CO-03 | Platform Analytics Ownership | 0C |
| AP-CO-04 | AI Control Plane | 0D |
| AP-CO-05 | Operator UX Shell | 1A |
| AP-CO-06 | Governance Architecture | 1B |

**Full detail:** [Convergence Program](./ADMIN_PORTAL_CONVERGENCE_PROGRAM.md)

---

## Target architecture summary

Post-modernization Admin Portal decomposes into:

- **6 domain services** + extracted AI Pipeline service layer
- **Single** `requireAdmin` implementation
- **Canonical** `/api/admin-portal` with documented satellites
- **Admin audit taxonomy** (control-plane events, not module activity)
- **`ADMIN_PORTAL_OPERATION_MATRIX.md`** — authoritative operation inventory

**Full detail:** [Control Plane Architecture](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md)

---

## Certification trajectory

| Milestone | Trigger |
|-----------|---------|
| NOT READY → CONDITIONALLY READY | 0E + 0B complete; 5 blockers closed; ≥70% score |
| CONDITIONALLY READY → READY FOR REVIEW | 1B complete; all majors closed; ≥85% score; test suite |

**Full detail:** [Certification Path](./ADMIN_PORTAL_CERTIFICATION_PATH.md)

---

## Engineering programs (future)

After this planning program:

1. Admin Portal Engineering Blueprint Program (0E + 0B scope) — **immediate next**
2. Admin Portal File Target Matrix Program
3. Admin Portal Implementation Program
4. Admin Portal Certification Evaluation Program

**Full detail:** [Engineering Program Roadmap](./ADMIN_PORTAL_ENGINEERING_PROGRAM_ROADMAP.md)

---

## Out of scope

- Business Operations re-certification or findings closure
- Product `analytics` module charter
- AI Platform L3 promotion (deferred per ledger)
- Ledger row creation (separate program after 1B)
- Memory Bank updates (unless separately requested)
- Reopening audit classifications, findings, or readiness verdict

---

## Document index

| # | Document |
|---|----------|
| 1 | This document |
| 2 | [`ADMIN_PORTAL_CONVERGENCE_PROGRAM.md`](./ADMIN_PORTAL_CONVERGENCE_PROGRAM.md) |
| 3 | [`ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md`](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md) |
| 4 | [`ADMIN_PORTAL_CERTIFICATION_PATH.md`](./ADMIN_PORTAL_CERTIFICATION_PATH.md) |
| 5 | [`ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md`](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md) |
| 6 | [`ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md`](./ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md) |
| 7 | [`ADMIN_PORTAL_ENGINEERING_PROGRAM_ROADMAP.md`](./ADMIN_PORTAL_ENGINEERING_PROGRAM_ROADMAP.md) |
| 8 | [`ADMIN_PORTAL_MODERNIZATION_EXECUTIVE_SUMMARY.md`](./ADMIN_PORTAL_MODERNIZATION_EXECUTIVE_SUMMARY.md) |

**Master plan close:** Strategy defined. No implementation authorized by this document.
