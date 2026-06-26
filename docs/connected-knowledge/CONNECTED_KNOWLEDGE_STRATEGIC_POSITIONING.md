# Connected Knowledge Platform — Strategic Positioning

**Program:** Connected Knowledge Platform — Phase 0A (updated Phase 1A)  
**Date:** 2026-06-25  
**Status:** Phase 1A — Knowledge Composition Engine live under feature flag

**Audience:** Product leadership, architecture council, module owners, partner program

---

## 1. Positioning statement

**Vssyl is an application platform becoming a Connected Knowledge Platform** — a system where users and AI interact with **entities and their relationships** across modules, with explicit provenance and permission-respecting federation, while modules retain ownership of their data.

This is the **third platform inflection**:

| Inflection | Era | User mental model |
|------------|-----|-------------------|
| 1 | Module collection | "I open Chat, Drive, Calendar…" |
| 2 | Application platform | "The platform finds, retrieves, and connects my work" |
| 3 | **Connected Knowledge** | **"I work with people, projects, and things — the platform knows how they relate"** |

---

## 2. What we are / what we are not

### We are

| Attribute | Description |
|-----------|-------------|
| **Federated** | Knowledge composed from module SoRs + V-Link — no monolithic graph DB |
| **Governed** | Users confirm AI-suggested connections; provenance is visible |
| **Constitutional** | Relationship Taxonomy, PE, membership ≠ access — unchanged |
| **Extension of certified work** | Context Graph, V-Link, Retrieval, Search — unified consumption |
| **Entity-primary (target)** | Navigation and AI center on `nodeKey`, not module id |

### We are not

| Anti-position | Why |
|---------------|-----|
| A new "Knowledge Module" in marketplace | Knowledge is Tier 0 platform — not installable |
| A graph database product | Federation over existing storage |
| An AI that silently learns relationships | Confirmation workflow required |
| A replacement for modules | Modules remain SoRs and UX owners |
| A rewrite of V-Link or Context Graph | Evolution and extension only |

---

## 3. Competitive framing (internal)

| Alternative approach | Vssyl choice |
|---------------------|--------------|
| Universal `entities` + `relationships` tables | **Rejected** — module ownership |
| Knowledge graph as separate vendor | **Rejected** — federate in-platform |
| AI RAG only (no persisted relationships) | **Insufficient** — V-Link + module edges |
| Module-by-module linking only | **Insufficient** — cross-module hub required |
| Single search bar as "knowledge" | **Necessary but not sufficient** — need edges + provenance |

**Differentiator:** Business operations (HR, Scheduling, Workforce) on the **same** knowledge plane as File Hub and Chat — when adoption completes.

---

## 4. Relationship to certified programs

```
┌────────────────────────────────────────────────────────────┐
│           CONNECTED KNOWLEDGE PLATFORM (this program)       │
│  Charter · provenance · consumption unity · entity UX       │
├────────────────────────────────────────────────────────────┤
│  Context Graph L3    V-Link Tier 0    AI Retrieval L3      │
│  Unified Search L3   Platform Kernel  Platform Entities    │
│  Marketplace Runtime Platform Controller Platform Adoption │
├────────────────────────────────────────────────────────────┤
│  Product modules (SoR) · Business Operations · Workspace   │
└────────────────────────────────────────────────────────────┘
```

| Program | Relationship |
|---------|--------------|
| **Context Graph** | Orchestration engine inside Connected Knowledge |
| **Platform Adoption** | Prerequisite for trustworthy knowledge **reads** |
| **Relationship Framework** | Constitutional taxonomy — source of edge classes |
| **AI Platform** | Primary consumer; evolves from retrieval to knowledge bundles |
| **Marketplace** | Partner knowledge via delegate — Phase 2 |
| **Analytics** | Consumes activity — does not define relationships |
| **Reference Workspace** | Shell for entity-primary navigation — Phase 2B UX |

**Do not reopen** archived Context Graph certification for scope creep. Extend via Connected Knowledge charter amendment.

---

## 5. Entity-centric organizational model

### Today (module-primary)

```
User → Business Workspace → module (hr | scheduling | drive) → entity
```

### Target (entity-primary)

```
User → Entity (person | project hub | file | task) → neighborhood → module detail
         ↑
    V-Link hub OR native entity home
```

### Transition strategy

| Step | Change | Risk |
|------|--------|------|
| 1 | Federation API returns full neighborhood | Low — backend only |
| 2 | AI cites provenanced edges consistently | Low |
| 3 | Search "related" hints from bundle | Medium |
| 4 | V-Link hub rebranded as Knowledge Hub | Medium — UX |
| 5 | Universal entity picker in omnibar | High — UX |
| 6 | Module sidebars become secondary | High — product |

**Phase 0A does not authorize step 4+.** Positioning only.

**Phase 1A (2026-06-25):** Knowledge Composition Engine implemented — platform asks "what knowledge has already been composed?" for pilot AI consumers (`KNOWLEDGE_COMPOSITION_ENABLED=true`). See [CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md).

