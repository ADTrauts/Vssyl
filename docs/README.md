# Vssyl Documentation Index

This directory contains human-readable guides and references for development, deployment, and operations. For AI context and product/architectural decisions, see the [`memory-bank/`](../memory-bank/) directory.

## 📚 Documentation Organization

### Setup Guides (`setup/`)

Step-by-step instructions for configuring external services and integrations:

- **GOOGLE_CLOUD_SETUP.md** - Complete Google Cloud Platform setup
- **STRIPE_SETUP_GUIDE.md** - Payment processing integration
- **SMTP_SETUP.md** - Email service configuration
- **EMAIL_NOTIFICATIONS_SETUP.md** - Email notification system
- **PUSH_NOTIFICATIONS_SETUP.md** - Push notification setup
- **AI_SETUP_GUIDE.md** - AI service integration
- **UPDATE_SECRETS_GUIDE.md** - Secret / env update procedures (moved from `docs/` root April 2026)

### Plans and audits (`plans/`)

Roadmaps, phased execution plans, and analysis summaries. See [`plans/README.md`](./plans/README.md) for an index.

### Deployment Guides (`deployment/`)

Production deployment procedures and optimization:

- **PRODUCTION_DEPLOYMENT.md** - Complete production deployment guide
- **GOOGLE_CLOUD_DEPLOYMENT.md** - Cloud Run deployment process
- **QUICK_DEPLOY.md** - Production `DATABASE_URL` / deploy notes (moved from repo root April 2026)
- **AUTOMATIC_MIGRATION_DEPLOYMENT.md** - How migrations run in Cloud Build vs container startup
- **BUILD_OPTIMIZATION_GUIDE.md** - Build performance optimization
- **FAST_BUILD_SETUP.md** - Quick build configuration
- **ULTRA_FAST_BUILD_GUIDE.md** - Advanced build optimization
- **GOOGLE_CLOUD_COST_OPTIMIZATION.md** - Cost management strategies
- **BUILD_CACHING_GUIDE.md** - Build cache / remote cache notes (moved from `docs/` root April 2026)

### Implementation Guides (`guides/`)

Technical implementation references and troubleshooting — **index:** [`guides/README.md`](./guides/README.md).

- **TECHNICAL_IMPLEMENTATION_GUIDE.md** - Comprehensive technical reference
- **TROUBLESHOOTING.md** - Common issues and solutions (incident history: `archive/troubleshooting-historical-incidents.md`)
- **PRISMA_MIGRATION_DISCIPLINE.md** - Schema change workflow and quick commands
- **ADVANCED_FEATURES.md** - Advanced feature documentation
- **ADVANCED_WORKFLOWS.md** - Complex workflow implementations
- **SYSTEM_ARCHITECTURE_DIAGRAM.md** - System architecture overview
- **ARCHITECTURE_FLOW_CHART.md** - Application flow diagrams
- **LOGGING_PHASE3_GUIDE.md** - Logging rollout / phases
- **NOTIFICATION_METADATA_GUIDE.md** - Notification types and manifests
- **TESTING_CHECKLIST.md** - Manual testing checklist
- **ALTERNATIVE_DATABASE_SOLUTIONS.md** - DB options notes
- **ENTERPRISE_INTEGRATION.md** - Enterprise integration reference
- **ADMIN_PORTAL.md** - Admin portal overview (moved from `docs/` root April 2026)
- **THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md** - Partner onboarding index (links pipeline, AI context, notifications)

**AI architecture / module AI guides** were consolidated (April 2026). Living rules: `memory-bank/aiContextSystem.md`. Archived copies: `archive/guides-merged-2026/`. **AI runbooks:** [`ai/README.md`](./ai/README.md).

### Archive (`archive/`)

Historical records and session summaries — **structure:** [`archive/README.md`](./archive/README.md).

