# PP-2 — Business Settings Deduplication Review

**Program:** Account Platform PP-2 Package 2  
**Date:** 2026-06-20  
**Type:** Review only — **no ownership moves**

---

## Inventory

| Surface | Path | APIs | Owner |
|---------|------|------|-------|
| Workspace Settings mega-hub | `/business/[id]/workspace/settings` | `/api/business/*` | **Business Administration** |
| Business Profile page | `/business/[id]/profile` | Same business APIs | BA (duplicate UI) |
| Business Branding page | `/business/[id]/branding` | Business branding APIs | BA (duplicate UI) |
| Webhooks sub-page | `.../workspace/settings/webhooks` | Webhook routes | BA |
| Module settings | Modules UI | `/api/modules/:id/configure` | Module platform |
| HR admin settings | HR editor | `/api/hr/admin/settings` | HR module |
| Scheduling config | Tab in workspace settings | Scheduling APIs | BA + Scheduling module |

---

## Duplication analysis

### Critical: Business entity profile

| Surface | Overlap |
|---------|---------|
| Workspace settings → Profile tab | `updateBusiness` form |
| `/business/[id]/profile` standalone page | Same form components |

**Authoritative owner:** Business Administration  
**Canonical target (future):** Workspace settings profile tab  
**Package 2 action:** Documented only — no route removal

### High: Business branding

| Surface | Overlap |
|---------|---------|
| Workspace settings → Branding tab | `GlobalBrandingEditor` |
| `/business/[id]/branding` standalone | Same editor |

**Authoritative owner:** Business Administration  
**Canonical target (future):** Workspace settings branding tab

### Medium: Security tab (2FA UI)

Workspace settings security tab shows 2FA UI **without backend** — misleading (PP2-F13 advisory). Not fixed in Package 2 (MFA out of scope).

---

## Settings Platform relationship

| Role | PP-2 responsibility |
|------|---------------------|
| Settings Platform | IA cross-link (`business_settings` nav entry → `/business`) |
| Business Administration | SoR for all business configuration rows |
| Package 2 | **No ownership transfer** |

---

## Future migration path (not authorized)

1. Add redirects: `/business/[id]/profile` → workspace settings profile tab
2. Add redirects: `/business/[id]/branding` → workspace settings branding tab
3. Remove duplicate standalone pages after traffic validation
4. BA charter owns execution — not PP-2

---

## Finding closure

| Finding | Status |
|---------|--------|
| **PP2-F05** Business settings triplication | **Partial** — reviewed + documented; UI dedup deferred to BA |

---

**Last updated:** 2026-06-20 (PP-2 Package 2)
