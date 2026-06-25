# Platform Controller — Workflow Analysis

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Design only — **no implementation**

**Related:** [Navigation Model](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) · [Platform Programs Hub Design](./PLATFORM_PROGRAMS_HUB_DESIGN.md)

---

## 1. Purpose

Evaluate whether current navigation supports common **platform operator workflows** efficiently, and define **target paths** after IA consolidation (existing pages only).

---

## 2. Workflow scorecard (current → target)

| Workflow | Current path efficiency | Target path | Delta |
|----------|------------------------|-------------|-------|
| Marketplace certification | **Good** — modules → submission → cert panel + readiness | Same; Marketplace top-level | **+1 click saved** (nav) |
| Search troubleshooting | **Poor** — probe buried in submission modal | Programs → Marketplace → probe OR Programs → Search card → modules filter | **Clearer discovery** |
| AI diagnostics | **Good** — ai-pipeline/diagnostics | Diagnostics nav → same page | **−1 hop** (remove ai-system) |
| Context Graph review | **Fair** — ai-pipeline/sources OR modules AI tab | Programs → Context Graph card → sources / AI tab | **Unified entry** |
| Provider configuration | **Fair** — ai-system or pipeline scroll | Providers nav → `#provider-governance` | **Direct** |
| Business billing probe | **Good** — readiness card | Same | Unchanged |
| User management | **Good** — users | Operations → users | Unchanged |
| Security incident | **Good** — security | Security | Unchanged |
| Stripe subscription sync | **Good** — billing | Billing | Unchanged |
| Platform health check | **Fair** — dashboard + system + performance | Overview → Programs hub → drill | **Clearer hierarchy** |

---

## 3. Detailed workflow maps

### 3.1 Marketplace certification

**Operator:** Platform admin certifying a partner module version.

**Current steps:**
1. Sidebar → Developer & Modules → Modules
2. Submissions tab → filter pending
3. Open submission modal
4. Review `ModuleCertificationReviewPanel`
5. Review `MarketplaceReadinessCard` (scope + four capabilities)
6. Run probes (optional): Search · Workspace · Billing · Activity
7. Approve/reject → promote version

**Pain points:**
- Probe results require network tab (AP0A-F03)
- AI Context tab separate from readiness delegates (AP-G09)
- Developers on separate nav section

**Target steps (same pages, better IA):**
1. Sidebar → **Marketplace → Modules**
2. Steps 2–7 unchanged

**Efficiency verdict:** **Supported.** IA change is discoverability only.

---

### 3.2 Search troubleshooting (Unified Search + Search Delegate)

**Operator:** Verify partner search delegate registration and live probe.

**Current steps:**
1. Remember modules page exists
2. Find module submission/detail
3. Readiness card → Search delegate status
4. Click Search probe (`?live=true` via API)

**Pain points:**
- No top-level "Search" concept
- No aggregate search health dashboard (intentionally not built in 1A)
- Feature flags not visible in UI

**Target steps:**
1. Sidebar → **Platform Programs**
2. **Unified Search** card → status summary (from existing readiness API aggregated in hub — **read-only federation, Phase 1B**)
3. Deep link → **Marketplace → Modules** (module filtered) OR probe doc link
4. Run probe on readiness card (unchanged)

**Efficiency verdict:** **Improves discovery** without new diagnostics.

---

### 3.3 AI diagnostics (AI Retrieval)

**Operator:** Investigate failed retrieval / grounding on a trace.

**Current steps:**
1. AI → AI Pipeline OR AI System → AI Pipeline card
2. Diagnostics sub-page OR Live Activity → trace
3. Evidence viewer → retrieval tab

**Pain points:**
- AI System adds optional hop
- ai-context redirect exists but unknown to operators

**Target steps:**
1. Sidebar → **Diagnostics → Diagnostics** (ai-pipeline/diagnostics)
2. Steps 2–3 unchanged

**Alternate:** AI Pipeline → Live Activity (for hub-first operators)

**Efficiency verdict:** **Supported.** Remove AI System nav.

---

### 3.4 Context Graph review

**Operator:** Validate context sources and module provider registration.

**Current steps (two valid paths):**
- **Path A:** AI Pipeline → Sources (platform policy view)
- **Path B:** Modules → AI Context tab (per-module providers)

