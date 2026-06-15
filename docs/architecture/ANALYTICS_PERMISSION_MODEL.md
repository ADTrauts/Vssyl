# Analytics Permission Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-4 — Relationship analytics constitutional architecture  
**Status:** Canonical permission rules  
**Date:** 2026-06-14  
**Parity:** [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md), [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md), [RECOMMENDATION_PERMISSION_MODEL.md](./RECOMMENDATION_PERMISSION_MODEL.md)

> **Scope:** Tenant isolation, visibility, aggregates, and redaction for relationship analytics. **Fail-closed.**

---

## Core rules

| # | Rule |
|---|------|
| AP1 | **Analytics cannot reveal hidden relationships** |
| AP2 | **Analytics cannot bypass PE** |
| AP3 | **Same fail-closed model as search and graph** |
| AP4 | **Aggregates must not enable enumeration of private entities** |
| AP5 | **Analytics never grants access** — read-only consumer |

---

## Tenant isolation

| Rule | Requirement |
|------|-------------|
| All rollups keyed by tenant | dashboardId, businessId, householdId |
| Cross-tenant dashboards | Platform admin only — aggregated PII-minimized |
| Business ADMIN | Business scope only — not other businesses |
| Event ingestion | Strip or reject events missing tenant scope |
| Warehouse partitions | Physical or logical per tenant tier |

---

## Visibility requirements

| Stage | Gate |
|-------|------|
| **Event ingest** | Emitter already authorized — metadata safe only |
| **Snapshot jobs** | System actor with scoped impersonation OR aggregate-only queries with PE |
| **Dashboard render** | User role + tenant match |
| **Export** | ADMIN + audit log |
| **AI summary** | Same aggregates user could run — not wider |

### User-facing analytics

User may see metrics about relationships **they participate in** or **entities they can list** via adapters.

**Forbidden:** Metric revealing count of files user cannot access in shared V_Link (use restricted count bucket only).

---

## Aggregate reporting

| Allowed aggregate | Forbidden aggregate |
|-------------------|---------------------|
| Count of shares user initiated | List of filenames in others' private drives |
| V_Link attachment count by type | Attachment titles cross-user |
| Accept rate of own AI suggestions | Other users' dismiss reasons with PII |
| Business member growth | Employee personal task titles |
| Public listing tag facet popularity | Private workspace tag co-occurrence matrix |

### k-anonymity guidance

Public or admin cross-user reports: suppress buckets with **k < 5** (configurable).

---

## Redaction rules

| Scenario | Rule |
|----------|------|
| Restricted V_Link attachments | Count only — `restrictedAttachmentCount` |
| Revoked shares | Include in churn — not current state detail |
| Deleted entities | Aggregate historical — no content |
| Chat relationships | Count events — no message bodies in analytics |
| HR metrics (future) | Elevated certification |

---

## Cross-module analytics

| Pattern | Rule |
|---------|------|
| V_Link cross-module attachment mix | Event metadata moduleId — high confidence |
| "Most linked module pair" | Tenant scoped — no foreign tenant |
| Federated health | Compose from per-module derived rollups — no join SoR |
| Graph density cross-surface | **Do not merge** Place + V_Link without legend |

Aligns with federation Pattern E — merge in presentation, not warehouse god table.

---

## Adapter vs event visibility parity

If adapter denies list for user, analytics dashboard for that user **must not** show higher detail from stale warehouse row.

| Mitigation | Detail |
|------------|--------|
| Recompute on read for sensitive metrics | Optional |
| Staleness TTL on snapshot metrics | Required label |
| Event-sourced metrics | Preferred for auditability |

---

## Partner / marketplace analytics

| Rule | Detail |
|------|--------|
| Partner sees own module usage aggregates | Contract scoped |
| Partner **never** sees customer relationship graph detail | Counts only |
| No partner write via analytics API | Read only |

---

## AI analytics access

See [AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md](./AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md).

---

## Failure modes

| Failure | Behavior |
|---------|----------|
| Missing tenant on rollup | Drop row + alert |
| User requests foreign tenant metric | 403 |
| Snapshot job over-broad | Fail job — do not persist |
| Re-identification risk in export | Block export |

---

## Review checklist

- [ ] Metric has tenant key  
- [ ] No PII in rollup schema  
- [ ] Restricted buckets for hidden relationships  
- [ ] PE not bypassed via analytics API  
- [ ] Confidence band shown for medium/low  
- [ ] Retention tier documented  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md) | Ecosystem |
| [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](./RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) | R2/R3 |

**Last updated:** 2026-06-14
