# AI Operations Center RBAC

> **Phase 4B notice:** Phase 4 initially introduced the AI Operations Center as a separate
> route. Phase 4B consolidated into the AI Pipeline Hub and tightened RBAC to platform
> ADMIN only. Prefer [`AI_PIPELINE_OPERATOR_RBAC.md`](./AI_PIPELINE_OPERATOR_RBAC.md).

**Program:** AI Architecture Phase 4 (historical role table)  
**Implementation:** `server/src/ai/operations/operationsRbac.ts` (updated in 4B)

---

## Roles

| Role | Access |
|------|--------|
| **Platform Admin** | Full read/write across all operations endpoints |
| **Platform Operator** | Same as admin except `settings:read` omitted |
| **Business Admin** | Business-scoped read + limited evaluation write |
| **Business AI Manager** | Business-scoped read + evaluation write |
| **Read-only Auditor** | Read-only all operations views |
| **Support Engineer** | Executions, explainability, read evaluations/corrections |

---

## Resolution

- JWT `user.role === 'ADMIN'` → default `PLATFORM_ADMIN`
- Header `x-ai-operations-role` → override for testing (admin only)
- Header `x-ai-operations-business-id` + business role headers → tenant scope for business roles
- Non-admin JWT → `READ_ONLY_AUDITOR` → **403** on all operations routes today

---

## Business scoping

`canAccessBusinessRecord` enforces `businessId` match for `BUSINESS_ADMIN` and `BUSINESS_AI_MANAGER`.

---

## Non-goals

- No second approval system
- No runtime mutation via RBAC grants
- Corrections approved in UI remain routing proposals only
