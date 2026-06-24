# Marketplace — Strategic Positioning

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Strategic recommendation — discovery only

---

## 1. Framing

Marketplace is a **Platform Capability**, not a product module. It provides:

- Module registry and discovery
- Install lifecycle and entitlements
- Artifact distribution and runtime resolution
- Developer governance and certification

It **does not** require rebuilding — it requires **extension** toward ecosystem participation contracts (search delegate, workspace integration, partner program).

---

## 2. Strategic options

### Option A — First-Party Marketplace

**Only Vssyl-built modules** in marketplace; third-party pipeline dormant or internal-only.

| Pros | Cons |
|------|------|
| Lowest security risk | Platform cannot scale module surface area |
| Full capability integration | Contradicts long-term vision |
| Simpler ops | Wasted existing pipeline investment (~70% built) |
| Faster feature velocity for core modules | Competitive disadvantage vs. platform ecosystems |

**Fit:** Short-term focus period only. **Not recommended** as end state given existing infrastructure.

---

### Option B — Partner Marketplace (Recommended)

**Approved external developers** through curated program: application, security review, SLAs, revenue share.

| Pros | Cons |
|------|------|
| Leverages existing pipeline + admin portal | Manual review does not scale infinitely |
| Controlled security posture | Partner integration gaps remain until Phase 2 |
| Revenue opportunity (Stripe subs exist) | Business billing path incomplete |
| Aligns with certification culture | Requires partner success function |
| Matches current maturity (L2.5) | Vertical modules need capability delegates |

**Fit:** **12–24 month target state.** Incremental path from today without architectural rebuild.

---

### Option C — Open Ecosystem

**Any developer** can publish after automated checks; minimal human review.

| Pros | Cons |
|------|------|
| Maximum ecosystem velocity | Current security model relies on human review |
| App-store-like growth | No runtime behavioral monitoring |
| Developer self-service | Static registries block real integration |
| | High support burden |
| | Brand/trust risk |

**Fit:** **Not viable today.** Requires MS-01–MS-10 mitigations, dynamic registries, SDK, and automated compliance. Target 24+ months after Option B maturity.

---

### Option D — Hybrid

**Tiered model:**

| Tier | Who | Gate | Integration level |
|------|-----|------|-------------------|
| **Core** | Vssyl first-party | Internal PR + moduleSpecs | Full (in-process) |
| **Certified Partner** | Approved developers | Admin review + cert | iframe + AI context + webhooks |
| **Integrated Partner** | Strategic verticals | Enhanced review + co-engineering | Search delegate + workspace embed |
| **Community** (future) | Open developers | Automated + spot audit | Basic iframe only |

| Pros | Cons |
|------|------|
| Practical near-term + aspirational long-term | Tier management complexity |
| Protects platform trust while opening ecosystem | Requires clear tier documentation |
| Allows vertical depth (CRM, Inventory) for strategic partners | Revenue split rules per tier |

**Fit:** **Recommended end-state architecture** — implement progressively starting from Option B.

---

## 3. Formal recommendation

### **Option D (Hybrid) — executed as Option B first**

**Phase sequence:**

1. **Now → 6 mo:** Partner Marketplace (Option B) — fix billing, workspace embed, developer portal UX
2. **6 → 12 mo:** Integrated Partner tier — search delegate (M-02), activity ingest, postMessage auth bridge
3. **12 → 24 mo:** Evaluate Community tier prerequisites — automated runtime audit, SDK GA

**Rationale:**

- ~70% of marketplace infrastructure already exists; rebuilding would waste investment
- Platform capabilities (Search L2, AI Retrieval L2, Context Graph L4) are **certified for first-party** — partners need **delegate contracts**, not new capabilities
- Security model (iframe + GCS + admin gate) is **appropriate for curated partners** but not open publishing
- GCP architecture **requires no redesign** for partner distribution
- Hybrid preserves File Hub / built-in reference quality while opening vertical modules (Inventory, CRM, POS) to partners who bring domain SoR

---

## 4. Critical question: external developer blockers

If an external developer joined **tomorrow** to build Inventory, CRM, Property Management, POS, Healthcare, or Manufacturing modules:

### Can do today ✅

