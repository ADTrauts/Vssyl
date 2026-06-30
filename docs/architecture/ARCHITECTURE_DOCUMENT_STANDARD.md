# Architecture Document Standard

**Program:** Architecture Governance — Phase 1D  
**Date:** 2026-06-29  
**Status:** **Required** for all new architecture documents  
**Authority:** [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md)

---

## Purpose

Define the required structure for Vssyl architecture documents so contributors and AI assistants can read, edit, and cross-link consistently.

---

## When to use this template

| Use | Do not use |
|-----|------------|
| New architecture decisions | How-to guides → `docs/guides/` |
| Domain constitutions and contracts | Product intent → `memory-bank/` |
| Certification status records | Session notes → `docs/archive/` |
| Discovery and reality assessments | Cursor rules → `.cursor/rules/` |

Register every new SoT document in [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md).

---

## Required template

Copy this skeleton for new architecture documents:

```markdown
# [Title]

**Program:** [Program name]
**Date:** YYYY-MM-DD
**Status:** [Draft | Active | Discovery | Constitutional | Archived]
**Owner:** [Team or program]
**Source of Truth for:** [Topic] — or "Supporting to [link]"

---

## Purpose

[Why this document exists — one paragraph]

## Scope

[What is in scope and explicitly out of scope]

## Problem

[What architectural question or gap this addresses]

## Architecture

[Decisions, diagrams, contracts, invariants]

## Responsibilities

| Layer | Owner | Must / must not |
|-------|-------|-----------------|

## Dependencies

[Upstream constitutions, services, other domains]

## Reference Implementation

[Code paths, reference modules, or "None"]

## Source of Truth

[This document if SoT, or link to canonical SoT]

## Certification Status

[Ledger row, level, or N/A with reason]

## Open Decisions

| ID | Question | Status |

## Related Documents

- [Link to constitution, index, domain README]

## Revision History

| Date | Change | Author |
```

---

## Document classes

| Class | Status field | Edit policy |
|-------|--------------|-------------|
| **Constitutional** | `Constitutional` | Council ratification required |
| **Source of Truth** | `Active` | Edit here first; update supporting docs |
| **Discovery** | `Discovery` | **Read-only** after publication — supersede with dated successor |
| **Status record** | `Active` | Update at program milestones |
| **Program archive** | `Archived` | **Never edit** — historical |
| **Supporting** | `Active` | Must not contradict SoT |

---

## Naming conventions

| Pattern | Example |
|---------|---------|
| Constitution | `SEARCH_CONSTITUTION.md` |
| Discovery | `NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md` |
| Status record | `DASHBOARD_STATUS_RECORD.md` |
| Operation matrix | `CHAT_OPERATION_MATRIX.md` |
| Certification record | `ANALYTICS_CERTIFICATION_RECORD.md` |
| Program archive | `WORKSPACE_PROGRAM_ARCHIVE.md` |

---

## Cross-linking rules

1. Link **up** to constitution and [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md).
2. Link **sideways** only to supporting docs — never create a second SoT.
3. Certification claims must link to [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md) or council ratification.
4. Discovery docs must state they do not supersede constitutional law.

---

## Deprecation banner (historical documents)

When a document is superseded, add at the top (do not delete the file):

```markdown
---

⚠️ **Architecture Notice**

This document is retained for historical context.

The canonical Source of Truth is:

[`path/to/canonical.md`](path/to/canonical.md)

Please update the canonical document rather than this file.

---
```

---

## AI assistant guidance

Before creating architecture documentation:

1. Read [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md)
2. Check [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) for existing SoT
3. Use this template
4. Register the new SoT in the source-of-truth matrix

---

**Last updated:** 2026-06-29 (Architecture Governance Phase 1D)
