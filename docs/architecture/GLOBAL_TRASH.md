# Global Trash architecture

**Status:** Canonical platform infrastructure (Tier 0)  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §7, §18

## Rule

**Global Trash is canonical.** Module trash views are **filtered queries** into the unified trash system — not separate delete stores.

## Implementation

| Component | Path |
|-----------|------|
| API | `server/src/controllers/trashController.ts`, `/api/trash/*` |
| Client | `web/src/contexts/GlobalTrashContext.tsx`, `GlobalTrashBin.tsx` |
| Schema | `trashedAt: DateTime?` on deletable models |

## Module requirements

- User-facing deletes set `trashedAt` (not `deletedAt`, not hard delete)
- Register module type with trash aggregation
- Restore and permanent delete use canonical trash controller logic
- Historical activity preserved on delete

## Exceptions

- **Notes** uses `deletedAt` — migrate to `trashedAt` (Batch 2)
- **V_Link archive** is separate from Global Trash (intentional)
- Chat **messages** may use message-level delete semantics (lightweight entity)

## Permanent delete

After retention window: `cleanupService` cron (§22) + `storageService` cleanup for file blobs. Migrate job to canonical trash service (no direct Prisma in job handlers long-term).

**Last updated:** 2026-05-28
