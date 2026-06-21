# CG-2A — Tag Index Security Model

**Program:** Phase 2A — Tag Index Architecture & Runtime  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED**

---

## Principles

| # | Principle | Enforcement |
|---|-----------|-------------|
| S1 | **Tags do not grant access** | Tag search returns only PE-approved entities |
| S2 | **Module SoR writes only** | Index layer has zero write paths |
| S3 | **Tenant scope required** | Queries accept dashboard/business/household filters |
| S4 | **Trashed hosts excluded** | Providers skip `trashedAt != null` |
| S5 | **No cross-tenant bleed** | Module queries scoped; access re-checked per hit |

---

## Permission flow

```
User request (JWT)
    ↓
tagIndexService (userId + scope)
    ↓
ContextGraphTagProvider
    ↓
Module access service (todo/notes/place V_Link access paths)
    ↓
Policy Engine (module dual policy where applicable)
    ↓
Return TagDescriptor[] or empty if denied
```

**Tag visibility never bypasses module PE.** A tag match on a task the user cannot read returns **no descriptor**.

---

## Threat model

| Threat | Mitigation |
|--------|------------|
| Tag search expands access | Post-filter via `resolve*ForVLink` on every candidate |
| Index writes corrupt SoR | No create/update/delete in tag index code |
| Tag → graph node inference | Tags only in `metadata.tags`; no edges created |
| Tag collision implies relationship | Documented prohibition; no edge synthesis |
| Unbounded scan | `MAX_TAG_SEARCH_RESULTS=50`; module scan cap 30 entities |
| Tag enumeration across tenants | Scope filters on prisma queries + PE |

---

## Data classification

| Data | Classification |
|------|----------------|
| `TagDescriptor` | Federated read view — ephemeral |
| `tagId` | Derived key — not secret |
| Module `tags[]` | Module-confidential per entity PE |
| Restricted entity tags | **Omitted** — not returned when access denied |

---

## API auth

All tag index routes require **JWT** (`authenticateJWT` middleware).

| Error | Code |
|-------|------|
| Unauthenticated | `CG_UNAUTHORIZED` |
| Missing tag param | `CG_INVALID_TAG` |
| Missing entity params | `CG_INVALID_DESCRIPTOR` |
| Missing moduleId | `CG_INVALID_MODULE` |

---

## V_Link unchanged

Tag index does **not**:

- Create V_Link attachments
- Modify V_LinkEntity rows
- Add tag-based V_Link suggestions
- Alter vlink pipeline context

V_Link remains the association substrate (#CG-2).

---

## Certification evidence

| Question | Answer |
|----------|--------|
| Can tags bypass permissions? | **No** |
| Does Context Graph own tags? | **No** |
| Are tags graph nodes? | **No** |

**Last updated:** 2026-06-19
