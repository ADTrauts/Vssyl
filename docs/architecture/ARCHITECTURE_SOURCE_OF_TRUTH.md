# Architecture Source of Truth

**Program:** Architecture Consolidation — Phase 0A  
**Date:** 2026-06-29  
**Status:** Canonical ownership registry — defines which document owns each architectural decision  
**Companion:** [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md) · [`ARCHITECTURE_DOMAIN_MAP.md`](./ARCHITECTURE_DOMAIN_MAP.md)

---

## How to use this document

Before creating or editing architecture documentation:

1. Find the topic in the matrix below.
2. Edit **only** the **Source of Truth** document for that topic.
3. Update **Supporting** documents only when they are explicitly designated as living companions.
4. Do **not** edit **Historical** or **Read-only** documents — add a new record or archive pointer instead.
5. For product intent changes, update the designated **Memory Bank** file — not architecture docs.

**Conflict resolution:** If repo code and a constitutional doc disagree, **stop** and reconcile before coding. If two docs disagree, the **Source of Truth** column wins. If SoT is blank or marked TBD, treat as **undecided** — do not invent truth in supporting docs.

---

## Global sources of truth

| Layer | Document | Edit policy |
|-------|----------|-------------|
| **Placement hierarchy** | [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md) | Architecture council / platform lead only |
| **Architecture index** | [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md) | Update when domains are added or SoT changes |
| **Certification status** | [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) | Update after council ratification or program closeout |
| **Module interop contract** | [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | Module platform team; PR review required |
| **Agent rules** | [`.cursor/rules/`](../../.cursor/rules/) | Short pointers only — link to long docs |
| **Implementation** | GitHub repo | Code is final runtime truth |

---

## Source of truth matrix

### Platform & Kernel

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Platform standards (constitutional)** | [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | [`PLATFORM_CAPABILITY_CATALOG.md`](./PLATFORM_CAPABILITY_CATALOG.md), [`.cursor/rules/platform-standards.mdc`](../../.cursor/rules/platform-standards.mdc) | [`GOVERNANCE_FOUNDATION_COMPLETE.md`](./GOVERNANCE_FOUNDATION_COMPLETE.md) | Audit closeouts in `audits/` |
| **Platform Kernel** | [`../platform-kernel/PLATFORM_KERNEL_STATUS_RECORD.md`](../platform-kernel/PLATFORM_KERNEL_STATUS_RECORD.md) | [`PLATFORM_KERNEL_CERTIFICATION_RECORD.md`](../platform-kernel/PLATFORM_KERNEL_CERTIFICATION_RECORD.md), [`DOMAIN_EVENT_OPERATION_MATRIX.md`](../platform-kernel/DOMAIN_EVENT_OPERATION_MATRIX.md) | [`PLATFORM_KERNEL_PROGRAM_ARCHIVE.md`](../platform-kernel/PLATFORM_KERNEL_PROGRAM_ARCHIVE.md) | Wave closeouts |
| **Policy Engine** | [`POLICY_ENGINE.md`](./POLICY_ENGINE.md) | [`.cursor/rules/policy-engine.mdc`](../../.cursor/rules/policy-engine.mdc), Platform Standards §4 | Phase 0 audits | — |
| **Domain Events** | [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) | [`../platform-kernel/DOMAIN_EVENT_OPERATION_MATRIX.md`](../platform-kernel/DOMAIN_EVENT_OPERATION_MATRIX.md), [`.cursor/rules/domain-events.mdc`](../../.cursor/rules/domain-events.mdc) | Phase 2C–2D closeouts | — |
| **Module Activity** | Platform Standards §3 + [`../platform-kernel/PLATFORM_ACTIVITY_QUERY_MODEL.md`](../platform-kernel/PLATFORM_ACTIVITY_QUERY_MODEL.md) | [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | — | Analytics-derived views |
| **Global Trash** | [`GLOBAL_TRASH.md`](./GLOBAL_TRASH.md) | Platform Standards §7, File Hub trash handler docs | — | — |
| **V_Link** | [`V_LINK.md`](./V_LINK.md) | [`RELATIONSHIP_FRAMEWORK_INDEX.md`](./RELATIONSHIP_FRAMEWORK_INDEX.md), Platform Standards §5 | [`../plans/V_LINK_PLATFORM_LAYER_PLAN.md`](../plans/V_LINK_PLATFORM_LAYER_PLAN.md) | — |
| **Platform Entity Model** | [`PLATFORM_ENTITY_MODEL.md`](./PLATFORM_ENTITY_MODEL.md) | Platform Standards §21 | — | — |
| **Platform Job Scheduler** | [`PLATFORM_JOB_REGISTRY.md`](./PLATFORM_JOB_REGISTRY.md) | Platform Standards §22 | — | — |
| **Context Graph** | [`../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md`](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md) | [`CONTEXT_GRAPH_CHARTER.md`](../context-graph/CONTEXT_GRAPH_CHARTER.md), [`CONTEXT_GRAPH_OPERATION_MATRIX.md`](../context-graph/CONTEXT_GRAPH_OPERATION_MATRIX.md) | [`CONTEXT_GRAPH_PROGRAM_ARCHIVE.md`](../context-graph/CONTEXT_GRAPH_PROGRAM_ARCHIVE.md) | Phase closeouts |
| **Relationship Framework** | [`RELATIONSHIP_FRAMEWORK_INDEX.md`](./RELATIONSHIP_FRAMEWORK_INDEX.md) | Taxonomy, hydration, search architecture docs | Reconciliation closeouts | — |
| **Certification levels** | [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) | [`../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) | Portfolio refresh snapshots | Individual audit drafts |
| **Reference modules (arch)** | [`REFERENCE_MODULE_CATALOG.md`](./REFERENCE_MODULE_CATALOG.md) | Per-module L3 certification reviews | Council review minutes | — |

### Navigation & Workspace

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Navigation philosophy** | [`NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md`](./NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md) | [`../ux/patterns/NAVIGATION_PATTERNS.md`](../ux/patterns/NAVIGATION_PATTERNS.md), `*Navigation.ts` code | — | UX audit scorecards |
| **Reference Workspace program** | [`../workspace/WORKSPACE_CERTIFICATION_RECORD.md`](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) | [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md), [`../workspace/WORKSPACE_OWNERSHIP_MODEL.md`](../workspace/WORKSPACE_OWNERSHIP_MODEL.md) | [`WORKSPACE_PROGRAM_ARCHIVE.md`](../workspace/WORKSPACE_PROGRAM_ARCHIVE.md) | QA execution reports |
| **Platform Shell** | [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) §2.4 | [`../ux/audits/PLATFORMSHELL_CERTIFICATION.md`](../ux/audits/PLATFORMSHELL_CERTIFICATION.md), [`../ux/PLATFORMSHELL_STANDARDIZATION_PLAN.md`](../ux/PLATFORMSHELL_STANDARDIZATION_PLAN.md) | 3C wave closeouts | — |
| **Business workspace routing** | [`WORKSPACE_ROUTING_CONTRACT.md`](./WORKSPACE_ROUTING_CONTRACT.md) | `businessWorkspaceNavigation.ts`, `businessWorkspaceContracts.ts` | Wave 1A–1D closeouts | — |
| **Personal dashboard routing** | [`PERSONAL_DASHBOARD_ROUTING_CONTRACT.md`](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | `personalDashboardNavigation.ts`, [`PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) | Wave 2A–2D closeouts | — |
| **Cross-surface transitions** | [`CROSS_SURFACE_TRANSITIONS.md`](./CROSS_SURFACE_TRANSITIONS.md) | `crossSurfaceNavigation.ts` | Part 2H QA evidence | — |
| **Workspace runtime** | [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | [`.cursor/rules/workspace-runtime.mdc`](../../.cursor/rules/workspace-runtime.mdc) | — | — |
| **Dashboard shell vs module boundary** | [`../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md`](../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) | [`../workspace/WORKSPACE_OWNERSHIP_MODEL.md`](../workspace/WORKSPACE_OWNERSHIP_MODEL.md) | — | — |
| **UX workspace patterns** | [`../ux/patterns/WORKSPACE_PATTERNS.md`](../ux/patterns/WORKSPACE_PATTERNS.md) | [`../ux/LAYOUT_PATTERNS.md`](../ux/LAYOUT_PATTERNS.md) | UX wave closeouts | — |

### Applications & Marketplace

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Application lifecycle** | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) | `shared/src/types/applicationLifecycle.ts`, `web/src/lib/applicationLifecycle.ts` | — | Marketplace phase summaries |
| **Module classification** | `shared/src/types/moduleClassification.ts` | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) | — | — |
| **Module interop** | [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | [`.cursor/rules/module-interoperability.mdc`](../../.cursor/rules/module-interoperability.mdc) | — | — |
| **Third-party pipeline** | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | [`../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md), [`../guides/THIRD_PARTY_MODULE_RULEBOOK.md`](../guides/THIRD_PARTY_MODULE_RULEBOOK.md) | Marketplace phase closeouts | — |
| **Marketplace partner runtime** | [`../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md`](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) | [`../marketplace/MARKETPLACE_REALITY_ASSESSMENT.md`](../marketplace/MARKETPLACE_REALITY_ASSESSMENT.md) | Phase 1A–1B closeouts | — |
| **Dashboard module product** | [`../dashboard/DASHBOARD_STATUS_RECORD.md`](../dashboard/DASHBOARD_STATUS_RECORD.md) | [`../dashboard/DASHBOARD_OPERATION_MATRIX.md`](../dashboard/DASHBOARD_OPERATION_MATRIX.md), [`memory-bank/dashboardProductContext.md`](../../memory-bank/dashboardProductContext.md) | [`DASHBOARD_PROGRAM_ARCHIVE.md`](../dashboard/DASHBOARD_PROGRAM_ARCHIVE.md) | Package implementation reports |
| **Dashboard membership SoT** | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) §membership | `dashboard.preferences.selectedModuleIds` (code) | — | — |
| **Module development how-to** | [`../guides/MODULE_DEVELOPMENT_GUIDE.md`](../guides/MODULE_DEVELOPMENT_GUIDE.md) | [`.cursor/rules/module-development.mdc`](../../.cursor/rules/module-development.mdc) | — | — |
| **File Hub patterns (implementation)** | [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) | [`audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) | FH wave closeouts | — |

### AI & Knowledge

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **AI mental model (plain English)** | [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) | [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) | — | — |
| **AI intelligence scopes** | [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) | Mental Model | Industry packs (future only) | — |
| **AI document status / terminology** | [`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) | Reading Guide, Nav Guide | — | — |
| **AI whole-system analysis** | [`../ai-system-audit/README.md`](../ai-system-audit/README.md) | Audit package docs | [`../ai-knowledge/deep-dive/`](../ai-knowledge/deep-dive/) | Do not fork parallel inventories |
| **AI accepted architecture decisions** | [`AI_ARCHITECTURE_DECISION_RECORDS.md`](./AI_ARCHITECTURE_DECISION_RECORDS.md) | [`../ai-system-audit/AI_ARCHITECTURE_DECISION_REGISTER.md`](../ai-system-audit/AI_ARCHITECTURE_DECISION_REGISTER.md), [`AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md`](./AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md) | — | — |
| **AI platform (constitutional)** | [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) | [`AI_PLATFORM_OVERVIEW.md`](./AI_PLATFORM_OVERVIEW.md), Platform Standards §6 | L2 certification review | — |
| **AI knowledge (constitutional)** | [`../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`](../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md) | Decision Model, Transition Model, Engine Spec | deep-dive set | — |
| **AI knowledge ingress philosophy** | [`../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md`](../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md) | Transition Model, Observation matrix | — | — |
| **AI context providers** | [`memory-bank/aiContextSystem.md`](../../memory-bank/aiContextSystem.md) | [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md), module manifests | — | — |
| **Digital Life Twin pipeline** | [`AI_TWIN_PROMPT_PIPELINE.md`](./AI_TWIN_PROMPT_PIPELINE.md) | [`AI_CONVERSATION_REASONING.md`](./AI_CONVERSATION_REASONING.md) | — | — |
| **AI business/personal boundaries** | [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) | Intelligence Model (Business scope) | — | — |
| **AI retrieval (constitutional)** | [`../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md`](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) | [`../ai/retrieval/AI_RETRIEVAL_OPERATION_MATRIX.md`](../ai/retrieval/AI_RETRIEVAL_OPERATION_MATRIX.md) | Phase 2A closeout | — |
| **AI experience routes** | `web/src/lib/aiExperienceNavigation.ts` | [`../ux/patterns/AI_EXPERIENCE_PATTERNS.md`](../ux/patterns/AI_EXPERIENCE_PATTERNS.md) | — | — |
| **Connected Knowledge** | [`../connected-knowledge/KNOWLEDGE_CONSTITUTION.md`](../connected-knowledge/KNOWLEDGE_CONSTITUTION.md) | Provenance, trust, consumption docs in same folder | Phase 0A summaries | — |
| **AI onboarding textbook** | [`AI_SYSTEM_TEXTBOOK.md`](./AI_SYSTEM_TEXTBOOK.md) | [`ai-textbook/`](./ai-textbook/) chapters | — | — |
| **Task-tier model routing (design)** | — (not shipped) | [`../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md`](../ai-system-audit/AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md) | — | Do not treat as runtime SoT |

### Search & Discovery

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Unified Search (constitutional)** | [`../search/SEARCH_CONSTITUTION.md`](../search/SEARCH_CONSTITUTION.md) | [`SEARCH_ARCHITECTURE_DECISION_RECORD.md`](./SEARCH_ARCHITECTURE_DECISION_RECORD.md), [`../search/UNIFIED_SEARCH_OPERATION_MATRIX.md`](../search/UNIFIED_SEARCH_OPERATION_MATRIX.md) | Phase 0A/1A closeouts | — |
| **Search providers** | [`SEARCH_PROVIDER_MODEL.md`](./SEARCH_PROVIDER_MODEL.md) | [`../search/SEARCH_PLATFORM_STANDARD.md`](../search/SEARCH_PLATFORM_STANDARD.md), [`../guides/SEARCH_DELEGATE_GUIDE.md`](../guides/SEARCH_DELEGATE_GUIDE.md) | — | — |
| **Search permissions** | [`SEARCH_PERMISSION_MODEL.md`](./SEARCH_PERMISSION_MODEL.md) | Search Constitution G-S1–G-S8 | — | — |
| **Relationship search** | [`RELATIONSHIP_SEARCH_ARCHITECTURE.md`](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) | Tag search guidelines | — | — |
| **Search product intent** | ⚠️ **Migrate to** Search Constitution | [`memory-bank/globalSearchProductContext.md`](../../memory-bank/globalSearchProductContext.md) | — | Do not extend Memory Bank file |

### Product Modules

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **File Hub (Drive)** | [`audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) | [`audits/FILE_HUB_OPERATION_MATRIX.md`](./audits/FILE_HUB_OPERATION_MATRIX.md), [`memory-bank/driveProductContext.md`](../../memory-bank/driveProductContext.md) | FH wave closeouts | — |
| **Chat** | [`audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) | [`audits/CHAT_OPERATION_MATRIX.md`](./audits/CHAT_OPERATION_MATRIX.md), [`memory-bank/chatProductContext.md`](../../memory-bank/chatProductContext.md) | Service extraction plan | — |
| **Calendar** | [`audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) | [`audits/CALENDAR_OPERATION_MATRIX.md`](./audits/CALENDAR_OPERATION_MATRIX.md), [`memory-bank/calendarProductContext.md`](../../memory-bank/calendarProductContext.md) | UX batch closeouts | — |
| **Todo** | [`audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) | [`audits/TODO_OPERATION_MATRIX.md`](./audits/TODO_OPERATION_MATRIX.md), [`memory-bank/todoProductContext.md`](../../memory-bank/todoProductContext.md) | — | — |
| **Notebook** | [`audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) | [`NOTEBOOK_WORKSPACE_ARCHITECTURE.md`](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md), link schema docs | Implementation plans | — |
| **Place** | [`PLACE_DOMAIN_MODEL.md`](./PLACE_DOMAIN_MODEL.md) + [`audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md`](./audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md) | [`PLACE_PATTERN_GUIDE.md`](./PLACE_PATTERN_GUIDE.md), [`PLACE_COMMERCE_BOUNDARY.md`](./PLACE_COMMERCE_BOUNDARY.md), [`memory-bank/vssylPlaceProductContext.md`](../../memory-bank/vssylPlaceProductContext.md) | UX/constitutional audits | — |
| **Notifications** | [`../guides/NOTIFICATION_METADATA_GUIDE.md`](../guides/NOTIFICATION_METADATA_GUIDE.md) | [`memory-bank/notificationsProductContext.md`](../../memory-bank/notificationsProductContext.md), Platform Standards notify path | UX certification docs | — |
| **Analytics capability** | [`../analytics/ANALYTICS_STATUS_RECORD.md`](../analytics/ANALYTICS_STATUS_RECORD.md) | [`../analytics/ANALYTICS_OWNERSHIP_MODEL.md`](../analytics/ANALYTICS_OWNERSHIP_MODEL.md), [`memory-bank/analyticsProductContext.md`](../../memory-bank/analyticsProductContext.md) | [`ANALYTICS_PROGRAM_ARCHIVE.md`](../analytics/ANALYTICS_PROGRAM_ARCHIVE.md) | — |

### Business Domain

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Business Operations domain** | [`../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md`](../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md) | Operation matrices per module, [`BUSINESS_OPERATIONS_REFERENCE_STATUS_RECORD.md`](../business-operations/BUSINESS_OPERATIONS_REFERENCE_STATUS_RECORD.md) | [`BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md`](../business-operations/BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md) | — |
| **HR module** | [`audits/HR_OPERATION_MATRIX.md`](./audits/HR_OPERATION_MATRIX.md) | [`memory-bank/hrProductContext.md`](../../memory-bank/hrProductContext.md) | Constitutional compliance assessments | — |
| **Scheduling module** | [`audits/SCHEDULING_OPERATION_MATRIX.md`](./audits/SCHEDULING_OPERATION_MATRIX.md) | [`memory-bank/schedulingProductContext.md`](../../memory-bank/schedulingProductContext.md) | — | — |
| **Workforce Comms** | [`audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md`](./audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) | — | — | — |
| **Business Administration** | [`../business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md`](../business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md) | [`BUSINESS_ADMINISTRATION_OPERATION_MATRIX.md`](../business-administration/BUSINESS_ADMINISTRATION_OPERATION_MATRIX.md) | Program archive | — |
| **Account Platform** | [`../account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md`](../account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md) | PP1/PP2/PP3 certification records, unified operation matrix | Program archive | Package implementation reports |

### Control Plane & Admin

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Admin Portal** | [`audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md`](./audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md) | [`audits/ADMIN_PORTAL_OPERATION_MATRIX.md`](./audits/ADMIN_PORTAL_OPERATION_MATRIX.md), [`../guides/ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md) | 50+ audit closeouts, program archive | Phase 0A summaries in `admin-portal/` |
| **Platform Controller IA** | [`../platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md`](../platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) | [`PLATFORM_CONTROLLER_NAVIGATION_MODEL.md`](../platform-controller/PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) | — | — |
| **AI Pipeline admin** | [`AI_PIPELINE_ADMIN_TOOLS.md`](./AI_PIPELINE_ADMIN_TOOLS.md) | Admin Portal AI pipeline matrices | AI admin closeouts | — |

### Design System

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **UX standards (constitutional)** | [`../ux/UX_CONSTITUTION.md`](../ux/UX_CONSTITUTION.md) | [`.cursor/rules/ux-standards.mdc`](../../.cursor/rules/ux-standards.mdc), [`../ux/DESIGN_TOKENS.md`](../ux/DESIGN_TOKENS.md) | UX wave closeouts | Individual module UX scorecards |
| **Design tokens (implementation)** | [`../ux/DESIGN_TOKENS.md`](../ux/DESIGN_TOKENS.md) + `web/src/styles/tokens.css` | UX Constitution Rule 11 | — | — |
| **UX Reference Program** | [`../ux/REFERENCE_MODULE_PROGRAM.md`](../ux/REFERENCE_MODULE_PROGRAM.md) | [`../ux/UX_REFERENCE_PATTERN_CATALOG.md`](../ux/UX_REFERENCE_PATTERN_CATALOG.md), per-module REFERENCE_MODULE_* audits | — | — |
| **Layout archetypes** | [`../ux/LAYOUT_PATTERNS.md`](../ux/LAYOUT_PATTERNS.md) | UX Constitution §3 | — | — |

### Infrastructure & Security

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Production deployment** | [`../deployment/PRODUCTION_DEPLOYMENT.md`](../deployment/PRODUCTION_DEPLOYMENT.md) | [`../deployment/GOOGLE_CLOUD_DEPLOYMENT.md`](../deployment/GOOGLE_CLOUD_DEPLOYMENT.md), [`memory-bank/deployment.md`](../../memory-bank/deployment.md) | Build optimization guides | Session summaries |
| **Security posture** | ⚠️ **TBD — gap** | [`memory-bank/securityComplianceSystem.md`](../../memory-bank/securityComplianceSystem.md), Platform Standards §27 | — | Do not treat Memory Bank as cert |
| **Rollback operations** | [`../deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`](../deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md) | — | — | — |
| **AI vision runbook** | [`../ai/RUNBOOK.md`](../ai/RUNBOOK.md) | [`../ai/PROVIDERS.md`](../ai/PROVIDERS.md) | — | — |
| **Partner operator runbook** | [`../marketplace/PARTNER_OPERATOR_RUNBOOK.md`](../marketplace/PARTNER_OPERATOR_RUNBOOK.md) | — | — | — |

### Realtime

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Realtime / WebSocket** | ⚠️ **TBD — gap** (Platform Standards §3 + module patterns) | [`memory-bank/presenceProductContext.md`](../../memory-bank/presenceProductContext.md), Chat operation matrix realtime section | — | — |

### Commercial & GTM

| Topic | Source of Truth | Supporting (living) | Historical / read-only | Never edit for truth |
|-------|-----------------|---------------------|------------------------|----------------------|
| **Go-to-market readiness** | [`../go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md`](../go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md) | Reality assessment, user journey audit, pricing review | — | — |
| **Platform portfolio discovery** | [`../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md`](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md) | [`PLATFORM_CERTIFICATION_STATUS_2026_5.md`](../platform-portfolio/PLATFORM_CERTIFICATION_STATUS_2026_5.md) | [`PLATFORM_PORTFOLIO_DOMAIN_MAP.md`](../platform-portfolio/PLATFORM_PORTFOLIO_DOMAIN_MAP.md) (stale) | — |

---

## Document class definitions

| Class | Definition | Edit policy |
|-------|------------|-------------|
| **Constitutional** | Permanent platform law; council-ratified | Change requires explicit governance process |
| **Source of Truth (SoT)** | Single authoritative doc for a topic | Edit here first; propagate to supporting |
| **Supporting (living)** | Active companions that extend SoT | Update when SoT changes; must not contradict SoT |
| **Status record** | Current program posture + cert tier | Update at program milestones |
| **Operation matrix** | Evidence of compliance per operation | Update when operations change |
| **Discovery / assessment** | Point-in-time reality check | **Read-only** after publication; supersede with new dated doc |
| **Closeout / archive** | Program completion record | **Never edit** — historical |
| **How-to / guide** | Implementation instructions | Update for accuracy; not architecture truth |
| **Memory Bank product context** | Product intent and status narrative | Update for product changes; defer to docs constitutions for architecture |
| **Plan** | Future execution intent | Update until executed or cancelled |

---

## Duplicate detection summary

| Duplicate pair | Authoritative | Action (Phase 1) |
|----------------|---------------|------------------|
| `globalSearchProductContext.md` vs `SEARCH_CONSTITUTION.md` | Search Constitution | Add deprecation banner to Memory Bank |
| `PLATFORM_PORTFOLIO_DOMAIN_MAP.md` vs `CERTIFICATION_LEDGER.md` | Ledger + this domain map | Mark portfolio map superseded |
| `docs/admin-portal/` vs `audits/ADMIN_PORTAL_*` | audits/ status record | Consolidate index under Admin Portal SoT |
| `workspace/` vs `workspace-review/` | workspace/ for program; workspace-review/ for boundary analyses | Merge or cross-link in Phase 1 |
| `AI_SYSTEM_ARCHITECTURE_MAP.md` (guides) vs `AI_PLATFORM_OVERVIEW.md` | AI Platform Overview | Archive guide per guides README |
| `PLATFORM_CERTIFICATION_STATUS_2026.md` vs `_2026_5.md` vs ledger | CERTIFICATION_LEDGER | Archive 2026 snapshot |
| Navigation across 15+ docs | NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY | Charter Navigation Reference Program |

**Do not merge in Phase 0A** — identify only.

---

## Recommended standard structure for future architecture documents

See **[`ARCHITECTURE_DOCUMENT_STANDARD.md`](./ARCHITECTURE_DOCUMENT_STANDARD.md)** — required template for all new architecture documents (Phase 1D).

---

## Domain ownership register (Phase 1F)

Official ownership register — expanded from SoT matrix. **Maturity** = certification level from ledger (2026-06-24).

| Domain | Primary SoT | Owner / Program | Cert | Ref impl | Maturity | Open questions |
|--------|-------------|-----------------|------|----------|----------|----------------|
| **Platform Standards** | `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` | Platform Engineering | Constitutional | — | L2+ implicit | Manifest reconcile-all |
| **Platform Kernel** | `platform-kernel/PLATFORM_KERNEL_STATUS_RECORD.md` | Platform Kernel Program | L2 CwF | Event registry | Archived L2 | Activity read migration |
| **Platform Shell** | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` | Reference Workspace | WS-L3 / 3C | PlatformShell.tsx | Complete | REG-B3 pattern annex |
| **Navigation** | `NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md` | Nav Ref Program (proposed) | — | `*Navigation.ts` | Discovery | Command palette ADR |
| **Workspace** | `workspace/WORKSPACE_CERTIFICATION_RECORD.md` | Reference Workspace | WS-L3 CwF | WS With Findings | Archived | RWS-F1 Place 404 |
| **Applications** | `APPLICATION_LIFECYCLE.md` | Platform Engineering | — | App Manager | Partial | Enable/disable arch-only |
| **Marketplace** | `guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md` | Marketplace Runtime | L3 CwF | Pilot assets | Active L3 | Public partner docs |
| **Dashboard module** | `dashboard/DASHBOARD_STATUS_RECORD.md` | Dashboard Program | L3 CwF | Widget registry | Archived L3 | Ref impl deferred |
| **AI Platform** | `AI_PLATFORM_CONSTITUTION.md` | AI Platform Program | L2 | UX Ref #4 | L2 active | L3 deferred |
| **AI Retrieval** | `ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md` | AI Platform | L2 CwF | Retrieval orch. | Phase 2A | Search alignment |
| **Search** | `search/SEARCH_CONSTITUTION.md` | Unified Search | L2 CwF | searchCapabilityService | Phase 1B | Provider gaps |
| **Notifications** | `guides/NOTIFICATION_METADATA_GUIDE.md` | Platform Engineering | L2 / UX #2 | notificationService | L2 | No constitution |
| **Realtime** | ⚠️ TBD | Platform Engineering | — | chatSocketService | Unaudited | Platform capability doc |
| **File Hub** | `audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md` | Drive team | **L4** | **Canonical ref** | L4 active | Ongoing hygiene |
| **Chat** | `audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md` | Chat team | L3 | Ref #2 | L3 | Post-L3 punch-list |
| **Calendar** | `audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md` | Calendar team | L3 | Ref #3 / UX #5 | L3 | Hygiene backlog |
| **Place** | `PLACE_DOMAIN_MODEL.md` + L3 review | Place team | L3 | Ref #5 dual-surface | L3 | Publisher URL 404 |
| **Analytics** | `analytics/ANALYTICS_STATUS_RECORD.md` | Platform Analytics | L2 CwF | Dashboard facade | Archived L2 | Event pipeline P2 |
| **Context Graph** | `context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md` | Context Graph | L4 CwF | #CG-1–#CG-4 | Archived L4 | L4-F01 prod gate |
| **Business Operations** | `business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md` | BO Program | L3 CwF | Ref #1/#6/#7 | Archived L3 | 17 advisories |
| **Business Admin** | `business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md` | BA Program | L3 | #OC-1/2/3 | Archived L3 | Integration mounts |
| **Account Platform** | `account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md` | Account Platform | L3 CwF | #AP-BILL-1 | Archived L3 | 19 advisories |
| **Admin Portal** | `audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md` | Platform Ops | L3 | AI Pipeline admin | Archived L3 | Split doc trees |
| **Platform Controller** | `platform-controller/PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md` | Controller Program | Inherits L3 | nav config | Phase 1B done | — |
| **UX / Design System** | `ux/UX_CONSTITUTION.md` | UX Reference Program | Constitutional | UX #1–#5 | Wave 6A | Place UX #6 deferred |
| **Security** | ⚠️ TBD | Platform / Security | — | securityService.ts | No cert | Architecture program needed |
| **Infrastructure** | `deployment/PRODUCTION_DEPLOYMENT.md` | DevOps | — | cloudbuild.yaml | Operational | Runbooks index |
| **Connected Knowledge** | `connected-knowledge/KNOWLEDGE_CONSTITUTION.md` | CK Program | — | — | Constitution only | Implementation charter |
| **Go-to-Market** | `go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md` | Product / GTM | — | — | ~45% readiness | Phase 0B GTM |
| **V_Link** | `V_LINK.md` | Platform Engineering | L2 | File Hub services | L2 active | Resolver expansion |

**Historical documents (do not edit for truth):** Program archives (`*_PROGRAM_ARCHIVE.md`), Phase 0A discovery snapshots with banners, `docs/archive/session-summaries/`.

---

**Last updated:** 2026-06-29 (Architecture Governance Phase 1F)