- **`session-summaries/`** - Development session notes and completion summaries
  - `business-workspace/` - Business workspace implementation sessions
  - `admin-access/` - Admin access setup sessions
  - `org-chart/` - Org chart implementation sessions
  - `fixes/` - Bug fix and issue resolution sessions
  - `active-context-archive-2026-04-pretrim.md` - Older narratives trimmed from `memory-bank/activeContext.md`
  - `BUSINESS_FRONT_PAGE_PROGRESS.md`, `COMPREHENSIVE_ADMIN_PORTAL_ANALYSIS.md`, `COMPREHENSIVE_CODEBASE_ANALYSIS.md`, `PIN_ICON_OPTIONS.md` - Moved from `docs/` root April 2026
- **`migration/`** - Migration scripts and historical data
  - Database schema migrations
  - Pricing system changes
  - Feature migration records
  - `CLEAN_RESTART_COMPLETE.md`, `DEPLOYMENT_INSTRUCTIONS.md` (Jan 2026 snapshots)
- **`guides-merged-2026/`** - Archived long-form AI docs (see folder README)
- **`stripe-merged-2026/`** - Archived duplicate Stripe markdown (see folder README)
- **`hr-merged-2026/`** - Archived HR framework completion docs (see folder README)
- **`troubleshooting-historical-incidents.md`** - Full incident log moved from memory bank

## 🎯 Quick Links

### For Developers

- [Technical Implementation Guide](./guides/TECHNICAL_IMPLEMENTATION_GUIDE.md)
- [Third-party module developers](./guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) (marketplace partners)
- [Troubleshooting Guide](./guides/TROUBLESHOOTING.md)
- [Build Optimization](./deployment/BUILD_OPTIMIZATION_GUIDE.md)

### For DevOps

- [Production Deployment](./deployment/PRODUCTION_DEPLOYMENT.md)
- [Google Cloud Setup](./setup/GOOGLE_CLOUD_SETUP.md)
- [Cost Optimization](./deployment/GOOGLE_CLOUD_COST_OPTIMIZATION.md)

### For Setup

- [Stripe Integration](./setup/STRIPE_SETUP_GUIDE.md)
- [Email Configuration](./setup/SMTP_SETUP.md)
- [AI Services](./setup/AI_SETUP_GUIDE.md)

## 📖 Documentation Philosophy

### docs/ vs memory-bank/

**docs/** - Human-readable operational guides
- ✅ Step-by-step tutorials
- ✅ Setup procedures
- ✅ Deployment instructions
- ✅ Troubleshooting references

**memory-bank/** - AI knowledge base
- ✅ Product context (why features exist)
- ✅ System architecture (how things work)
- ✅ Current state (what's done, what's next)
- ✅ Technical patterns and decisions

**Rule of thumb**: 
- If it's **"how to do X"** → goes in `docs/`
- If it's **"why we did X"** or **"how X works"** → goes in `memory-bank/`

## 🔄 Documentation Updates

### Adding New Documentation

1. **Setup Guides**: Place in `docs/setup/`
2. **Deployment Procedures**: Place in `docs/deployment/`
3. **Implementation References**: Place in `docs/guides/`
4. **Session Notes**: Archive in `docs/archive/session-summaries/`

### Updating Documentation

- Update this README when adding major new guides
- Keep guides focused and actionable
- Cross-reference memory-bank for architectural context
- Archive outdated guides instead of deleting them

## 📝 Contributing

When creating new documentation:

1. **Be specific** - Exact commands, file paths, and examples
2. **Be complete** - Include prerequisites, steps, and verification
3. **Be maintainable** - Date major updates, note version changes
4. **Cross-reference** - Link to related docs and memory-bank files

## 🔗 Related Resources

- [Plans index](./plans/README.md) - Roadmaps and phased plans in `docs/plans/`
- [Guides index](./guides/README.md) - Implementation guides in `docs/guides/`
- [Archive index](./archive/README.md) - What lives under `docs/archive/`
- [AI runbooks index](./ai/README.md) - Vision / provider operational docs
- [Memory Bank](../memory-bank/) - AI context and architectural decisions
- [Project Brief](../memory-bank/projectbrief.md) - Project overview and goals
- [System Patterns](../memory-bank/systemPatterns.md) - Architectural patterns
- [Tech Context](../memory-bank/techContext.md) - Technology stack details
- [Progress](../memory-bank/progress.md) - Current status and completed features

---

**Last Updated**: April 19, 2026  
**Organization**: Vssyl Platform Documentation Team
