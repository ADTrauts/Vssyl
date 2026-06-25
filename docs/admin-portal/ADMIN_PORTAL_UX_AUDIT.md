# Admin Portal — UX Audit

**Program:** Admin Portal Program — Phase 0A  
**Date:** 2026-06-24  
**Status:** Discovery only — **no UX certification awarded**

**Authority:** [`UX_CONSTITUTION.md`](../ux/UX_CONSTITUTION.md) · [`UX_REFERENCE_PATTERN_CATALOG.md`](../ux/UX_REFERENCE_PATTERN_CATALOG.md)

**Baseline:** G9 UX shell **PASS** (2026-06-18 closeout). This audit re-evaluates operator UX after marketplace readiness surfaces and governance/retention nav additions.

**Related:** [Reality Assessment](./ADMIN_PORTAL_REALITY_ASSESSMENT.md) · [`ADMIN_PORTAL_UX_SHELL_CLOSEOUT.md`](../architecture/audits/ADMIN_PORTAL_UX_SHELL_CLOSEOUT.md)

---

## 1. Executive summary

Admin Portal UX is **functional and improved** since the June 2026 modernization wave: shared `AdminPortalEmptyState`, `ConfirmModal` adoption, and token migration closed prior G9 findings. The **AI Pipeline sub-tree** remains the **reference UX pattern** for operator surfaces.

Heterogeneity persists: the **modules governance page** is a 2,100+ LOC monolith; **business intelligence** and several AI satellite pages are hub-discovered but not sidebar-listed; marketplace probe feedback is minimal ("see network tab"); and **12 orphan/debug pages** remain reachable by URL.

**Overall UX posture:** **Above minimum operator bar; below unified Platform Programs command-center ideal.**

---

## 2. UX scorecard (2026-06-24)

| Category | Status | Evidence | Finding |
|----------|--------|----------|---------|
| Shell | **PASS WITH FINDINGS** | Custom sidebar + header; intentional PlatformShell exception | Operator isolation appropriate |
| Navigation | **PASS WITH FINDINGS** | 22 sidebar items, 6 collapsible sections | 12 orphan pages; BI not in nav |
| Admin IA | **PASS WITH FINDINGS** | Logical Operations → Commercial → AI → Platform → Modules | No Platform Programs hub |
| Page consistency | **PASS WITH FINDINGS** | AI Pipeline uses sub-shell; shared page shell elsewhere | modules page ad-hoc density |
| Dashboard consistency | **PASS WITH FINDINGS** | `AdminStatCard`, shared empty states | Heterogeneous chart patterns across analytics/BI |
| Empty/loading/error | **PASS** | `AdminPortalEmptyState`, Spinner, retry patterns | 0E-C mock removal closed gaps |
| Modal / confirm | **PASS** | `ConfirmModal` on critical flows | seed-modules may still use legacy patterns |
| Token usage | **PASS WITH FINDINGS** | `v-*` tokens in layout/shell | Legacy `gray-*` in marketplace components |
| Marketplace probe UX | **PASS WITH FINDINGS** | Readiness card + 4 probe buttons | Weak result surfacing; no history |
| Certification workflow UX | **PASS** | Certification panel + checklist in modal | Dense but complete |
| Debug page leakage | **PASS WITH FINDINGS** | Env-gated testing nav; debug pages by URL | Mitigated not eliminated |
| Mobile behavior | **UNKNOWN** | Sidebar collapse exists | Not tested in this audit |
| Accessibility | **UNKNOWN** | Pipeline sub-shell has aria on back link | Broader a11y not assessed |

---

## 3. Navigation and information architecture

### 3.1 Sidebar structure (authoritative: `layout.tsx`)

| Section | Items | Count |
|---------|-------|------:|
| Operations | Overview, Users, Moderation, Support | 4 |
| Commercial | Financial Management, Pricing | 2 |
| AI | AI System, AI Pipeline | 2 |
| Platform | Analytics, Performance, Security, **Governance**, **Retention**, System Logs, System Admin | 7 |
| Developer & Modules | Developers, Modules | 2 |
| Admin Labs | Overrides, Testing (gated), Impersonation | 2–3 |

**Change since prior audit:** Governance and Retention **added to sidebar** (previously orphan under `/admin/*`).

### 3.2 Orphan surfaces

| Page | Discovery path | Risk | Recommendation |
|------|----------------|------|----------------|
| `/admin-portal/business-intelligence` | AI System hub | Low | Add to Platform or Commercial section |
| `/admin-portal/business-ai` | AI System hub | Low | Acceptable hub pattern |
| `/admin-portal/ai-context` | AI System hub | Medium | Retire → pipeline diagnostics |
| `/admin-portal/ai-learning` | Redirect/hub | Low | Deprecated — keep redirect |
| `/admin-portal/seed-modules` | Direct URL | Medium | Move to Admin Labs or CLI |
| 6 debug/test pages | Direct URL | Medium | Keep env-gated; remove from prod build tree (future) |

