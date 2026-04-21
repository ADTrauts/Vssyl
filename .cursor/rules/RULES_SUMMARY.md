# Vssyl Application Rules - Quick Reference

This is a quick reference guide to all documented rules. For complete details, see the specific rule files.

## 📋 Rule Files Location

- **`.cursor/rules/core.mdc`** - Core workflow, plan/act behavior, and reuse-first rules
- **`.cursor/rules/memory-bank.mdc`** - Memory bank structure and documentation placement rules
- **`.cursor/rules/coding-standards.mdc`** - Broad coding, API, Prisma, logging, storage, and security standards
- **`.cursor/rules/module-development.mdc`** - Module-specific development requirements
- **`.cursor/rules/module-interoperability.mdc`** - Canonical interoperability contract enforcement (permissions, activity events, tenant parity for first-party and third-party)
- **`.cursor/rules/backend-trust-boundaries.mdc`** - Backend auth, tenancy, socket, and webhook guardrails
- **`.cursor/rules/frontend-proxy-auth-consistency.mdc`** - Frontend proxy, auth UX, and provider consistency guardrails
- **`.cursor/rules/release-safety-gates.mdc`** - CI, deploy, startup, healthcheck, and rollback guardrails
- **`memory-bank/AI_CODING_STANDARDS.md`** - Type safety and code quality standards

---

## 🚨 Critical Rules (MUST FOLLOW)

### 1. Reuse-First Rule (NEW - Added 2025-10-28)
- **Before creating ANY new route, model, path, component, or document:**
  - Search entire codebase and Memory Bank for existing equivalents
  - If something exists that works, use it as-is — DO NOT CHANGE IT
  - Only create new items when no suitable extension point exists
  - Document rationale when creating something new

### 2. Backend Trust Boundaries
- **Never trust client-supplied authority IDs** like `userId`, `businessId`, `dashboardId`, `householdId`, or socket room IDs by themselves
- **Resolve actor identity from trusted auth state first** (`req.user`, verified webhook signature, trusted admin flow)
- **Prove membership/ownership** with a database lookup before reads, writes, joins, emits, reactions, or read receipts
- **Secure sensitive routes at the mount point** — especially admin, debug, callback, and webhook routes

### 3. Frontend Proxy & Auth Consistency
- **Use the Next.js `/api/*` proxy** or a shared frontend API helper for browser-side requests
- **Do not call `${API_BASE_URL}` directly from normal pages/components**
- **Avoid overlapping providers** for the same route tree (business/session/config state should have one clear owner)
- **Protected route trees need one clear contract** — shared guard, server gate, or explicit forbidden state

### 4. Release Safety Gates
- **CI must run the checks that actually protect the changed area**
- **Keep tool/workspace versions aligned** across workflows, package scripts, and Dockerfiles
- **Startup should fail fast** if migrations or required readiness steps fail
- **Healthchecks must match their purpose** — shallow liveness is not the same as database-backed readiness

### 5. Environment Variables & URLs
- **NEVER hardcode localhost** in production code
- **ALWAYS use** `NEXT_PUBLIC_API_BASE_URL` with production fallback
- **Fallback hierarchy**: `NEXT_PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → production URL
- **Production URLs**:
  - Backend: `https://vssyl-server-235369681725.us-central1.run.app`
  - Frontend: `https://vssyl.com`
  - WebSocket: `wss://vssyl-server-235369681725.us-central1.run.app/socket.io/`

### 6. API Routing Pattern
- **MUST use Next.js API proxy** (`/api/[...slug]/route.ts`)
- **NEVER bypass** the proxy with direct backend URLs
- **NEVER create double `/api` paths** — use relative paths in API clients
- **Pattern**: Client calls `/api/endpoint` → Proxy forwards to backend

### 7. Prisma & Database
- **NEVER edit `prisma/schema.prisma`** directly — edit module files in `prisma/modules/*`
- **Build order**: `prisma:build` → `prisma:generate` → `prisma:migrate`
- **Connection pooling**: Always include `?connection_limit=20&pool_timeout=20`
- **Encode passwords**: Use `encodeURIComponent()` for special characters

### 8. Multi-Tenant Data Isolation (CRITICAL SECURITY)
- **Personal context**: MUST include `dashboardId` in all queries
- **Business context**: MUST include both `dashboardId` AND `businessId`
- **Household context**: MUST include both `dashboardId` AND `householdId`
- **NEVER query without context scoping** — prevents data leakage

### 9. TypeScript Type Safety
- **ZERO `any` types policy** — use `unknown`, `Record<string, unknown>`, or specific interfaces
- **Explicit router types**: Always type Express routers explicitly
- **Prisma JSON**: Use `Prisma.InputJsonValue` for JSON fields
- **Type guards**: Use type guards for runtime type checking

### 10. Authentication & Security
- **Frontend**: Use NextAuth `getToken({ req, secret })`
- **Backend**: ALWAYS check `req.user` exists before accessing properties
- **Input validation**: Use Zod or express-validator for all user input
- **Never log secrets**: Don't log tokens, passwords, or API keys

