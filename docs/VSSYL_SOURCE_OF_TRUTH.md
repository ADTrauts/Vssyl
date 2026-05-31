# VSSYL Source of Truth

This repository defines the canonical references for VSSYL:

1. **GitHub repo is canonical for code**
2. **Memory Bank is canonical for product and architecture**
3. **Platform standards (constitutional framework):** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) — Runtime Kernel, module contract, governance, migration
4. **Cursor rules must follow both** — start with **`.cursor/rules/source-of-truth.mdc`** and **`docs/VSSYL_SOURCE_OF_TRUTH.md`** (this file); agent rules are short files under **`.cursor/rules/`** (see **`RULES_SUMMARY.md`**). Long architecture notes live in **`docs/architecture/`**; how-to guides in **`docs/guides/`**.
5. **Outdated docs should be archived, not deleted**
6. **Implementation status must be updated after major changes**

### Module reference implementation

**File Hub** (`drive`, user-facing: File Hub) is the canonical first-party **Reference Implementation** (tag: `file-hub-reference-implementation`, maturity 87/100). Compliance audits and operation matrix live under [`docs/architecture/audits/`](architecture/audits/) — start with [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md). Status: [`memory-bank/progress.md`](../memory-bank/progress.md).

Use this document as the baseline reference across custom GPT, Cursor, and ChatGPT conversations.
