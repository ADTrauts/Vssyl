# AI Active Tool and Action Register

**Program:** AI Architecture Phase 1 / 1B  
**Date:** 2026-07-12  
**Status:** Active  
**Runtime SSOT:** `server/src/ai/governance/aiToolRiskRegistry.ts`  
**Policy:** [`AI_TOOL_RISK_AND_APPROVAL_POLICY.md`](./AI_TOOL_RISK_AND_APPROVAL_POLICY.md)

---

## Twin tool-loop tools (active)

| Canonical name | Module | R/W | Risk | Reversible | Approval | Idempotency | Audit | Status |
|----------------|--------|-----|------|------------|----------|-------------|-------|--------|
| list_drive_files | drive | R | READ_ONLY | Y | NEVER | N | N | Active |
| share_file | drive | W | EXTERNAL_VISIBILITY | Y | RISK_BASED → **required** | Y | Y | Active — **approval enforced** + respond executes |
| summarize_notebook_page | notebook | R | READ_ONLY | Y | NEVER | N | N | Active |
| extract_notebook_action_items | notebook | R | READ_ONLY | Y | NEVER | N | N | Active (proposals only) |
| search_places | place | R | READ_ONLY | Y | NEVER | N | N | Active |
| get_place_recommendations | place | R | READ_ONLY | Y | NEVER | N | N | Active |
| get_place_purchase_help | place | R | READ_ONLY | Y | NEVER | N | N | Active |
| create_todo | todo | W | LOW_RISK_REVERSIBLE | Y | not required | Y | Y | Active — **idempotent** |

---

## Adjacent paths (Phase 1B)

| Path | Notes | Gap |
|------|-------|-----|
| `ActionExecutor` HIGH_RISK ops | Fenced — silent execute blocked for share/delete/send/… | Not on governed ledger yet |
| `ActionExecutorRegistry` / webhooks | Partner executors | Deferred — partner policy open |
| Retired `AutonomousActionExecutor` | Not active | Do not classify as active |
| `POST /api/ai/approvals/:id/respond` | Executes governed tool exactly once | Active |
| Notebook confirm action-items UI | User confirms outside Twin tool loop | OK — not silent |
| Media routes (image gen, whisper) | Not Twin tools | Out of Phase 1 tool register |

---

## Known gaps

- ActionExecutor not fully migrated onto `executeGovernedTool` (fence only for HIGH_RISK)
- No business-policy override table
- Inline Twin chat approval card polish deferred (`AI_PHASE1B_OPEN_LIMITATIONS.md`)
- Keep this document aligned with `aiToolRiskRegistry.ts`
