# Marketplace Partner Pilot — Closeout

**Program:** Marketplace & Module Ecosystem — Phase 1B-G  
**Date:** 2026-06-24  
**Status:** ✅ Internal pilot foundation complete  
**Pilot module id:** `vssyl-pilot-assets`

---

## 1. Purpose

Close out the **internal sandbox pilot** that validates the partner capability stack end-to-end before external partner onboarding (Phase 1C).

---

## 2. Pilot scope

`vssyl-pilot-assets` is the canonical **Asset Management** sandbox module used across:

| Capability | Registration | Probe |
|------------|--------------|-------|
| Search Delegate | `registerSandboxPilotSearchDelegate` | `GET .../search-delegate-probe?live=true` |
| Workspace Bridge | `registerSandboxPilotWorkspaceBridge` | `GET .../workspace-bridge-probe?live=true` |
| Business Billing | Business-scoped install + entitlement | `GET .../business-billing-probe` |
| Activity Ingest | `registerSandboxPilotActivityIngest` | `GET .../activity-ingest-probe?live=true` |
| Module Scope | `moduleScope: business` | Readiness card scope badge |

---

## 3. Pilot activity events

| Action | User-facing concept |
|--------|---------------------|
| `create` | Asset created |
| `update` | Asset updated |
| `checked_out` | Asset checked out |
| `maintenance_scheduled` | Maintenance scheduled |

Entity: `asset` · Scope: `business`

---

## 4. Pilot validation matrix

| Step | Method | Expected | Status |
|------|--------|----------|--------|
| 1 | Enable env flags + allowlist | Registry sync on startup | ✅ Documented |
| 2 | Admin marketplace-readiness | All capabilities declared/registered when enabled | ✅ |
| 3 | Search probe (live) | Normalized results in orchestrator path | ✅ |
| 4 | Workspace probe (live) | Bridge JWT + embed contract valid | ✅ |
| 5 | Billing probe | Entitlement path resolves | ✅ |
| 6 | Activity probe (live) | Event via `emitModuleActivityEvent` | ✅ |
| 7 | Scope gate | Personal install rejected for business-only module | ✅ |
| 8 | Unit/integration tests | Marketplace test suite | ✅ |

---

## 5. Pilot limitations (accepted)

| Limitation | Impact | Target phase |
|------------|--------|--------------|
| Internal-only module id | No external partner proof | 1C |
| Feature flags default OFF | Manual ops enablement | 1C runbook |
| In-memory delegate stores | Multi-instance Cloud Run caveat | 1C/D ops |
| Sandbox delegate URLs may be internal | Not production partner HTTPS | 1C |
| No persisted probe audit trail | Admin must re-run probes | Enhancement backlog |

---

## 6. Pilot closeout decision

| Question | Answer |
|----------|--------|
| Is `vssyl-pilot-assets` sufficient to prove platform delegate architecture? | **Yes** |
| Does it replace external partner validation? | **No** |
| Is pilot closed for foundation purposes? | **Yes** |
| Next pilot wave | **Phase 1C — single external allowlisted partner** |

---

## 7. Operator checklist (enable pilot)

1. Set partner env flags to `true` and allowlist `vssyl-pilot-assets`
2. Restart `vssyl-server`
3. Confirm module APPROVED with certification passed (v1.4.0)
4. Open Admin Portal → Modules → submission detail
5. Run all four probes on readiness card
6. Install module in test business; verify workspace embed + search + activity

---

## 8. Related documents

- [SEARCH_DELEGATE_SANDBOX_PILOT.md](./SEARCH_DELEGATE_SANDBOX_PILOT.md)
- [PARTNER_ACTIVITY_SANDBOX_PILOT.md](./PARTNER_ACTIVITY_SANDBOX_PILOT.md)
- [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md)
- [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md](./MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md)

---

**Last updated:** 2026-06-24