### 3.3 Discoverability gaps for new platform programs

| Platform capability | Expected operator path | Current path | Gap |
|--------------------|------------------------|--------------|-----|
| Marketplace partner probes | Modules → submission detail | ✅ Present | Probe results weak |
| Unified Search ops | Platform → Search | ❌ Missing | No nav entry |
| Context Graph ops | AI Pipeline → sources/registry | Partial | No labeled "Context Graph" IA |
| Activity ingest monitor | Modules probe | Probe only | No aggregate view |
| Sandbox pilot status | Platform or Modules | ❌ Missing | AP-G08 |

---

## 4. Workflow audits

### 4.1 Module certification workflow

| Step | UX quality | Notes |
|------|------------|-------|
| List submissions with filters | **Good** | Search, bulk actions |
| Open submission detail | **Good** | Modal with tabs |
| Review certification checklist | **Good** | `ModuleCertificationReviewPanel` |
| Check marketplace readiness | **Good** | `MarketplaceReadinessCard` with scope badge |
| Run delegate probes | **Adequate** | Buttons work; feedback minimal |
| Approve/reject with notes | **Good** | ConfirmModal, review notes |
| Promote version | **Good** | Gate errors surfaced from API |

**Friction points:** Modal density on smaller viewports; probe success requires network tab inspection; no persisted probe audit trail in UI.

### 4.2 AI diagnostics workflow

| Step | UX quality | Notes |
|------|------------|-------|
| Navigate to AI Pipeline | **Good** | Sidebar + AI System hub |
| View health metrics | **Good** | Retrieval trigger rate, enforcement stats |
| Open trace | **Excellent** | Evidence viewer with retrieval tab |
| Test lab dry-run | **Good** | Structured panels |
| Policy edit | **Good** | Registry validation feedback |

**Verdict:** AI Pipeline is the **UX reference** for Admin Portal deep workflows.

### 4.3 Platform configuration workflow

| Step | UX quality | Notes |
|------|------------|-------|
| System config | **Adequate** | system page |
| Dangerous migration ops | **Good** | Gated + confirm token |
| Pricing edits | **Good** | Modal with query pack fields |
| Governance / retention | **Adequate** | Now in nav; component-level UX varies |

### 4.4 Support and moderation workflows

| Workflow | UX quality | Notes |
|----------|------------|-------|
| Moderation queue | **Good** | Filters, bulk action |
| Support tickets | **Adequate** | Large page; functional |
| Impersonation | **Good** | Banner + lab; custom iframe sandbox |

---

## 5. Pattern alignment

### 5.1 Best-aligned: AI Pipeline

| Pattern | Component | Notes |
|---------|-----------|-------|
| Sub-page shell | Pipeline sub-shell pattern | Back link, title, padding |
| Operations hub | `PipelineOperationsHub.tsx` | Health cards, tool grid |
| Enforcement badges | Pipeline components | Clear status semantics |

**Recommendation:** Use AI Pipeline sub-shell as template for future **Platform Programs hub** and split modules tabs.

### 5.2 Weakest-aligned

| Page | Issues |
|------|--------|
| `modules/page.tsx` | 2,100+ LOC; multiple concerns in one file |
| `MarketplaceReadinessCard` | Legacy gray tokens; probe note is yellow text only |
| Debug pages | Inconsistent with production shell standards |

---

## 6. UX findings register

| ID | Finding | Severity |
|----|---------|----------|
| UX-01 | No Platform Programs hub for Search / Context Graph / Marketplace pilot | Major |
| UX-02 | Probe results not rendered inline — operator must inspect network | Advisory |
| UX-03 | Business Intelligence not in sidebar | Advisory |
| UX-04 | modules page monolith hurts maintainability and load time | Advisory |
| UX-05 | Marketplace components use legacy color tokens | Advisory |
| UX-06 | 12 orphan/debug pages in production tree | Advisory (mitigated) |

---

## 7. Recommendations (planning only)

1. Add **Platform Programs** nav item with federated status cards (Search, Marketplace pilot, Context Graph).
2. Enhance **MarketplaceReadinessCard** — inline probe JSON summary + last-run timestamp.
3. Add **Business Intelligence** to Platform section or merge into Analytics with tab IA.
4. Split **modules page** into tab components (submissions, AI context, analytics) under shared shell.
5. Retire **ai-context** page — redirect to AI Pipeline diagnostics.

---

**Last updated:** 2026-06-24 (Phase 0A discovery)
