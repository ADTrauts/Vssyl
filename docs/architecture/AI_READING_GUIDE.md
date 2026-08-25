# AI Reading Guide

**Program:** AI Architecture Phase 0  
**Date:** 2026-07-12  
**Status:** Active — official reading order for AI documentation  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** AI documentation reading progression  
**Companion:** [`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) · [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md)

---

## Recommended progression

Read in this order unless you already know the layer you need.

| Step | Document | Why |
|------|----------|-----|
| **1** | [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) | Plain-English picture of Vssyl AI |
| **2** | [`AI_PLATFORM_OVERVIEW.md`](./AI_PLATFORM_OVERVIEW.md) | Live diagrams and path map |
| **3** | [`../ai-system-audit/AI_SYSTEM_LAYER_MAP.md`](../ai-system-audit/AI_SYSTEM_LAYER_MAP.md) | Layers and ownership |
| **4** | [`../ai-system-audit/AI_SYSTEM_END_TO_END_FLOWS.md`](../ai-system-audit/AI_SYSTEM_END_TO_END_FLOWS.md) | What happens on a real request |
| **5** | [`../ai-system-audit/AI_SYSTEM_COMPONENT_INVENTORY.md`](../ai-system-audit/AI_SYSTEM_COMPONENT_INVENTORY.md) | What exists in the repo |
| **6** | [`../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md`](../ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md) | What happens to new information |
| **7** | [`../ai-knowledge/KNOWLEDGE_TRANSITION_MODEL.md`](../ai-knowledge/KNOWLEDGE_TRANSITION_MODEL.md) | How knowledge changes state |
| **8** | [`../ai/PROVIDERS.md`](../ai/PROVIDERS.md) + [`../ai-system-audit/AI_PROVIDER_AND_MODEL_AUDIT.md`](../ai-system-audit/AI_PROVIDER_AND_MODEL_AUDIT.md) | Provider architecture (current) |
| **9** | [`AI_CONVERSATION_REASONING.md`](./AI_CONVERSATION_REASONING.md) | Understanding layer before solving |
| **10** | Deep technical docs | Twin pipeline, context assembly, retrieval constitution, pipeline admin, audits |

**Phase 1 safety (after understanding the Twin):**  
[`AI_PHASE1_TEST_STRATEGY.md`](./AI_PHASE1_TEST_STRATEGY.md) · [`AI_TOOL_RISK_AND_APPROVAL_POLICY.md`](./AI_TOOL_RISK_AND_APPROVAL_POLICY.md) · [`AI_PHASE1_SAFETY_AND_REGRESSION_CLOSEOUT.md`](./AI_PHASE1_SAFETY_AND_REGRESSION_CLOSEOUT.md) · [`AI_PHASE1B_END_TO_END_SAFETY_CLOSEOUT.md`](./AI_PHASE1B_END_TO_END_SAFETY_CLOSEOUT.md) · [`AI_PHASE1B_SAFETY_CERTIFICATION_MATRIX.md`](./AI_PHASE1B_SAFETY_CERTIFICATION_MATRIX.md)

**Phase 2 execution platform:**  
[`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md) · [`AI_EXECUTION_LIFECYCLE.md`](./AI_EXECUTION_LIFECYCLE.md) · [`AI_APPROVAL_ARCHITECTURE.md`](./AI_APPROVAL_ARCHITECTURE.md) · [`AI_EXECUTION_PLATFORM_GAPS.md`](./AI_EXECUTION_PLATFORM_GAPS.md) · [`AI_PHASE2_EXECUTION_PLATFORM_CLOSEOUT.md`](./AI_PHASE2_EXECUTION_PLATFORM_CLOSEOUT.md)

**Phase 3 intelligence platform (observe-only):**  
[`AI_EXECUTION_RECORD_ARCHITECTURE.md`](./AI_EXECUTION_RECORD_ARCHITECTURE.md) · [`AI_EVALUATION_ARCHITECTURE.md`](./AI_EVALUATION_ARCHITECTURE.md) · [`AI_ROOT_CAUSE_MODEL.md`](./AI_ROOT_CAUSE_MODEL.md) · [`AI_CORRECTION_ROUTING.md`](./AI_CORRECTION_ROUTING.md) · [`AI_REGRESSION_INTELLIGENCE.md`](./AI_REGRESSION_INTELLIGENCE.md) · [`AI_OPERATOR_PLATFORM.md`](./AI_OPERATOR_PLATFORM.md) · [`AI_PLATFORM_METRICS.md`](./AI_PLATFORM_METRICS.md) · [`AI_PHASE3_CLOSEOUT.md`](./AI_PHASE3_CLOSEOUT.md)

