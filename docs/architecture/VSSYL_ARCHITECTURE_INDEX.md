# Vssyl Architecture Index

**Program:** Architecture Consolidation — Phase 0A
**Date:** 2026-06-29 (AI section updated 2026-08-25 — Digital Life Twin documentation reconciliation)
**Status:** Canonical entry point — **supersedes informal navigation via scattered READMEs**
**Audience:** Engineers, architects, AI agents, program owners

> **Start here.** This index answers: *"Where is the source of truth for this topic?"*
> For ownership rules, see [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md).
> For domain topology, see [`ARCHITECTURE_DOMAIN_MAP.md`](./ARCHITECTURE_DOMAIN_MAP.md).
> For health and consolidation backlog, see [`ARCHITECTURE_HEALTH_REPORT.md`](./ARCHITECTURE_HEALTH_REPORT.md).

---

## Authority hierarchy

Read documents in this order when resolving conflicts:

| Priority | Source | Role |
|----------|--------|------|
| 1 | **GitHub repo** | Implementation truth |
| 2 | [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md) | Placement and hierarchy |
| 3 | **Constitutional docs** | Permanent platform law |
| 4 | [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) | Certification status (dated) |
| 5 | **Domain status records** | Program posture per domain |
| 6 | [`memory-bank/`](../memory-bank/) | Product intent (may lag docs) |
| 7 | [`docs/guides/`](../guides/) | How-to (not architecture truth) |

**Constitutional documents (peer tier):**

- [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) — Platform Kernel + module contract
- [`UX_CONSTITUTION.md`](../ux/UX_CONSTITUTION.md) — Design system law
- [`SEARCH_CONSTITUTION.md`](../search/SEARCH_CONSTITUTION.md) — Unified Search law
- [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) — AI platform law
- [`AI_RETRIEVAL_CONSTITUTION.md`](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) — AI retrieval law
- [`KNOWLEDGE_CONSTITUTION.md`](../connected-knowledge/KNOWLEDGE_CONSTITUTION.md) — Connected Knowledge law (pre-implementation)

---

## Quick navigation — by concern

