# Marketplace & Module Ecosystem — Phase 1B-C Closeout

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1B-C — Workspace Embed & Auth Bridge Foundation  
**Date:** 2026-06-24  
**Status:** **Complete**

---

## 1. Bottom line

Phase 1B-C moves certified partner modules from **standalone iframe guests** toward **native workspace participants**. The business workspace default route now embeds partner modules via `PartnerModuleWorkspaceEmbed` + secure postMessage auth bridge. Session tokens remain server-side.

---

## 2. Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Workspace contract exists | ✅ `PARTNER_WORKSPACE_CONTRACT.md` + shared types |
| 2 | Auth bridge exists | ✅ JWT + postMessage + init/verify APIs |
| 3 | Session tokens protected | ✅ Bridge JWT only; no session in postMessage |
| 4 | Workspace participation registration | ✅ Manifest + registry + certification |
| 5 | Sandbox validation | ✅ Admin workspace-bridge-probe |
| 6 | Tests pass | ✅ 10 marketplace + certification tests |
| 7 | Documentation updated | ✅ |

---

## 3. Deliverables

### Code
- `shared/src/types/workspace-bridge.ts`
- `server/src/marketplace/workspace*` (manifest, registry, JWT, probe, sync, sandbox pilot)
- `server/src/controllers/module/moduleWorkspaceBridgeController.ts`
- `web/src/components/PartnerModuleWorkspaceEmbed.tsx`
- `web/src/components/ModuleHost.tsx` (bridge messages)
- `web/src/components/business/BusinessWorkspaceContent.tsx` (partner default case)

### Documentation
- `WORKSPACE_EMBED_RUNTIME_FOUNDATION.md`
- `POSTMESSAGE_AUTH_BRIDGE.md`
- `PARTNER_WORKSPACE_CONTRACT.md`
- Updated `WORKSPACE_PARTICIPATION_ARCHITECTURE.md`

---

## 4. Out of scope (unchanged)

- Billing fixes, Activity ingest, Context Graph, V_Link, developer portal, open ecosystem

---

## 5. Recommended next steps

1. Sandbox HTML bundle for `vssyl-pilot-assets` that consumes `vssyl:workspace:v1:host:init`
2. Personal workspace embed parity
3. Theme/branding propagation from business configuration
4. Sidebar icon from manifest metadata

---

**Last updated:** 2026-06-24
