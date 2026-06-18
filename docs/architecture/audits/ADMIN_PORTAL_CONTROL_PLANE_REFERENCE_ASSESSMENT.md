# Admin Portal — Control Plane Reference Assessment

**Program:** Admin Portal Certification Evaluation  
**Date:** 2026-06-18  
**Benchmarks:** File Hub (L4 Reference), Chat (L3 Reference #2), Calendar (L3 Reference #3), HR, Scheduling, Workforce Communications  
**Catalog:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) (product modules)

**Constraint:** Assessment only — no reference designation awarded; no ledger update.

---

## Executive summary

| Question | Answer |
|----------|--------|
| **Control Plane Reference Candidate?** | **YES — Strong Candidate (partial)** |
| **Full platform reference (File Hub L4 equivalent)?** | **NO** |
| **Reference designation ready today?** | **NO** — open AP-F-007 + G9 UX gaps |

Admin Portal is **not** a product module and will not enter the Reference Module Program as `moduleId: admin`. It can nonetheless serve as a **control-plane pattern reference** for platform operations, AI admin governance, and privileged-mutation audit — analogous to how AI Platform has a separate certification strategy from module L3.

---

## 1. Reference program fit

| Program | Admin Portal fit |
|---------|------------------|
| Reference Module Program (`drive`, `chat`, etc.) | **N/A** — not a workspace module |
| Reference Workspace Program | **Deferred** — portal annex unassessed |
| **Control Plane Reference Program (proposed)** | **Strong Candidate** |
| AI Platform certification (separate row) | Complementary — pipeline admin is subdomain |

**Recommendation:** Establish or extend a **Platform Control Plane / Admin** reference track distinct from module Reference #N numbering, or add a **platform systems** row to `CERTIFICATION_LEDGER.md` via council (out of scope for this evaluation).

---

## 2. Qualifying areas (YES)

### 2.1 AI Pipeline admin control plane

| Criterion | Evidence | vs certified modules |
|-----------|----------|---------------------|
| Canonical API surface | 45 handlers under `/api/admin-portal/ai-pipeline/*` | Deeper than typical module admin annex |
| HTTP test coverage | 45/45 integration smokes | Exceeds pre-1B AI Platform partial |
| Policy governance | Intents, grounding, sources, tools, settings, retention, compliance | Unique platform capability |
| Diagnostics ownership | `adminAiPipelineDiagnosticsService`; UI canonical | Closed AP-F-029 |
| Provider governance | Satellite documented; hygiene tests | Comparable to module marketplace ops |

**Reference value:** Marketplace and first-party modules needing **AI policy admin** should follow this pipeline mount pattern.

---

### 2.2 Admin audit taxonomy

| Criterion | Evidence |
|-----------|----------|
| Canonical actions | 30 `ADMIN_*` actions in `adminAuditTaxonomy.ts` |
| Resource types | 20 `lower_snake_case` types |
| Single write path | `adminAuditService.ts` only |
| Tests | `adminAuditTaxonomy.test.ts`, `adminAuditService.test.ts` |

**Reference value:** Template for **platform privileged-mutation audit** where `emitModuleActivityEvent` is N/A.

---

### 2.3 Route / service governance

| Criterion | Evidence |
|-----------|----------|
| Zero route Prisma | Enforced by static tests |
| Domain service owners | 13+ `admin/*Service` modules |
| Facade deprecation | `adminService.ts` compatibility-only |
| Dangerous-op pattern | Env gate + confirmation + audit deny |

**Reference value:** Extraction pattern for **legacy monolith → control-plane services** (HR 6A / Scheduling parallel).

---

### 2.4 Production safety controls

| Criterion | Evidence |
|-----------|----------|
| Mock removal | Hygiene tests + grep clean |
| Debug gating | `adminPortalDebugGate` |
| Impersonation policy | Deny paths + audit |
| Auth consolidation | Single `requireAdmin` model |

**Reference value:** Operator-safety checklist for **high-privilege platform surfaces**.

---

## 3. Disqualifying / deferred areas (NO or not yet)

| Area | Gap | Blocks reference? |
|------|-----|-------------------|
| **Analytics ownership** | AP-F-007 triplication | **Yes** for analytics reference patterns |
| **UX shell** | G9 FAIL; AP-F-023–026 | **Yes** for Reference UX |
| **Satellite mount consolidation** | Documented fragmentation | Partial — document-only reference OK |
| **Full operation-matrix audit assertions** | P0 covered; not 100% row-level tests | Partial — acceptable for strong candidate |
| **Policy Engine universal adoption** | Waiver model | No — documented compensating control |
| **Level 4 Reference Implementation** | No | **Yes** — File Hub remains sole L4 |

---

## 4. Comparison to certified references

| Dimension | File Hub L4 | Chat L3 Ref | HR L3 | Admin Portal |
|-----------|-------------|-------------|-------|--------------|
| Primary role | Product module | Product module | Product module | **Platform control plane** |
| Service extraction | Reference | Complete | Complete | **Complete (1B)** |
| Operation matrix | Yes | Yes | Yes | **Yes** |
| Test density | Very high | High | ~80 cases | **High (18 route + 45 AI)** |
| UX reference | Yes | Yes | Module UX | **Below bar** |
| Constitutional doc | Yes | Yes | Yes | **Yes (full program)** |
| Ledger row | Yes | Yes | Yes | **Pending council** |

**Headline:** Admin Portal **matches or exceeds** certified modules on **governance architecture and test evidence** for its class (control plane), but **lags** on **UX shell** and **analytics coherence**.

---

## 5. Reference candidate decision

| Status | Verdict |
|--------|---------|
| **Control Plane Reference Candidate** | **YES** |
| **Designation tier** | **Strong Candidate, approaching Reference** |
| **Immediate Reference # designation** | **NO** — council session required |
| **Qualifying sub-areas** | AI Pipeline admin, audit taxonomy, route/service governance, dangerous-op safety |

### If council approves reference status, cite these patterns

1. **AI Pipeline admin HTTP surface** — policy CRUD, diagnostics, retention, test lab  
2. **`ADMIN_*` audit taxonomy** — privileged mutation envelope  
3. **Route architecture standard** — 0 Prisma, service delegation, governance tests  
4. **Dangerous migration op gate** — env + confirm + audit deny  

---

## 6. Path to full reference

| Step | Closes |
|------|--------|
| 0C Analytics rationalization | AP-F-007 |
| 1A UX Shell | AP-F-023–026; G9 |
| Council: platform ledger row | Formal recognition |
| Optional: ai-context-debug merge | Advisory tail |
| Optional: route LOC reduction | Maintainability |

---

## Cross-reference

- [ADMIN_PORTAL_CERTIFICATION_EVALUATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION.md)
- [ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md](./ADMIN_PORTAL_AI_PIPELINE_HTTP_COVERAGE.md)
- [ADMIN_PORTAL_AUDIT_TAXONOMY.md](./ADMIN_PORTAL_AUDIT_TAXONOMY.md)
- [ADMIN_PORTAL_ROUTE_ARCHITECTURE_STANDARD.md](./ADMIN_PORTAL_ROUTE_ARCHITECTURE_STANDARD.md)
