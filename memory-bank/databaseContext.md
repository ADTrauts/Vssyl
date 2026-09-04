# Database Context

**Last verified:** 2026-09-03  
**Role:** Concise orientation to Vssyl data organization  
**Authority:** Modular Prisma files + migrations + [`database-prisma.mdc`](../.cursor/rules/database-prisma.mdc) win. This file does **not** replace the schema.

---

## Non-negotiables

1. Edit **`prisma/modules/**/*.prisma` only**.
2. **`prisma/schema.prisma` is generated** — never hand-edit.
3. Schema changes require **migrations** (`pnpm prisma:migrate` / deploy workflow).
4. **Never edit already-applied migration files** — add a new migration.
5. Preserve **tenant / resource ownership** fields and query scoping (`dashboardId`, `businessId`, `householdId`, etc. as applicable).
6. Use **`pnpm`** Prisma scripts from the repo root (not ad-hoc `npm run` / `npx` as the primary workflow).

Operational detail: [`docs/guides/PRISMA_MIGRATION_DISCIPLINE.md`](../docs/guides/PRISMA_MIGRATION_DISCIPLINE.md).

---

## Layout

```text
prisma/
├── schema.prisma          # GENERATED — do not edit
├── modules/               # SOURCE — edit here
│   ├── auth/
│   ├── business/
│   ├── chat/
│   ├── drive/
│   ├── calendar/
│   ├── todo/
│   ├── notes/
│   ├── notebook/
│   ├── ai/
│   ├── billing/
│   ├── admin/
│   ├── hr/
│   ├── scheduling/
│   ├── workforce_comms/
│   ├── place/
│   └── platform/          # e.g. V_Link
├── migrations/
└── README.md
```

Exact files change over time — list directories with `ls prisma/modules`, not this document.

---

## Workflow (root)

```bash
pnpm prisma:build      # assemble schema from modules
pnpm prisma:generate   # build + generate client
pnpm prisma:migrate    # build + migrate dev
pnpm prisma:migrate:deploy  # production-style deploy
pnpm prisma:studio
```

Check drift with `pnpm prisma migrate status` before destructive steps. Do **not** reset a database to “fix” drift unless data loss is explicitly approved.

---

## Domain map (orientation only)

| Area | Typical module folder | Notes |
|------|----------------------|--------|
| Identity / users | `auth/` | Users, prefs, profile |
| Business / org / dashboard | `business/` | Includes org-chart models; **authz ≠ PE** |
| Chat | `chat/` | Conversations / messages |
| File Hub | `drive/` | Files / folders |
| Calendar / Todo / Notes / Notebook | matching folders | Module SoR tables |
| AI | `ai/` | Twin/pipeline/memory-related tables |
| Billing | `billing/` | Subscriptions / pricing |
| Admin / security | `admin/` | Control-plane / audit-ish |
| HR / Scheduling / Workforce Comms | matching folders | Business ops |
| Place | `place/` | Place domain |
| Platform | `platform/` | Cross-cutting (e.g. V_Link) |

Product intent for modules lives in `*ProductContext.md`. Architecture for trash/events/PE lives under `docs/architecture/`.

---

## Related

- Rules: [`database-prisma.mdc`](../.cursor/rules/database-prisma.mdc)
- Stack card: [`techContext.md`](./techContext.md)
- Module contract: [`moduleSpecs.md`](./moduleSpecs.md)