| I need to understand… | Go to |
|------------------------|-------|
| Overall platform law | [Platform Kernel](#1-platform) |
| Where users navigate | [Navigation & Workspace](#2-navigation--workspace) |
| How apps install and appear | [Applications & Marketplace](#3-applications--marketplace) |
| AI and Digital Life Twin | [AI Platform](#4-ai-platform) |
| Finding content | [Search & Discovery](#5-search--discovery) |
| A specific product module | [Product Modules](#6-product-modules) |
| Business vs personal surfaces | [Business & Personal](#7-business--personal) |
| Admin / operator tools | [Admin & Control Plane](#8-admin--control-plane) |
| Visual design rules | [Design System](#9-design-system) |
| Deployment and infra | [Infrastructure](#10-infrastructure) |
| Partner / third-party modules | [Developer Platform](#11-developer-platform) |
| Certification status | [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) |
| What's certified vs planned | [`ARCHITECTURE_DOMAIN_MAP.md`](./ARCHITECTURE_DOMAIN_MAP.md) |

---

## Architecture book — top-level chapters

```
Platform Kernel & Capabilities
    ↓
Navigation & Workspace Shells
    ↓
Applications & Lifecycle
    ↓
AI & Knowledge
    ↓
Business Domain
    ↓
Infrastructure & Operations
    ↓
Developer Platform & Marketplace
```

---

## 1. Platform

Platform-wide constitutional framework, kernel capabilities, and cross-cutting systems.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Platform standards (master)** | [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | — | Active constitutional |
| **Certification ledger** | [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) | Meta | Updated 2026-06-24 |
| **Platform Kernel** | [`../platform-kernel/PLATFORM_KERNEL_STATUS_RECORD.md`](../platform-kernel/PLATFORM_KERNEL_STATUS_RECORD.md) | L2 CwF | Program archived |
| **Platform capability catalog** | [`PLATFORM_CAPABILITY_CATALOG.md`](./PLATFORM_CAPABILITY_CATALOG.md) | — | Active |
| **Policy Engine** | [`POLICY_ENGINE.md`](./POLICY_ENGINE.md) | L2 | Partial rollout |
| **Domain Events** | [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) | L2 CwF | Sub-score under kernel |
| **Module Activity** | [`../platform-kernel/PLATFORM_ACTIVITY_QUERY_MODEL.md`](../platform-kernel/PLATFORM_ACTIVITY_QUERY_MODEL.md) | L2 CwF | Sub-score under kernel |
| **Global Trash** | [`GLOBAL_TRASH.md`](./GLOBAL_TRASH.md) | L2 | Active |
| **V_Link** | [`V_LINK.md`](./V_LINK.md) | L2 | Active |
| **Platform Entity Model** | [`PLATFORM_ENTITY_MODEL.md`](./PLATFORM_ENTITY_MODEL.md) | — | Active |
| **Platform Job Registry** | [`PLATFORM_JOB_REGISTRY.md`](./PLATFORM_JOB_REGISTRY.md) | L1 | Inventory-first |
| **Context Graph** | [`../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md`](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md) | L4 CwF | Program archived |
| **Relationship Framework** | [`RELATIONSHIP_FRAMEWORK_INDEX.md`](./RELATIONSHIP_FRAMEWORK_INDEX.md) | — | Active index |
| **Reference Module Catalog** | [`REFERENCE_MODULE_CATALOG.md`](./REFERENCE_MODULE_CATALOG.md) | — | Active |
| **Platform Portfolio** | [`../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md`](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md) | — | Discovery complete |

**Supporting:** [`../platform-kernel/`](../platform-kernel/) · [`../context-graph/`](../context-graph/) · [`../platform-adoption/`](../platform-adoption/)

---

## 2. Navigation & Workspace

How users move between surfaces; shell orchestration vs module interiors.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Navigation (executive)** | [`NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md`](./NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md) | — | Phase 0A discovery |
| **Reference Workspace program** | [`../workspace/WORKSPACE_CERTIFICATION_RECORD.md`](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) | WS-L3 CwF | Program archived |
| **Platform Shell** | [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) | 3C-4E/4F | Complete |
| **Business routing contract** | [`WORKSPACE_ROUTING_CONTRACT.md`](./WORKSPACE_ROUTING_CONTRACT.md) | — | Authoritative |
| **Personal routing contract** | [`PERSONAL_DASHBOARD_ROUTING_CONTRACT.md`](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | — | Authoritative |
| **Cross-surface transitions** | [`CROSS_SURFACE_TRANSITIONS.md`](./CROSS_SURFACE_TRANSITIONS.md) | — | Authoritative |
| **Workspace ownership** | [`../workspace/WORKSPACE_OWNERSHIP_MODEL.md`](../workspace/WORKSPACE_OWNERSHIP_MODEL.md) | — | Governance record |
| **Workspace runtime** | [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | — | Active |
| **UX navigation patterns** | [`../ux/patterns/NAVIGATION_PATTERNS.md`](../ux/patterns/NAVIGATION_PATTERNS.md) | UX-PAT-NAV | Wave 6A standard |
| **UX workspace patterns** | [`../ux/patterns/WORKSPACE_PATTERNS.md`](../ux/patterns/WORKSPACE_PATTERNS.md) | UX-PAT-WS | Wave 6A standard |
| **PlatformShell UX cert** | [`../ux/audits/PLATFORMSHELL_CERTIFICATION.md`](../ux/audits/PLATFORMSHELL_CERTIFICATION.md) | PASS w/ findings | 2026-06-03 |

**Code SSOT:** `web/src/lib/personalDashboardNavigation.ts` · `businessWorkspaceNavigation.ts` · `crossSurfaceNavigation.ts`

**Supporting:** [`../workspace/`](../workspace/) · [`../workspace-review/`](../workspace-review/) (boundary analyses)

---

## 3. Applications & Marketplace

Install, configure, assign, and discover applications.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Application lifecycle** | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) | — | Active (2026-06-29) |
| **Module interoperability** | [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | — | Constitutional |
| **Marketplace partner pipeline** | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | L3 CwF | Active |
| **Marketplace status** | [`../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md`](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) | L3 CwF | Phase 1B-G complete |
| **Dashboard module** | [`../dashboard/DASHBOARD_STATUS_RECORD.md`](../dashboard/DASHBOARD_STATUS_RECORD.md) | L3 CwF | Program archived |
| **Dashboard / shell boundary** | [`../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md`](../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) | — | Classification C hybrid |

**Supporting:** [`../marketplace/`](../marketplace/) · [`../dashboard/`](../dashboard/) · [`../guides/MODULE_DEVELOPMENT_GUIDE.md`](../guides/MODULE_DEVELOPMENT_GUIDE.md)

---

## 4. AI Platform

Digital Life Twin, context system, retrieval, orchestration.

**Start here:** [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) · Mental model: [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md)

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **AI mental model** | [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) | — | Six-decision model; scopes; C3; contracts |
| **AI intelligence model** | [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) | — | Four scopes; Knowledge vs Intelligence |
| **AI reading / doc status** | [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) · [`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) | — | Phase 0 |
| **AI system audit (analysis)** | [`../ai-system-audit/README.md`](../ai-system-audit/README.md) | — | Official whole-system analysis |
| **AI architecture decisions** | [`AI_ARCHITECTURE_DECISION_RECORDS.md`](./AI_ARCHITECTURE_DECISION_RECORDS.md) | — | Accepted ADRs |
| **AI platform constitution** | [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) | — | Constitutional |
| **AI platform overview** | [`AI_PLATFORM_OVERVIEW.md`](./AI_PLATFORM_OVERVIEW.md) | L2 | L3 deferred |
| **AI platform certification (6B)** | [`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](./AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md) | CwF 86 | Phase 6B |
| **AI canonical Twin runtime map** | [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md) | — | Shipped Service→Core flow |
| **AI canonical diagram** | [`AI_PLATFORM_CANONICAL_DIAGRAM.md`](./AI_PLATFORM_CANONICAL_DIAGRAM.md) | — | Topology |
| **AI context assembly** | [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md) | — | Acquisition vs assembly; C3 |
| **External read capabilities** | [`AI_EXTERNAL_CAPABILITY_MODEL.md`](./AI_EXTERNAL_CAPABILITY_MODEL.md) | — | Canonical design; not shipped |
| **AI subsystem inventory** | [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](./AI_PLATFORM_SUBSYSTEM_INVENTORY.md) | — | Status + ownership |
| **Business / personal Twin boundaries** | [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) | — | Scopes; canonical path |
| **Model Routing readiness** | [`AI_MODEL_ROUTING_READINESS.md`](./AI_MODEL_ROUTING_READINESS.md) | — | Phase 7 prep (not shipped) |
| **AI knowledge constitution** | [`../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`](../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md) | — | Constitutional |
| **AI product philosophy** | [`../../memory-bank/aiProductPhilosophy.md`](../../memory-bank/aiProductPhilosophy.md) | — | Product intent (not architecture SoT) |
| **AI context providers** | [`../guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md), [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md) | [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | Integration **if AI-exposed** |
| **Digital Life Twin pipeline** | [`AI_TWIN_PROMPT_PIPELINE.md`](./AI_TWIN_PROMPT_PIPELINE.md) | — | Active |
| **AI retrieval constitution** | [`../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md`](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) | L2 CwF | Phase 2A governance |
| **AI experience navigation** | `web/src/lib/aiExperienceNavigation.ts` | — | Route SSOT |
| **Connected Knowledge** | [`../connected-knowledge/KNOWLEDGE_CONSTITUTION.md`](../connected-knowledge/KNOWLEDGE_CONSTITUTION.md) | — | Constitution only |
| **AI textbook (onboarding)** | [`AI_SYSTEM_TEXTBOOK.md`](./AI_SYSTEM_TEXTBOOK.md) | — | Internal reference |

**Supporting:** [`../ai/`](../ai/) · [`../ai-knowledge/`](../ai-knowledge/) · [`./ai-textbook/`](./ai-textbook/) · [`../plans/AI_PLATFORM_MATURITY_PLAN.md`](../plans/AI_PLATFORM_MATURITY_PLAN.md)

---

## 5. Search & Discovery

Unified Search and federated discovery infrastructure.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Search constitution** | [`../search/SEARCH_CONSTITUTION.md`](../search/SEARCH_CONSTITUTION.md) | L2 CwF | Ratified 2026-06-23 |
| **Search ADR** | [`SEARCH_ARCHITECTURE_DECISION_RECORD.md`](./SEARCH_ARCHITECTURE_DECISION_RECORD.md) | — | Active |
| **Search operation matrix** | [`../search/UNIFIED_SEARCH_OPERATION_MATRIX.md`](../search/UNIFIED_SEARCH_OPERATION_MATRIX.md) | — | Active |
| **Search provider model** | [`SEARCH_PROVIDER_MODEL.md`](./SEARCH_PROVIDER_MODEL.md) | — | Active |
| **Relationship search** | [`RELATIONSHIP_SEARCH_ARCHITECTURE.md`](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) | — | Active |

**⚠️ Stale:** [`../../memory-bank/globalSearchProductContext.md`](../../memory-bank/globalSearchProductContext.md) — redirect stub; use Search Constitution instead (body: `docs/archive/session-summaries/globalSearchProductContext.md`).

**Supporting:** [`../search/`](../search/) · [`../guides/SEARCH_DELEGATE_GUIDE.md`](../guides/SEARCH_DELEGATE_GUIDE.md)

---

## 6. Product Modules

User-facing modules — architecture truth in certification reviews and operation matrices.

| Module | Canonical document | Cert | Reference |
|--------|-------------------|------|-----------|
| **File Hub (Drive)** | [`audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) | **L4** | Arch #1 / UX #1 |
| **Chat** | [`audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) | L3 | Arch #2 |
| **Calendar** | [`audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) | L3 | Arch #3 / UX #5 |
| **Todo** | [`audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) | L3 | Arch #4 / UX #3 |
| **Notebook** | [`audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) | L3 | Composition module |
| **Place** | [`audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md) | L3 | Arch #5 |
| **Notifications** | [`../guides/NOTIFICATION_METADATA_GUIDE.md`](../guides/NOTIFICATION_METADATA_GUIDE.md) | L2 / UX #2 | Platform service |
| **Analytics** | [`../analytics/ANALYTICS_STATUS_RECORD.md`](../analytics/ANALYTICS_STATUS_RECORD.md) | L2 CwF | Platform capability |

**Pattern catalog:** [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

**Product intent:** [`../../memory-bank/*ProductContext.md`](../../memory-bank/) per module

---

## 7. Business & Personal

Business domain modules, administration, and account platform.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Business Operations** | [`../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md`](../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md) | L3 CwF | Program archived |
| **HR** | [`audits/HR_OPERATION_MATRIX.md`](./audits/HR_OPERATION_MATRIX.md) | L3 CwF | BO Ref Candidate #1 |
| **Scheduling** | [`audits/SCHEDULING_OPERATION_MATRIX.md`](./audits/SCHEDULING_OPERATION_MATRIX.md) | L3 CwF | BO Ref Candidate #6 |
| **Workforce Comms** | [`audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md`](./audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) | L3 CwF | BO Ref Candidate #7 |
| **Business Administration** | [`../business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md`](../business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md) | L3 | #OC-1/2/3 |
| **Account Platform** | [`../account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md`](../account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md) | L3 CwF | Program archived |
| **Place dual-surface** | [`PLACE_PATTERN_GUIDE.md`](./PLACE_PATTERN_GUIDE.md) | L3 | Consumer + publisher |
| **Place domain model** | [`PLACE_DOMAIN_MODEL.md`](./PLACE_DOMAIN_MODEL.md) | — | Locked |

**Supporting:** [`../business-operations/`](../business-operations/) · [`../business-administration/`](../business-administration/) · [`../account-platform/`](../account-platform/)

---

## 8. Admin & Control Plane

Operator-facing architecture.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Admin Portal** | [`audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md`](./audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md) | L3 | Program archived |
| **Platform Controller IA** | [`../platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md`](../platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) | — | Phase 1B complete |
| **Platform Controller nav** | [`../platform-controller/PLATFORM_CONTROLLER_NAVIGATION_MODEL.md`](../platform-controller/PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) | — | Implemented |
| **Admin operator guide** | [`../guides/ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md) | — | How-to |

**Supporting:** [`../admin-portal/`](../admin-portal/) · [`audits/ADMIN_PORTAL_*.md`](./audits/)

---

## 9. Design System

UX constitutional framework and reference program.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **UX Constitution** | [`../ux/UX_CONSTITUTION.md`](../ux/UX_CONSTITUTION.md) | — | Constitutional |
| **Design tokens** | [`../ux/DESIGN_TOKENS.md`](../ux/DESIGN_TOKENS.md) | — | Active |
| **Layout patterns** | [`../ux/LAYOUT_PATTERNS.md`](../ux/LAYOUT_PATTERNS.md) | — | Active |
| **UX Reference Program** | [`../ux/REFERENCE_MODULE_PROGRAM.md`](../ux/REFERENCE_MODULE_PROGRAM.md) | UX-L3 | #1–#5 registered |
| **UX pattern catalog** | [`../ux/UX_REFERENCE_PATTERN_CATALOG.md`](../ux/UX_REFERENCE_PATTERN_CATALOG.md) | — | Wave 6A |

**Supporting:** [`../ux/`](../ux/) · [`../ux/patterns/`](../ux/patterns/) · [`../ux/audits/`](../ux/audits/)

---

## 10. Infrastructure

Deployment, security posture, and operations.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Production deployment** | [`../deployment/PRODUCTION_DEPLOYMENT.md`](../deployment/PRODUCTION_DEPLOYMENT.md) | — | Active |
| **Google Cloud deployment** | [`../deployment/GOOGLE_CLOUD_DEPLOYMENT.md`](../deployment/GOOGLE_CLOUD_DEPLOYMENT.md) | — | Active |
| **Deployment context** | [`../../memory-bank/deployment.md`](../../memory-bank/deployment.md) | — | Product intent |
| **Security & compliance** | Platform Standards §27 + [`POLICY_ENGINE.md`](./POLICY_ENGINE.md); Admin product intent [`../../memory-bank/adminProductContext.md`](../../memory-bank/adminProductContext.md) | — | ⚠️ No dedicated security cert program (historical MB: [`../archive/session-summaries/securityComplianceSystem.md`](../archive/session-summaries/securityComplianceSystem.md)) |
| **Rollback runbook** | [`../deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`](../deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md) | — | Active |

**Supporting:** [`../deployment/`](../deployment/) · [`../setup/`](../setup/)

---

## 11. Developer Platform

Partner and first-party module development.

| Topic | Canonical document | Cert | Status |
|-------|-------------------|------|--------|
| **Third-party pipeline SoT** | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | L3 CwF | Active |
| **Module development guide** | [`../guides/MODULE_DEVELOPMENT_GUIDE.md`](../guides/MODULE_DEVELOPMENT_GUIDE.md) | — | Active |
| **Partner developer guide** | [`../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) | — | Active |
| **Sample manifests** | [`../test-modules/`](../test-modules/) | — | Reference |
| **Certification roadmap** | [`../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) | — | Master roadmap |

---

## 12. Go-to-Market & Commercial

Commercial readiness (not runtime architecture, but indexed for completeness).

| Topic | Canonical document | Status |
|-------|-------------------|--------|
| **GTM Phase 0A** | [`../go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md`](../go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md) | Discovery complete |
| **Production readiness** | [`../go-to-market/PRODUCTION_READINESS_INVENTORY.md`](../go-to-market/PRODUCTION_READINESS_INVENTORY.md) | Discovery |
| **Pricing review** | [`../go-to-market/PRICING_AND_COMMERCIAL_REVIEW.md`](../go-to-market/PRICING_AND_COMMERCIAL_REVIEW.md) | Discovery |

---

## Memory Bank — when to use

| Need | Read |
|------|------|
| Current focus / next steps | [`../../memory-bank/activeContext.md`](../../memory-bank/activeContext.md) |
| Implementation status | [`../../memory-bank/progress.md`](../../memory-bank/progress.md) |
| Product intent for a module | [`../../memory-bank/*ProductContext.md`](../../memory-bank/) |
| System-wide patterns | [`../../memory-bank/systemPatterns.md`](../../memory-bank/systemPatterns.md) |
| Database context | [`../../memory-bank/databaseContext.md`](../../memory-bank/databaseContext.md) |

**Rule:** Memory Bank = product intent. `docs/architecture/` = architectural truth. When they conflict, **stop and reconcile** per [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md).

---

## Plans, archives, and non-architecture docs

| Folder | Purpose | Index |
|--------|---------|-------|
| [`../plans/`](../plans/) | Future execution plans | [`../plans/README.md`](../plans/README.md) |
| [`../archive/`](../archive/) | Historical session summaries | [`../archive/README.md`](../archive/README.md) |
| [`../guides/`](../guides/) | How-to and onboarding | [`../guides/README.md`](../guides/README.md) |
| [`audits/`](./audits/) | Phase 0 constitutional audits | Per-module |
| `docs/reference/` | — | **Does not exist** |
| `docs/runbooks/` | — | **Does not exist** (scattered runbooks) |

---

## Agent quick-start (selective)

Root [`AGENTS.md`](../../AGENTS.md) is **orientation only** — not architecture authority. This index remains the canonical map of architecture ownership.

1. Read [`../../AGENTS.md`](../../AGENTS.md)
2. Read [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md)
3. Inspect the actual implementation involved in the task
4. Use **this Architecture Index** to identify the canonical architecture owner
5. Read relevant scoped [`.cursor/rules`](../../.cursor/rules/)
6. Load relevant Memory Bank product context only if product intent is needed
7. Read [`activeContext.md`](../../memory-bank/activeContext.md) / [`progress.md`](../../memory-bank/progress.md) only when current workstream status, recent history, sequencing, or unfinished work is material
8. Check [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) when certification status matters
9. Check [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) before editing any architecture doc

Do **not** treat `activeContext.md` or `progress.md` as universal baseline reads.

---

## Related consolidation deliverables

| Document | Purpose |
|----------|---------|
| [`ARCHITECTURE_DOMAIN_MAP.md`](./ARCHITECTURE_DOMAIN_MAP.md) | Visual domain ownership tree |
| [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) | SoT matrix + ownership register |
| [`ARCHITECTURE_HEALTH_REPORT.md`](./ARCHITECTURE_HEALTH_REPORT.md) | Health metrics (Phase 1H refreshed) |
| [`ARCHITECTURE_DOCUMENT_STANDARD.md`](./ARCHITECTURE_DOCUMENT_STANDARD.md) | Required template for new docs |
| [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md) | AI assistant decision trees |
| [`NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md`](./NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md) | Navigation Phase 0A discovery |

---

**Last updated:** 2026-09-03 (Batch 0.5 — selective agent quick-start)
