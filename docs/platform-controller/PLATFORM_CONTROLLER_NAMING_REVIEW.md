# Platform Controller — Naming Review

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Conceptual only — **no code renames, no route changes**

---

## 1. Purpose

Evaluate product terminology for the long-term identity of Vssyl's platform operator surface as it evolves from **Admin Portal** to **Platform Controller**.

---

## 2. Candidate terms

| Term | Connotation | Fit |
|------|-------------|-----|
| **Admin Portal** | Generic SaaS admin; settings-heavy | **Legacy** — understates governance scope |
| **Platform Controller** | Operational authority; capability-oriented | **Recommended primary** |
| **Platform Console** | Operator terminal; neutral | **Acceptable alternate** — less distinctive |
| **Control Plane** | Infrastructure / Kubernetes idiom | **Technical class label** — not user-facing product name |
| **Governance Center** | Policy/certification emphasis | **Partial** — misses ops/billing/support |
| **Command Center** | Incident/ops emphasis | **Partial** — misses certification |

---

## 3. Recommended naming strategy

### 3.1 Primary product name (user-facing)

# **Platform Controller**

**Tagline:** *Operational control plane for the Vssyl platform.*

**Use when:**
- Shell header, marketing, docs, operator onboarding
- Program names (Platform Controller Program)
- Executive / certification documents

### 3.2 Technical class label (architecture / ledger)

# **Platform Control Plane**

**Use when:**
- `CERTIFICATION_LEDGER.md` row: "Admin Portal / Control Plane"
- API mount documentation
- Architecture audits, `.cursor/rules`, Memory Bank technical context

### 3.3 Transition naming (12-month)

| Surface | Phase | Name |
|---------|-------|------|
| Shell header | 1B | Platform Controller |
| Docs folder | 1A | `docs/platform-controller/` |
| Route prefix | **Deferred** | Keep `/admin-portal` until migration program |
| Code paths | **Deferred** | Keep `admin-portal`, `adminApiService`, `adminPortal*` |
| Memory Bank | 1B doc update | Add Platform Controller section; retain Admin Portal history |
| Ledger | **No change** | "Admin Portal / Control Plane" until council rename |

**Principle:** **Conceptual rename first, mechanical rename later** — avoids breaking bookmarks, tests, and API clients.

---

## 4. Domain terminology (nav labels)

| Legacy label | Platform Controller label |
|--------------|----------------------------|
| Admin Portal | Platform Controller |
| Overview (dashboard) | **Platform Overview** |
| Developer & Modules | **Marketplace** |
| AI System | *(retired nav)* → **Platform Programs** |
| AI Pipeline | **AI Pipeline** (unchanged — established) |
| Platform (section) | Split → **Diagnostics**, **Configuration**, **Security** |
| Commercial | **Billing** |
| Admin Labs | **Operator Labs** |
| Financial Management | **Billing** (or Subscriptions) |
| Modules | **Modules** (under Marketplace) |

---

## 5. Platform program naming (canonical)

| Internal id | Display name | Avoid |
|-------------|--------------|-------|
| `platform-kernel` | Platform Kernel | "System settings" |
| `unified-search` | Unified Search | "Search admin" |
| `ai-retrieval` | AI Retrieval | "AI Pipeline" as program name (pipeline is the tool) |
| `context-graph` | Context Graph | "AI sources" alone (too narrow) |
| `marketplace-partner-runtime` | Marketplace Partner Runtime | "Modules admin" |

---

## 6. Terms to retire (conceptual)

| Term | Replacement | Notes |
|------|-------------|-------|
| Admin Portal (user-facing) | Platform Controller | Phased |
| AI System (nav) | Platform Programs + AI Pipeline | Page may remain as redirect |
| Business Intelligence (route) | Platform Analytics → Insights tab | Already redirected |
| AI Learning (route) | AI Pipeline | Already redirected |
| AI Context Debug (route) | AI Pipeline Diagnostics | Already redirected |
| centralized-ai (API) | ai-pipeline | Retire mount |

---

## 7. Terms to preserve

| Term | Why |
|------|-----|
| `ADMIN` role | Platform RBAC — not renamed |
| `/api/admin-portal` | Stable API contract until migration |
| `adminApiService` | Code stability |
| AI Pipeline | Established operator vocabulary |
| Marketplace | Aligns with product `/modules` |
| Module certification | Certification ledger vocabulary |

---

## 8. Naming conflicts to avoid

| Conflict | Resolution |
|----------|------------|
| Platform Controller vs Platform Kernel program | Controller = **product**; Kernel = **program** inside it |
| Control Plane vs Controller | Plane = architecture; Controller = UI product |
| Platform Console vs user "console" | Prefer Controller — Console ambiguous with browser devtools |
| Governance Center vs Security | Governance = Configuration domain; Security = incidents |

---

## 9. Documentation placement

| Content | Location |
|---------|----------|
| Phase 1A IA / consolidation | `docs/platform-controller/` |
| Operator how-to (future) | `docs/guides/PLATFORM_CONTROLLER.md` (1B — supersedes `ADMIN_PORTAL.md`) |
| Product intent | `memory-bank/adminProductContext.md` → add Platform Controller section |
| Architecture class | `docs/architecture/audits/ADMIN_PORTAL_*` — archive prefix; cross-link platform-controller |

---

## 10. Council / ledger language (future)

When recertification wave occurs (Phase 0A recommendation):

> **Platform Controller (Platform Control Plane)** — LEVEL 3 CERTIFIED

Supersedes display string "Admin Portal / Control Plane" — **ledger ID unchanged** until formal council ratification.

---

## 11. Recommendation summary

| Question | Answer |
|----------|--------|
| Long-term product name | **Platform Controller** |
| Architecture class | **Platform Control Plane** |
| Route/code rename now? | **No** |
| Shell copy rename | **Yes** — Phase 1B |
| Alternate acceptable name | Platform Console (second choice) |

---

**Last updated:** 2026-06-24 (Phase 1A design)
