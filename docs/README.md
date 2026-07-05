# Vssyl Documentation Index

This directory contains human-readable guides and references for development, deployment, and operations.

**Architecture entry point:** [`architecture/VSSYL_ARCHITECTURE_INDEX.md`](./architecture/VSSYL_ARCHITECTURE_INDEX.md)  
**Source of truth hierarchy:** [`VSSYL_SOURCE_OF_TRUTH.md`](./VSSYL_SOURCE_OF_TRUTH.md)  
**AI assistant navigation:** [`architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md)  
**Product intent:** [`memory-bank/`](../memory-bank/)

---

## Architecture governance (`architecture/`)

**Start here:** [`architecture/VSSYL_ARCHITECTURE_INDEX.md`](./architecture/VSSYL_ARCHITECTURE_INDEX.md)

| Document | Purpose |
|----------|---------|
| [VSSYL_ARCHITECTURE_INDEX](./architecture/VSSYL_ARCHITECTURE_INDEX.md) | Executive table of contents |
| [ARCHITECTURE_SOURCE_OF_TRUTH](./architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md) | Ownership matrix; edit policy |
| [ARCHITECTURE_DOMAIN_MAP](./architecture/ARCHITECTURE_DOMAIN_MAP.md) | Domain topology + certification |
| [ARCHITECTURE_HEALTH_REPORT](./architecture/ARCHITECTURE_HEALTH_REPORT.md) | Documentation health metrics |
| [AI_ARCHITECTURE_NAVIGATION_GUIDE](./architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md) | AI decision trees |
| [ARCHITECTURE_DOCUMENT_STANDARD](./architecture/ARCHITECTURE_DOCUMENT_STANDARD.md) | Template for new arch docs |
| [CERTIFICATION_LEDGER](./architecture/CERTIFICATION_LEDGER.md) | Certification dashboard |

Cross-cutting design notes: [`architecture/README.md`](./architecture/README.md)

### Domain landing pages

| Domain | README |
|--------|--------|
| Search | [`search/README.md`](./search/README.md) |
| Marketplace | [`marketplace/README.md`](./marketplace/README.md) |
| Dashboard | [`dashboard/README.md`](./dashboard/README.md) |
| Workspace | [`workspace/README.md`](./workspace/README.md) |
| Analytics | [`analytics/README.md`](./analytics/README.md) |
| Context Graph | [`context-graph/README.md`](./context-graph/README.md) |
| Platform Kernel | [`platform-kernel/README.md`](./platform-kernel/README.md) |
| Account Platform | [`account-platform/README.md`](./account-platform/README.md) |
| Business Operations | [`business-operations/README.md`](./business-operations/README.md) |
| Business Administration | [`business-administration/README.md`](./business-administration/README.md) |
| Connected Knowledge | [`connected-knowledge/README.md`](./connected-knowledge/README.md) |
| Admin Portal | [`admin-portal/README.md`](./admin-portal/README.md) |
| AI Knowledge | [`ai-knowledge/README.md`](./ai-knowledge/README.md) |
| Platform Controller | [`platform-controller/README.md`](./platform-controller/README.md) |
| Platform Portfolio | [`platform-portfolio/README.md`](./platform-portfolio/README.md) |
| Platform Adoption | [`platform-adoption/README.md`](./platform-adoption/README.md) |
| Deployment | [`deployment/README.md`](./deployment/README.md) |
| UX / Design System | [`ux/README.md`](./ux/README.md) |
| AI operations | [`ai/README.md`](./ai/README.md) |

---

## Setup Guides (`setup/`)

- **GOOGLE_CLOUD_SETUP.md** — Google Cloud Platform setup
- **STRIPE_SETUP_GUIDE.md** — Payment processing
- **SMTP_SETUP.md** — Email configuration
- **AI_SETUP_GUIDE.md** — AI service integration
- See folder for full list

---

## Deployment (`deployment/`)

**Index:** [`deployment/README.md`](./deployment/README.md)

- **PRODUCTION_DEPLOYMENT.md** — Production deployment guide
- **GOOGLE_CLOUD_DEPLOYMENT.md** — Cloud Run deployment
- **CLOUD_RUN_ROLLBACK_RUNBOOK.md** — Rollback runbook
- Build optimization guides in folder

---

## Implementation Guides (`guides/`)

**Index:** [`guides/README.md`](./guides/README.md)

- **MODULE_DEVELOPMENT_GUIDE.md** — First-party module development
- **THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md** — Marketplace pipeline
- **NOTIFICATION_METADATA_GUIDE.md** — Notification types
- **ADMIN_PORTAL.md** — Operator overview
- **TECHNICAL_IMPLEMENTATION_GUIDE.md** — Technical reference

---

## UX standards (`ux/`)

**Index:** [`ux/README.md`](./ux/README.md)

- **UX_CONSTITUTION.md** — Non-negotiable UX principles
- **DESIGN_TOKENS.md** — `--v-*` token system
- **LAYOUT_PATTERNS.md**, pattern catalog under `ux/patterns/`

---

## Plans (`plans/`)

Roadmaps and phased execution — [`plans/README.md`](./plans/README.md)

---

## Archive (`archive/`)

Historical records — [`archive/README.md`](./archive/README.md)

---

## Quick links

### For developers

- [Architecture Index](./architecture/VSSYL_ARCHITECTURE_INDEX.md)
- [AI Navigation Guide](./architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md)
- [Module Development Guide](./guides/MODULE_DEVELOPMENT_GUIDE.md)
- [Third-party modules](./guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md)

### For DevOps

- [Production Deployment](./deployment/PRODUCTION_DEPLOYMENT.md)
- [Google Cloud Setup](./setup/GOOGLE_CLOUD_SETUP.md)

### For AI assistants

1. [`VSSYL_SOURCE_OF_TRUTH.md`](./VSSYL_SOURCE_OF_TRUTH.md)
2. [`memory-bank/activeContext.md`](../memory-bank/activeContext.md)
3. [`architecture/VSSYL_ARCHITECTURE_INDEX.md`](./architecture/VSSYL_ARCHITECTURE_INDEX.md)
4. [`architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`](./architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md)

---

## docs/ vs memory-bank/

| `docs/` | `memory-bank/` |
|---------|----------------|
| Architecture truth & governance | Product intent & current focus |
| How-to guides & deployment | Why features exist |
| Certification & contracts | `activeContext.md`, `progress.md` |
| Domain README landing pages | `*ProductContext.md` per module |

**Rule:** Architecture decisions → `docs/architecture/` SoT. Product intent → Memory Bank. See [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md).

---

**Last updated:** 2026-06-29 (Architecture Governance Phase 1)
