# Admin Portal AI Administration Certification Impact

**Program:** Admin Portal Modernization — Stage 0D Planning  
**Date:** 2026-06-17  
**Baseline:** [`ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md`](./ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md) — **CONDITIONALLY READY** (~74%, 20/27 gate points)  
**Constraint:** Impact estimate only — no certification awarded

---

## 1. Scope

Assess how successful **Stage 0D completion** would affect adapted control-plane gates:

- **G3** Service boundaries
- **G4** API coherence
- **G6** Test evidence
- **G9** UX management shell

Gates not primary 0D targets (G1, G2, G5, G7, G8) noted briefly.

---

## 2. Gate impact summary

| Gate | Pre-0D | Post-0D (projected) | Δ | Confidence |
|------|--------|---------------------|---|------------|
| **G3** Service boundaries | FAIL | FAIL → **PARTIAL** | +1 level | Medium |
| **G4** API coherence | PARTIAL | **PASS** | +1 level | High |
| **G6** Test evidence | PARTIAL | PARTIAL → **improved** | +0.5–1 score | Medium |
| **G9** UX management shell | FAIL | FAIL → **PARTIAL** | +1 level | Medium |

**Projected weighted score:** 20/27 → **23–24/27 (~85–89%)** after 0D-G

**Certification review:** Still **blocked by AP-F-004** (AdminService monolith) until 1B — 0D does not close the sole remaining blocking finding.

---

## 3. G3 — Service boundaries

### Current (post-0B)

| Issue | Evidence |
|-------|----------|
| FAIL | `adminService.ts` monolith; `ai-centralized.ts` 3,491 LOC parallel to pipeline services |
| Pipeline services exist | `server/src/ai/pipeline/*` — proper domain separation for instrumentation |

### 0D impact

| Action | Effect |
|--------|--------|
| Retire centralized-ai body | Removes largest non-canonical route monolith from AI admin |
| Preserve pipeline services | No regression — routes stay thin-ish wrappers over pipeline package |
| No AdminService extraction | AP-F-004 remains open |

### Projected status

**PARTIAL** — AI domain boundaries clarified; platform-wide G3 still fails on `adminService.ts` until 1B.

**Score:** 1/3 → **2/3**

---

## 4. G4 — API coherence

### Current (post-0B)

| Issue | Evidence |
|-------|----------|
| PARTIAL | Operation matrix + mount map document 170 AI admin handlers across 6 mounts |
| Fragmentation | 97 legacy handlers dwarf 45 canonical |

### 0D impact

| Action | Effect |
|--------|--------|
| Retire >80% centralized-ai | Handler ratio inverts: canonical >> legacy |
| Document satellites | ai-providers, business-ai, modules/ai remain justified |
| Retire ai-context-debug | Removes duplicate forensics mount |
| Update mount map | Single AI control plane story |

### Projected status

**PASS** — Canonical `/api/admin-portal/ai-pipeline` is unambiguous primary AI admin API; satellites documented; legacy retired.

**Score:** 2/3 → **3/3**

---

## 5. G6 — Test evidence

### Current (post-0B)

| Issue | Evidence |
|-------|----------|
| PARTIAL | 11 server admin-portal tests; 11 pipeline unit tests; **0** pipeline HTTP tests |
| Fence only | `aiCentralizedAdminFence.test.ts` |

### 0D impact

| Action | Effect |
|--------|--------|
| Create `admin-portal-ai-pipeline.test.ts` | Closes AP-F-030 partial |
| Expand centralized-ai fence tests | Proves retirement |
| Create `adminPortalAiAdminHygiene.test.ts` | Prevents centralized-ai client reintroduction |
| No full billing/security/BI suite | AP-F-014 remains 1B |

### Projected status

**PARTIAL (stronger)** — Critical AI governance path has HTTP smoke evidence; not comprehensive.

**Score:** 2/3 → **2.5–3/3** (round to **3/3** if ≥10 pipeline HTTP cases)

---

## 6. G9 — UX management shell

### Current (post-0B)

| Issue | Evidence |
|-------|----------|
| FAIL | No shared EmptyState/ConfirmModal; gray tokens |
| Partial win | AI Pipeline sub-shell (`PipelineSubpageShell`) exists |

### 0D impact

| Action | Effect |
|--------|--------|
| Pipeline-centric IA | Strongest admin UX pattern becomes default for AI |
| Retire stub pages | Removes misleading "coming soon" surfaces |
| ai-system launcher refactor | Reduces duplicate hub chrome |
| Not full 1A shell | EmptyState/token migration still open (AP-F-023–026) |

### Projected status

**PARTIAL** — AI domain approaches reference sub-shell pattern; platform-wide G9 still fails until 1A.

**Score:** 1/3 → **2/3**

---

## 7. Findings impact

| Finding | Pre-0D | Post-0D (projected) |
|---------|--------|---------------------|
| **AP-F-008** | Open major | **Closed** |
| **AP-F-029** | Open advisory | **Closed** |
| **AP-F-030** | Open major | **Partial** — smoke tests; full suite 1B |
| **AP-F-004** | Open blocking | **Open** (unchanged) |
| **AP-F-007** | Open major | **Open** (0C) |

**Open findings:** 13 → **10** (3 closed in 0D)

---

## 8. Readiness trajectory

| Milestone | Outcome | Gate score |
|-----------|---------|------------|
| Post-0B (current) | CONDITIONALLY READY | ~74% |
| Post-0D (projected) | CONDITIONALLY READY (stronger) | ~85–89% |
| Post-1B (required for review) | READY FOR CERTIFICATION REVIEW (if AP-F-004 closed) | ≥85% + zero blocking |

**0D alone does not achieve READY FOR CERTIFICATION REVIEW** because AP-F-004 (blocking) and AP-F-007 (0C) remain.

---

## 9. Ledger impact

| Item | 0D effect |
|------|-----------|
| CERTIFICATION_LEDGER module row | None — still N/A |
| Future control-plane row | Strengthens AI Pipeline as reference subdomain evidence |
| AI Platform certification | Positive alignment — retires competing centralized-ai narrative |

**No ledger updates in 0D planning or projected implementation.**

---

## 10. Certification council talking points (post-0D)

1. **Single AI admin API** — `/api/admin-portal/ai-pipeline` with 45 real handlers
2. **Legacy retired** — centralized-ai scaffold no longer pollutes mount inventory
3. **Forensics unified** — pipeline diagnostics replaces context-debug duplication
4. **Tests exist** — HTTP smoke for highest-maturity admin subdomain
5. **Still deferred** — AdminService monolith (1B), analytics triplication (0C), full PE/audit taxonomy (1B)

---

**Impact assessment close.** Planning only. Next: [Executive Summary](./ADMIN_PORTAL_AI_ADMIN_EXECUTIVE_SUMMARY.md).
