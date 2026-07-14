# AI Skill Contract

**Program:** AI Architecture Phase 8  
**Date:** 2026-07-13  
**Status:** Active  
**Source of Truth for:** Field-by-field `AISkillDefinition` contract  
**Code:** `shared/src/types/ai-skills.ts`  
**Companion:** [`AI_SKILL_CERTIFICATION_STANDARD.md`](./AI_SKILL_CERTIFICATION_STANDARD.md)

---

## Principle

A Skill is a **governed task contract**. Every field is intentional. Provider model strings are **not** part of the contract — use `capabilityRequest` instead.

---

## Top-level identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | yes | Stable identifier (snake_case). Example: `notebook_page_summary` |
| `name` | `string` | yes | Human display name |
| `description` | `string` | yes | Customer- or operator-facing summary |
| `version` | `string` | yes | Semver; immutable once published (`CERTIFIED`+) |
| `status` | `AISkillStatus` | yes | Lifecycle state — see [`AI_SKILL_LIFECYCLE.md`](./AI_SKILL_LIFECYCLE.md) |
| `owner` | `string` | yes | Owning team/module. Example: `module:notebook`, `platform:ai` |
| `scope` | `AISkillScope` | yes | Phase 8 active: `PLATFORM`, `MODULE_INTERNAL` only |

### `AISkillScope` (Phase 8)

| Value | Active | Meaning |
|-------|--------|---------|
| `PLATFORM` | yes | Cross-module platform Skill |
| `MODULE_INTERNAL` | yes | Bound to module context providers |
| `INDUSTRY_FUTURE` | **no** | Registry rejects at registration |
| `BUSINESS_FUTURE` | **no** | Not implemented |
| `PERSONAL_FUTURE` | **no** | Not implemented |

---

## Intent & I/O

| Field | Type | Description |
|-------|------|-------------|
| `intentTypes` | `AISkillIntentType[]` | Selection hints; not executable alone |
| `inputSchema` | `AISkillJsonSchema` | JSON Schema subset; planner validates `required` + `additionalProperties` |
| `outputSchema` | `AISkillJsonSchema` | Post-execution validation in runner |

### `AISkillIntentType`

`DOCUMENT_SUMMARIZATION` · `ACTION_EXTRACTION` · `STRUCTURED_DOCUMENT_EXTRACTION` · `TODO_PRIORITIZATION` · `MEETING_RECAP` · `GENERIC`

---

## Routing (Capability — not Provider)

| Field | Type | Description |
|-------|------|-------------|
| `capabilityRequest.primary` | `AIModelCapability` | Provider-neutral capability (Phase 7 taxonomy) |
| `capabilityRequest.secondary` | `AIModelCapability[]` | Optional secondary capabilities |
| `capabilityRequest.tier` | `AIRoutingTier` | `FAST` · `BALANCED` · `DEEP` · etc. |

**Note:** Phase 8 records capability requests on plans and execution records. Model Router runs **shadow-only**; implementations still call existing adapters with env-configured models.

---

## Context & knowledge

### `contextRequirements`

| Field | Type | Description |
|-------|------|-------------|
| `providers` | `string[]` | Context provider keys (e.g. `notebook`) |
| `moduleIds` | `string[]` | Optional module binding for `MODULE_INTERNAL` |
| `minNecessary` | `boolean` | **Must be `true`** — runner rejects otherwise |
| `personalMemoryAllowed` | `boolean` | Whether personal memory may be consulted |
| `businessMembershipRequired` | `boolean` | Fail closed without `businessId` |

### `knowledgeRequirements`

| Field | Type | Description |
|-------|------|-------------|
| `personalMemory` | `'disallowed' \| 'read_allowed'` | Personal memory policy |
| `businessPolicy` | `boolean` | Business policy knowledge |
| `liveModuleSoR` | `boolean` | Live module system-of-record reads |
| `platformGuidance` | `boolean` | Platform guidance docs |
| `industryPackFuture` | `boolean` | Reserved; inactive |

### `systemsOfRecordRead`

`string[]` — declarative SoR keys (e.g. `notebook.page`) for audit and certification.

---

## Grounding

### `groundingPolicy`

| Field | Type | Description |
|-------|------|-------------|
| `sourceCitationRequired` | `boolean` | Output must cite sources |
| `refuseWhenUngrounded` | `boolean` | Fail when grounding check fails |
| `allowSpeculation` | `boolean` | Allow non-grounded speculation |

---

## Tools & actions

| Field | Type | Description |
|-------|------|-------------|
| `allowedTools` | `string[]` | Declared tool allowlist (pilots: empty) |
| `actionPolicy.allowedReadTools` | `string[]` | Read tools permitted |
| `actionPolicy.allowedMutatingTools` | `string[]` | Mutating tools (pilots: empty) |
| `actionPolicy.prohibitedTools` | `string[]` | Explicit deny (pilots: `['*']` or named tools) |
| `actionPolicy.maxToolRounds` | `number` | Max tool loop rounds (pilots: `0`) |
| `actionPolicy.mutationsDefaultOff` | `boolean` | Mutations off unless explicitly governed |

