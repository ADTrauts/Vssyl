# Product Context

**Authority:** System-level product model for Vssyl.  
**Not:** Per-application ProductContexts, architecture design, Policy Engine internals, UX token/layout law, commercial pricing, or implementation status.

Domain ProductContexts own detailed behavior. Canonical architecture owns technical design. Dedicated policy files own unresolved commercial and deep AI detail.

---

## Product model

Vssyl is **one contextual operational platform**: distinct application/domain surfaces plus shared platform capabilities.

Applications feel connected because they operate inside the same governed system—not because all data collapses into one domain.

**Central tension:** connected experience **with** bounded ownership.

---

## User and context model

| Context | Meaning |
|---------|---------|
| **Personal** | Individual authority, preferences, and personal work |
| **Business** | Tenant/organization authority, policies, and business work |

One platform and shared intelligence serve both. Authority and privacy boundaries remain separate. Context may cross boundaries only through **governed** mechanisms—not by default, relationship alone, or shared infrastructure alone.

Household, education, and similar concepts are not root identity peers; if active, they live with their own owners.

---

## Application and domain ownership

- **Applications** own their domain records and workflows.
- **Shared platform capabilities** support applications without taking over domain truth.
- **Dashboard** projects information; it does not own underlying domains.
- **Analytics** interprets information; it does not own operational records.
- **V_Link** connects relationships/context; it does not replace source ownership or grant access merely because a relationship exists.
- **AI** reasons over governed domain truth; it does not create a shadow system of record.

---

## Shared platform capabilities

Shared capabilities let applications participate in one coherent system. Examples (not exhaustive): identity and membership · permissions · communication · analytics · settings · presence · relationships · notifications · contextual intelligence · interoperability.

Exact contracts live in ProductContexts and architecture.

---

## Relationships (V_Link)

**V_Link** provides relationship and contextual connection across Vssyl.

Entities remain source-owned. A relationship is **not** an automatic access grant. V_Link is not universal entity ownership. Relationship context is not durable memory.

Detail: [`vlinkProductContext.md`](./vlinkProductContext.md) and V_Link architecture docs.

---

## Contextual intelligence

Vssyl’s AI philosophy describes its governed contextual intelligence as a **Digital Life Twin** concept. How visible that name should be to end users remains an **open product decision**.

At system product level:

- Intelligence uses governed Vssyl context—not generic conversation alone.
- Personal and Business remain governed scopes over shared intelligence.
- Applications remain sources of domain truth.
- Authorization is inherited; AI never expands it.
- Actions pass through appropriate domain owners.
- Model/provider is replaceable and is not product identity.
- Intelligence should reduce work rather than create another administrative surface.

Philosophy: [`aiProductPhilosophy.md`](./aiProductPhilosophy.md). Not every application must expose AI.

---

## Application and ecosystem taxonomy

Representative categories—not an exhaustive catalog:

**Direct work surfaces** — domain work. Examples: File Hub, Chat, Calendar, To-Do, HR, Scheduling, Place.

**Projection / interpretation** — Dashboard (home projections; not the whole platform); Analytics (interpretation; not domain SoR).

**Administrative** — examples: Business Administration, Members, Platform Admin. Platform Admin owns approval/certification; tenant business configuration stays with business-admin surfaces.

**Cross-cutting** — examples: Settings, Presence, Notifications.

**Creator / ecosystem**

| Surface | Role |
|---------|------|
| **Developer** | Authoring, publishing, creator-side monetization awareness |
| **Marketplace** | Discover, evaluate, install |
| **Platform Admin** | Approval / certification |

Module lifecycle owns installed-state truth. Marketplace does not own creator-economics policy.

**Relationship bridge** — V_Link (above).

Full taxonomy: [`README.md`](./README.md) and `*ProductContext.md`.

---

## Experience principles

- Context-aware rather than app-isolated
- Coherent across Personal/Business while respecting scope boundaries
- Reduce cognitive and operational burden
- Guide users without demanding constant software administration
- Prefer real-world language over exposing technical internals
- Preserve user control
- Enable cross-app continuity without collapsing domain ownership
- Use natural language where it genuinely improves interaction

Dashboard is a projection surface inside the workspace shell—not “all of Vssyl.”

Visual/interaction law: [`docs/ux/UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md).

---

## Enterprise and commercial boundary

**Vssyl remains one application/product family across customer scale.**

Enterprise needs may deepen governance, configuration, integrations, entitlements, and support/service depth **without** creating separate enterprise forks. Those deepenings are not automatic commercial packaging promises.

Commercial packaging is **not** root product identity. Open questions remain around pricing structure, enterprise commercial meaning, premium/module packaging, creator economics, and AI monetization.

See [`commercialOpenDecisions.md`](./commercialOpenDecisions.md).

---

## What this model is not

- Isolated SaaS apps · one giant monolithic domain · Dashboard-owned data
- AI replacing domain truth · unrestricted cross-context access
- Separate enterprise application forks · pricing encoded as system identity

---

## Where to go next

| Concern | Owner |
|---------|--------|
| Domain product behavior | Relevant `*ProductContext.md`, [`README.md`](./README.md) |
| Architecture | [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](../docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md), [`VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md) |
| UX | [`UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md) |
| AI philosophy | [`aiProductPhilosophy.md`](./aiProductPhilosophy.md) |
| Commercial open decisions | [`commercialOpenDecisions.md`](./commercialOpenDecisions.md) |
| Current status | [`activeContext.md`](./activeContext.md), [`progress.md`](./progress.md) — **only when needed** |
| Contributor / navigation | Root [`AGENTS.md`](../AGENTS.md) |