1. Create developer account and submit module metadata
2. Upload zip artifact to GCS (if dev bucket configured)
3. Pass baseline zip scan and structural certification (with effort)
4. Receive admin approval (after human review queue)
5. Get module installed by users (personal scope)
6. Run UI in sandboxed iframe/bundle via `/modules/run/:id`
7. Register AI context providers (partner HTTPS endpoints)
8. Register webhook AI action executors (HMAC)
9. Declare notification types in manifest (metadata discovery)
10. Subscribe to platform domain events via business webhooks (limited types)
11. Operate entirely external backend + database for domain SoR
12. Set pricing tiers (personal Stripe subs work)

### Cannot do today ❌

1. **Appear in global unified search**
2. **Register Context Graph adapter** for entity relationships
3. **Register V_Link entity types** for cross-module linking
4. **Emit events to platform activity feed**
5. **Create in-app platform notifications** via API
6. **Join platform Socket.IO realtime** rooms
7. **Render natively in business workspace hub** (no switch case / landing)
8. **Register Platform Entity types** for jobs/scheduling
9. **Participate in AI retrieval query discovery** (blocked by search)
10. **Complete business paid subscription lifecycle** (`BusinessModuleSubscription` never created)
11. **Self-serve without admin approval** (no open publishing)
12. **Use npm SDK** (documentation only)
13. **Auto-update installed users** to new version
14. **Claim `capabilities.search` in manifest** without failing compliance
15. **Run in-process API routes** on Vssyl server (by design)
16. **Access Drive/Chat/Calendar data directly** (must use platform APIs if exposed + user auth)
17. **Use platform GCS for general module attachments** (artifact bucket only)
18. **Enforce manifest permissions via platform PE** for entity actions
19. **Get sandbox/test tenant** automatically
20. **Pass automated runtime tenant isolation audit**

### Vertical-specific blockers

| Vertical | Additional blockers |
|----------|---------------------|
| **Inventory** | No search; no V_Link to products; no POS hardware bridge |
| **CRM** | No member/search integration for partner contacts; activity feed gap |
| **Property Management** | No calendar/booking platform bridge for partner units |
| **POS** | No payment terminal integration; no offline sync contract |
| **Healthcare** | No HIPAA BAA framework; no audit log export for partner actions |
| **Manufacturing** | No IoT/event ingest; no scheduler integration for partner jobs |

---

## 5. Marketplace vs. module ecosystem maturity

| Dimension | Marketplace | Module ecosystem |
|-----------|-------------|------------------|
| Distribution | L2.5 | L2 |
| Runtime | L2 | L2 |
| Governance | L3 | L2 |
| Capability participation | L1 | L1 |
| Developer experience | L1.5 | L1 |
| Business integration | L1 | L1 |

**Ecosystem maturity lags marketplace maturity** because static platform registries were built for first-party reference modules, not dynamic partner onboarding.

---

## 6. Competitive positioning

| Platform model | Vssyl today | Target (Hybrid) |
|----------------|-------------|-----------------|
| Salesforce AppExchange | Catalog + install | + partner program |
| Shopify Apps | External SoR + iframe | Similar model fits |
| Atlassian Marketplace | Deep integration SDK | Requires search/V_Link delegates |
| Google Workspace | Strict review + APIs | Match with cert + partner tier |

**Differentiator opportunity:** AI-native modules with governed context providers + retrieval — if search delegate ships, partners get AI participation without in-process code.

---

## 7. Investment thesis

| Invest | Defer |
|--------|-------|
| Fix business billing gap | Open community tier |
| Workspace third-party embed | In-process plugin system |
| Search delegate M-02 | Marketplace recommendation ML |
| Developer portal UX | Full npm SDK (docs sufficient for MVP) |
| Partner program operations | Vertical-specific platform modules |
| postMessage auth bridge | Docker sandbox on Cloud Run |
| Activity ingest API | Context Graph partner adapters (Phase 3) |

---

## 8. Success metrics (Phase 1)

| Metric | Target |
|--------|--------|
| Partner modules approved | 3–5 pilot |
| End-to-end install → runtime success rate | >99% |
| Business workspace embed for third-party | 1+ module |
| BusinessModuleSubscription working | 100% billing path |
| Search delegate design approved | Council sign-off |
| Partner developer time-to-first-submit | <4 hours with guide |

---

**Last updated:** 2026-06-23
