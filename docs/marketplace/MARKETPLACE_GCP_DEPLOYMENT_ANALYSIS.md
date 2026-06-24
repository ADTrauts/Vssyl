# Marketplace — GCP Deployment Analysis

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only  
**Authority:** [`memory-bank/deployment.md`](../../memory-bank/deployment.md), [`docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`](../guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md)

---

## 1. Executive summary

**Vssyl's current Google Cloud architecture can support third-party module distribution without major infrastructure changes.** Module artifacts, runtime isolation, and marketplace APIs already target GCS + Cloud Run + Cloud SQL. Gaps are **application-layer** (billing, registry, workspace integration), not cloud topology.

| Question | Answer |
|----------|--------|
| Can GCP support third-party modules? | **Yes** — iframe/bundle model fits serverless |
| Can GCP support marketplace distribution? | **Yes** — GCS private artifacts + signed URLs |
| Can GCP support module upgrades? | **Yes** — version immutability + promote/rollback |
| Can GCP support module lifecycle management? | **Yes** — existing API + admin portal |
| Major architectural changes required? | **No** for MVP partner program; **Yes** for in-process integrations (deliberately avoided) |

---

## 2. Current deployment topology

```
                    ┌─────────────────┐
                    │  Cloud Build    │
                    │  (Kaniko)       │
                    └────────┬────────┘
                             │ push images
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ Cloud Run        │         │ Cloud Run        │
    │ vssyl-web        │         │ vssyl-server     │
    │ (Next.js)        │────────►│ (Express API)    │
    │ vssyl.com        │  proxy  │ *.run.app        │
    └──────────────────┘         └────────┬─────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
    ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
    │ Cloud SQL        │       │ GCS              │       │ Secret Manager   │
    │ PostgreSQL       │       │ vssyl-storage    │       │ JWT, Stripe, …   │
    │ (private IP)     │       │ module artifacts │       │                  │
    └──────────────────┘       └──────────────────┘       └──────────────────┘
                                          │
                                          ▼
                              Partner module bundles (private)
                              modules/{moduleId}/versions/{version}/
```

**Region:** us-central1  
**Build:** `cloudbuild.yaml` — Kaniko, ~5–10 min, parallel web/server  
**CI:** GitHub Actions `verify` — migrate, type-check, vitest

---

## 3. Component fit for marketplace

### 3.1 Cloud Run (API + Web)

| Requirement | Fit | Notes |
|-------------|-----|-------|
| Marketplace API hosting | ✅ | Stateless; scales with demand |
| Module runtime config API | ✅ | Short-lived signed URLs |
| In-process first-party modules | ✅ | Monorepo in same container |
| In-process third-party code | ❌ **By design** | Correct — use iframe |
| Docker sandbox for scan | ❌ | No Docker daemon in Cloud Run |
| WebSocket (realtime) | 🟡 | Requires Redis adapter for multi-instance (`SOCKET_IO_REDIS_URL`) |
| Cold start latency | 🟡 | Acceptable for API; iframe load separate |

**Verdict:** Cloud Run is appropriate for marketplace **control plane**. Partner **data plane** runs on partner infrastructure or separate Cloud Run services they operate.

### 3.2 Cloud SQL (PostgreSQL)

| Requirement | Fit | Notes |
|-------------|-----|-------|
| Module registry | ✅ | `Module`, `ModuleVersion`, installations |
| Marketplace transactions | ✅ | ACID for install/subscribe |
| Partner business data | N/A | Stored on partner systems |
| Full-text search index | ❌ Not used | Federated search; no central index yet |
| Connection pooling | ✅ | `connection_limit` in DATABASE_URL |

**Verdict:** Sufficient for marketplace metadata and install state. Partner SoR remains external.

### 3.3 Google Cloud Storage

| Requirement | Fit | Notes |
|-------------|-----|-------|
| Private module artifacts | ✅ | Uniform bucket-level access |
| Signed upload URLs | ✅ | V4 signing from API service account |
| Signed read URLs (runtime) | ✅ | 5–15 min TTL |
| Browser CORS for bundle fetch | 🟡 | Must configure bucket CORS for web origin |
| 500 MB artifact limit | ✅ | Enforced in init endpoint |
| Public artifact URLs | ❌ **Forbidden** | Correct security posture |

**Verdict:** GCS is the **correct and implemented** artifact store. Local dev without GCS cannot test upload path.

**Env vars (production):**
```
STORAGE_PROVIDER=gcs
GOOGLE_CLOUD_PROJECT_ID=vssyl-472202
GOOGLE_CLOUD_STORAGE_BUCKET=vssyl-storage-472202
```

### 3.4 Cloud Build / CI

| Requirement | Fit | Notes |
|-------------|-----|-------|
| Deploy marketplace API changes | ✅ | Automated on main push |
| Marketplace certification migration | ✅ | `20260517000000_module_version_certification` |
| Module artifact tests in CI | 🟡 | Phase 7 unit tests; no GCS in CI by default |
| Partner module builds | N/A | Partners build externally; upload zip |

