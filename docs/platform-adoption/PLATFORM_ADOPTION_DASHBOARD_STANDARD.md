# Platform Adoption Dashboard — Standard

**Program:** Platform Capability Adoption — Wave 5  
**Date:** 2026-06-25  
**UI:** `web/src/app/admin-portal/platform-adoption/`  
**Card:** `web/src/components/admin-portal/PlatformAdoptionCard.tsx`

---

## 1. Purpose

Every evaluated module uses the same adoption card on the Platform Adoption dashboard. New modules add a registry entry — **no card redesign**.

---

## 2. Required card fields

| Field | Source |
|-------|--------|
| Module name | `PlatformAdoptionRegistryEntry.displayName` |
| Adoption level | Score → A–E via `platformAdoptionScoring` |
| Level label | Platform Native / Strong / Partial / Minimal / Legacy |
| Score | Baseline score with live search regression adjustment |
| Certification | `certificationRef` from registry |
| Last validation | Registry ISO date |
| Top gap | Registry string |
| Missing capabilities | Derived from capability map |
| Validation warnings | `runPlatformAdoptionCiValidation()` filtered by module |

---

## 3. Detail view fields

| Section | Content |
|---------|---------|
| Capability checklist | 12 capabilities + live notes |
| Recent adoption changes | Wave history from registry |
| Recommended improvements | Registry list |
| Reference docs | Matrix + scorecard links |
| Validation warnings | Live CI warnings for module |

---

## 4. Fleet summary metrics

| Metric | Computation |
|--------|-------------|
| Average score | Mean of module card scores |
| Fully searchable | `unifiedSearch === full` count |
| AI retrieval (Full) | `aiRetrieval === full` count |
| Kernel (Full) | `platformKernel === full` count |
| Context graph (Full) | `contextGraph === full` count |
| Marketplace modules | Approved non-built-in modules in DB |
| Level B+ | Count of A + B levels |
| CI warnings | Validation error + warning count |

---

## 5. Trend reporting

Static wave milestones in `platformAdoptionTrends.ts` — updated when adoption waves close.

---

## 6. Adding a new module

1. Add entry to `PLATFORM_ADOPTION_REGISTRY` (12-char capability encoding)
2. Update `PLATFORM_ADOPTION_MATRIX.md` and scorecard if baseline changes
3. Map activity service in `platformAdoptionValidation.ts` if built-in
4. Hub auto-renders via API — **no layout change**

---

## 7. Anti-patterns

| Do not | Why |
|--------|-----|
| Embed full module dashboards in card | Duplicates product surfaces |
| Invent mock scores | Use registry + live signals only |
| Create module-specific card components | Breaks consistency |

**Last updated:** 2026-06-25
