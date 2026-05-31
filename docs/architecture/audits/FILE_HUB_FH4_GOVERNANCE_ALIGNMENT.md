# File Hub Governance Alignment (FH-4 / P1-G1)

**Date:** 2026-05-31

---

## Platform Job Registry

| Job ID | Schedule | Handler | Delegates to | Tier |
|--------|----------|---------|--------------|------|
| `trash_permanent_delete` | `0 0 * * *` (America/New_York) | `deleteOldTrashedItems` | `permanentlyDeleteTrashedDriveFileForCleanup` / `permanentlyDeleteTrashedDriveFolderForCleanup` in `driveDeleteService` | **canonical** (was transitional) |

**Registration:** `cleanupService.startCleanupJob()` → `registerPlatformJob()`  
**Startup:** `server/src/index.ts` calls `startCleanupJob()`

---

## Compliance checklist

| Requirement | Status |
|-------------|--------|
| Single registration path | Yes |
| No duplicate cron in same file | Yes (`scheduleTrashCleanup` delegates to `startCleanupJob`) |
| Canonical delete service on permanent delete | Yes — storage + V_Link unlink |
| Documented in platform standards §22 | Referenced in this annex |
| Drift detection | **Not implemented** (platform-wide gap) |

---

## FH-4 outcome

File Hub trash cleanup job is registry-compliant and documented. Tier promoted to `canonical` after FH-4 verification.
