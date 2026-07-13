# AI Phase 1 Open Decisions

**Program:** AI Architecture Phase 1 / 1B  
**Date:** 2026-07-12  
**Status:** Open — do not invent silent policy  

| ID | Topic | Current Phase 1 stance | Needs product/eng confirmation |
|----|-------|------------------------|--------------------------------|
| P1-OD-01 | Direct user command as confirmation | Intent only; EXTERNAL_VISIBILITY still needs approval | Confirm UX copy for share_file |
| P1-OD-02 | Query charge on provider failure | Unchanged: consume after successful twin processing in route | Document if soft-fail consume should refund |
| P1-OD-03 | Approval expiry | 7 days for tool-loop approvals created in governed executor | Align with twin action 24h expiry? |
| P1-OD-04 | Retry after partial failure | FAILED rows may retry (increment retryCount) | Cap retries? |
| P1-OD-05 | Reversal behavior | Not implemented for share_file | Who unshares? |
| P1-OD-06 | Partner webhook execution | Not migrated to governed executor | Risk policy for webhooks |
| P1-OD-07 | Business-specific approval overrides | Not implemented | Schema + UI |
| P1-OD-08 | ActionExecutor activity logging | Uneven; high-risk fenced in Phase 1B | Full governed migration |
| P1-OD-09 | Unclassified ActionExecutor actions | HIGH_RISK set fenced; others deferred | Expand register |
| P1-OD-10 | Charging when approval pending | Twin text still may charge after turn | Clarify |
| P1-OD-11 | create_todo without approval | Kept (LOW_RISK) | Confirm with product |
| P1-OD-12 | Knowledge ingress classifier | Runtime remember-that tested; distributed heuristics remain | Single classifier later? |
| P1-OD-13 | Memory fact supersede | Append-only on correction phrases | Quality phase |

**Phase 1B limitations catalog:** [`AI_PHASE1B_OPEN_LIMITATIONS.md`](./AI_PHASE1B_OPEN_LIMITATIONS.md)  
Related audit confirmations (CONFIRM-01…06) remain **Needs Discussion** unless superseded here.
