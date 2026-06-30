# Unified Search

**Domain:** Platform discovery infrastructure  
**Program:** Unified Search Capability  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §5

---

## Purpose

Federated global search across authorized module content. Answers: *Can this user find information anywhere in Vssyl they are authorized to see?*

## Scope

Orchestrator, search providers, permissions, UI (`GlobalSearchBar`). Not a product module.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Constitutional law** | [`SEARCH_CONSTITUTION.md`](./SEARCH_CONSTITUTION.md) |
| ADR | [`../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md`](../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md) |
| Operation matrix | [`UNIFIED_SEARCH_OPERATION_MATRIX.md`](./UNIFIED_SEARCH_OPERATION_MATRIX.md) |
| Provider model | [`../architecture/SEARCH_PROVIDER_MODEL.md`](../architecture/SEARCH_PROVIDER_MODEL.md) |

## Reference Documents

- [`SEARCH_PLATFORM_STANDARD.md`](./SEARCH_PLATFORM_STANDARD.md)
- [`SEARCH_CAPABILITY_CERTIFICATION_REVIEW.md`](./SEARCH_CAPABILITY_CERTIFICATION_REVIEW.md)
- [`UNIFIED_SEARCH_PHASE_0A_EXECUTIVE_SUMMARY.md`](./UNIFIED_SEARCH_PHASE_0A_EXECUTIVE_SUMMARY.md)
- [`../guides/SEARCH_DELEGATE_GUIDE.md`](../guides/SEARCH_DELEGATE_GUIDE.md)

## Reference Implementations

- `server/src/services/search/searchCapabilityService.ts`
- `web/src/components/GlobalSearchBar.tsx`
- `POST /api/search`

## Certification Status

**L2 Certified WITH FINDINGS** — ratified 2026-06-23. See [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).

## Related Domains

- [AI Retrieval](../ai/retrieval/) — parallel discovery path
- [Marketplace](../marketplace/) — search delegate registration
- [Navigation](../architecture/NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md)

## Open Decisions

- Command palette vs search-only UI (Navigation Reference Program)
- Calendar/Todo provider gaps vs manifest claims
- Business workspace tenant-scoped search context (US-F10)

**Last updated:** 2026-06-29
