# Admin Portal — AI Navigation Matrix

**Package:** 0D-F — AI Control Plane UX Consolidation  
**Date:** 2026-06-17  
**Goal:** One canonical path per AI administration capability

---

## Legend

| Status | Meaning |
|--------|---------|
| **Canonical** | Sole operator path for capability |
| **Redirect** | Legacy URL preserved; forwards to canonical |
| **Satellite** | Intentionally separate domain (not pipeline) |
| **Transitional** | Launcher only; no duplicate capability UX |
| **Retired** | Removed from navigation |

---

## Primary navigation (layout)

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| Sidebar → AI System | `/admin-portal/ai-system` | — | — | **Transitional** launcher |
| Sidebar → AI Pipeline | `/admin-portal/ai-pipeline` | Yes (hub) | — | **Canonical** |

---

## AI System launcher (transitional hub)

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| System card → AI Pipeline | `/admin-portal/ai-pipeline` | Yes | — | **Canonical** |
| System card → AI Test Lab | `/admin-portal/ai-pipeline/test-lab` | Yes | — | **Canonical** |
| System card → Provider Governance | `/admin-portal/ai-pipeline#provider-governance` | Yes | — | **Canonical** |
| System card → Business AI Global | `/admin-portal/business-ai` | Satellite | — | **Satellite** |
| Quick Action → AI Pipeline | `/admin-portal/ai-pipeline` | Yes | — | **Canonical** |
| Quick Action → AI Test Lab | `/admin-portal/ai-pipeline/test-lab` | Yes | — | **Canonical** |
| Quick Action → Provider Governance | `/admin-portal/ai-pipeline#provider-governance` | Yes | — | **Canonical** |
| Quick Action → Business AI | `/admin-portal/business-ai` | Satellite | — | **Satellite** |
| ~~System card → Context Debug~~ | ~~`/admin-portal/ai-context`~~ | — | Yes | **Retired** (0D-F) |
| ~~System card → Business Intelligence~~ | ~~`/admin-portal/business-intelligence`~~ | — | Yes (analytics) | **Removed** from AI launcher (0D-F) |
| ~~Quick Action → Debug AI Context~~ | ~~`/admin-portal/ai-context`~~ | — | Yes | **Retired** (0D-F) |

---

## AI Pipeline hub and subpages

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| Hub → Response Diagnostics | `/admin-portal/ai-pipeline/diagnostics` | Yes | — | **Canonical** |
| Hub → Test Lab | `/admin-portal/ai-pipeline/test-lab` | Yes | — | **Canonical** |
| Hub → Provider Governance panel | `#provider-governance` on hub | Yes | — | **Canonical** |
| Hub tool sections (Observe) | `/admin-portal/ai-pipeline/diagnostics` | Yes | — | **Canonical** |
| Catalog, policies, compliance, etc. | `/admin-portal/ai-pipeline/*` | Yes | — | **Canonical** |

---

## Legacy redirects

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| `/admin-portal/ai-learning` | `/admin-portal/ai-pipeline` | Yes | — | **Redirect** (0D-B) |
| `/admin-portal/ai-context` | `/admin-portal/ai-pipeline/diagnostics` | Yes | — | **Redirect** (0D-F) |

---

## Module governance (distinct)

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| Modules page → AI Context tab | In-page module certification | Satellite | Not admin debug | **Preserved** |

---

## API entry points (operator-relevant)

| Source | Destination | Canonical | Duplicate | Status |
|--------|-------------|-----------|-----------|--------|
| Pipeline diagnostics API | `/api/admin-portal/ai-pipeline/diagnostics` | Yes | — | **Canonical** |
| Context debug API | `/api/ai-context-debug/*` | — | Yes | **Transitional** (Deprecation headers) |
| Centralized AI | `/api/centralized-ai/*` | — | Yes | **Retired** (410 fence, 0D-B) |

---

## Capability → canonical path summary

| Capability | Canonical path |
|------------|----------------|
| Diagnostics / forensics | `/admin-portal/ai-pipeline/diagnostics` |
| Evaluation / dry-run | `/admin-portal/ai-pipeline/test-lab` |
| Provider governance | `/admin-portal/ai-pipeline#provider-governance` |
| Pipeline control plane | `/admin-portal/ai-pipeline` |
| Business AI global | `/admin-portal/business-ai` |
| AI launcher | `/admin-portal/ai-system` (nav-only) |

---

## Duplication closure (AP-F-008 / AP-F-029)

| Duplicate | Resolution |
|-----------|------------|
| ai-context 5-tab UI | Redirect + component removal |
| ai-system context-debug card | Removed |
| ai-system BI card in AI launcher | Removed (analytics owns BI) |
| Pipeline hub → ai-context link | Removed (0D-E) |

**Matrix verdict:** One canonical path per AI admin capability for operator UX. API-level debug mount consolidation tracked separately in 0D-G / 1B.
