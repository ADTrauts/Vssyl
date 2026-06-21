# PP-2 — Reference Review

**Program:** Account Platform — PP-2 Settings Platform Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Reference candidacy assessment — **no designation awarded**

---

## Reference review question

Should PP-2 Settings Platform receive **reference designation** within the Vssyl platform certification framework?

---

## Reference taxonomy context

| Reference type | Applicability to PP-2 |
|----------------|----------------------|
| **Reference Module #N** (workspace module catalog) | **Not applicable** — PP-2 is an Account Platform sub-program, not a workspace module |
| **Control-plane reference** (Admin Portal pattern) | **Partial analogy** — settings orchestration is platform infrastructure |
| **Account Platform pattern reference** | **Candidate** — settings orchestration within trilogy |

PP-2 is evaluated as a **platform sub-program capability** (Settings Platform), comparable in governance rigor to Admin Portal control-plane certification — not as Reference Module #6+ in [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md).

---

## Reference candidacy criteria

| Criterion | Assessment | Score |
|-----------|------------|-------|
| Constitutional maturity (G1–G9) | 26/27; 0N core matrix | ✅ Strong |
| Teachable patterns | Registry + orchestration + adapter + hub IA | ✅ Yes |
| Reusability | PP-3 billing settings links; future modules use registry | ✅ Yes |
| Uniqueness | First consolidated personal settings platform in Account Platform | ✅ Yes |
| Documented debt acceptable at reference | F05, advisories — WITH FINDINGS precedent | ✅ Acceptable |
| Cross-module adoption ready | Personal slice only; business/module reference rows open | ⚠️ Partial |

---

## Pattern catalog (teachable artifacts)

| Pattern | Artifact | Reference value |
|---------|----------|-----------------|
| Preference key registry | `preferenceRegistry.ts` + spec | High — other sub-programs should register keys |
| Settings orchestration service | `settingsService.ts` | High — single write path template |
| Domain adapter delegation | `notificationSettingsAdapter.ts` | High — cross-domain write convergence |
| Navigation contract | `settingsNavigationContract.ts` | Medium — IA governance |
| Hub inventory metadata | `settingsHubInventory.ts` | Medium — consolidation tracking |
| Theme hydration | `settingsTheme.ts` + ThemeProvider | Medium — appearance persistence |
| Thin controller + PE | `settingsController.ts` | High — standard module/sub-program pattern |

---

## Comparison to certified references

| Reference | PP-2 comparison |
|-----------|-----------------|
| **File Hub (L4 Reference Implementation)** | PP-2 has similar service extraction maturity in personal slice; lacks full matrix C majority across all rows |
| **Chat (Reference Module #2, L3)** | PP-2 matches Chat partial-acceptance posture (documented advisories, 0 blockers) |
| **Admin Portal (Control-plane L3 WF)** | Closest analog — platform infrastructure, not workspace module; PP-2 score (96%) comparable to AP eval (~89% at eval) |
| **HR / Scheduling (L3 WF + Candidate)** | PP-2 **exceeds** HR/Scheduling at eval time — zero blocking findings, 0N core matrix |

---

## Reference candidate determination

| Status | Determination |
|--------|---------------|
| **Reference Module #N** | **Not candidate** — wrong taxonomy |
| **Account Platform Settings Pattern Reference** | **Candidate — deferred** |
| **Reference designation council** | **Not opened** |

### Rationale for candidate-deferred (not rejected)

1. Personal settings slice is certification-ready and pattern-rich.
2. Business/module reference rows remain P-only — full-platform reference would overclaim.
3. Umbrella composite certification should precede or accompany cross-trilogy reference designation.
4. PP-3 client migration may add billing-settings patterns worth including in a unified Account Platform reference packet.

### Rationale for not opening reference council now

- Evaluation recommends **L3 WITH FINDINGS**, not plain L3.
- Reference designation historically follows certification ratification (Chat, File Hub, Admin Portal precedent).
- Account Platform umbrella review (Phase 3) is the appropriate gate for trilogy-level reference candidacy.

---

## Recommended reference path

```
PP-2 L3 WITH FINDINGS certification (ratification council)
    ↓
PP-1 + PP-3 sub-domain certifications
    ↓
Umbrella progress review
    ↓
Account Platform Settings Pattern Reference council (optional)
```

**Do not** open Reference Module catalog integer assignment for PP-2.

---

## Reference review outcome

| Field | Value |
|-------|-------|
| **Reference candidate status** | **Candidate deferred** — Account Platform settings pattern |
| **Reference designation awarded** | **No** |
| **Reference council opened** | **No** |
| **Revisit trigger** | Umbrella Phase 3 or explicit settings-pattern council charter |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
