# AI Pipeline Operator RBAC

**Program:** AI Architecture Phase 4B  
**Date:** 2026-07-12  
**Implementation:** `server/src/ai/operations/operationsRbac.ts` + Admin Portal `authenticateJWT` / platform `ADMIN`

---

## Principle

Do **not** invent a second role system. Pipeline operator APIs require the same platform admin gate as the rest of the Admin Portal.

---

## Authorization model

| Check | Rule |
|-------|------|
| Authentication | JWT via `authenticateJWT` |
| Authorization | `req.user.role === 'ADMIN'` |
| Permissions | Fine-grained `AIOperationsPermission` for ADMIN (and optional READ_ONLY test override) |
| Business scope | **Deferred** — `x-ai-operations-business-id` is **ignored** and does not grant access |

---

## Mapping former Phase 4 roles

| Former Phase 4 role | Phase 4B |
|---------------------|----------|
| PLATFORM_ADMIN | Platform ADMIN JWT |
| PLATFORM_OPERATOR | Platform ADMIN JWT (same gate today) |
| BUSINESS_ADMIN / BUSINESS_AI_MANAGER | Deferred — no unverified header grant |
| READ_ONLY_AUDITOR | Admin-only test header `x-ai-operations-role: READ_ONLY_AUDITOR` |
| SUPPORT_ENGINEER | Deferred |

---

## Business-scope denial

```text
Client sends x-ai-operations-business-id + business role
→ buildOperationsAuthContext ignores businessId
→ Non-ADMIN → 403
→ ADMIN → full platform operator access (not tenant-limited by header)
```

When business operator UI ships, validate:

1. Authenticated user  
2. `BusinessMember` membership  
3. Business role  
4. Allowed operator scope  

---

## Related

- [`AI_OPERATIONS_CENTER_RBAC.md`](./AI_OPERATIONS_CENTER_RBAC.md) — historical Phase 4 (banner)
- Admin Portal: `adminPortalAuth.ts` / `requireAdmin`
