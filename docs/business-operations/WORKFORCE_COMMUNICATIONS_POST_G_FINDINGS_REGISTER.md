# Workforce Communications Post-Phase-G Findings Register

**Module id:** `workforce_comms`  
**Register date:** 2026-06-14  
**Status:** Post-Phase-G re-evaluation  
**Prior register:** F-WC-001..005 (pre-Phase-G; not persisted as standalone doc)

---

## Summary

| Category | Count |
|----------|-------|
| **Closed (Phase G)** | 5 |
| **Open — Major** | 0 |
| **Open — Advisory** | 4 |
| **Blocking** | 0 |

---

## Closed findings (verified Phase G)

| ID | Severity | Finding | Closure evidence | Blocks cert? |
|----|----------|---------|------------------|--------------|
| **F-WC-001** | Major | `workforce_comms` missing from `registerBuiltInModules.ts` AI `contextProviders` | Module definition + `workforce_comms_overview` / `workforce_comms_reach` providers; `workforceCommsCertificationClosure.test.ts` | Was no |
| **F-WC-002** | Major | No `workforce_*` in notifications page / API discovery | `LEGACY_TYPE_MAPPING` + `WORKFORCE_NOTIFICATION_TYPE_CATEGORIES` + `CATEGORY_ICONS.workforce_comms` | Was no |
| **F-WC-003** | Major | Manifest notifications all `planned: true` while live types emit | Live types without `planned`; `workforce_ack_reminder` remains planned; taxonomy + manifest tests | Was no |
| **F-WC-004** | Major | AI routes lack `checkWorkforceCommsPolicy` | PE on `/ai/context/overview` and `/ai/context/reach`; 32/32 routes gated | Was no |
| **F-WC-005** | Major | `WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` stale (Phase 0C) | Post-implementation matrix with Phase A–G truth | Was no |

---

## Open findings (post-G)

### Advisory

| ID | Severity | Finding | Evidence | Blocks cert? | Recommended action |
|----|----------|---------|----------|--------------|-------------------|
| **F-WC-006** | Advisory | Server `notificationGroupingService.ts` lacks `workforce_*` type → module category mapping (client has mappings; server grouping may infer incorrectly) | `grep workforce_ notificationGroupingService.ts` → 0 matches; HR/scheduling entries present | No | Add `workforce_*` entries mirroring HR/scheduling pattern |
| **F-WC-007** | Advisory | `workforce_attachment_added` in activity taxonomy but not emitted from `workforceAttachmentService` | Taxonomy line 96; no `recordAttachment*` in activity service | No | Emit on successful attachment add or remove from taxonomy until wired |
| **F-WC-008** | Advisory | `workforce_ack_reminder` declared `planned: true` — no scheduled job / emitter | Manifest + taxonomy; no `notifyAckReminder` implementation | No | Implement reminder job in future phase; keep `planned: true` |
| **F-WC-009** | Advisory | Operation matrix lives under `docs/business-operations/` not `docs/architecture/audits/` (File Hub / Chat pattern) | Matrix path; file target matrix listed `audits/` as alternate | No | Copy or symlink audit-trail matrix to `docs/architecture/audits/` on council ratification |

### Deferred by blueprint (not findings)

| Item | Status | Notes |
|------|--------|-------|
| Emergency alert system | Out of scope Phase G | Evaluate-only per roadmap |
| SMS / email campaigns | Future | Not in A–G charter |
| WC AI write executors | N/A | Read-only module; no write executor required at L3 |
| HR policy/announcement bridge HR-side wiring | Deferred by design | `onHrPolicyBroadcastRequested` / `onHrAnnouncementBroadcastRequested` exported; HR calls when ready — onboarding bridge wired |

---

## Severity definitions

| Severity | Definition |
|----------|------------|
| **Blocking** | Prevents Level 3 — constitutional violation or manifest lie on live capability |
| **Major** | Level 3 gate partial on primary mutation surface; tracked on certificate |
| **Advisory** | Parity, hygiene, or deferred-scope item; remediation within 90 days |

---

## Findings closure policy

- F-WC-001..005: **Closed** — do not reopen unless regression detected in CI or audit.
- F-WC-006..009: **Open advisory** — council may accept at ratification or require 90-day remediation plan (recommended: accept with plan, same as HR F-HR-004..009).

---

## Related

- [WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md](./WORKFORCE_COMMUNICATIONS_POST_G_CERTIFICATION_REEVALUATION.md)
- [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md)
