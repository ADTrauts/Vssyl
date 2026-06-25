# Platform Adoption — CI Validation

**Program:** Platform Capability Adoption — Wave 5  
**Date:** 2026-06-25  
**Runner:** `pnpm --filter vssyl-server validate:platform-adoption`

---

## Purpose

Warn when platform participation regresses or manifests drift from registered providers. **Does not block builds by default.**

Set `PLATFORM_ADOPTION_CI_STRICT=true` to fail CI on validation **errors** (not warnings).

---

## Checks

| Code | Severity | Condition |
|------|----------|-----------|
| `SEARCH_PROVIDER_MISSING` | error | `MANIFEST_SEARCH_MODULE_IDS` entry lacks ready provider |
| `MANIFEST_SEARCH_NO_PROVIDER` | warning | Built-in manifest claims search but provider not ready |
| `AI_WITHOUT_SEARCH` | warning | Built-in declares AI but not search (verify Retrieval Adapter path) |
| `ADOPTION_SEARCH_REGRESSION` | error | Registry marks search Full but live provider missing (incl. composition parent) |
| `ACTIVITY_SERVICE_GAP` | warning | Registry marks activity Full but no activity service mapping |
| `REGISTRY_MISSING_BUILTIN` | warning | Built-in module id missing from adoption registry |

---

## Implementation

- **Validation:** `server/src/platform-adoption/platformAdoptionValidation.ts`
- **Test runner:** `server/src/platform-adoption/__tests__/platformAdoptionCiValidation.test.ts`
- **Related:** `assertManifestSearchProviderParity()` in `searchProviderRegistry.ts` (existing search tests)

---

## Local usage

```bash
cd server && pnpm validate:platform-adoption
```

Strict mode (optional gate):

```bash
PLATFORM_ADOPTION_CI_STRICT=true pnpm validate:platform-adoption
```

---

## When to update

- New search-ready module → add to `MANIFEST_SEARCH_MODULE_IDS` + registry
- Adoption wave closes → update registry baseline + trends
- Manifest capability changes → re-run validation

**Last updated:** 2026-06-25