**Verdict:** Platform CI supports marketplace **platform code**. Partner CI is partner responsibility.

### 3.5 Secret Manager

| Secret | Marketplace use |
|--------|-----------------|
| JWT secrets | Auth for all module APIs |
| Stripe keys | Module subscriptions |
| GCS credentials | ADC on Cloud Run (preferred) |
| Partner webhook HMAC | Stored per module config (not in runtime payload) |

**Verdict:** Adequate. Runtime endpoint correctly strips secrets from client payload.

---

## 4. Runtime isolation model

| Layer | Isolation mechanism | GCP dependency |
|-------|---------------------|----------------|
| **API process** | No partner code execution | Cloud Run container boundary |
| **Partner UI** | iframe sandbox + CSP origin checks | Browser; blob URLs for bundles |
| **Partner data** | External HTTPS APIs | Partner's Cloud Run / other |
| **Artifact integrity** | SHA-256 + baseline zip scan | GCS object immutability per version |
| **Network egress** | API calls partner URLs for AI context | Cloud Run default egress |

**ModuleHost sandbox attributes:**
```
sandbox="allow-forms allow-scripts allow-same-origin"
```

**Risk:** `allow-same-origin` required for bundle blob URLs — reduces sandbox strictness vs. pure cross-origin iframe. Mitigated by blob origin = app origin.

---

## 5. Module deployment assumptions

### What the platform assumes

1. Partner hosts UI as **HTTPS** static/bundle OR uploads **zip to GCS**
2. Partner operates **backend APIs** for data mutations
3. Partner implements **tenant scoping** on their APIs
4. AI context providers are **partner HTTPS endpoints** called server-side by Vssyl
5. Module upgrades require **new version upload + admin approval**
6. No platform redeploy needed for partner module updates

### What requires platform redeploy

1. New first-party module
2. New search provider (today)
3. New Context Graph adapter (today)
4. New V_Link entity type (today)
5. Changes to certification rules / scan logic

---

## 6. Scalability considerations

| Scenario | Current capacity | Bottleneck |
|----------|------------------|------------|
| 100 marketplace modules | ✅ | DB rows trivial |
| 10K installs per module | ✅ | Indexed FK queries |
| Concurrent runtime loads | ✅ | Signed URL + CDN-less GCS reads |
| Large bundle downloads | 🟡 | 500 MB max; client-side unzip |
| Global partner latency | 🟡 | GCS us-central1; partner chooses regions |
| Admin review queue | 🟡 | Manual; no auto-scaling reviewers |

---

## 7. Environment matrix (summary)

| Environment | Artifact upload | Runtime bundle | Sandbox |
|-------------|-------------------|----------------|---------|
| **Production** | GCS required | ✅ | Zip scan only |
| **Local (local storage)** | ❌ 503 on init | N/A | N/A |
| **Local + dev GCS bucket** | ✅ | ✅ | Zip scan |
| **CI** | ❌ Not exercised | Unit tests only | N/A |

Source: `docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`

---

## 8. GCP readiness score

| Dimension | Score (0–5) | Notes |
|-----------|-------------|-------|
| Artifact storage & delivery | 5 | Production-ready GCS pipeline |
| Compute for control plane | 5 | Cloud Run proven |
| Database for registry | 5 | Cloud SQL adequate |
| CI/CD for platform | 4 | Missing GCS integration tests in CI |
| Runtime isolation | 4 | iframe model sound; bundle same-origin tradeoff |
| Multi-instance realtime | 3 | Redis adapter optional |
| Partner infra guidance | 2 | Docs exist; no reference architecture |
| Observability for marketplace | 3 | Structured logs; no dedicated dashboards |

**Composite GCP readiness: 4.0 / 5**

---

## 9. Changes NOT required (avoid over-engineering)

- ❌ Separate Cloud Run service per partner module (iframe model sufficient)
- ❌ Kubernetes cluster for module hosting
- ❌ New database engine for marketplace
- ❌ Public CDN for artifacts (signed URLs correct)
- ❌ In-process plugin loader

---

## 10. Recommended GCP enhancements (Phase 1)

| Item | Effort | Value |
|------|--------|-------|
| Bucket CORS validation in deploy checklist | Low | Prevents bundle runtime failures |
| GCS-backed CI smoke test (dev bucket) | Medium | Catches upload regressions |
| Marketplace log-based metrics (Cloud Monitoring) | Low | Install/runtime error rates |
| Document partner reference architecture (Cloud Run + Cloud SQL) | Medium | Developer onboarding |
| Redis adapter verification for production WS | Medium | Multi-instance realtime |

---

## 11. Answer: major architectural changes?

**For third-party module distribution via marketplace:** **No major GCP changes required.**

**For full platform ecosystem parity (search, V_Link, activity feed):** **Application architecture changes required** — not cloud topology. These are delegate APIs and ingest bridges, deployable on existing Cloud Run services.

---

**Last updated:** 2026-06-23
