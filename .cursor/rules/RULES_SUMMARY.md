# Vssyl Application Rules - Quick Reference

This is a quick reference guide to all documented rules. For complete details, see the specific rule files.

## 📋 Rule Files Location

- **`.cursor/rules/coding-standards.mdc`** - Comprehensive coding standards (778 lines)
- **`.cursor/rules/module-development.mdc`** - Module development requirements (829 lines)
- **`.cursor/rules/core.mdc`** - Core workflow and reuse-first rules (69 lines)
- **`.cursor/rules/memory-bank.mdc`** - Memory bank structure and documentation rules (310 lines)
- **`memory-bank/AI_CODING_STANDARDS.md`** - Type safety and code quality standards

---

## 🚨 Critical Rules (MUST FOLLOW)

### 1. Reuse-First Rule (NEW - Added 2025-10-28)
- **Before creating ANY new route, model, path, component, or document:**
  - Search entire codebase and Memory Bank for existing equivalents
  - If something exists that works, use it as-is — DO NOT CHANGE IT
  - Only create new items when no suitable extension point exists
  - Document rationale when creating something new

### 2. Environment Variables & URLs
- **NEVER hardcode localhost** in production code
- **ALWAYS use** `NEXT_PUBLIC_API_BASE_URL` with production fallback
- **Fallback hierarchy**: `NEXT_PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → production URL
- **Production URLs**:
  - Backend: `https://vssyl-server-235369681725.us-central1.run.app`
  - Frontend: `https://vssyl.com`
  - WebSocket: `wss://vssyl-server-235369681725.us-central1.run.app/socket.io/`

### 3. API Routing Pattern
- **MUST use Next.js API proxy** (`/api/[...slug]/route.ts`)
- **NEVER bypass** the proxy with direct backend URLs
- **NEVER create double `/api` paths** — use relative paths in API clients
- **Pattern**: Client calls `/api/endpoint` → Proxy forwards to backend

### 4. Prisma & Database
- **NEVER edit `prisma/schema.prisma`** directly — edit module files in `prisma/modules/*`
- **Build order**: `prisma:build` → `prisma:generate` → `prisma:migrate`
- **Connection pooling**: Always include `?connection_limit=20&pool_timeout=20`
- **Encode passwords**: Use `encodeURIComponent()` for special characters

### 5. Multi-Tenant Data Isolation (CRITICAL SECURITY)
- **Personal context**: MUST include `dashboardId` in all queries
- **Business context**: MUST include both `dashboardId` AND `businessId`
- **Household context**: MUST include both `dashboardId` AND `householdId`
- **NEVER query without context scoping** — prevents data leakage

### 6. TypeScript Type Safety
- **ZERO `any` types policy** — use `unknown`, `Record<string, unknown>`, or specific interfaces
- **Explicit router types**: Always type Express routers explicitly
- **Prisma JSON**: Use `Prisma.InputJsonValue` for JSON fields
- **Type guards**: Use type guards for runtime type checking

### 7. Authentication & Security
- **Frontend**: Use NextAuth `getToken({ req, secret })`
- **Backend**: ALWAYS check `req.user` exists before accessing properties
- **Input validation**: Use Zod or express-validator for all user input
- **Never log secrets**: Don't log tokens, passwords, or API keys

### 8. Storage Abstraction
- **ALWAYS use `storageService`** — never direct file system access
- **Production**: Set `STORAGE_PROVIDER=gcs`
- **Methods**: `uploadFile()`, `deleteFile()`, `getFileUrl()`, `getProvider()`

### 9. Logging Standards
- **New code**: ALWAYS use `logger` utility (`logger.info/error/warn`)
- **Existing code**: `console.log` is acceptable (natural migration)
- **Structured logging**: Include context (userId, operation, error details)
- **Never log secrets**: Don't log tokens, passwords, or sensitive data

### 10. Module Development (AI Context Integration)
- **MANDATORY**: Every module MUST have complete `ModuleAIContext` object
- **Required components**: purpose, category, keywords, patterns, concepts, entities, actions, contextProviders
- **Context providers**: Must respond < 500ms, use authentication, return 10-20 items max
- **Registration**: Must register AI context during module installation

### 11. Documentation Rules
- **NEVER create root-level `.md` files** (except README.md)
- **Use `memory-bank/`** for AI context and persistent knowledge
- **Use `docs/`** for human-facing operational guides
- **Update existing files** rather than creating duplicates

### 12. Development Workflow
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
3. Check Memory Bank — Existing patterns and contexts

### Before Creating Modules
1. Check `.cursor/rules/module-development.mdc` — Complete requirements
2. Check Memory Bank module contexts — Existing module patterns

### Before Documenting
1. Check `.cursor/rules/memory-bank.mdc` — Documentation placement rules
2. Check if existing docs cover the topic

### Before Deploying
1. Check `.cursor/rules/coding-standards.mdc` — Environment variables, URLs
2. Check deployment checklist in `docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md`

---

## ✅ Quick Checklist Before Any Change

- [ ] Searched codebase for existing equivalent
- [ ] Checked Memory Bank for patterns
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

---

**Last Updated**: 2025-10-28  
**Status**: Comprehensive — All major rules documented  
**Maintainer**: Development Team

