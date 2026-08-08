---
name: verify
description: Run the narrowest evidence-based verification appropriate to the current Vssyl change.
---

# Verify Vssyl change

Use the `vssyl-cloud-agent-verify` Skill.

1. Inspect the requested target, `git status`, and staged/unstaged diff. Do not modify unrelated work.
2. Classify the affected scope: Cursor configuration/docs, Prisma, shared types, backend/API, frontend/runtime, UI flow, build/release, or cross-cutting.
3. Select the narrowest checks that establish correctness using existing scripts and tests:
   - Cursor-only changes: parse config/frontmatter and run their focused harnesses.
   - Prisma: follow `vssyl-prisma-schema-change`.
   - TypeScript: targeted tests plus relevant type-check.
   - Cross-cutting/release: expand toward the CI checks in `.github/workflows/ci.yml`.
4. If the change affects runtime behavior, inspect the running Cloud Agent or start the existing local workstation as needed. Confirm backend health.
5. If the change affects UI behavior and the workstation is running, verify the changed flow in the browser. Authenticate with the seeded local tester if required.
6. Do not weaken Rules, hooks, tests, or production safeguards to obtain a pass.

Report exactly one result:

- `PASS` — selected checks passed with sufficient evidence.
- `PASS WITH FINDINGS` — checks passed, but relevant limitations or non-blocking findings remain.
- `FAIL` — a required check failed or sufficient evidence could not be obtained.

Include affected scope, checks run, command/browser evidence, skipped checks and reasons, and remaining findings.
