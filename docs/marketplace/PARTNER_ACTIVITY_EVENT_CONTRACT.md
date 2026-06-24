# Partner Activity — Event Contract

**Program:** Marketplace & Module Ecosystem — Phase 1B-E / **1B-F implemented**  
**Date:** 2026-06-24  
**Status:** Contract specification — **implemented** (`shared/src/types/activity-ingest.ts`)  
**Authority:** `memory-bank/moduleSpecs.md`, `server/src/services/platform/platformActivityTypes.ts`, `emitModuleActivityEvent` envelope

---

## 1. Purpose

Define the **partner → platform** activity ingest contract that normalizes into the existing `ModuleActivityEnvelope` / `emitModuleActivityEvent` shape — without requiring changes to feed consumers on day one.

---

## 2. Contract version

**`activityIngest.contractVersion: "1"`** (manifest + HTTP body)

---

## 3. Manifest declaration (`activityIngest`)

```json
{
  "capabilities": {
    "activity": true
  },
  "activityIngest": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "entityTypes": ["asset", "work_order"],
    "actionTypes": ["create", "update", "delete", "assign", "complete"],
    "maxMetadataBytes": 4096,
    "idempotencyRequired": true
  },
  "entities": [
    { "type": "asset", "displayName": "Asset", "supportsActivity": true }
  ]
}
```

**Rules:**

- `capabilities.activity: true` requires valid `activityIngest` block (certification gate).
- `actionTypes` must be declared; platform rejects undeclared actions at ingest.
- `entityTypes` must align with `entities[].type` where `supportsActivity: true`.

---

## 4. HTTP ingest request (partner → platform)

**Proposed:** `POST /api/modules/:moduleId/activity-ingest`  
**Implemented:** ✅ Phase 1B-F  
**Auth:** Activity Ingest JWT (see security model) — **not** platform session token.

```typescript
interface PartnerActivityIngestRequest {
  contractVersion: '1';
  idempotencyKey: string;       // max 128 chars; unique per moduleId+tenant
  occurredAt: string;           // ISO-8601; server may clamp skew
  action: string;                 // must be in manifest actionTypes
  actor: {
    userRef: string;              // platform user id OR hashed ref from bridge JWT
  };
  target: {
    type: string;                 // manifest entityTypes
    id: string;                   // stable id in partner SoR
  };
  parent?: {
    type: string;
    id: string;
  };
  context: {
    scope: 'personal' | 'business' | 'household';
    businessId?: string;
    dashboardId?: string;
    householdId?: string;
  };
  visibility?: {
    scope: 'personal' | 'business' | 'household' | 'direct-share';
  };
  severity?: 'info' | 'notice' | 'important';  // optional; default info
  metadata?: Record<string, unknown>;          // bounded size; no secrets
}
```

---

## 5. Platform response

```typescript
interface PartnerActivityIngestSuccessResponse {
  success: true;
  contractVersion: '1';
  eventId: string;              // platform-assigned evt_*
  accepted: true;
  duplicate?: boolean;          // true when idempotencyKey replay
}

interface PartnerActivityIngestErrorResponse {
  success: false;
  error: {
    code:
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'INVALID_REQUEST'
      | 'UNKNOWN_ACTION'
      | 'UNKNOWN_ENTITY'
      | 'TENANT_MISMATCH'
      | 'RATE_LIMITED'
      | 'IDEMPOTENCY_CONFLICT'
      | 'INTERNAL_ERROR';
    message: string;
  };
}
```

---

## 6. Normalization mapping

| Partner field | Platform `ModuleActivityEnvelope` |
|---------------|-----------------------------------|
| `eventId` | Platform-generated (never trust partner eventId as primary key) |
| `occurredAt` | `timestamp` (server time wins on large skew) |
| `actor.userRef` | `actor.userId` after resolution to platform user |
| `action` | `action` |
| `target` | `target` |
| `parent` | `parent` |
| `context` + `moduleId` from JWT | `context` |
| `visibility` | `visibility.scope` |
| `metadata` | `metadata` (sanitized) |
| `severity` | `metadata.severity` (if not first-class) |

**Pinned fields (platform overwrites):**

- `context.moduleId` ← certified module id from JWT/registry
- `actor.userId` ← validated platform user (never raw partner claim alone)

---

## 7. Idempotency

| Rule | Detail |
|------|--------|
| Key scope | `(moduleId, businessId\|dashboardId\|householdId, idempotencyKey)` |
| TTL | 72 hours minimum retention |
| Replay | Return `duplicate: true` with same `eventId` |
| Conflict | Same key + different payload → `IDEMPOTENCY_CONFLICT` |

---

## 8. Action taxonomy guidance

Use **verb-style** actions aligned with first-party modules:

| Pattern | Examples |
|---------|----------|
| CRUD | `create`, `update`, `delete` |
| Workflow | `assign`, `complete`, `approve`, `reject` |
| Collaboration | `share`, `comment`, `react` |
| Avoid | `analytics_snapshot`, `heartbeat`, `page_view` |

Analytics belong in partner SoR or future analytics APIs — not activity ingest.

---

## 9. Alignment with domain events

| Concern | Activity ingest | Domain events |
|---------|-----------------|---------------|
| Source | Partner-reported (validated) | Platform mutation (authoritative) |
| Type strings | `action` + `target.type` | `{module}.{entity}.{verb}` taxonomy |
| Bus | Feed + AI read path | `emitDomainEvent` subscribers |
| Partner path | **This contract** | ❌ Do not accept partner domain events directly |

Optional **future bridge:** platform may emit a **derived** `partner.activity.recorded` domain event **after** successful ingest normalization — for outbound webhooks only, not for feed authority.

---

## 10. Certification checklist (contract)

| ID | Requirement |
|----|-------------|
| AP-C01 | `activityIngest` block valid when `capabilities.activity` |
| AP-C02 | All `actionTypes` documented in module docs |
| AP-C03 | `entityTypes` match manifest entities |
| AP-C04 | Idempotency keys implemented client-side |
| AP-C05 | Metadata under `maxMetadataBytes` |
| AP-C06 | No PII/secrets in metadata |
| AP-C07 | Sandbox probe emits sample event |

---

**Last updated:** 2026-06-24
