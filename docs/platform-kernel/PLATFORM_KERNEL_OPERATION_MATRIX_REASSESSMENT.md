# Platform Kernel — Operation Matrix Reassessment

**Program:** Platform Kernel — L2 Certification Readiness Review  
**Review date:** 2026-06-23  
**Status:** Validation summary — governance only

---

## 1. Scope

Reassess operation-matrix coverage for:

- **Platform Activity** — read/write operations and consumer adoption
- **Domain Events** — subscribers, emitters, module participation

---

## 2. Platform Activity matrix

### Write path (canonical)

| Operation | Owner | Implementation | Status |
|-----------|-------|----------------|--------|
| `emitModuleActivityEvent` | Platform Kernel | `moduleActivityService.ts` | **Production** |
| Module adapters (`*ActivityService`) | Module owners | 18+ services | **Production** |

### Read path (canonical)

| Operation | Owner | Implementation | Adopters |
|-----------|-------|------------------|----------|
| `getFeedForUser` | Platform Kernel | `platformActivityQueryService` | Feed, AI×3 |
| `getRecentActivity` | Platform Kernel | same | Analytics, Drive recent |
| `getActivityForEntity` | Platform Kernel | same | Drive item activity |
| `getModuleActivity` | Platform Kernel | same | Analytics module |
| `getActivitySummary` | Platform Kernel | same | Analytics |
| `countModuleActivity` | Platform Kernel | same | *(available; workforce uses direct Log)* |

### Consumer disposition

| Class | Count | Status |
|-------|------:|--------|
| Migrated to query service | 7 | ✅ |
| Compliant direct Log | 2 | ✅ (delegate optional) |
| Deferred write cleanup | 1 | C-12 documented |
| Production read violations | 0 | ✅ |

### Activity matrix gap

| Gap | Severity | Finding ID |
|-----|----------|------------|
| No single runtime-validated activity operation matrix file | Advisory | PK-ACT-M5 |
| Place/workforce not delegated | Major | PK-ACT-M4 |

---

## 3. Domain Events matrix

**Source:** `server/src/events/domainEventOperationMatrix.ts`  
**Runtime validation:** `validateDomainEventOperationMatrix()` at subscriber registration

### Subscriber matrix (validated)

| Metric | Result |
|--------|--------|
| Total definitions | 9 |
| Production active (default) | **7** |
| Stubs active (default) | **0** |
| Stubs feature-flagged | 2 (opt-in only) |
| Matrix validation | **PASS** |

| ID | Class | Production |
|----|-------|:----------:|
| activity | Production | ✅ |
| socket | Production | ✅ |
| notification | Partial | ✅ |
| ai_event_consumer | Partial | ✅ |
| webhook_subscriptions | Production | ✅ |
| calendar_dashboard_bootstrap | Partial | ✅ |
| workspace_dashboard_seed | Partial | ✅ |
| search_index_stub | Stub | ❌ |
| workflow_router_stub | Stub | ❌ |

### Emitter ownership (validated)

| ID | Owner | Status |
|----|-------|--------|
| platform_emitters | Platform Kernel | ✅ |
| vlink_emitters | V_Link Program | ✅ |
| module_domain_event_services | Module owners (incl. **hr**) | ✅ |
| inline_account_settings | Account Platform | ✅ |

### Module participation (validated)

**Function:** `validateCertifiedModuleParticipation()` — **PASS**

| Module | Facade | DE emit |
|--------|--------|:-------:|
| chat | ✅ | ✅ |
| calendar | ✅ | ✅ |
| drive | ✅ delegated | ✅ |
| todo | ✅ | ✅ |
| notebook | ✅ | ✅ |
| place | ✅ | ✅ |
| dashboard | ✅ | ✅ |
| account | ✅ | ✅ |
| hr | ✅ **hrDomainEventService** | ✅ |
| scheduling | ✅ | ✅ |
| workforce_comms | ✅ | ✅ |
| orgchart | ✅ | ✅ |
| approval_hierarchy | ✅ | ✅ |

**Exempt:** analytics (activity-only), admin_portal (consumer-only)

### Registry scale

| Metric | Value |
|--------|------:|
| `DOMAIN_EVENT_TYPES` | **192** |
| HR types added (DE-2) | 12 |

*Note: `DOMAIN_EVENT_OPERATION_MATRIX.md` body still cites 180 types in one section — update during evaluation prep (documentation drift only).*

---

## 4. Cross-pillar matrix alignment

| Concern | Activity | Domain Events | Aligned? |
|---------|----------|---------------|:--------:|
| Runtime validation | Partial (tests only) | **Yes** | Partial |
| Owner documentation | Yes | Yes | ✅ |
| Certified module coverage | Via adoption report | Via participation validator | ✅ |
| Stub honesty | N/A | Yes | ✅ |

---

## 5. Reassessment verdict

| Matrix | Ready for L2 evaluation? |
|--------|--------------------------|
| Platform Activity operations | **Yes** (with documented gaps) |
| Domain Events operations | **Yes** |
| Combined | **Yes** |

---

**Last updated:** 2026-06-23
