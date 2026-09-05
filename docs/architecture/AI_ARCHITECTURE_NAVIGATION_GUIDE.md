# AI Architecture Navigation Guide

**Program:** Architecture Governance — Phase 1E (AI tree updated Phase 0 — 2026-07-12)  
**Date:** 2026-07-12  
**Status:** Active — for AI assistants and new contributors  
**Entry point:** [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md)  
**AI reading order:** [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md)

---

## Purpose

Reduce repeated architectural discovery during AI-assisted development. Follow the decision trees below to reach the **canonical** document for each task type.

**Rule:** Read SoT documents first. Do not infer architecture from code alone when a constitutional doc exists.

---

## Selective agent startup

Do **not** universally read `memory-bank/activeContext.md` or `progress.md` on every task.

Default discovery (all domains):

```
1. AGENTS.md  ← orientation only; not architecture law
2. docs/VSSYL_SOURCE_OF_TRUTH.md
3. Inspect actual task-relevant code
4. docs/architecture/VSSYL_ARCHITECTURE_INDEX.md  ← find domain owner
5. Relevant scoped .cursor/rules
6. Task-relevant Memory Bank product context only if needed
7. activeContext.md / progress.md only when workstream status/history is material
8. ARCHITECTURE_SOURCE_OF_TRUTH.md  ← before editing architecture docs
9. CERTIFICATION_LEDGER.md  ← when cert level matters
```

### AI work — discovery chain

For AI / Digital Life Twin tasks, follow this order before older AI plans or Memory Bank AI narratives:

```
1. AGENTS.md
2. docs/VSSYL_SOURCE_OF_TRUTH.md
3. Inspect relevant AI implementation (server/src/ai/**, routes, tests)
4. docs/architecture/AI_SYSTEM_MENTAL_MODEL.md
5. docs/architecture/AI_READING_GUIDE.md
6. docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md  ← Current / Supporting / Historical / Future
7. Task-relevant canonical AI subsystem documents (per matrix + trees below)
8. Targeted Memory Bank / status context only if product intent or workstream status is material
```

