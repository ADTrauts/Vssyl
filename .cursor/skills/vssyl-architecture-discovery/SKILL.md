---
name: vssyl-architecture-discovery
description: Locates Vssyl architecture authority, domain ownership, certification status, and analogous implementations. Use for architecture questions, audits, cross-cutting changes, unfamiliar domains, source-of-truth conflicts, or before proposing a new platform pattern.
---

# Vssyl architecture discovery

Use this procedure to discover existing truth; do not create a parallel architecture.

## Procedure

1. Read the universal baseline:
   - `docs/VSSYL_SOURCE_OF_TRUTH.md`
   - `memory-bank/activeContext.md`
   - `memory-bank/progress.md`
2. Locate the domain through:
   - `docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`
   - `docs/architecture/ARCHITECTURE_DOMAIN_MAP.md`
3. Confirm the owning document and edit policy in:
   - `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`
4. Read the owning document before supporting guides, audits, plans, or historical closeouts. Check `docs/architecture/CERTIFICATION_LEDGER.md` when certification status matters.
5. Search the repository for analogous implementations using several domain terms. Prefer a certified/reference implementation where one is named; File Hub is the canonical first-party module reference.
6. Compare documentation claims with implementation:
   - Code is implementation truth.
   - Architecture documents own architecture.
   - Memory Bank owns product intent and status.
7. If code and constitutional architecture conflict, or ownership is blank, TBD, duplicated, or ambiguous, stop. Report the exact conflict and owning authorities; do not invent architecture or silently choose a supporting document.

## Output

Report:

- requested domain and scope;
- authoritative owner/source-of-truth with paths;
- supporting and read-only/historical sources;
- analogous implementation paths;
- certification posture when relevant;
- conflicts, drift, and unresolved ownership;
- recommendations constrained to existing governance.

Do not edit architecture while performing discovery or an audit unless a separate, explicitly approved change requests it.
