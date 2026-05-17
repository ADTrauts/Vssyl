# Third-party module rulebook

Reviewer and implementer checklist for marketplace modules. **Agent rule:** `.cursor/rules/third-party-modules.mdc`

## Read order

1. This rulebook (must-pass checklist)
2. [`THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](./THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) — onboarding index
3. [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) — authoritative pipeline (wins on conflict)
4. [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) — interoperability contract
5. [`memory-bank/aiContextSystem.md`](../../memory-bank/aiContextSystem.md) — if AI-exposed
6. [`NOTIFICATION_METADATA_GUIDE.md`](./NOTIFICATION_METADATA_GUIDE.md) — if notifications declared

## Platform constraints (non-negotiable)

- **No in-process partner code** on the Vssyl API server.
- **UI runtime:** sandboxed **iframe** (`frontend.entryUrl`) or approved **bundle** from GCS artifact after scan.
- **Artifacts:** private GCS, signed URLs post-approval; **semantic versioning**; published versions **immutable**.
- **Approval:** automated security scan + **admin review** before install.
- **Size limit:** 500 MB per artifact (see pipeline doc for current limits).

## Interoperability must-pass

Same contract as first-party (`memory-bank/moduleSpecs.md`):

| # | Requirement |
|---|-------------|
| 1 | **authorize → execute → emit → notify/realtime** — no emit on failure or deny |
| 2 | **Tenant scoping** on every read/write path |
| 3 | **Normalized activity events** when actions are user-visible in activity surfaces |
| 4 | **Activity vs analytics** separated |
| 5 | **Realtime** visibility-scoped; membership proven before join/emit |
| 6 | **Notification** manifest metadata + routable payload ids |
| 7 | **AI context** (keywords, providers) when module is AI-exposed |

Authorization may use platform **Policy Engine** where applicable (`docs/architecture/POLICY_ENGINE.md`); partner backends must enforce their own auth for partner-hosted APIs.

## Review gate (reject or request changes if missing)

- [ ] **Structural certification** passes — blocks admin approval publish and version promotion/rollback when failed; re-validated on approve/promote if `NOT_RUN` or validator version is stale; warnings visible in admin portal (warnings do not block)
- [ ] Manifest complete (permissions, dependencies, version, entry URL or artifact path)
- [ ] Scan passed; no critical findings unresolved
- [ ] Certification checklist in `moduleSpecs.md` satisfied or documented exceptions approved
- [ ] AI context + notification metadata when applicable
- [ ] Privacy / data residency story matches declared scopes
- [ ] No substitute of analytics tables for activity trail

## Anti-patterns

- Partner analytics written only to platform activity log without real activity events.
- Skipping scan or admin approval for “internal” production installs.
- iframe without sandbox constraints documented in pipeline.
- Duplicate notification types not registered in manifest metadata.

## Related

- Internal monorepo modules: `docs/guides/MODULE_DEVELOPMENT_GUIDE.md`, `.cursor/rules/module-development.mdc`
- Fixtures: `docs/test-modules/README.md`

**Last updated:** 2026-05-17 (MP-Q1 structural validator)
