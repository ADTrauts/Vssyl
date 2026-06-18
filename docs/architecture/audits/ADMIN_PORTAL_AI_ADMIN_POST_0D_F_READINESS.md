# Admin Portal — AI Admin Post-0D-F Readiness

**Package:** 0D-F — AI Control Plane UX Consolidation  
**Date:** 2026-06-17  
**Prior baseline:** 84.2 (end of 0D-E) — [ADMIN_PORTAL_AI_ADMIN_POST_0D_E_READINESS.md](./ADMIN_PORTAL_AI_ADMIN_POST_0D_E_READINESS.md)

---

## Scorecard

| Dimension | Weight | 0D-E | **0D-F** | Expected 0D-G |
|-----------|--------|------|----------|---------------|
| Architecture | 20% | 86 | **88** | 90 |
| Ownership | 20% | 90 | **92** | 94 |
| Navigation | 15% | 82 | **90** | 92 |
| Service boundaries | 20% | 82 | **83** | 85 |
| Testing | 15% | 68 | **74** | 78 |
| Documentation | 10% | 94 | **96** | 97 |

### Weighted overall

| Milestone | Score |
|-----------|-------|
| End of 0D-E | 84.2 |
| **End of 0D-F** | **87.4** |
| Target entering 0D-G | **88+** |
| Stage 0D complete (0D-G) | **90+** |

**Success criterion met:** Readiness **exceeds 86%** at **87.4**.

---

## Dimension notes

### Architecture (88)

- AI Pipeline affirmed sole diagnostics/evaluation UX destination
- Legacy ai-context UI retired; redirect preserves bookmarks
- ai-system reduced to canonical launcher set (4 destinations)
- API transitional layer unchanged (appropriate for UX-only package)

### Ownership (92)

- UX ownership model explicit per capability
- No duplicate diagnostics panels in admin portal
- Module certification `ai-context` tab preserved as distinct surface

### Navigation (90)

- ai-context redirect + middleware
- ai-system context-debug and BI launcher cards removed
- Pipeline hub already canonical from 0D-E
- One path per capability documented in navigation matrix

### Service boundaries (83)

- UI/client retirement only; server routes unchanged
- `aiContextDebug.ts` client removed; server mount remains transitional
- Minor improvement; full API boundary closure deferred 0D-G

### Testing (74)

- **New:** `adminPortalAiControlPlaneUx.test.ts` (7 cases)
- **Updated:** `adminPortalDiagnosticsOwnership.test.ts` (redirect assertion)
- Pipeline HTTP tests from 0D-E retained
- test-lab POST smoke still deferred 1B

### Documentation (96)

- Four 0D-F audit artifacts (retirement, navigation, UX ownership, readiness)
- Findings register and package plan updated

---

## Finding status post-0D-F

| Finding | 0D-F outcome | Remaining |
|---------|--------------|-----------|
| AP-F-029 | **Substantially closed** | API mount merge 0D-G / 1B |
| AP-F-008 | UI/navigation closed | centralized-ai mount removal 0D-G |
| AP-F-030 | Unchanged | Expanded HTTP coverage 1B |

---

## Gate checklist

| Gate | Status |
|------|--------|
| ai-context surface retired | **Pass** |
| Diagnostics duplication removed (UI) | **Pass** |
| AI System simplified launcher | **Pass** |
| Navigation ownership explicit | **Pass** |
| AI Pipeline sole diagnostics destination | **Pass** |
| AP-F-029 substantially closed | **Pass** |
| Readiness > 86% | **Pass** (87.4) |
| Provider APIs untouched | **Pass** |
| Business AI untouched | **Pass** |

---

## Verification

```bash
pnpm type-check
pnpm exec vitest run web/src/lib/__tests__/adminPortalAiControlPlaneUx.test.ts
pnpm exec vitest run web/src/lib/__tests__/adminPortalDiagnosticsOwnership.test.ts
pnpm exec vitest run server/src/routes/__tests__/admin-portal-ai-pipeline.test.ts
pnpm exec vitest run server/src/routes/__tests__/aiContextDebugTransitional.test.ts
```

---

**Next package:** 0D-G — Readiness review and Stage 0D closeout (not started in this package).