**Phase 4 intelligence workflows (historical product framing):**  
[`AI_OPERATIONS_CENTER_ARCHITECTURE.md`](./AI_OPERATIONS_CENTER_ARCHITECTURE.md) · [`AI_OPERATIONS_CENTER_API.md`](./AI_OPERATIONS_CENTER_API.md) · [`AI_OPERATIONS_CENTER_RBAC.md`](./AI_OPERATIONS_CENTER_RBAC.md) · [`AI_OPERATIONS_CENTER_UX.md`](./AI_OPERATIONS_CENTER_UX.md) · [`AI_OPERATIONS_CENTER_CLOSEOUT.md`](./AI_OPERATIONS_CENTER_CLOSEOUT.md)

**Phase 4B Admin consolidation (canonical Pipeline Hub):**  
[`AI_ADMIN_SURFACE_CONSOLIDATION_MATRIX.md`](./AI_ADMIN_SURFACE_CONSOLIDATION_MATRIX.md) · [`AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md`](./AI_PIPELINE_OPERATOR_INFORMATION_ARCHITECTURE.md) · [`AI_PIPELINE_OPERATOR_RBAC.md`](./AI_PIPELINE_OPERATOR_RBAC.md) · [`AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md`](./AI_PHASE4B_ADMIN_CONSOLIDATION_CLOSEOUT.md)

**Phase 5 Runtime Observation Layer:**  
[`AI_RUNTIME_OBSERVATION_ARCHITECTURE.md`](./AI_RUNTIME_OBSERVATION_ARCHITECTURE.md) · [`AI_OBSERVATION_EVENTS.md`](./AI_OBSERVATION_EVENTS.md) · [`AI_REDACTION_POLICY.md`](./AI_REDACTION_POLICY.md) · [`AI_RETENTION_POLICY.md`](./AI_RETENTION_POLICY.md) · [`AI_PHASE5_CLOSEOUT.md`](./AI_PHASE5_CLOSEOUT.md)

**Phase 5B Observation Reliability:**  
[`AI_OBSERVATION_DELIVERY_ASSESSMENT.md`](./AI_OBSERVATION_DELIVERY_ASSESSMENT.md) · [`AI_OBSERVATION_DELIVERY_CONTRACT.md`](./AI_OBSERVATION_DELIVERY_CONTRACT.md) · [`AI_OBSERVATION_EXECUTION_STATE_MODEL.md`](./AI_OBSERVATION_EXECUTION_STATE_MODEL.md) · [`AI_OBSERVATION_RETENTION_RUNBOOK.md`](./AI_OBSERVATION_RETENTION_RUNBOOK.md) · [`AI_PHASE5B_OBSERVATION_RELIABILITY_CERTIFICATION.md`](./AI_PHASE5B_OBSERVATION_RELIABILITY_CERTIFICATION.md) · [`AI_PHASE5B_CLOSEOUT.md`](./AI_PHASE5B_CLOSEOUT.md) · [`../deployment/AI_PHASE5B_OBSERVATION_MIGRATION_RUNBOOK.md`](../deployment/AI_PHASE5B_OBSERVATION_MIGRATION_RUNBOOK.md)

**Phase 6 Evaluation & Correction Workflow:**  
[`AI_EVALUATION_WORKFLOW.md`](./AI_EVALUATION_WORKFLOW.md) · [`AI_CORRECTION_WORKFLOW.md`](./AI_CORRECTION_WORKFLOW.md) · [`AI_REVIEW_WORKFLOW.md`](./AI_REVIEW_WORKFLOW.md) · [`AI_RESOLUTION_WORKFLOW.md`](./AI_RESOLUTION_WORKFLOW.md) · [`AI_PHASE6_CLOSEOUT.md`](./AI_PHASE6_CLOSEOUT.md)

