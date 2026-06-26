# Partner Knowledge Participation

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Constitutional partner rules — **no implementation**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [VLINK_PARTICIPATION_ARCHITECTURE.md](../marketplace/VLINK_PARTICIPATION_ARCHITECTURE.md) · [third-party-modules.mdc](../../.cursor/rules/third-party-modules.mdc)

---

## 1. Purpose

Define how **marketplace partner modules** contribute entities and relationships to the Connected Knowledge Platform **without compromising platform integrity**.

Partners remain **out-of-process**. Platform stores **association edges**; partners remain **delegated source of truth** for entity state.

---

## 2. Participation principles

| ID | Principle |
|----|-----------|
| **PK-1** | Partner code never runs in platform API process |
| **PK-2** | Partner entity truth lives in partner SoR — platform caches hydrate snapshots only |
| **PK-3** | Platform stores cross-module **association** edges (`VLinkEntity` with partner metadata) |
| **PK-4** | Every partner edge carries L1 provenance with delegate version |
| **PK-5** | Partner cannot read other modules' knowledge via bundle |
| **PK-6** | Revocation is partner-initiated or cert-suspension — platform hides edge |
| **PK-7** | Confidence never overrides failed `accessCheck` |
| **PK-8** | Certification requires knowledge contract compliance |

---

## 3. Knowledge tiers for partners

| Artifact | Tier | Owner |
|----------|:----:|-------|
| Partner entity record | **L1** | Partner SoR |
| Platform `VLinkEntity` to partner entity | **L2** (association) | Platform |
| Combined neighborhood view | Federation | Composer |

**Distinction:** Entity **state** (title, status) = L1 delegate. **Link** to File Hub task = L2 platform association.

---

## 4. Delegate contract (constitutional minimum)

Manifest declaration:

```json
{
  "knowledgeDelegate": {
    "version": "1",
    "hydrateUrl": "https://partner.example.com/vssyl/knowledge/hydrate",
    "accessCheckUrl": "https://partner.example.com/vssyl/knowledge/access",
    "searchUrl": "https://partner.example.com/vssyl/knowledge/search",
    "revokeWebhookUrl": "https://partner.example.com/vssyl/knowledge/revoke",
    "entityTypes": ["deal", "contact"]
  }
}
```

### 4.1 Operations

| Operation | Purpose | Knowledge effect |
|-----------|---------|------------------|
| **hydrate** | Title, subtitle, icon, status | L1 node snapshot |
| **accessCheck** | User may see entity? | PE gate — fail = omit |
| **search** | Link picker candidates | L6 until linked → L2 |
| **revoke** (webhook to platform) | Entity invalid | Edge → revoked |
| **unlink** (lifecycle) | Partner entity deleted | Platform soft-unlink |

### 4.2 Request context (platform → partner)

Every delegate call includes:

```typescript
interface DelegateContext {
  tenantId: string;       // businessId and/or dashboardId
  userId: string;
  moduleId: string;       // partner module id
  entityType: string;
  entityId: string;
  scopes: string[];       // granted OAuth-style scopes
  requestId: string;
}
```

Partner **must** validate tenant + user on every call.

---

## 5. Partner provenance

Required on L1 nodes and partner-linked edges:

```typescript
{
  tier: 'L1',
  origin: 'partner_delegate',
  assertedAt: string,      // from partner response
  verifiedAt: string,      // platform receive time
  actor: {
    type: 'partner',
    id: 'partner_module_id',
    partnerModuleId: 'partner_module_id'
  },
  sourceSystem: 'partner:{moduleId}',
  relationshipSource: {
    relationshipClass: 'association',
    delegateVersion: '1'
  }
}
```

---

## 6. Partner confidence

| Condition | Confidence |
|-----------|:----------:|
| Delegate 200 + fresh TTL | C1 |
| Delegate 200 + stale TTL | C4 (degraded) |
| Delegate timeout | Hidden — degraded placeholder in operator view only |
| accessCheck deny | Omitted — not C4 visible to user |

Partner **may not** supply confidence field — platform assigns per [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md).

---

## 7. Ownership and verification

| Question | Answer |
|----------|--------|
| Who owns partner entity? | Partner |
| Who owns link to V_Link? | Platform (user initiated) |
| Who verifies access? | Partner `accessCheck` each hydrate |
| Who verifies link validity? | Platform on display; partner on access |
| Certification | Marketplace checklist + knowledge contract |

### Verification schedule

| Check | When |
|-------|------|
| accessCheck | Every hydrate |
| hydrate refresh | TTL default 15 min (configurable per cert) |
| revoke webhook | Real-time |
| cert suspension | Platform revokes all L1 from module |

---

## 8. Participation modes (phased)

| Mode | Phase | Partner can |
|------|-------|-------------|
| **M0 — None** | Today | iframe only |
| **M1 — Consume deep link** | Interim | Open partner URL from V_Link metadata |
| **M2 — Delegate read** | Phase 2A | Hydrate + access in picker |
| **M3 — Full association** | Phase 2B | Search + link + federation in AI |

Phase 0B authorizes **M2–M3 design** only.

---

## 9. Entity type registration

Partners declare in manifest:

```json
{
  "entities": [
    {
      "entityType": "deal",
      "displayName": "Deal",
      "vlinkLinkable": true,
      "knowledgeParticipation": "delegate"
    }
  ]
}
```

Platform maps to:

```
nodeKey = {partnerModuleId}:deal:{partnerEntityId}
VLinkEntityType = PARTNER_ENTITY
metadata = { moduleId, partnerEntityType, partnerEntityId }
```

No new enum value without resolver + lifecycle policy ([PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)).

---

## 10. Revocation and suspension

| Event | Platform action |
|-------|-----------------|
| Partner `revoke` webhook | Mark edges revoked; emit domain event |
| Cert suspended | All L1/L2 partner edges hidden |
| Cert restored | Revalidate on next access |
| User unlink | Standard V_Link unlink — partner notified optional |
| Partner entity merge | Partner sends migrate webhook — platform updates metadata |

---

## 11. Security boundaries

| Threat | Mitigation |
|--------|------------|
| Cross-tenant leak | Delegate context tenant scoping |
| Token replay | Short-lived signed platform tokens |
| Partner over-collection | Scope limits in manifest |
| Malicious hydrate | Schema validation + size caps |
| In-process bypass | **Forbidden** — PK-1 |

---

## 12. AI and search participation

| Consumer | Partner knowledge |
|----------|-------------------|
| AI Twin | L1 nodes in bundle when intent includes partner module |
| Search | Partner `searchUrl` provider — L6 until linked |
| Context Graph | Partner adapter in composer |
| Retrieval | May delegate to partner search |

AI **must not** state partner entity facts when delegate fails — omit or qualify C4.

---

## 13. Certification checklist (knowledge addendum)

| # | Requirement |
|---|-------------|
| 1 | `knowledgeDelegate` manifest block |
| 2 | hydrate + accessCheck implemented |
| 3 | Tenant isolation tests |
| 4 | Revoke webhook documented |
| 5 | Entity types in `entities[]` |
| 6 | Lifecycle unlink on partner delete |
| 7 | No in-process code |
| 8 | Provenance fields in delegate responses |

---

## 14. Anti-patterns

| Anti-pattern | Violation |
|--------------|-----------|
| Partner Prisma in platform | PK-1 |
| Platform caches partner body as SoR | PK-2 |
| Partner reads KnowledgeBundle | PK-5 |
| Skip accessCheck on C1 | PK-7 |
| Partner-defined confidence | PK-7 |

---

## 15. References

- [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md)
- [KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md](./KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md)
- [THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)