**Pain points:**
- No labeled "Context Graph" entry
- Two paths not cross-linked

**Target steps:**
1. Platform Programs → **Context Graph** card
2. Choose **Platform sources** → `ai-pipeline/sources`
3. Or **Module providers** → `modules` (AI Context tab)

**Efficiency verdict:** **Supported** via Programs hub links — no merge of A and B (different concerns).

---

### 3.5 Provider configuration

**Operator:** Review OpenAI/Anthropic usage, expenses, official API health.

**Current steps:**
1. AI System → Provider card OR AI Pipeline scroll to provider section
2. `ProviderGovernancePanel` + satellite `/api/admin/ai-providers`

**Target steps:**
1. Sidebar → **Providers** (hash link to existing panel)
2. Same panel

**Efficiency verdict:** **Improved** — one nav target.

---

### 3.6 Business billing (partner module entitlement)

**Operator:** Verify paid module entitlement for a business.

**Current steps:**
1. Modules → submission/readiness → Billing probe

**Target steps:**
1. Platform Programs → **Marketplace Partner Runtime** card → Modules
2. Readiness → Billing probe

**Efficiency verdict:** **Supported.**

---

### 3.7 User management & impersonation

**Operator:** Suspend user or impersonate for support.

**Current steps:**
1. Operations → Users (action) OR Admin Labs → Impersonation

**Target steps:**
1. Operations → Users / Impersonation (same section, clearer label)

**Efficiency verdict:** **Supported.**

---

### 3.8 Security incident response

**Operator:** Triage and resolve security event.

**Current steps:**
1. Platform → Security
2. Events tab → resolve → export if needed

**Cross-links (target):**
- AI Pipeline audit → Security (related policy violations)

**Efficiency verdict:** **Supported.**

---

### 3.9 Commercial operations

**Operator:** Sync Stripe subscription, adjust pricing tier.

**Current steps:**
1. Commercial → Billing / Pricing

**Target steps:**
1. Billing → Financial Management / Pricing

**Efficiency verdict:** **Supported** — rename section only.

---

### 3.10 Platform Kernel / system health

**Operator:** Check migrations, system config, performance.

**Current steps:**
1. Platform → System / Performance / Dashboard

**Target steps:**
1. Platform Programs → **Platform Kernel** card → System + Performance links
2. Overview dashboard for summary

**Efficiency verdict:** **Supported** via federation links.

---

## 4. Workflow → domain matrix

| Workflow | Primary domain | Secondary domain | Canonical page |
|----------|----------------|------------------|----------------|
| Marketplace certification | Marketplace | Platform Programs | `modules` |
| Search troubleshooting | Platform Programs | Marketplace | readiness + probe |
| AI diagnostics | Diagnostics | AI | `ai-pipeline/diagnostics` |
| Context Graph review | Platform Programs | AI / Marketplace | `sources` + modules AI tab |
| Provider configuration | Providers | AI | `ai-pipeline#provider-governance` |
| Business billing probe | Marketplace | Billing | readiness card |
| User management | Operations | — | `users` |
| Impersonation | Operations | — | `impersonate` |
| Security incident | Security | — | `security` |
| Subscription sync | Billing | — | `billing` |
| Pricing change | Billing | — | `pricing` |
| Retention policy | Configuration | — | `retention` |
| Module AI registration | Marketplace | Platform Programs | modules AI Context tab |

---

## 5. Navigation friction summary

| Friction | Severity | IA fix |
|----------|----------|--------|
| AI System redundant launcher | Medium | Merge into Programs hub |
| Search ops invisible at top level | Medium | Programs card |
| 7 items under Platform section | Medium | Split to Configuration + Diagnostics |
| Probe feedback weak | Low | UX 1B — not IA |
| modules page density | Low | Tab split 1B — not IA |
| 12 orphan debug URLs | Low | Hide under Labs |

---

## 6. Recommended workflow-first nav order

Order sidebar by **frequency × criticality** (operator research inferred from Phase 0A):

1. Overview
2. Platform Programs
3. Marketplace
4. Operations (Users, Support)
5. Diagnostics
6. AI Pipeline
7. Security
8. Billing
9. Providers
10. Configuration
11. Operator Labs (collapsed)

---

**Last updated:** 2026-06-24 (Phase 1A design)