### `approvalPolicy`

| Field | Type | Description |
|-------|------|-------------|
| `mandatoryApproval` | `boolean` | Require approval before run |
| `approvalForMutations` | `boolean` | Approval if mutations proposed |

Phase 8 pilots: read-only / propose-only — no tool rounds.

---

## Privacy, timeout, cost

### `privacyPolicy`

| Field | Description |
|-------|-------------|
| `redactSecrets` | Enable secret leak detection on output |
| `persistPrivateKnowledge` | Whether to persist private knowledge from run |
| `externalVisibilityAllowed` | External visibility of outputs |

### `timeoutPolicy`

| Field | Description |
|-------|-------------|
| `softTimeoutMs` | Soft limit (documentation / future enforcement) |
| `hardTimeoutMs` | Plan `timeoutMs`; hard bound reference |

### `costPolicy`

| Field | Description |
|-------|-------------|
| `maxQueryCost` | Optional cost ceiling |
| `costTierHint` | `free` · `standard` · `premium` |

---

## Observation & evaluation

### `observationPolicy`

| Field | Description |
|-------|-------------|
| `emitSkillEvents` | Emit Skill observation events |
| `attachToExecutionRecord` | Persist `AIExecutionRecord` with `surface: SKILL` |

### `evaluationProfile`

| Field | Description |
|-------|-------------|
| `id` | Profile identifier (e.g. `eval.notebook_page_summary.v1`) |
| `factualGroundingRequired` | Evaluation expects grounding |
| `sourceCitationCompleteness` | Citation completeness check |
| `schemaValidityRequired` | Schema must validate |
| `toolCorrectness` | Tool usage correctness |
| `uncertaintyBehavior` | Uncertainty handling |
| `responseCompleteness` | Output completeness |
| `prohibitedClaims` | Claims that must not appear |
| `latencyTargetMs` | Target latency for ops |

---

## Implementation binding

| Field | Type | Description |
|-------|------|-------------|
| `instructionAssetKey` | `string` | Key into `skillInstructionAssets.ts` (operator metadata) |
| `implementationKey` | `string` | Key into `skillImplementations` map — **code-owned, not DB** |

Instruction assets describe prompt responsibility; implementations execute adapters.

---

## Visibility & compatibility

| Field | Type | Description |
|-------|------|-------------|
| `tags` | `string[]` | Search/filter tags |
| `compatibility.minPlatformPhase` | `string` | Minimum platform phase |
| `compatibility.replacesKey` | `string?` | Superseded Skill key |
| `customerVisible` | `boolean` | Exposed on customer API |
| `internalOnly` | `boolean` | Hidden from customers even if visible flag set |
| `certificationNotes` | `string?` | Operator certification notes |
| `activatedAt` | `ISO8601?` | Activation timestamp |
| `deprecatedAt` | `ISO8601?` | Deprecation timestamp |
| `retiredAt` | `ISO8601?` | Retirement timestamp |
| `replacementKey` | `string?` | Successor Skill key |

---

## Runtime DTOs (derived)

These are **not** registry fields but execution-time shapes:

| Type | Purpose |
|------|---------|
| `AISkillSelectionInput` | Selection request (explicit key authoritative) |
| `AISkillSelectionResult` | Selection outcome + alternatives + shadow flag |
| `AISkillExecutionPlan` | Immutable plan produced by planner |
| `AISkillExecutionRequest` | Customer execute payload |
| `AISkillExecutionResult` | Execute response + shadow routing summary |

---

## Validation rules (enforced in code)

1. **Registry:** duplicate `key@version` rejected; inactive scopes rejected  
2. **Selection:** `SUSPENDED` / `RETIRED` / `DRAFT` not executable via explicit key  
3. **Planner:** required input fields; max input JSON ~200k chars; business membership  
4. **Runner:** tool allow/prohibit consistency; `minNecessary` required; output schema + secret leak check  
5. **Customer API:** only `customerVisible` Skills; DRAFT/REVIEW/RETIRED return 404  

---

## Example (abbreviated)

```typescript
// notebook_page_summary@1.0.0 — see pilotSkillDefinitions.ts
{
  key: 'notebook_page_summary',
  version: '1.0.0',
  status: 'ACTIVE',
  scope: 'MODULE_INTERNAL',
  intentTypes: ['DOCUMENT_SUMMARIZATION', 'MEETING_RECAP'],
  capabilityRequest: { primary: 'STRUCTURED_SUMMARY', tier: 'BALANCED' },
  contextRequirements: { providers: ['notebook'], moduleIds: ['notebook'], minNecessary: true, ... },
  implementationKey: 'impl.notebook_page_summary.v1',
  instructionAssetKey: 'notebook_page_summary.instructions.v1',
}
```

---

## Related

- [`AI_SKILL_REGISTRY.md`](./AI_SKILL_REGISTRY.md)  
- [`AI_CAPABILITY_MODEL.md`](./AI_CAPABILITY_MODEL.md)  
- [`AI_EXECUTION_RECORD_ARCHITECTURE.md`](./AI_EXECUTION_RECORD_ARCHITECTURE.md)
