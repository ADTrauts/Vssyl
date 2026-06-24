# Search Delegate — GCP Deployment Model

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Deployment architecture — **no implementation**  
**Authority:** [MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md](./MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md), [SEARCH_DELEGATE_ARCHITECTURE.md](./SEARCH_DELEGATE_ARCHITECTURE.md)

---

## 1. Question

Can Search Delegates operate within existing Vssyl GCP infrastructure without architectural changes?

**Answer: Yes.** Search delegate proxy runs entirely within the existing **Cloud Run API service**. Partner endpoints run on **partner infrastructure** (which may also be Cloud Run).

---

## 2. Deployment topology

```
┌─────────────────────────────────────────────────────────────────┐
│ Google Cloud — Vssyl Project (vssyl-472202)                      │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │ Cloud Run        │         │ Cloud SQL PostgreSQL          │  │
│  │ vssyl-server     │────────►│ Module, ModuleVersion,        │  │
│  │                  │         │ ModuleInstallation            │  │
│  │ NEW: partner     │         └──────────────────────────────┘  │
│  │ SearchDelegate   │                                            │
│  │ Proxy (in-proc)  │         ┌──────────────────────────────┐  │
│  │                  │         │ Secret Manager                │  │
│  └────────┬─────────┘         │ JWT_SECRET                    │  │
│           │                   └──────────────────────────────┘  │
│           │ HTTPS egress                                         │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ POST + Search Delegate JWT
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Partner infrastructure (any cloud / on-prem)                     │
│  e.g. Partner Cloud Run service                                  │
│  https://api.partner.example.com/vssyl/v1/search                 │
│  Partner DB (isolated)                                           │
└─────────────────────────────────────────────────────────────────┘
```

**No new Vssyl Cloud Run service required.** No new GCS buckets. No new Cloud SQL tables for Phase 1B (registry is in-memory; config sourced from existing `ModuleVersion` rows).

---

## 3. Component placement

| Component | Runs on | Notes |
|-----------|---------|-------|
| `searchCapabilityService` | vssyl-server Cloud Run | Existing |
| `partnerSearchDelegateRegistry` | vssyl-server memory | Rebuilt on sync; multi-instance = eventual consistency (acceptable) |
| `partnerSearchDelegateProxy` | vssyl-server | Outbound HTTPS via Cloud Run default egress |
| JWT issuance | vssyl-server | Uses `JWT_SECRET` from Secret Manager |
| Dynamic registry load | vssyl-server startup + sync | Reads Cloud SQL |
| Partner delegate endpoint | **Partner Cloud Run** (typical) | Not Vssyl-managed |
| Module UI (iframe) | vssyl-web + partner CDN/GCS | Existing marketplace runtime |

---

## 4. Multi-instance Cloud Run considerations

| Concern | Mitigation |
|---------|------------|
| **In-memory registry drift** | Each instance loads on startup; `syncModule` on admin action; nightly `syncAllModules` |
| **Circuit breaker state** | Per-instance (acceptable); optional Redis shared state Phase 2 |
| **Concurrent egress** | Cloud Run scales horizontally; each instance calls partners independently |
| **Cold start** | Registry warm on boot from DB query (~12 approved modules today — negligible) |

**Optional Phase 2:** Redis registry cache if partner count >50.

---

## 5. Networking & egress

| Property | Value |
|----------|-------|
| **Egress** | Cloud Run default internet egress to partner HTTPS URLs |
| **VPC** | Not required for delegate calls |
| **Private Google Access** | N/A |
| **Partner → Platform** | Not required for search (platform initiates) |
| **Firewall** | Partners must allow Vssyl egress IPs OR public internet (document allowlist optional) |

**Cloud Run egress IP note:** IPs may vary unless VPC connector with static NAT — document for enterprise partners in developer guide.

---

## 6. Integration with existing marketplace runtime

| Marketplace piece | Search delegate interaction |
|-------------------|----------------------------|
| **GCS artifact / iframe** | Independent — UI unrelated to search |
| **ModuleVersion.manifestSnapshot** | Source of delegate config |
| **ModuleRegistrySyncService** | Load trigger |
| **Admin portal** | Test Lab probe |
| **Certification gate** | Blocks publish without valid delegate |

**No change** to GCS CORS, artifact pipeline, or ModuleHost.

---

## 7. Environment matrix

| Environment | Search delegate behavior |
|-------------|-------------------------|
| **Production** | Live partner HTTPS URLs; real JWT |
| **Staging** | Partner staging URL in manifest; staging JWT_SECRET |
| **Local dev** | `partnerSearchDelegateProxy` calls partner localhost via ngrok OR mock server |
| **CI** | Mock HTTP server (nock/msw); no live partner calls |

**Local testing:** Partner developer runs delegate on `localhost`; manifest uses ngrok URL for finalize — same pattern as artifact dev testing.

---

## 8. Secrets & configuration

| Secret / env | Purpose |
|--------------|---------|
| `JWT_SECRET` | Sign Search Delegate JWT |
| `PARTNER_SEARCH_DELEGATE_ENABLED` | Feature flag (proposed) — default `false` until pilot |
| `PARTNER_SEARCH_DELEGATE_MAX_TIMEOUT_MS` | Platform cap (3000) |
| `PARTNER_SEARCH_DELEGATE_CIRCUIT_THRESHOLD` | Optional tuning |

**No new secrets required for pilot.**

---

## 9. Observability (Cloud Logging / Monitoring)

| Metric | Type |
|--------|------|
| `partner_search_delegate_requests` | Counter by moduleId, status |
| `partner_search_delegate_latency_ms` | Histogram |
| `partner_search_delegate_timeouts` | Counter |
| `partner_search_delegate_invalid_results` | Counter |
| `partner_search_delegate_circuit_open` | Gauge |

Log-based metrics → Cloud Monitoring dashboards. Alert on timeout spike per module.

---

## 10. Deployment rollout (implementation phase)

| Step | Action |
|------|--------|
| 1 | Deploy backend with feature flag **off** |
| 2 | Deploy validator + sync (registry empty until flag on) |
| 3 | Enable flag in staging; run probe against pilot partner |
| 4 | Pilot module approved with search delegate |
| 5 | Enable flag in production for pilot moduleId allowlist |
| 6 | Expand to all certified partner modules |

**Allowlist env (pilot):** `PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST=acme-assets`

---

## 11. Cost impact

| Resource | Increment |
|----------|-----------|
| Cloud Run CPU | Marginal — outbound HTTP per search query per partner provider |
| Cloud SQL | None — existing tables |
| Egress | ~1–5 KB request + response per delegate call |
| GCS | None |

**Negligible** at pilot scale (<1000 searches/day).

---

## 12. Conclusion

| Question | Answer |
|----------|--------|
| New Cloud Run service? | **No** |
| New database? | **No** (Phase 1B) |
| New GCS? | **No** |
| Partner on Cloud Run? | **Recommended** but partner choice |
| Existing marketplace compatible? | **Yes** |

---

**Last updated:** 2026-06-23
