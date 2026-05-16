# Implementation guides (`docs/guides/`)

Technical references used during development and ops. **Troubleshooting** starts in [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md); long incident history is in [`../archive/troubleshooting-historical-incidents.md`](../archive/troubleshooting-historical-incidents.md).

## By topic

| Topic | File |
|-------|------|
| **Monorepo / shared code** | [`SHARED_PACKAGE_IMPORTS.md`](./SHARED_PACKAGE_IMPORTS.md), [`PRISMA_MIGRATION_DISCIPLINE.md`](./PRISMA_MIGRATION_DISCIPLINE.md) |
| **Architecture diagrams** | [`SYSTEM_ARCHITECTURE_DIAGRAM.md`](./SYSTEM_ARCHITECTURE_DIAGRAM.md), [`ARCHITECTURE_FLOW_CHART.md`](./ARCHITECTURE_FLOW_CHART.md), [`DECISION_FLOW_CHARTS.md`](./DECISION_FLOW_CHARTS.md), [`AI_SYSTEM_ARCHITECTURE_MAP.md`](./AI_SYSTEM_ARCHITECTURE_MAP.md) |
| **Build / env / DB options** | [`MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`](./MODULE_PLATFORM_ENVIRONMENT_MATRIX.md), [`ALTERNATIVE_DATABASE_SOLUTIONS.md`](./ALTERNATIVE_DATABASE_SOLUTIONS.md) |
| **Third-party modules** | [`THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](./THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) (start here), then [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) (authoritative pipeline) |
| **Module dev (long reference)** | [`MODULE_DEVELOPMENT_LONG_REFERENCE.md`](./MODULE_DEVELOPMENT_LONG_REFERENCE.md) — templates/examples; short rule: `.cursor/rules/module-development.mdc` |
| **Logging & notifications** | [`LOGGING_PHASE3_GUIDE.md`](./LOGGING_PHASE3_GUIDE.md), [`NOTIFICATION_METADATA_GUIDE.md`](./NOTIFICATION_METADATA_GUIDE.md), [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) (`emitDomainEvent` vs `emitModuleActivityEvent`, `platform:domain_event`) |
| **Authorization (Policy Engine v1)** | [`POLICY_ENGINE.md`](./POLICY_ENGINE.md) — `authorize`, `enforcePolicy`, `requirePolicy` |
| **Product / portal** | [`ADMIN_PORTAL.md`](./ADMIN_PORTAL.md), [`SIDEBAR_CUSTOMIZATION_IMPLEMENTATION_PLAN.md`](./SIDEBAR_CUSTOMIZATION_IMPLEMENTATION_PLAN.md), [`ENTERPRISE_INTEGRATION.md`](./ENTERPRISE_INTEGRATION.md) |
| **AI (in-repo plans)** | [`AI_SUGGESTIONS_DISPLAY_PLAN.md`](./AI_SUGGESTIONS_DISPLAY_PLAN.md) — *long AI architecture narratives live in* `docs/archive/guides-merged-2026/` *and* `memory-bank/aiContextSystem.md` |
| **Deep implementation** | [`TECHNICAL_IMPLEMENTATION_GUIDE.md`](./TECHNICAL_IMPLEMENTATION_GUIDE.md), [`ADVANCED_FEATURES.md`](./ADVANCED_FEATURES.md), [`ADVANCED_WORKFLOWS.md`](./ADVANCED_WORKFLOWS.md) |
| **QA** | [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) |

Add new guides here; do not place loose `.md` files under `docs/` root (see `docs/README.md`).