---

## 6. Marketplace positioning

Partners contribute **entities and relationships** without compromising platform integrity:

| Principle | Implementation |
|-----------|----------------|
| Platform stores cross-module edges | `VLinkEntity` with partner metadata |
| Partner authorizes access | Delegate `accessCheck` |
| No in-process partner code | iframe/bundle runtime unchanged |
| Certification includes knowledge contract | Manifest `vlinkDelegate` + `entities[]` |
| Partner cannot see other modules' data | Tenant scope + PE on every hydrate |

**Partner pitch:** "Your module's entities appear in the user's connected knowledge — not isolated in an iframe silo."

---

## 7. User value propositions

| Persona | Value |
|---------|-------|
| **Individual user** | "My project hub shows everything connected — files, meetings, tasks — without hunting modules" |
| **Business operator** | "HR, scheduling, and comms appear in the same search and AI answers as operations files" |
| **AI user** | "The assistant knows what I already linked — and asks before guessing" |
| **Admin** | "I can see adoption and knowledge gaps per module" |
| **Partner developer** | "My entities participate in V-Link and search via documented delegate" |

---

## 8. Governance model (proposed)

| Body | Role |
|------|------|
| **Architecture council** | Charter, taxonomy extensions, anti-patterns |
| **Platform team** | Federation API, V-Link evolution, Context Graph extension |
| **Module owners** | Native edges, adapters, V-Link resolver |
| **AI platform** | Bundle consumption, provenance in twin |
| **Marketplace** | Partner delegate certification |

**Certification target (future):** Connected Knowledge Platform **L3** as Tier 0 capability — after Phase 1 convergence evidence.

---

## 9. Success criteria (program level)

| Criterion | Measure |
|-----------|---------|
| **Consumption unity** | AI + operator tools use same bundle shape |
| **Provenance visibility** | Users distinguish manual vs AI vs inferred |
| **Coverage** | All L3 modules in entity catalog with explicit edges |
| **Adoption alignment** | ACT-R1 complete; BO modules in search |
| **Partner path** | Delegate spec certified; one pilot partner |
| **No constitutional violations** | Audit passes membership ≠ access |

---

## 10. Risks to positioning

| Risk | Mitigation |
|------|------------|
| "Knowledge graph" hype → wrong architecture | Federated messaging in all docs |
| Parallel graph team builds Prisma models | Phase 0B anti-pattern list |
| Module owners resist entity-primary UX | Gradual; hubs first |
| AI over-promises understanding | Provenance badges; suggestion workflow |
| Partner pressure for in-process resolver | Delegate-only stance |

---

## 11. Messaging guidelines

### Say

- "Connected Knowledge Platform"
- "Entity neighborhood"
- "Federated relationships with provenance"
- "V-Link knowledge hubs"
- "User-governed AI suggestions"

### Avoid

- "Vssyl Knowledge Graph" (implies monolithic store)
- "AI understands everything" (overclaim)
- "Universal relationships table" (anti-pattern)
- "New module for knowledge" (wrong tier)

---

## 12. Document map

| Document | Purpose |
|----------|---------|
| [CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md](./CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md) | Leadership summary |
| [CONNECTED_KNOWLEDGE_REALITY_ASSESSMENT.md](./CONNECTED_KNOWLEDGE_REALITY_ASSESSMENT.md) | Component evaluation |
| [ENTITY_RELATIONSHIP_CATALOG.md](./ENTITY_RELATIONSHIP_CATALOG.md) | Entity and edge inventory |
| [CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md](./CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md) | Integration audit |
| [AI_KNOWLEDGE_MODEL_ASSESSMENT.md](./AI_KNOWLEDGE_MODEL_ASSESSMENT.md) | AI retrieval vs knowledge |
| [VLINK_EVOLUTION_STRATEGY.md](./VLINK_EVOLUTION_STRATEGY.md) | V-Link evolution |
| [KNOWLEDGE_COMPOSITION_ENGINE.md](./KNOWLEDGE_COMPOSITION_ENGINE.md) | Phase 1A implementation |
| [CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md) | Phase 1A closeout |

---

## 13. Phase 1A implementation (2026-06-25)

The **Knowledge Composition Engine** (`server/src/knowledge/`) is live under feature flag:

```bash
KNOWLEDGE_COMPOSITION_ENABLED=true
```

Context Graph orchestrates resolution; the composer maps provenance, confidence, trust, and eligibility. Pilot consumers receive `knowledgeBundles` on the pipeline graph context with `contextBundle` fallback retained.

**Validate:** `pnpm --filter vssyl-server validate:connected-knowledge`

See [CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md).

---

## 14. Closing position

Vssyl unified **modules** through shared platform capabilities. The Connected Knowledge Platform unifies **knowledge** — the relationships among entities users already manage — without surrendering module ownership or constitutional trust boundaries.

**The long-term objective:** users interact primarily with **connected entities and relationships** rather than isolated applications. Phase 0A confirms the architecture path is **federation and governance**, not greenfield infrastructure.
