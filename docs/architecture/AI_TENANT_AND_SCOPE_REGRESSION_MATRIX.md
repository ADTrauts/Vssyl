# AI Tenant and Scope Regression Matrix

**Program:** AI Architecture Phase 1 / 1B  
**Date:** 2026-07-12  
**Status:** Active  

| Threat scenario | Enforcement layer | Test / evidence | Expected | Remaining gaps |
|-----------------|-------------------|-----------------|----------|----------------|
| User A cannot access user B conversation | Conversation ownership / service | `ai-twin-phase1b-e2e` — another user cannot load… | Deny (empty history) | — |
| User A cannot share user B file | Drive share AuthZ | `toolExecutor` / drive share tests + governed share | Deny / 403 message | — |
| Business A cannot load business B context | Twin route membership | `ai-twin-phase1b-business-auth` | 403 | `/business-ai/interact` still mock |
| Non-member / removed / inactive | Membership `isActive` | same suite | 403 | — |
| Removed employee loses business AI | Membership check | same suite | Deny | Employee-access flag on interact path separate |
| File ID spoofing via tool args | Domain visibility/share services | toolExecutor tests | Reject | — |
| Provider fallback loses tenant | Core passes same options | provider factory + routing unit | Preserve userId/context | — |
| Model cannot write Prisma | toolExecutor uses services | Source contract tests | Pass | — |
| Household ≠ business leak | Context scope params | Orchestrator selection skips HR/scheduling without businessId | Pass | Explicit household fixture optional |
| Idempotency key cross-user / business | `beginOrReplayActionExecution` | `idempotencyPhase1b` + governed tests | Conflict | — |
| share_file without approval | governedToolExecutor | Phase 1 unit + Phase 1B approval E2E | AWAITING_APPROVAL | Inline chat UX polish |
| Duplicate approval execute | respond + ledger | `ai-twin-phase1b-approval` | Single domain call | — |
| Business fact → personal/global | remember-that scope | `knowledgeIngressPhase1b.runtime` | business scope | Correction supersede |

**Commands:** see Phase 1B closeout / test strategy.
