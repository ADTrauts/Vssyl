# Module Scope Standard

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5-F  
**Date:** 2026-06-24  
**Status:** ✅ Implemented  
**Authority:** `shared/src/types/module-scope.ts`, `server/src/marketplace/moduleScopeService.ts`

---

## 1. Canonical classification

| `moduleScope` | Meaning | `supportedContexts` requirement |
|---------------|---------|--------------------------------|
| `personal` | Personal dashboard only | Must include `personal`; must **not** include `business` |
| `business` | Business workspace only | Must include `business`; must **not** include `personal` |
| `both` | Personal and business | Must include `personal` and `business` |
| `internal` | Platform-only; hidden from marketplace | No marketplace contexts required |

**Tenant contexts** (`personal`, `business`, `household`) may appear in `supportedContexts` and sub-capability blocks. `household` does not map to a `moduleScope` value in this phase.

---

## 2. Manifest requirement (third-party)

```json
{
  "moduleScope": "both",
  "supportedContexts": ["personal", "business"]
}
```

- `moduleScope` is **required** for third-party certification (`requireExplicitScope: true`).
- Built-in modules resolve scope from `BUILT_IN_MODULE_SCOPES` when manifest omits `moduleScope`.

---

## 3. Built-in scope map

| Module | Scope |
|--------|-------|
| drive, chat, calendar, todo, notes, notebook, vlink, place, dashboard | `both` |
| hr, scheduling, workforce_comms | `business` |

Source: `server/src/constants/builtInModuleScopes.ts`

---

## 4. Sub-capability alignment

When declared, these must be **subsets** of manifest `supportedContexts`:

- `searchDelegate.supportedContexts`
- `workspaceParticipation.supportedContexts`

Enforced in certification validator v1.3.0.

---

## 5. Install / browse scopes

| API scope param | Values |
|-----------------|--------|
| Marketplace browse | `personal` \| `business` |
| Install | `personal` \| `business` |
| Runtime | `personal` \| `business` |

Install target must be compatible with `moduleScope` (see enforcement doc).

---

**Last updated:** 2026-06-24
