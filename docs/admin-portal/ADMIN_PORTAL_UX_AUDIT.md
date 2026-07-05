# Admin Portal — UX Audit

**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Date:** 2026-07-05  
**Status:** Discovery only — no UX certification awarded

**Authority:** [`UX_CONSTITUTION.md`](../ux/UX_CONSTITUTION.md) · [`DESIGN_TOKENS.md`](../ux/DESIGN_TOKENS.md)

**Baseline:** G9 UX shell PASS (2026-06-18). Re-evaluated after Platform Controller navigation reorganization (Phase 1B) and Platform Programs hub addition.

**Related:** [Information Architecture](./ADMIN_PORTAL_INFORMATION_ARCHITECTURE.md) · [Reference Assessment](./ADMIN_PORTAL_REFERENCE_ASSESSMENT.md)

---

## 1. Executive summary

Admin Portal UX is **operator-functional and improving**. The **Platform Controller** rebrand (sidebar sections, collapsible groups, Platform Programs hub) closes the largest IA gap from the June 2026 audit. AI Pipeline remains the **reference UX pattern** for deep operator workflows.

Heterogeneity persists: the **modules page** (~2,100 LOC) is dense; **business-intelligence** overlaps analytics; marketplace probe feedback is weak; **13 orphan/debug pages** remain URL-reachable. No global operator search exists.

**Overall UX posture:** **Above minimum operator bar; approaching unified cockpit ideal (~78% UX completion).**

---

## 2. UX scorecard

| Category | Status | Evidence | Finding |
|----------|--------|----------|---------|
| Shell | **PASS** | Custom Platform Controller sidebar + header | Intentional PlatformShell exception |
| Navigation | **PASS WITH FINDINGS** | 24 sidebar destinations, 10 sections | Orphan pages; no global search |
| Information architecture | **PASS WITH FINDINGS** | Platform Programs hub added | BI still orphan |
| Page consistency | **PASS WITH FINDINGS** | `AdminPortalPageShell`, Pipeline sub-shell | Modules page ad-hoc |
| Dashboard | **PASS WITH FINDINGS** | `AdminStatCard`, empty states | No live health strip |
| Empty / loading / error | **PASS** | `AdminPortalEmptyState`, Spinner, retry | Mock removal closed |
| Modal / confirm | **PASS** | `ConfirmModal` on critical flows | — |
| Token usage | **PASS WITH FINDINGS** | `v-*` in layout/shell | Legacy `gray-*` in some marketplace components |
| Marketplace probe UX | **PASS WITH FINDINGS** | Readiness card + 4 probes | Weak result surfacing |
| Certification workflow | **PASS** | Panel + checklist in modal | Dense on small viewports |
| Platform Programs hub | **PASS** | `PlatformProgramCard` grid | Health load errors graceful |
| Debug leakage | **PASS WITH FINDINGS** | Env-gated nav items | Direct URL still works |
| Operator efficiency | **PASS WITH FINDINGS** | Most flows ≤3 clicks | Business ops requires impersonation workaround |
| Searchability | **FAIL** | No global operator search | High friction for user/business lookup |
| Accessibility | **UNKNOWN** | Pipeline back-link aria | Broader audit not run |
| Mobile | **UNKNOWN** | Sidebar collapse | Not tested |

---

## 3. Navigation evaluation

### 3.1 Current sidebar (authoritative: `platformControllerNavigation.ts`)

| Section | Items | Default collapsed |
|---------|------:|:-------------------:|
| Overview | 2 | No |
| Platform Programs | 2 | No |
| Marketplace | 2 | No |
| AI & Diagnostics | 4 | No |
| Operations | 4 | No |
| Providers | 1 | No |
| Security | 1 | No |
| Billing | 2 | No |
| Configuration | 3 | No |
| Operator Labs | 2–3 | **Yes** |

**Improvement since June 2026:** Platform Programs and Platform Adoption now in nav. AI System removed from nav (reduces duplicate launcher). Provider Governance uses hash deep-link on AI Pipeline.

### 3.2 Click-depth analysis (operator efficiency)

| Task | Clicks | Acceptable? |
|------|-------:|:-----------:|
| View platform stats | 1 (dashboard default) | ✅ |
| Certify a module submission | 2 (modules → modal) | ✅ |
| Run AI trace diagnostic | 2 (AI Pipeline → diagnostics) | ✅ |
| Sync Stripe subscription | 2 (billing → sync) | ✅ |
| Find a business (not impersonating) | 3+ (impersonate → search) | ⚠️ |
| Check email delivery | N/A | ❌ |
| Check API health | N/A (outside portal) | ❌ |
| Platform program health | 1 (platform-programs) | ✅ |
| Edit pricing tier | 2 (pricing → modal) | ✅ |

**Verdict:** Core governance and AI flows are efficient. **Business and infra ops require unnecessary navigation or leave the portal.**

### 3.3 Orphan surfaces

| Page | Discovery | Risk | Recommendation |
|------|-----------|------|----------------|
| `business-intelligence` | Direct URL / analytics tab | Low | Merge into analytics insights |
| `business-ai` | Platform Programs link | Low | Acceptable hub |
| `ai-system` | Bookmark only | Low | Keep redirect |
| `ai-context` | Bookmark / old links | Medium | Redirect → diagnostics |
| 7 debug pages | Direct URL | Medium | Keep gated |
| `seed-modules` | Operator Labs (gated) | Low | Acceptable |

