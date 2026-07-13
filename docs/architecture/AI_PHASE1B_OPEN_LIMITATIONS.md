# AI Phase 1B — Open Limitations

**Program:** AI Architecture Phase 1B  
**Date:** 2026-07-12  
**Status:** Explicit limitations — do not invent silent policy  

| ID | Topic | Limitation | Impact |
|----|-------|------------|--------|
| P1B-L-01 | Approval UX polish | Pending tool approvals surface in metadata + ApprovalManager uses `/api/ai/approvals`; AIChatDropdown does not yet render inline approval cards | Users may need Approvals / notifications to confirm shares |
| P1B-L-02 | Approval expiry | Tool-loop approvals = 7 days; twin action list approvals historically 24h | Align in product decision |
| P1B-L-03 | Partial failure | Domain share may fail after APPROVED status transition | Execution marked FAILED; retry policy open |
| P1B-L-04 | Stale EXECUTING | Constant `STALE_EXECUTING_MS` documented; automatic reclaim not implemented | Concurrent workers may see in-flight replay |
| P1B-L-05 | Partner webhooks | Not on governedToolExecutor | Fenced only where ActionExecutor HIGH_RISK applies |
| P1B-L-06 | Business approval overrides | Not implemented | All tenants share Phase 1 risk policy |
| P1B-L-07 | Charge on provider failure | Unchanged: consume after successful twin processing | Soft-fail refund undecided |
| P1B-L-08 | Local provider vision | Strips vision; summaries retained | Expected |
| P1B-L-09 | PDF rendering / OCR | Not required for CI; contract tests use fixtures | Scanned PDF path environment-dependent |
| P1B-L-10 | Distributed locking | Unique `idempotencyKey` only | No Redis lock |
| P1B-L-11 | Ungoverned mutation paths | ActionExecutor high-risk fenced (block), not fully migrated to governed ledger | Legacy `/api/ai/chat` still exists |
| P1B-L-12 | Business `/interact` | Still mock BusinessAIDigitalTwinService — not canonical Twin | Use `POST /api/ai/twin` + `businessId` |
| P1B-L-13 | Memory correction | “Remember that…” appends; does not hard-supersede prior fact | May show conflicting facts until Quality phase |
| P1B-L-14 | Inferred learning E2E | Promote/dismiss covered partially by existing APIs; not full Twin turn | Recorded as CERTIFIED_WITH_LIMITATION |
| P1B-L-15 | Production migration drift | Older migrations may block `migrate dev` | Use `migrate deploy` + runbook |
| P1B-L-16 | Real provider contracts | Fake providers only for Twin E2E | OpenAI/Anthropic shape unit-tested |
| P1B-L-17 | AuthZ revoke between propose and approve | Domain re-check happens at execute; dedicated fixture thin | Rely on domain 403/404 |
| P1B-L-18 | Query balance non-admin | E2E uses ADMIN to skip gating | Membership tests use admin member for allow path |

Inherited Phase 1 open decisions (P1-OD-01…12) remain unless superseded above.