### 11. Storage Abstraction
- **ALWAYS use `storageService`** — never direct file system access
- **Production**: Set `STORAGE_PROVIDER=gcs`
- **Methods**: `uploadFile()`, `deleteFile()`, `getFileUrl()`, `getProvider()`

### 12. Logging Standards
- **New code**: ALWAYS use `logger` utility (`logger.info/error/warn`)
- **Existing code**: `console.log` is acceptable (natural migration)
- **Structured logging**: Include context (userId, operation, error details)
- **Never log secrets**: Don't log tokens, passwords, or sensitive data

### 13. Module Development (AI Context Integration)
- **MANDATORY**: Every module MUST have complete `ModuleAIContext` object
- **Required components**: purpose, category, keywords, patterns, concepts, entities, actions, contextProviders
- **Context providers**: Must respond < 500ms, use authentication, return 10-20 items max
- **Registration**: Must register AI context during module installation

### 13b. Module Interoperability (certification)
- **Authoritative contract**: `memory-bank/moduleSpecs.md`
- **Lifecycle**: authorize → execute → emit normalized activity → notify/realtime; never emit on failed/unauthorized actions
- **Parity**: Same checklist for built-in and marketplace modules (see `module-interoperability.mdc`)
- **Review**: Marketplace approval and first-party module PRs must verify the certification checklist

### 14. Documentation Rules
- **NEVER create root-level `.md` files** (except README.md)
- **Use `memory-bank/`** for AI context and persistent knowledge
- **Use `docs/`** for human-facing operational guides
- **Update existing files** rather than creating duplicates

### 15. Development Workflow
- **Start dev**: `pnpm dev` from root (starts frontend + backend)
- **Before commit**: `pnpm lint`, `pnpm type-check`, Prisma commands if DB changes
- **Build order**: Prisma build → generate → migrate (if schema changed)

---

## 📚 Detailed Rule Categories

### Google Cloud Production Infrastructure
- Machine type: `E2_HIGHCPU_8`
- Node version: 20.x
- Multi-stage Docker builds required
- Prisma generation must run BEFORE TypeScript compilation

### Authentication Patterns
- NextAuth.js for frontend token management
- JWT middleware for backend routes
- Always validate `req.user` exists (401 if not)
- Bcrypt with salt rounds >= 10

### API Design Standards
- Standard response format: `{ success: boolean, data?: T, error?: string }`
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauth), 403 (forbidden), 500 (error)
- Consistent error handling with try-catch blocks
- Proper logging for all operations

### Database Patterns
- Use Prisma for all queries (never raw SQL with user input)
- Transactions for related operations
- Proper error handling and graceful failures
- Singleton PrismaClient pattern

### Security & Validation
- Input validation (Zod, express-validator)
- XSS prevention (React auto-escapes)
- SQL injection prevention (Prisma parameterized queries)
- Rate limiting for sensitive endpoints
- Secure headers (CSP, X-Frame-Options)

### Module AI Context Requirements
- Complete `ModuleAIContext` object with all required fields
- At least one context provider endpoint
- Authentication required on all context endpoints
- Response time < 500ms
- Return 10-20 items max per provider

---

## 🔍 When to Check Rules

### Before Creating New Code
1. Check `.cursor/rules/core.mdc` — Reuse-first rule
2. Check `.cursor/rules/coding-standards.mdc` — Type safety, API patterns
3. Check `.cursor/rules/backend-trust-boundaries.mdc` when touching backend controllers, routes, services, sockets, or webhooks
4. Check `.cursor/rules/frontend-proxy-auth-consistency.mdc` when touching frontend pages, layouts, contexts, or API calls
5. Check Memory Bank — Existing patterns and contexts

### Before Creating Modules
1. Check `.cursor/rules/module-interoperability.mdc` — Contract and certification gates
2. Check `.cursor/rules/module-development.mdc` — Complete requirements
3. Check Memory Bank module contexts — Existing module patterns

### Before Documenting
1. Check `.cursor/rules/memory-bank.mdc` — Documentation placement rules
2. Check if existing docs cover the topic

### Before Deploying
1. Check `.cursor/rules/coding-standards.mdc` — Environment variables, URLs
2. Check `.cursor/rules/release-safety-gates.mdc` — CI, startup, healthchecks, rollback expectations
3. Check deployment checklist in `docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md`

---

## ✅ Quick Checklist Before Any Change

- [ ] Searched codebase for existing equivalent
- [ ] Checked Memory Bank for patterns
- [ ] Module work: `module-interoperability.mdc` + `moduleSpecs.md` certification items reviewed
- [ ] No localhost URLs in production code
- [ ] Using proper environment variable hierarchy
- [ ] Multi-tenant data scoping included
- [ ] Authentication checks in place
- [ ] Input validation implemented
- [ ] No `any` types (unless documented exception)
- [ ] Using `storageService` (not direct filesystem)
- [ ] Using `logger` utility (new code)
- [ ] Following API proxy pattern
- [ ] Prisma module pattern (not editing schema.prisma directly)
- [ ] Trust boundaries verified for backend IDs, sockets, and webhooks
- [ ] Release/health/CI changes still represent real safety gates

---

**Last Updated**: 2026-04-21  
**Status**: Comprehensive — includes audit-driven preventive rules  
**Maintainer**: Development Team