---

## 4. Information hierarchy

### 4.1 What works

1. **Overview first** — Dashboard and Analytics at top match founder/ops mental model.
2. **Platform Programs as second section** — Correct elevation of certified capabilities.
3. **AI & Diagnostics grouped** — Pipeline, diagnostics, logs, performance co-located.
4. **Operator Labs collapsed** — Dangerous/debug tools deprioritized visually.
5. **AI Pipeline sub-shell** — Back navigation, section titles, consistent spacing.

### 4.2 Hierarchy gaps

| Gap | Impact | Fix (consolidation) |
|-----|--------|---------------------|
| No **Businesses** in Operations | CS/Support friction | Add Operations → Businesses |
| No **Email** in Configuration | Launch ops invisible | Add Configuration → Email Ops |
| BI separate from Analytics | Duplicate mental model | Single analytics destination |
| Provider Governance as hash link | Easy to miss | Acceptable if hub prominent |
| No global search | Slow user/business lookup | Header search → users/businesses |

---

## 5. Visual consistency

| Pattern | Adoption | Notes |
|---------|----------|-------|
| `AdminPortalPageShell` | Most non-pipeline pages | ✅ |
| `PipelineSubpageShell` | All AI Pipeline sub-pages | ✅ Reference |
| `AdminStatCard` | Dashboard, analytics | ✅ |
| `AdminPortalEmptyState` | Standardized empty | ✅ |
| `PlatformProgramCard` | Platform Programs | ✅ |
| `shared/components` Button/Card/Spinner | Widespread | ✅ |
| Legacy Tailwind grays | modules, some charts | 🔄 Token migration tail |
| Chart libraries | Mixed across analytics/BI | 🔄 Normalize in merge |

**Header:** "Platform Controller" + "Operational control plane" — consistent with Operational Excellence positioning. Static "System Online" indicator is **not wired to `/api/health`** (misleading during outages).

---

## 6. Loading, empty, and error states

| Surface | Loading | Empty | Error |
|---------|---------|-------|-------|
| Dashboard | Spinner | EmptyState on no activity | Alert + retry |
| Modules | Spinner | Empty submissions message | Error banner |
| Support | Spinner | Empty ticket state | Retry (mock removed) |
| AI Pipeline | Skeleton panels | Pipeline-specific empty | Per-section error |
| Platform Programs | Card-level loading | N/A | Graceful degradation message |
| Billing | Spinner | Empty subscriptions | Error + retry |

**Verdict:** **PASS** — 0E-C mock removal and empty state standardization hold.

---

## 7. Workflow UX audits

### 7.1 Module certification (reference workflow)

| Step | Quality | Notes |
|------|---------|-------|
| Filter submissions | Good | Search, status filters |
| Open detail modal | Good | Tabbed |
| Certification checklist | Good | Clear pass/warn/fail |
| Readiness probes | Adequate | Success unclear without network tab |
| Approve/reject | Good | ConfirmModal |

### 7.2 AI diagnostics (reference workflow)

| Step | Quality | Notes |
|------|---------|-------|
| Hub health metrics | Good | At-a-glance |
| Trace table | Excellent | Sortable, filterable |
| Evidence viewer | Excellent | Retrieval tab |
| Test lab | Good | Structured dry-run |

### 7.3 Support workflow

| Step | Quality | Notes |
|------|---------|-------|
| Ticket queue | Good | Filters work |
| Assign / respond | Adequate | Large monolithic page |
| Customer context | Weak | No linked user/business sidebar |

### 7.4 Billing workflow

| Step | Quality | Notes |
|------|---------|-------|
| Subscription list | Good | Stripe links |
| Sync actions | Good | Per-row and bulk |
| Payout review | Good | Tab separation |
| Unknown amount warning | Good | Visible banner |

---

## 8. Accessibility

| Item | Status |
|------|--------|
| Focus visible on sidebar links | Partial |
| `sr-only` headings on Platform Programs | ✅ |
| Pipeline back link aria | ✅ |
| Color contrast on dark sidebar | Generally adequate |
| Keyboard trap in large modals | Unknown |
| Screen reader on data tables | Unknown |

**Recommendation:** Run focused a11y pass on modules modal and support page before declaring operator UX certified.

---

## 9. UX modernization priorities (no redesign)

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Header health indicator wired to `/api/health` | Small |
| P0 | Global operator search (users + businesses) | Medium |
| P1 | Merge BI into analytics (remove orphan) | Medium |
| P1 | Probe result toast/panel on readiness card | Small |
| P1 | Support page: linked user/business context | Medium |
| P2 | Modules page decomposition (tabs extraction) | Medium |
| P2 | Token migration tail on marketplace components | Small |
| P3 | Redirect ai-context → diagnostics | Small |

---

## 10. UX completion estimate

| Area | % |
|------|--:|
| Shell & navigation | 85% |
| Core workflows (AI, modules, billing) | 90% |
| Secondary workflows (support, perf) | 70% |
| Discoverability (search, orphans) | 60% |
| Infra/email ops UX | 40% |
| Accessibility confidence | 50% (unknown) |

### **Weighted UX completion: ~78%**

---

**Last updated:** 2026-07-05
