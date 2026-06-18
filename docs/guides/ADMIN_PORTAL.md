# Admin Portal

## What it is

The **Admin Portal** (`/admin-portal`) is a **platform control plane + governance surface**. It is **not** a product module and is **not** installable through the module marketplace or business workspace module registry.

- **Canonical entry:** `/admin-portal` (requires platform `ADMIN` role)
- **Canonical module governance:** `/admin-portal/modules` (submissions, certification, AI context status)
- **Legacy handoff:** `/modules/admin` redirects to `/admin-portal/modules` (do not add duplicate governance UI there)

**Architecture references:** [Control Plane Architecture](../architecture/audits/ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md) · [Satellite Mount Map](../architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) · [Operation Matrix](../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md)

---

## Access & security

| Requirement | Detail |
|-------------|--------|
| Role | Platform `ADMIN` on all admin-portal API routes |
| Session | NextAuth session with JWT forwarded to Express |
| Debug / test surfaces | Disabled unless `ADMIN_PORTAL_DEBUG_ENABLED=true` (Package 0E-E) |
| Dangerous DB migration ops | Disabled unless `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED=true` + confirm token (Package 0E-B) |

Admin Portal routes use `authenticateJWT` + `requireAdmin` from `adminPortalShared.ts` on the canonical `/api/admin-portal/*` mount.

---

## Primary sections

| Section | Path | Notes |
|---------|------|-------|
| Dashboard | `/admin-portal/dashboard` | Live stats via `adminApiService` (no mock health fallback) |
| Users | `/admin-portal/users` | User management, impersonation lab |
| Moderation | `/admin-portal/moderation` | Reported content |
| Support | `/admin-portal/support` | Support tickets (live API; error + retry on failure) |
| Modules | `/admin-portal/modules` | **Canonical** module governance + certification + AI context |
| Developers | `/admin-portal/developers` | Developer / marketplace ops |
| Analytics / BI / AI | `/admin-portal/analytics`, `business-intelligence`, `ai-system`, `ai-pipeline` | See boundary docs for ownership |
| System | `/admin-portal/system`, `system-logs`, `security`, `performance` | Platform operations |

---

## Module governance boundary (AP-F-009 / AP-F-010)

- **Do not** register `admin` as a core/installable module id in `coreModuleRegistry.ts` or `config/modules.ts`.
- **Do not** build parallel submission review UI under `/modules/admin`.
- Marketplace browsing remains at `/modules`; platform operators use **Admin Portal → Modules** for governance.

---

## API integration

Frontend calls use the Next.js API proxy (`/api/...`) via `web/src/lib/adminApiService.ts` — not raw production backend URLs.

Primary backend mount: `/api/admin-portal/*` (canonical). Satellite mounts (AI providers, logs, overrides, etc.) are documented in the [Satellite Mount Map](../architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md).

---

## Development

```bash
pnpm dev   # from repo root — web ~3000, server ~5000
```

Enable debug/test tools locally only when needed:

```bash
ADMIN_PORTAL_DEBUG_ENABLED=true
ADMIN_PORTAL_DANGEROUS_OPS_ENABLED=true   # migration delete/reset only
```

---

## File layout (high level)

```
web/src/app/admin-portal/          # Control plane pages
web/src/components/admin-portal/   # Portal shell components
web/src/lib/adminApiService.ts     # API client
server/src/routes/admin-portal/    # Canonical backend domains
```

---

## Related memory bank

Product intent and feature status: `memory-bank/adminProductContext.md`

**Last updated:** 2026-06-17 (Stage 0B-B registry cleanup)
