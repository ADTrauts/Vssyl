# Module Scope Guide (Partners)

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Authority:** `shared/src/types/module-scope.ts`, certification validator **v1.3.0+**

---

## 1. Purpose

`moduleScope` tells Vssyl **where your module may be installed** — personal dashboard, business workspace, or both. Scope is **authoritative** for marketplace browse, install, runtime, billing, and delegate context.

---

## 2. Values

| `moduleScope` | Meaning | `supportedContexts` must include |
|---------------|---------|----------------------------------|
| `personal` | Personal dashboard only | `personal` (not `business`) |
| `business` | Business workspace only | `business` (not `personal`) |
| `both` | Personal and business | `personal` and `business` |
| `internal` | Platform-only (not marketplace) | N/A for partners |

**Third-party modules:** `moduleScope` is **required**. Certification fails without it.

---

## 3. Manifest example

```json
{
  "moduleScope": "business",
  "supportedContexts": ["business"],
  "searchDelegate": {
    "supportedContexts": ["business"]
  },
  "workspaceParticipation": {
    "supportedContexts": ["business"]
  },
  "activityIngest": {
    "supportedContexts": ["business"]
  }
}
```

Every delegate block's `supportedContexts` must be a **subset** of manifest `supportedContexts`.

---

## 4. Certification requirements

| Checklist id | Rule |
|--------------|------|
| `module_scope` | Valid enum; aligns with `supportedContexts` |
| `contexts` | Sub-capabilities ⊆ top-level contexts |

---

## 5. Common mistakes

| Mistake | Result |
|---------|--------|
| Omit `moduleScope` | Certification **fail** |
| `moduleScope: business` but `supportedContexts` includes `personal` | Certification **fail** |
| Search delegate declares `personal` on business-only module | Certification **fail** |
| Install business module from personal context | Install API **403** |
| Browse wrong marketplace tab | Module hidden (by design) |

---

## 6. Choosing scope for your module

| Build this | Use |
|------------|-----|
| HR, assets, fleet, ops tools | `business` |
| Personal productivity | `personal` |
| Notes-like tools for home + work | `both` |

Reference spec: [REFERENCE_PARTNER_MODULE_SPEC.md](./REFERENCE_PARTNER_MODULE_SPEC.md) uses **`business`**.

---

## 7. Related docs

- [PARTNER_DEVELOPER_GUIDE.md](./PARTNER_DEVELOPER_GUIDE.md)
- [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md)
- Internal detail: [MODULE_SCOPE_STANDARD.md](../marketplace/MODULE_SCOPE_STANDARD.md)

**Last updated:** 2026-06-24