[`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) controls whether an older AI document is Current, Supporting, Historical, Future/design-only, or otherwise noncanonical. Do not treat the historical [`docs/archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md`](../archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md) as current architecture or strategic AI roadmap authority.

---

## Dashboard work

```
Dashboard task
    ↓
Is it widget grid / widget registry / dashboard CRUD?
    YES → docs/dashboard/DASHBOARD_STATUS_RECORD.md
        → docs/dashboard/DASHBOARD_OPERATION_MATRIX.md
        → memory-bank/dashboardProductContext.md (product intent)
    NO → Is it shell tabs / personal routing?
        YES → docs/architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md
            → docs/workspace/WORKSPACE_CERTIFICATION_RECORD.md
    NO → Is it business hub panel?
        YES → docs/architecture/audits/BUSINESS_WORKSPACE_OPERATION_MATRIX.md
            → docs/architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md
    ↓
Shell vs module boundary (always read if unsure)
    → docs/workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md
    ↓
Application install vs dashboard assignment
    → docs/architecture/APPLICATION_LIFECYCLE.md
```

---

## Workspace & navigation work

```
Navigation / workspace / shell task
    ↓
docs/architecture/NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md  (executive)
    ↓
Personal routing → PERSONAL_DASHBOARD_ROUTING_CONTRACT.md
Business routing → WORKSPACE_ROUTING_CONTRACT.md
Cross-surface    → CROSS_SURFACE_TRANSITIONS.md
Platform chrome  → REFERENCE_WORKSPACE_PLATFORM_SHELL.md
UX patterns      → docs/ux/patterns/NAVIGATION_PATTERNS.md
                 → docs/ux/patterns/WORKSPACE_PATTERNS.md
Code SSOT        → web/src/lib/*Navigation.ts
```

---

## AI work

```
AI task
    ↓
Follow “AI work — discovery chain” above first
    (mental model → reading guide → status matrix → then subsystem docs)
    ↓
Need whole-system understanding / onboarding?
    YES → docs/architecture/AI_READING_GUIDE.md
        → docs/architecture/AI_SYSTEM_MENTAL_MODEL.md
        → docs/architecture/AI_INTELLIGENCE_MODEL.md
        → docs/ai-system-audit/README.md  (official analysis; check matrix)
    ↓
Changing AI platform behavior or boundaries?
    YES → docs/architecture/AI_PLATFORM_CONSTITUTION.md  (law first)
        → docs/architecture/AI_ARCHITECTURE_DECISION_RECORDS.md
    ↓
Platform governance → docs/architecture/AI_PLATFORM_CONSTITUTION.md
Overview / diagrams → docs/architecture/AI_PLATFORM_OVERVIEW.md
Digital Life Twin   → docs/architecture/AI_TWIN_PROMPT_PIPELINE.md
Context providers   → docs/architecture/AI_CONTEXT_ASSEMBLY.md
                      → docs/guides/AI_CONTEXT_PROVIDER_API.md
Product philosophy  → memory-bank/aiProductPhilosophy.md (product intent; not architecture SoT)
Business/personal   → docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md
Knowledge ingress   → docs/ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md
Knowledge law       → docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md
AI retrieval        → docs/ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md
Providers / vision  → docs/ai/PROVIDERS.md (Twin path; see audit for exemptions)
Admin diagnostics   → docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md
UX patterns         → docs/ux/patterns/AI_EXPERIENCE_PATTERNS.md
Route SSOT          → web/src/lib/aiExperienceNavigation.ts
Doc status / terms  → docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md
Onboarding textbook → docs/architecture/AI_SYSTEM_TEXTBOOK.md
Historical deep-dive → docs/ai-knowledge/deep-dive/ (HISTORICAL — prefer audit)
Observation / ops / routing → docs/architecture/AI_READING_GUIDE.md
        (Phases 5–5B observation, 6–6B evaluation/certification, 7 shadow routing)
        → AI_RUNTIME_OBSERVATION_ARCHITECTURE.md · AI_PHASE6_CLOSEOUT.md
        → AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md · AI_MODEL_ROUTER_ARCHITECTURE.md
```

---

## Search & discovery work

```
Search task
    ↓
docs/search/SEARCH_CONSTITUTION.md  (constitutional — always first)
    ↓
ADR              → docs/architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md
Providers        → docs/architecture/SEARCH_PROVIDER_MODEL.md
Operation matrix → docs/search/UNIFIED_SEARCH_OPERATION_MATRIX.md
Partner delegates→ docs/guides/SEARCH_DELEGATE_GUIDE.md

⚠️ Do NOT use memory-bank/globalSearchProductContext.md (redirect stub; superseded — SEARCH_CONSTITUTION)
```

---

## Drive / File Hub work

```
Drive / File Hub task
    ↓
docs/architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md  (L4 ref)
    ↓
Operation matrix → FILE_HUB_OPERATION_MATRIX.md
Pattern catalog  → docs/guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md
Product intent   → memory-bank/driveProductContext.md
Workspace mount  → NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md §8
Application layer→ APPLICATION_LIFECYCLE.md
```

---

## Calendar work

```
Calendar task
    ↓
docs/architecture/audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md
    ↓
Operation matrix → CALENDAR_OPERATION_MATRIX.md
UX reference     → docs/ux/audits/REFERENCE_MODULE_CALENDAR.md
Product intent   → memory-bank/calendarProductContext.md
Workspace        → docs/ux/patterns/WORKSPACE_PATTERNS.md (UX-PAT-WS-004)
Navigation       → docs/ux/patterns/NAVIGATION_PATTERNS.md (UX-PAT-NAV-006)
```

---

## Chat work

```
Chat task
    ↓
docs/architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md
    ↓
Operation matrix → CHAT_OPERATION_MATRIX.md
Reference review → docs/architecture/CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md
Product intent   → memory-bank/chatProductContext.md
Realtime patterns→ Platform Standards §3 (no standalone realtime SoT yet)
```

---

## Marketplace / third-party module work

```
Marketplace / partner module task
    ↓
docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md
    ↓
Developer guide  → THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md
Module dev guide → MODULE_DEVELOPMENT_GUIDE.md
Interop contract → memory-bank/moduleSpecs.md
Certification    → docs/marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md
Search delegates → docs/marketplace/SEARCH_DELEGATE_ARCHITECTURE.md
```

---

## Business Operations work

```
HR / Scheduling / Workforce Comms task
    ↓
docs/business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md
    ↓
Per-module matrix → docs/architecture/audits/[HR|SCHEDULING|WORKFORCE]_OPERATION_MATRIX.md
Business admin    → docs/business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md
Workspace mount   → BUSINESS_WORKSPACE_OPERATION_MATRIX.md
```

---

## Admin Portal / Platform Controller work

```
Admin / operator task
    ↓
docs/architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md
    ↓
Operation matrix → ADMIN_PORTAL_OPERATION_MATRIX.md
Platform Controller IA → docs/platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md
Operator how-to  → docs/guides/ADMIN_PORTAL.md

Admin AI operator (canonical shell = AI Pipeline Hub)
    ↓
AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md
AI_ADMIN_SURFACE_CONSOLIDATION_MATRIX.md
AI_PIPELINE_OPERATOR_RBAC.md
API (intelligence workflows) → AI_OPERATIONS_CENTER_API.md  (/api/admin/ai/operations)
UI → /admin-portal/ai-pipeline/*  (NOT /admin-portal/ai/operations — redirects only)
```

---

## UX / design system work

```
UX / UI task
    ↓
docs/ux/UX_CONSTITUTION.md
    ↓
Tokens           → docs/ux/DESIGN_TOKENS.md
Layout patterns  → docs/ux/LAYOUT_PATTERNS.md
Pattern catalog  → docs/ux/UX_REFERENCE_PATTERN_CATALOG.md
Module UX cert   → docs/ux/audits/REFERENCE_MODULE_*.md
```

---

## Platform kernel / cross-cutting work

```
Platform kernel task
    ↓
docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md
    ↓
Policy Engine    → POLICY_ENGINE.md
Domain Events    → DOMAIN_EVENTS.md
V_Link           → V_LINK.md
Context Graph    → docs/context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md
Certification    → CERTIFICATION_LEDGER.md
```

---

## What NOT to read (common mistakes)

| Avoid | Read instead |
|-------|--------------|
| `memory-bank/globalSearchProductContext.md` | `docs/search/SEARCH_CONSTITUTION.md` |
| `platform-portfolio/PLATFORM_PORTFOLIO_DOMAIN_MAP.md` | `ARCHITECTURE_DOMAIN_MAP.md` |
| `platform-portfolio/PLATFORM_CERTIFICATION_STATUS_2026.md` | `CERTIFICATION_LEDGER.md` |
| `guides/AI_SYSTEM_ARCHITECTURE_MAP.md` (legacy names) | `AI_PLATFORM_OVERVIEW.md` |
| Archived `AI_PLATFORM_PHASED_PLAN.md` as current AI SoT | `AI_SYSTEM_MENTAL_MODEL.md` → `AI_READING_GUIDE.md` → `AI_DOCUMENT_STATUS_MATRIX.md` |
| Inventing navigation rules | `NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md` |

---

## Editing architecture docs

```
Before editing any architecture document
    ↓
ARCHITECTURE_SOURCE_OF_TRUTH.md  → confirm you have the SoT
    ↓
ARCHITECTURE_DOCUMENT_STANDARD.md  → use template for new docs
    ↓
Update ARCHITECTURE_SOURCE_OF_TRUTH.md if creating new SoT
```

---

**Last updated:** 2026-09-03 (Batch 0.5 — selective agent startup; AI discovery chain)
