---
name: architecture-audit
description: Read-only audit of authority, implementation patterns, conflicts, and drift for a Vssyl domain.
---

# Audit Vssyl architecture

This command is read-only. Use the `vssyl-architecture-discovery` Skill.

1. Resolve the requested domain and boundaries; state assumptions if the request is broad.
2. Follow the Skill’s source-of-truth and ownership discovery procedure.
3. Identify the canonical owner, supporting living documents, certification status, and historical/read-only material.
4. Search for representative and analogous implementation paths, preferring named reference implementations.
5. Compare implementation, architecture authority, and product/status records. Report contradictions, stale claims, duplicated ownership, and unowned decisions.
6. Recommend alignment within the existing governance hierarchy.

Do not edit files, redesign architecture, create new governance, or convert recommendations into implementation.

Report:

- domain and scope;
- authoritative sources and owner;
- relevant implementation/reference patterns;
- certification posture;
- conflicts/drift with evidence;
- constrained recommendations;
- unresolved questions requiring an owner.
