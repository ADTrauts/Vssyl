# VSSYL Source of Truth

This repository defines the canonical references for VSSYL:

1. **GitHub repo is canonical for code**
2. **Memory Bank is canonical for product intent** — see [`memory-bank/`](../memory-bank/); architectural truth lives in `docs/architecture/`
3. **Architecture entry point:** [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](architecture/VSSYL_ARCHITECTURE_INDEX.md) — start here for any architectural topic
4. **Architecture governance:**
   - [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md) — which document owns each decision; edit policy
   - [`ARCHITECTURE_DOMAIN_MAP.md`](architecture/ARCHITECTURE_DOMAIN_MAP.md) — domain topology and certification status
   - [`ARCHITECTURE_HEALTH_REPORT.md`](architecture/ARCHITECTURE_HEALTH_REPORT.md) — documentation health metrics
   - [`AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md) — AI assistant decision trees
   - [`AI_READING_GUIDE.md`](architecture/AI_READING_GUIDE.md) — official AI documentation reading order
   - [`AI_SYSTEM_MENTAL_MODEL.md`](architecture/AI_SYSTEM_MENTAL_MODEL.md) — plain-English AI mental model
   - [`ai-system-audit/README.md`](ai-system-audit/README.md) — official whole-system AI architecture analysis (Phase 0 adopted)
   - [`ARCHITECTURE_DOCUMENT_STANDARD.md`](architecture/ARCHITECTURE_DOCUMENT_STANDARD.md) — required template for new architecture docs
5. **Platform standards (constitutional framework):** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) — Runtime Kernel, module contract, governance, migration
6. **Certification status:** [`docs/architecture/CERTIFICATION_LEDGER.md`](architecture/CERTIFICATION_LEDGER.md) — operational certification dashboard (dated)
7. **UX standards (constitutional framework):** [`docs/ux/UX_CONSTITUTION.md`](ux/UX_CONSTITUTION.md) — design tokens, layouts, components, accessibility; tokens in [`docs/ux/DESIGN_TOKENS.md`](ux/DESIGN_TOKENS.md) and `web/src/styles/tokens.css`
8. **Cursor rules must follow both** — start with **`.cursor/rules/source-of-truth.mdc`** and **this file**; agent rules are short files under **`.cursor/rules/`** (see **`RULES_SUMMARY.md`**). Long architecture notes live in **`docs/architecture/`**; UX standards in **`docs/ux/`**; how-to guides in **`docs/guides/`**.
9. **Outdated docs should be archived, not deleted** — mark with deprecation banner per [`ARCHITECTURE_DOCUMENT_STANDARD.md`](architecture/ARCHITECTURE_DOCUMENT_STANDARD.md)
10. **Implementation status must be updated after major changes** — [`memory-bank/progress.md`](../memory-bank/progress.md)

### Module reference implementation

**File Hub** (`drive`, user-facing: File Hub) is the canonical first-party **Reference Implementation** (tag: `file-hub-reference-implementation`, maturity 87/100). Compliance audits and operation matrix live under [`docs/architecture/audits/`](architecture/audits/) — start with [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md). Status: [`memory-bank/progress.md`](../memory-bank/progress.md).

### Conflict resolution

If **repo code** and a **constitutional doc** disagree, stop and reconcile before shipping. If **two docs** disagree, the **Source of Truth** named in [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md) wins. If Memory Bank and architecture docs conflict on **architecture**, architecture docs win; on **product intent**, Memory Bank wins.

Use this document as the baseline reference across custom GPT, Cursor, and ChatGPT conversations.

**Last updated:** 2026-07-12 (AI Architecture Phase 0 — audit adoption + mental model)