**Phase 6B Platform Certification & Readiness:**  
[`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](./AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md) · [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](./AI_PLATFORM_SUBSYSTEM_INVENTORY.md) · [`AI_PLATFORM_CANONICAL_DIAGRAM.md`](./AI_PLATFORM_CANONICAL_DIAGRAM.md) · [`AI_MODEL_ROUTING_READINESS.md`](./AI_MODEL_ROUTING_READINESS.md) · [`AI_PHASE6B_CLOSEOUT.md`](./AI_PHASE6B_CLOSEOUT.md)

**Phase 7 Provider-Neutral Model Routing (Shadow Mode):**  
[`AI_MODEL_ROUTER_ARCHITECTURE.md`](./AI_MODEL_ROUTER_ARCHITECTURE.md) · [`AI_MODEL_ROUTING_AUDIT.md`](./AI_MODEL_ROUTING_AUDIT.md) · [`AI_CAPABILITY_MODEL.md`](./AI_CAPABILITY_MODEL.md) · [`AI_ROUTING_TIERS.md`](./AI_ROUTING_TIERS.md) · [`AI_MODEL_CATALOG.md`](./AI_MODEL_CATALOG.md) · [`AI_ROUTING_POLICY.md`](./AI_ROUTING_POLICY.md) · [`AI_PHASE7_CLOSEOUT.md`](./AI_PHASE7_CLOSEOUT.md)

**Phase 8 AI Skills Framework:**  
[`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md) · [`AI_SKILL_CONTRACT.md`](./AI_SKILL_CONTRACT.md) · [`AI_SKILL_EXECUTION_MODEL.md`](./AI_SKILL_EXECUTION_MODEL.md) · [`AI_SKILL_REGISTRY.md`](./AI_SKILL_REGISTRY.md) · [`AI_SKILL_LIFECYCLE.md`](./AI_SKILL_LIFECYCLE.md) · [`AI_SKILL_CANDIDATE_AUDIT.md`](./AI_SKILL_CANDIDATE_AUDIT.md) · [`AI_SKILL_PILOT_CATALOG.md`](./AI_SKILL_PILOT_CATALOG.md) · [`AI_SKILL_CERTIFICATION_STANDARD.md`](./AI_SKILL_CERTIFICATION_STANDARD.md) · [`AI_SKILL_SECURITY_MODEL.md`](./AI_SKILL_SECURITY_MODEL.md) · [`AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md`](./AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md) · [`AI_PHASE8_CLOSEOUT.md`](./AI_PHASE8_CLOSEOUT.md)

**Phase 8B Skill Productization (canonical product paths):**  
[`AI_SKILL_PRODUCTIZATION.md`](./AI_SKILL_PRODUCTIZATION.md) · [`AI_SKILL_PRODUCTIZATION_AUDIT.md`](./AI_SKILL_PRODUCTIZATION_AUDIT.md) · [`AI_SKILL_CANONICAL_EXECUTION_MODEL.md`](./AI_SKILL_CANONICAL_EXECUTION_MODEL.md) · [`AI_SKILL_QUALITY_MODEL.md`](./AI_SKILL_QUALITY_MODEL.md) · [`AI_PHASE8B_CLOSEOUT.md`](./AI_PHASE8B_CLOSEOUT.md)

**Always pair principles with law:**

- Platform law → [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md)  
- Knowledge law → [`../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`](../ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md)  
- Intelligence scopes → [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md)

---

## By role

| Role | Start at | Then |
|------|----------|------|
| Product owner | Mental Model → Intelligence Model | Customer/background map in audit |
| New engineer | Steps 1–5 | Twin prompt pipeline + context providers |
| Knowledge / Teach Vssyl | Steps 1, 6–7 | Knowledge Constitution + UX docs |
| Provider / model work | Steps 1, 8 | Model routing *target* (future) in audit — do not treat as shipped |
| Operator / admin | Overview → Pipeline admin tools | Audit observability doc |
| Agent (Cursor) | [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md) | Task tree → SoT |

---

## Historical material

Documents marked **Historical** in [`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) remain available for archaeology. Prefer this reading guide and the System Audit for current understanding.

Do **not** delete historical documents.

---

## Future vs current

| Topic | Current SoT | Future / design-only |
|-------|-------------|----------------------|
| Conversational runtime | Twin + constitution + audit | — |
| Model tiers FAST/BALANCED/DEEP | Phase 7 Model Router (shadow) + [`AI_ROUTING_TIERS.md`](./AI_ROUTING_TIERS.md) | Live cutover still future — production uses `selectLlmProvider` |
| Governed Skills | Phase 8 Skills Framework + [`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md) | AI Studio, Industry Packs, customer-created Skills |
| Industry Intelligence | Slot in Intelligence Model | Not implemented |
| External read (Places, Routes, web) | [`AI_EXTERNAL_CAPABILITY_MODEL.md`](./AI_EXTERNAL_CAPABILITY_MODEL.md) (design) | Not shipped — `web_search` stub only; no Google client |
