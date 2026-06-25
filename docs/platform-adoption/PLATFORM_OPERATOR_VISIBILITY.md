# Platform Operator Visibility

**Program:** Platform Capability Adoption — Wave 5  
**Date:** 2026-06-25  
**Status:** Complete — see [PLATFORM_ADOPTION_WAVE5_CLOSEOUT.md](./PLATFORM_ADOPTION_WAVE5_CLOSEOUT.md)

---

## Purpose

Operators need to answer **"Which modules are truly platform-native?"** without reading architecture docs or grepping the codebase.

Wave 5 adds an operational reporting surface inside **Platform Controller** that reuses:

- Phase 0A adoption matrix + scorecard baselines
- Live signals from `searchProviderRegistry`, manifests, and activity service mappings
- Existing Marketplace certification probes (partner modules)

---

## Operator surfaces

| Surface | Path | Audience |
|---------|------|----------|
| **Platform Adoption dashboard** | `/admin-portal/platform-adoption` | Fleet summary + module cards |
| **Module detail** | `/admin-portal/platform-adoption/{moduleId}` | Capability checklist + recommendations |
| **Platform Programs hub** | `/admin-portal/platform-programs` | Links to adoption dashboard (no duplicate metrics) |
| **Marketplace modules** | `/admin-portal/modules` | Partner certification + delegate probes (unchanged) |

---

## What operators see

### Fleet summary

- Average adoption score
- Modules fully searchable / AI retrieval / kernel / context graph
- Marketplace-capable module count
- Level B+ module count
- CI validation warning count

### Per-module card

- Adoption level (A–E) and label (Platform Native → Legacy)
- Score / certification / last validation
- Top gap + missing capabilities
- Link to detail view

### Module detail

- 12-capability checklist with live notes (search provider, activity service, controller visibility)
- Recent wave changes
- Recommended improvements
- Reference documentation links

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin-portal/platform-adoption` | Dashboard payload (fleet + modules + trends + validation) |
| GET | `/api/admin-portal/platform-adoption/:moduleId` | Module detail |
| GET | `/api/admin-portal/platform-adoption/validation` | CI validation result |

Admin JWT + platform ADMIN role required.

---

## Implementation map

| Component | Location |
|-----------|----------|
| Registry baseline | `server/src/platform-adoption/platformAdoptionRegistry.ts` |
| Live validation | `server/src/platform-adoption/platformAdoptionValidation.ts` |
| Operator service | `server/src/services/admin/platformAdoptionService.ts` |
| Admin routes | `server/src/routes/admin-portal/adminPortalRoutes.adoption.ts` |
| UI | `web/src/app/admin-portal/platform-adoption/` |

---

## Anti-patterns (out of scope)

- Duplicate analytics dashboards for adoption metrics
- Widget-specific or module-specific operator pipelines
- Redesigning Platform Controller IA beyond one nav item + pages

**Last updated:** 2026-06-25
