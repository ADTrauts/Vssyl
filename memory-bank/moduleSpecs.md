# Module interoperability & certification checklist

**Status:** Active contributor / certification checklist  
**Last verified:** 2026-09-04  
**Authority:** Must-pass interoperability expectations for first-party and third-party modules  
**Not:** Vssyl architecture Source of Truth

This file is a **contributor/certification checklist**, not architecture law.

Architecture ownership (Runtime Kernel, tiers, read/write paths, drift) remains in canonical architecture docs — especially Platform Standards.  
`moduleSpecs` owns the **must-pass interoperability expectations** used to judge whether a module behaves correctly inside Vssyl.

If a module-specific document conflicts with this checklist on certification items, **this checklist wins** unless explicitly superseded here or by Platform Standards.

---

## Privileged-action lifecycle

Every important module action must follow:

1. **Authorize** (tenant + role/permission check)
2. **Execute** (state mutation)
3. **Emit** activity event (normalized envelope)
4. **Notify** consumers (realtime + notification surfaces as applicable)

Events and success-side notifications must only be produced for **successful, authorized** actions.  
Unauthorized or failed actions must produce **no** success-side activity emission and **no** success-side notification as if the action succeeded.

---

## Normalized activity event envelope

Modules must emit a compatible event shape for key actions:

```typescript
interface NormalizedActivityEvent {
  eventId: string;
  timestamp: string; // ISO
  actor: {
    userId: string;
    role?: string;
  };
  action: string; // create|update|delete|share|message|react|...
  target: {
    type: string; // file|folder|message|task|...
    id: string;
  };
  parent?: {
    type: string; // conversation|folder|project|...
    id: string;
  };
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
    moduleId: string;
  };
  visibility: {
    scope: 'personal' | 'business' | 'household' | 'direct-share';
  };
  metadata?: Record<string, unknown>;
}
```

Implementation of emission services lives in code/architecture docs — not in this checklist.

---

## Activity ≠ Analytics

1. **Activity** — immutable event records describing what happened.
2. **Analytics** — derived aggregation/trends built from activity and domain data.

Do not store analytics summaries in activity records, and do not use analytics-only tables as a substitute for activity trails.

---

## Required module contract areas

Every module must define and implement:

1. **Context scope** — personal/business/household support declaration; tenant scoping for reads and writes
2. **Permission** — declared permission set; runtime enforcement **before** actions
3. **Activity** — normalized event emission for key actions; queryable retrieval path for UI
4. **Realtime** — delivery scoped by visibility; idempotent client update behavior
5. **Notification** — type metadata in manifest (if the module emits notifications); payload identifiers for navigation
6. **AI context (if AI-exposed)** — context providers and response shape per **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**; at least one valid `contextProviders` entry when the module is AI-exposed (structural validation via platform certification helpers)
7. **API / auth** — proxy-safe API patterns; authenticated identity and context validation
8. **Observability** — structured logs; auditable privileged actions

Do **not** treat AI context as required for modules that are not AI-exposed.

---

## Module certification checklist (must-pass)

A module is not considered interoperable unless all are true:

1. Permission checks block unauthorized actions.
2. Tenant scoping is enforced for every persisted query path.
3. Key actions emit normalized activity events.
4. Realtime updates are scoped and authorized.
5. Notification metadata is declared and valid (**if** the module emits notifications).
6. AI context providers are implemented and discoverable (**if** the module is AI-exposed): manifest + registry entry, canonical response shape, admin health check passes. See **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**.
7. Activity and analytics concerns are separated.

---

## Enforcement path (orientation)

| Channel | Responsibility |
|--------|----------------|
| **First-party (monorepo)** | PR review uses this checklist; agents follow `.cursor/rules/module-interoperability.mdc` + `module-development.mdc`. |
| **Third-party (marketplace)** | Admin approval must not pass if certification items are unmet; structural gates on publish/promote/rollback. See `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`. |
| **Automation** | CI and structural certification catch regressions; **semantic** checklist still needs human review. |

**Dry-run references:** `server/src/startup/registerBuiltInModules.ts` (first-party); `docs/test-modules/` sample manifest (third-party-shaped artifact).

---

## Canonical owners (pointers only)

| Concern | Owner |
|--------|--------|
| Platform constitutional framework | [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) |
| Authorization enforcement | [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md) |
| Domain vs module activity events | [`docs/architecture/DOMAIN_EVENTS.md`](../docs/architecture/DOMAIN_EVENTS.md) |
| Install / assignment lifecycle | [`docs/architecture/APPLICATION_LIFECYCLE.md`](../docs/architecture/APPLICATION_LIFECYCLE.md) |
| Notification metadata how-to | [`docs/guides/NOTIFICATION_METADATA_GUIDE.md`](../docs/guides/NOTIFICATION_METADATA_GUIDE.md) |
| UX law | [`docs/ux/UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md) |
| Marketplace product intent | [`marketplaceProductContext.md`](./marketplaceProductContext.md) |
| Developer / publisher product intent | [`developerProductContext.md`](./developerProductContext.md) |
| Permissions model filename | [`permissionsModel.md`](./permissionsModel.md) — redirect; PE owns enforcement |

Agent rules: `.cursor/rules/module-interoperability.mdc`, `.cursor/rules/module-development.mdc`.
