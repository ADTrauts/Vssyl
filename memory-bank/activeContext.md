# Active Context - Vssyl Business Admin & AI Integration

## AI Architecture Phase 7 — Model Routing Engine / Shadow Mode (July 2026) ✅

**Status:** **COMPLETE** (awaiting review; not committed).

**Outcome:** Canonical capability → tier → catalog Model Router shipped in **shadow mode**. Production `selectLlmProvider` behavior unchanged. Pipeline Model Routing page observe-only.

**Key docs:** [`AI_MODEL_ROUTER_ARCHITECTURE.md`](../docs/architecture/AI_MODEL_ROUTER_ARCHITECTURE.md) · [`AI_PHASE7_CLOSEOUT.md`](../docs/architecture/AI_PHASE7_CLOSEOUT.md)

**Next:** Review / commit · optional Phase 7B live cutover for specialized paths.

---

## AI Architecture Phase 6B — Platform Certification & Readiness (July 2026) ✅

**Status:** **COMPLETE** (awaiting review; not committed).

**Outcome:** **CERTIFIED_WITH_FINDINGS** (score 86/100). Platform ready for Phase 7 Model Routing at existing provider seams. No runtime behavior changes.

**Key docs:** [`AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md`](../docs/architecture/AI_PLATFORM_ARCHITECTURE_CERTIFICATION.md) · [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](../docs/architecture/AI_PLATFORM_SUBSYSTEM_INVENTORY.md) · [`AI_PLATFORM_CANONICAL_DIAGRAM.md`](../docs/architecture/AI_PLATFORM_CANONICAL_DIAGRAM.md) · [`AI_MODEL_ROUTING_READINESS.md`](../docs/architecture/AI_MODEL_ROUTING_READINESS.md) · [`AI_PHASE6B_CLOSEOUT.md`](../docs/architecture/AI_PHASE6B_CLOSEOUT.md)

**Next:** Review / commit Phase 5–6B AI work · Phase 7 Model Routing Engine.

---

## AI Architecture Phase 6 — Evaluation & Correction Workflow (July 2026) ✅

**Status:** **COMPLETE** (awaiting review; not committed in this session).

**Outcome:** Human ops loop on existing Pipeline / Operations substrate. Corrections remain governed proposals — no Twin runtime mutation. Single evaluation `workflowStatus` lifecycle extended; work items + optional regression linkage + notifications + workflow report.

**Key docs:** [`AI_EVALUATION_WORKFLOW.md`](../docs/architecture/AI_EVALUATION_WORKFLOW.md) · [`AI_CORRECTION_WORKFLOW.md`](../docs/architecture/AI_CORRECTION_WORKFLOW.md) · [`AI_REVIEW_WORKFLOW.md`](../docs/architecture/AI_REVIEW_WORKFLOW.md) · [`AI_RESOLUTION_WORKFLOW.md`](../docs/architecture/AI_RESOLUTION_WORKFLOW.md) · [`AI_PHASE6_CLOSEOUT.md`](../docs/architecture/AI_PHASE6_CLOSEOUT.md)

**Next:** Review / commit Phase 6 · optional Business Reviewer RBAC · regression CI (future).

---

## Reference Workspace — Registration Review (June 2026) ✅

**Status:** **COMPLETE** — inaugural registration review; governance only; no engineering.

**Outcome:** **Approved with Findings**. Reference Workspace Platform Shell **registered** (hybrid holder: Business Workspace + Personal Dashboard shell). **12** open findings. REG-B3 partial waived.

**Deliverables:** [`REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md)

**Next:** Optional Business 1E (RWS-F1) · pattern annex (GOV-1) · WS-L3 readiness (separate wave).

---

## Reference Workspace — Registration Prep (June 2026) ✅

**Status:** **COMPLETE** — governance and documentation only; no designation; no engineering.

**Outcome:** `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` drafted. Prep recommendation **Approved with Findings**. REG-B2 **closed**. REG-B3 **partial** (pattern annex). RWS-F1 remains.

**Deliverables:** [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../docs/architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

**Next:** Formal registration review (council) · optional Business 1E (RWS-F1) · WS-L3 readiness review.

---

## Reference Workspace — WS-L2 Certification Review (June 2026) ✅

**Status:** **COMPLETE** — governance and certification only; no registration; no engineering.

**Outcome:** Combined Reference Workspace Program **WS-L2 Certified with Findings**. Business **90%** · Personal **88%** · Combined **~89%**. **0** process blockers · **12** open findings (RWS-F1 primary).

**Deliverables:** [`REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) · updated charter · module catalog · UX roadmap

**Next:** `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` draft · optional Business 1E (RWS-F1) · WS-L3 readiness review.

---

## Reference Workspace — Wave 2F Operation Matrix Re-Audit (June 2026) ✅

**Status:** **COMPLETE** — governance only; no WS-L2 certification; no registration.

**Outcome:** L2-B4 closed. Business + Personal operation matrices re-audited. **0 WS-L2 process blockers**. Combined **~89%**.

**Deliverables:** [`REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md) · updated business matrix · new personal matrix

**Next:** WS-L2 certification review · registration doc draft · optional Business 1E (RWS-F1).

---

## Reference Workspace — Wave 2E Cross-Surface QA (June 2026) ✅

**Status:** **COMPLETE** — QA + evidence only; no WS-L2 certification; no registration.

**Outcome:** Part 2H matrix **27 rows executed** · **23 PASS** (adjudicated) · **1 P0 FAIL** (RWS-16 Place segment 404) · **L2-B3 closed**.

**Deliverables:** [`REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md) · Part 2H in [`PLATFORM_MANUAL_QA_MATRIX.md`](../docs/ux/PLATFORM_MANUAL_QA_MATRIX.md)

**Next:** L2-B4 operation matrix re-audit · WS-L2 certification review · Business Place segment hygiene (RWS-F1).

---

## Personal Dashboard — Wave 2D Drift Enforcement (June 2026) ✅

**Status:** **COMPLETE** — registry drift suite; no certification; no registration.

**Outcome:** L2-B2 closed. **15 drift tests PASS** · Personal WS-L2 **86%** · Combined **85%**.

**Deliverables:** [`PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md`](../docs/architecture/audits/PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md) · `personalDashboardRegistryDrift.test.ts`

**Next:** Cross-surface QA checklist (L2-B3) · operation matrix re-audit (L2-B4) · WS-L2 certification review · registration doc draft.

---

## Business Workspace — Wave 1D Hygiene (June 2026) ✅

**Status:** **COMPLETE** — orphan segment cleanup; no certification; no registration.

**Outcome:** L2-B1 closed. Mock chat/calendar/ai pages + legacy vlink redirect removed. **28 business workspace tests PASS.**

**Deliverables:** [`BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md) · [`BUSINESS_WORKSPACE_ROUTE_INVENTORY.md`](../docs/architecture/BUSINESS_WORKSPACE_ROUTE_INVENTORY.md)

**Next:** ~~Personal **2D**~~ **Done** · WS-L2 certification review · registration doc draft.

---

## Reference Workspace — WS-L2 Assessment (June 2026) ✅

**Status:** **COMPLETE** — governance assessment only; no certification; no registration.

**Outcome:** Combined WS-L2 readiness **74%** · Business **82%** · Personal **79%**. **4 WS-L2 blockers** remain.

**Deliverable:** [`REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md)

**Next:** Wave **1D** · Personal **2D** drift prep · registration doc draft · WS-L2 certification review (deferred).

---

## Personal Dashboard — WS-L1 Certification (June 2026) ✅

**Status:** **COMPLETE** — governance and certification review only; no registration.

**Decision:** **WS-L1 Certified with Findings** — Personal Dashboard shell (`personal-dashboard`).

**Co-surface:** Business Workspace also WS-L1 — dual co-surfaces certified. Registration still requires combined WS-L2.

**Deliverable:** [`PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md)

**Next:** ~~Wave **1D**~~ **Done** · Personal **2D** · WS-L2 certification review.

---

## Personal Dashboard — Wave 2C Standardization (June 2026) ✅

**Status:** **COMPLETE** — implementation + contract enforcement; no certification; no registration.

**Deliverables:** `personalDashboardNavigation.ts` · `crossSurfaceNavigation.ts` · navigation tests · shell wiring · chat layout normalization.

**PD blockers:** **PD-1–PD-4, PD-6–PD-10 closed** (engineering). **0** remaining WS-L2 engineering blockers for personal orchestration.

**WS-L1:** **Certification-ready** — formal review not executed in 2C.

**Deliverable:** [`PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md`](../docs/architecture/audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md)

**Next:** ~~Personal **WS-L1 certification review**~~ **Done** · Combined **WS-L2 assessment** · Business **1D** hygiene.

---

## Personal Dashboard — Wave 2B Contract Package (June 2026) ✅

**Status:** **COMPLETE** — governance and documentation only; no certification; no registration.

**Deliverables:** Routing · widget · cross-surface · context variant contracts.

**WS-L2:** Governance package **complete** — **2C engineering** next.

**Deliverable:** [`PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md`](../docs/architecture/audits/PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md)

**Next:** **Wave 2C** · Business **1D** hygiene.

---

## Personal Dashboard — Wave 2A Co-Surface Audit (June 2026) ✅

**Status:** **COMPLETE** — governance and analysis only; no certification; no registration.

**Outcome:** Boundary audit for Personal Dashboard shell. **10 blockers** (PD-1–PD-10). Co-surface readiness: **Yes with findings**.

**Deliverable:** [`PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md`](../docs/architecture/audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md)

**Next:** ~~**Wave 2B**~~ **2B Done** · **Wave 2C** · Business **1D** hygiene.

---

## Business Workspace — WS-L1 Certification (June 2026) ✅

**Status:** **COMPLETE** — governance and certification review only; no registration; no engineering.

**Decision:** **WS-L1 Certified with Findings** — Business Workspace shell (`/business/:id/workspace/*`).

**Readiness:** **Eligible for Reference Workspace prep** — not registration-ready (WS-L2 + Personal Dashboard co-surface).

**Deliverable:** [`BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md)

**Next:** Wave **1D** hygiene · ~~Personal Dashboard **2A**~~ **2A Done** · **Wave 2B** · **WS-L2** assessment.

---

## Business Workspace — Wave 1C Navigation Contracts (June 2026) ✅

**Status:** **COMPLETE** — enforcement wave; no certification; no registration.

**Changes:** `businessWorkspaceContracts.ts` · segment URL navigation · `shouldRenderWorkspaceChildren` · CI drift tests · [WORKSPACE_ROUTING_CONTRACT.md](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md).

**WS-L1:** **Certified with Findings** — superseded by certification review.

**Deliverable:** [`BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md)

---

## Business Workspace — Wave 1C Navigation Contracts (June 2026) ✅ (historical)

**Status:** **COMPLETE** — implementation wave; no certification; no registration.

**Changes:** Removed 3 stub widgets · deleted 4 dead landings · `DriveWorkspaceLanding` · canonical `ensureBusinessDashboard` · members/analytics segment redirects.

**WS-L1:** **6/9 blockers resolved** — superseded by 1C.

**Deliverable:** [`BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md)

---

## Business Workspace — Wave 1A Boundary Audit (June 2026) ✅

**Status:** **COMPLETE** — audit and governance only; no code; no certifications; no registrations.

**Deliverable:** [`BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md)

**Findings:** Workspace contract v0.1 · **9 WS-L1 blockers** · **4 dead** `*WorkspaceLanding` files · **3 stub widgets** in shell · Drive upload leak in `BusinessWorkspaceContent` · dual mount paths (switch vs nested routes).

**WS-L1:** Stabilizing — blockers documented; strict close after **1B** + **1C**.

**Next:** ~~Business Workspace Wave **1B**~~ **1B Done** · Business Workspace Wave **1C** (navigation contracts).

**Wave 1B (2026-06-14):** [BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md](./BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md) — stubs removed; 4 dead landings deleted; Drive → `DriveWorkspaceLanding`; canonical `ensureBusinessDashboard`.

---

## Reference Workspace Program — Wave 6C Charter (June 2026) ✅

**Status:** **COMPLETE** — governance only; no designation; no certifications; no council action.

**Verdict:** **Reference Workspace Program chartered** as first-class parallel track (program type #3).

| Decision | Outcome |
|----------|---------|
| Workspace track should exist? | **Yes** |
| Separate from UX References? | **Yes** — orchestration vs module interaction |
| Certification model | **WS-L1 / WS-L2 / WS-L3** (orchestration-focused) |
| Inaugural candidate | **Business Workspace** + Personal Dashboard shell |
| Place Publisher Hub | **UX #6** — not workspace inaugural |

**Archetypes:** hub · split · portal · control-center · publisher · dashboard.

**Deliverable:** [`REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](../docs/architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)

**Next:** ~~Business Workspace Wave **1A+**~~ **1A Done** · Business Workspace Wave **1B**.

---

## UX Reference Program — Wave 6C Expansion Review (June 2026) ✅

**Status:** **COMPLETE** — governance review only; no registration; no certification changes; no council action.

**Verdict:** Original UX program (#1–#5 + Wave 6A) **complete** — baseline tier **frozen**. **Approve governed expansion tier** (UX #6+).

| Decision | Outcome |
|----------|---------|
| UX #6 should exist? | **Yes** — governed expansion |
| Place as UX #6? | **Recommended primary candidate** — Eligible CwF; not registered |
| Reference Workspace track? | **Yes — parallel** (not substitute for UX #6) |
| Domain numbered slots? | **No** — pattern annexes (HR, Marketplace, Analytics) |

**Deliverable:** [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../docs/ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)

**Next:** **6B-Place-Ref6-Prep** · **6D-Place-Pattern-Extraction** · **6C-Reference-Workspace-Charter** (parallel).

---

## Place — Wave 6B-Place-Certification-Review (June 2026) ✅

**Status:** **COMPLETE** — first formal Place UX certification review.

**Awards:** **UX-L1 Certified** · **UX-L2 Certified** · **UX-L3 Certified** (strict). **11 PASS / 0 PWF / 0 FAIL**.

**Reference UX #6:** **Eligible With Findings** — not designated; no registration.

**Deliverables:** [`PLACE_UX_CERTIFICATION_REVIEW.md`](../docs/ux/audits/PLACE_UX_CERTIFICATION_REVIEW.md) · updated [`PLACE_UX_SCORECARD.md`](../docs/ux/audits/PLACE_UX_SCORECARD.md) · [`PLACE_UX_CERTIFICATION.md`](../docs/ux/audits/PLACE_UX_CERTIFICATION.md)

**Basis:** Part 2G QA **27/27 PASS** + waves 6B-B/C/D remediation.

**Next:** **6B-Place-Ref6-Prep** (registration artifact; human sign-off).

---

## Place — Wave 6B-Place-QA-R2 (June 2026) ✅

**Status:** **COMPLETE** — env remediation + 15-row re-run (evidence only; no certification).

**Results:** **27 PASS / 0 FAIL / 0 BLOCKED** (combined R1+R2). **PLC-QA-ENV-01:** **Resolved** (migration applied). **P-13:** **Closable**.

**R2 fixes (QA-related):** `PlaceMeetings` menu toggle · trash restore proxy body forward · QA seed (`seed-qa-place.mjs`).

**Deliverables:** [`PLACE_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/PLACE_QA_EXECUTION_REPORT_2026.md) · [`PLACE_QA_ADDENDUM_2026.md`](../docs/ux/audits/PLACE_QA_ADDENDUM_2026.md) · [`qa-evidence/5G-QA/place/`](../docs/ux/audits/qa-evidence/5G-QA/place/)

**Next:** ~~**6B-Place-Certification-Review**~~ **Done**.

---

## Place — Wave 6B-Place-QA (June 2026) ✅

**Status:** **COMPLETE** — Part 2G matrix R1 executed (superseded by R2 closeout above).

**R1 results:** 12 PASS / 3 FAIL / 12 BLOCKED. Blocker **PLC-QA-ENV-01** cleared in R2.

---

## Place — Wave 6B-Place-UX-D (June 2026) ✅

**Status:** **COMPLETE** — trash lifecycle, error handling, dark mode, graph a11y, QA matrix prep; no certification.

**Resolved:** **P-6** · **P-9** · **P-11** (eng) · **P-12** (partial). **Prepared:** **P-13** (27 QA rows).

**Projected scorecard:** **7 PASS / 4 PWF / 0 FAIL** (was 5/6/0).

**Readiness:** L1 **86%** · L2 **82%** · L3 **38%**.

**Next:** **6B-Place-QA** re-run after **PLC-QA-ENV-01** → certification review gate.

**Evidence:** [`PLACE_UX_BATCH_D_CLOSEOUT.md`](../docs/ux/audits/PLACE_UX_BATCH_D_CLOSEOUT.md)

---

## Place — Wave 6B-Place-UX-C (June 2026) ✅

**Status:** **COMPLETE** — consumer shell, mobile sheets, layout consolidation; no certification.

**Resolved:** **P-3** · **P-7** (engineering) · **P-10** · **P-5**. **Partial:** **P-11** · **P-12**.

**Projected scorecard:** **5 PASS / 6 PWF / 0 FAIL** (was 3/7/1).

**Readiness:** L1 **78%** · L2 **68%** · L3 **28%**.

**Next:** **6B-Place-UX-D** (trash, errors, graph a11y, QA).

**Evidence:** [`PLACE_UX_BATCH_C_CLOSEOUT.md`](../docs/ux/audits/PLACE_UX_BATCH_C_CLOSEOUT.md)

---

## Place — Wave 6B-Place-UX-B (June 2026) ✅

**Status:** **COMPLETE** — interaction safety + publisher shell; no certification.

**Resolved:** **P-1** (prompt) · **P-2** (ConfirmModal) · **P-4** (PageHeader/PageToolbar) · **P-8** (DropdownMenu).

**Projected scorecard:** **3 PASS / 7 PWF / 1 FAIL** (was 1/7/3).

**Readiness:** L1 **62%** · L2 **45%** · L3 **18%**.

**Next:** **6B-Place-UX-C** (layout + mobile).

**Evidence:** [`PLACE_UX_BATCH_B_CLOSEOUT.md`](../docs/ux/audits/PLACE_UX_BATCH_B_CLOSEOUT.md)

---

## Place — Wave 6B UX Reference Assessment (June 2026) ✅

**Status:** **COMPLETE** — first formal Place UX assessment; no engineering; no certification; no reference designation.

**Scorecard:** **1 PASS / 7 PWF / 3 FAIL** — **not certified**.

**Readiness:** L1 **38%** · L2 **22%** · L3 **12%** · pattern reuse **32%**.

**Reference UX #6:** **Deferred** (conditional after modernization). **Reference Workspace:** **Ineligible**.

**Blockers:** P-1 `prompt()` · P-2 no ConfirmModal · P-3/P-4 layout shells · P-7 mobile.

**Next:** **6B-Place-UX-B** (interaction safety) when prioritized.

**Evidence:** [`PLACE_UX_BASELINE_AUDIT.md`](../docs/ux/audits/PLACE_UX_BASELINE_AUDIT.md)

---

## UX Reference Program — Wave 6A Pattern Extraction (June 2026) ✅

**Status:** **COMPLETE** — documentation and governance only; no engineering.

**Outcome:** **56** canonical UX patterns extracted from registered references #1–#5 into **9** pattern standard documents + master catalog.

**Deliverables:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../docs/ux/UX_REFERENCE_PATTERN_CATALOG.md) · [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../docs/ux/UX_REFERENCE_PROGRAM_CLOSEOUT.md) · [`docs/ux/patterns/`](../docs/ux/patterns/)

**Program verdict:** UX Reference Module Program (registration roster + pattern extraction) **complete**. Follow-on: Chat UX, Place UX, partner enforcement — not Wave 6A blockers.

**Evidence:** [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../docs/ux/UX_REFERENCE_PROGRAM_CLOSEOUT.md)

---

## AI Experience — Wave 5H-AI-Ref4-Registration (June 2026) ✅

**Status:** **COMPLETE** — Reference UX **#4** registered; governance only.

**Decision:** **Approved with Findings** — official holder: **AI Experience**.

**Registration:** [`REFERENCE_MODULE_AI.md`](../docs/ux/audits/REFERENCE_MODULE_AI.md)

**UX certification (unchanged):** UX-L1 · UX-L2 · **UX-L3 Certified with Findings**.

**Roster:** UX reference slots **#1–#5** fully registered.

**Evidence:** [`REFERENCE_MODULE_AI.md`](../docs/ux/audits/REFERENCE_MODULE_AI.md)

---

## AI Experience — Wave 5H-AI-Ref4-Prep (June 2026) ✅

**Status:** **COMPLETE** — Reference UX #4 registration readiness review; no registration; no council.

**Recommendation:** **Approved with Findings** (readiness) — council action pending.

**Gates met:** UX-L3 CwF · Part 2F QA · portfolio fit · 11/0/0 scorecard.

**Slot:** **Vacant — reserved**; AI Experience recommended official UX #4 holder.

**Findings:** R-AI-1–4 + QA-ENV-02 carry-forward; **0 registration blockers**.

**Next:** **5H-AI-Ref4-Registration** — `REFERENCE_MODULE_AI.md` + council.

**Evidence:** [`AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md`](../docs/ux/audits/AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md)

---

## AI Experience — Wave 5H-AI-L1L2-D (June 2026) ✅

**Status:** **COMPLETE** — formal UX certification review; no engineering; no UX #4 registration.

**Award:** **UX-L1 Certified** · **UX-L2 Certified** · **UX-L3 Certified with Findings** (first AI awards).

**Scorecard:** **11 PASS / 0 PWF / 0 FAIL** — **AI-9** reclassified as non-scorecard architecture debt.

**UX #4:** **Eligible With Findings** — slot **still reserved**.

**Open:** **AI-9** (debt), **R-AI-1**–**R-AI-4**, **QA-ENV-02**.

**Next:** **5H-AI-Ref4-Prep** when UX #4 prioritized.

**Evidence:** [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](../docs/ux/audits/AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md)

---

## AI Experience — Wave 5H-AI-UX-D (June 2026) ✅

**Status:** **COMPLETE** — Part 2F QA execution; evidence only; no certification award.

**QA outcome:** **20 PASS / 0 FAIL / 2 BLOCKED** (AI-06 business hub; AI-16 mobile automation).

**Post-QA scorecard:** **11 PASS / 1 PWF / 0 FAIL** (was 8/3/0).

**Closed:** **AI-10**, **AI-11**, **AI-15**. **Deferred:** **AI-9** (architectural debt).

**Readiness:** L1 **95%** · L2 **92%** · L3 **38%** — **UX-L1/L2 review ready**.

**Next:** Formal UX-L1/L2 review wave (when prioritized).

**Evidence:** [`AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md)

---

## AI Experience — Wave 5H-AI-UX-C (June 2026) ✅

**Status:** **COMPLETE** — navigation consolidation + widget parity + Part 2F prep; no certification; no QA execution.

**Projected scorecard:** **8 PASS / 3 PWF / 0 FAIL** (was 7/4/0).

**Resolved:** **AI-12**, **AI-13**, **AI-14**; **AI-15** documented in Part 2F. **Prepared:** **AI-10**, **AI-11**. **Deferred:** **AI-9** (architectural debt).

**Readiness:** L1 **88%** · L2 **78%** · L3 **30%**.

**Next:** **5H-AI-UX-D** (Part 2F QA + cert review).

**Evidence:** [`AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md`](../docs/ux/audits/AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md)

---

## AI Experience — Wave 5H-AI-UX-B (June 2026) ✅

**Status:** **COMPLETE** — engineering remediation; no certification award; no QA.

**Projected scorecard:** **7 PASS / 4 PWF / 0 FAIL** (was 3/6/2).

**Resolved:** **AI-1–AI-8** — confirm delete, menus, layout shell, mobile sheet, EmptyState, a11y labels.

**Readiness:** L1 **72%** · L2 **58%** · L3 **22%**.

**Reference UX #4:** **Deferred** — conditional reserve holds.

**Next:** **5H-AI-UX-C** (light) → **5H-AI-UX-D** (QA + cert review).

**Evidence:** [`AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md`](../docs/ux/audits/AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md)

---

## AI Experience — Wave 5H-AI-UX-A (June 2026) ✅

**Status:** **COMPLETE** — first formal UX audit; no certification award; no engineering.

**Baseline:** **3 PASS / 6 PWF / 2 FAIL** — Layout + Mobile **FAIL**; embedded delete/menu gaps (**AI-1**, **AI-2**).

**Readiness:** L1 **42%** · L2 **28%** · L3 **15%**.

**Evidence:** [`AI_EXPERIENCE_UX_AUDIT_2026.md`](../docs/ux/audits/AI_EXPERIENCE_UX_AUDIT_2026.md)

---

## Reference UX #4 Strategic Review (June 2026) ✅

**Status:** **COMPLETE** — portfolio strategy only; no designation; no certification change.

**Decision:** **Reserve UX #4 for AI Experience** (`AIChatWorkspace` / twin chat UX).

**Vacancy:** **Filled** — AI Experience registered as Reference UX **#4** (2026-06-03).

**Rankings:** (1) AI Experience · (2) Place (future slot) · (3) Chat · (4) Dashboard · Business Workspace ineligible.

**Evidence:** [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](../docs/ux/audits/REFERENCE_UX_4_STRATEGIC_REVIEW.md)

---

## Todo — Reference UX #3 Registration (June 2026) ✅

**Status:** **COMPLETE** — governance registration only; no UX level change; no engineering.

**Decision:** **Approved with Findings** — Reference UX **#3** (task workspace / multi-view UX).

**Clarification:** Independent of Architecture Reference **#4** (Todo code L3). UX-L3 **Certified** (11 PASS / 0 PWF) unchanged.

**Evidence:** [`REFERENCE_MODULE_TODO.md`](../docs/ux/audits/REFERENCE_MODULE_TODO.md)

---

## Chat — Wave 5H-Chat-Reassess (June 2026) ✅

**Status:** **COMPLETE** — UX modernization reassessment only; no engineering; no certification change.

**Outcome:** **6 PASS / 5 PWF / 0 FAIL** (5B.3 authoritative, unchanged); **52%** L2-ready · **28%** L3-ready.

**Findings open:** C-5 search stub · C-6 conversation management · C-8 QA · C-9 hub pattern.

**Architecture Reference #2:** **Retain** (Chat code L3). **UX Reference #2:** **Rejected** — Notifications holds slot.

**Shortest L2 path:** **5H-Chat-L2** → **5G-QA-EXEC** Part 2E → **5H-Chat-L2-D**.

**Strategic priority:** **#4** — after Todo Reference UX #3, AI Platform L3 scoping, new-module modernization.

**Evidence:** [`CHAT_UX_MODERNIZATION_REASSESSMENT.md`](../docs/ux/audits/CHAT_UX_MODERNIZATION_REASSESSMENT.md)

---

## QA-ENV-04 — Build validation hardening (June 2026) ✅

**Status:** **RESOLVED** — platform reliability only; no certification or feature changes.

**Gap closed:** `verify:ci` and GitHub Actions now run `pnpm run build:web` (`next build`) after `type-check` — catches bundler-only failures like QA-ENV-01.

**Cloud Build:** Already ran `next build` in `web/Dockerfile.production`; no pipeline change.

**New flow:** `pnpm verify:ci` = `type-check` → `build:web` → `test`.

**Evidence:** [`QA_ENV_04_BUILD_VALIDATION_CLOSEOUT.md`](../docs/architecture/audits/QA_ENV_04_BUILD_VALIDATION_CLOSEOUT.md).

---

## QA-ENV-01 — Environment blocker remediation (June 2026) ✅

**Status:** **RESOLVED** — runtime/build investigation only; no QA re-run; no certification changes.

**Root cause:** `ContextMenu.tsx` / `DropdownMenu.tsx` imported `./menuShared.js` while Next.js bundles `shared/src` via path alias — `.js` sibling does not exist in source; TypeScript `bundler` resolution masked the gap.

**Fix:** Extensionless `./menuShared` imports in both files (matches shared component convention).

**Validation:** `/calendar/month|day|week|year`, `/chat`, `/todo`, `/notifications` compile (dev turbo); `pnpm type-check` PASS.

**Evidence:** [`QA_ENV_01_ROOT_CAUSE_ANALYSIS.md`](../docs/ux/audits/QA_ENV_01_ROOT_CAUSE_ANALYSIS.md).

**Residual:** **QA-ENV-02** — `JWT_SECRET` missing blocks local backend; **E-14** **resolved** (R3).

---

## Todo — Wave 5G-Todo-L3-D (June 2026) ✅

**Status:** **COMPLETE** — UX-L3 certification review; no council action; no designation award.

**Outcome:** **11 PASS / 0 PWF / 0 FAIL** — cats 4+5 upgraded from T-11 evidence.

**Awards:** **UX-L1 Certified** · **UX-L2 Certified** (upgraded from CwF) · **UX-L3 Certified** (first Todo L3).

**Reference UX #3:** **Approved with Findings** — registered (separate governance wave).

**Evidence:** [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](../docs/ux/audits/TODO_UX_L3_CERTIFICATION_REVIEW.md), [`REFERENCE_MODULE_TODO.md`](../docs/ux/audits/REFERENCE_MODULE_TODO.md)

---

## Todo — Wave 5G-QA-EXEC Part 2C (June 2026) ✅

**Status:** **COMPLETE** — QA evidence only; certification unchanged.

**Outcome:** **25 PASS / 0 FAIL / 2 BLOCKED / 1 N/A / 2 KNOWN-PWF** (TODO-01–30).

**T-11:** **Closable** — full Part 2C matrix; 0 P0 FAIL.

**Status:** Superseded by **5G-Todo-L3-D** certification.

**Evidence:** [`TODO_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/TODO_QA_EXECUTION_REPORT_2026.md)

---

## Todo — Wave 5G-Todo-L3 Prep (June 2026) ✅

**Status:** **COMPLETE** — UX-L3 readiness audit only; no certification promotion.

**Outcome:** **74%** L3-ready — **9 PASS / 2 PWF**; **T-11** sole critical gate.

**Next:** **5G-QA-EXEC** Part 2C → **5G-Todo-L3-D**.

**Evidence:** [`TODO_UX_L3_READINESS_REVIEW.md`](../docs/ux/audits/TODO_UX_L3_READINESS_REVIEW.md)

---

## Notifications — Reference UX #2 Registration (June 2026) ✅

**Status:** **COMPLETE** — governance registration only; no UX level change; no engineering.

**Decision:** **Approved with Findings** — Reference UX **#2** (management-page inbox UX).

**Clarification:** Independent of Architecture Reference **#2** (Chat). Chat UX #2 **Rejected** (5B.3).

**Evidence:** [`REFERENCE_MODULE_NOTIFICATIONS.md`](../docs/ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md)

---

## Notifications — Wave 5G-Notifications-D (June 2026) ✅

**Status:** **COMPLETE** — UX-L3 certification review; no council action; no designation award.

**Outcome:** **11 PASS / 1 PWF / 0 FAIL** — cats 4+5 upgraded from N-6 evidence; cat 8 PWF retained (N-4).

**Awards:** **UX-L1 Certified** · **UX-L2 Certified** (upgraded from CwF) · **UX-L3 Certified with Findings** (first Notifications L3).

**Reference UX #2:** **Approved with Findings** — registered (separate governance wave).

**Evidence:** [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](../docs/ux/audits/NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md)

---

## Calendar — Wave 5G-Calendar-D (June 2026) ✅

**Status:** **COMPLETE** — UX-L3 certification review; no council action; no designation award.

**Outcome:** **11 PASS / 0 PWF / 0 FAIL** — cats 4+5 upgraded from E-14 evidence.

**Awards:** **UX-L1 Certified** · **UX-L2 Certified** (upgraded from CwF) · **UX-L3 Certified** (first Calendar L3).

**Reference UX #5:** **Approved with Findings** — registered 2026-06-03.

**Evidence:** [`REFERENCE_MODULE_CALENDAR.md`](../docs/ux/audits/REFERENCE_MODULE_CALENDAR.md), [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](../docs/ux/audits/CALENDAR_UX_L3_CERTIFICATION_REVIEW.md)

---

## Calendar — Reference UX #5 Registration (June 2026) ✅

**Status:** **COMPLETE** — governance only; no UX level change; no engineering.

**Decision:** **Approved with Findings** — Reference UX #5 (scheduling/time-grid UX). Architecture Reference #3 unchanged; Architecture #5 remains Place.

**Evidence:** [`REFERENCE_MODULE_CALENDAR.md`](../docs/ux/audits/REFERENCE_MODULE_CALENDAR.md)

---

## Notifications — Wave 5G-QA-EXEC Part 2B (June 2026) ✅

**Status:** **COMPLETE** — superseded by 5G-Notifications-D certification.

**Outcome:** **18 PASS / 0 FAIL / 0 BLOCKED / 2 N/A** (NTF-01–20).

**N-6:** **Resolved** — full Part 2B matrix; 0 P0 FAIL.

**Evidence:** [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md)

---

## Notifications — Wave 5G-Notifications L3 Remediation (June 2026) ✅

**Status:** **COMPLETE** — engineering only; superseded for process gate by QA exec.

**Evidence:** [`NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md)

---

## Notifications — Wave 5G-Notifications-L3 Prep (June 2026) ✅

**Status:** **COMPLETE** — readiness audit only; superseded by 5G remediation for engineering gates.

**Evidence:** [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](../docs/ux/audits/NOTIFICATIONS_UX_L3_READINESS_REVIEW.md)

---

## Calendar — Wave 5G-QA-EXEC-R3 (June 2026) ✅

**Status:** **COMPLETE** — E-14 closed; superseded by 5G-Calendar-D certification.

**Outcome:** **19 PASS / 0 FAIL / 4 BLOCKED / 1 N/A**.

**Evidence:** [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](../docs/ux/audits/CALENDAR_QA_EXEC_R3_REPORT_2026.md)

---

## Calendar — Wave 5G-QA-EXEC-R2 (June 2026) ✅

**Status:** **COMPLETE** — targeted QA only; superseded by R3 full matrix.

**Outcome:** **5/5 PASS** — CAL-06, CAL-08, CAL-14, CAL-16, CAL-22 (desktop light).

**Evidence:** [`CALENDAR_QA_EXEC_R2_REPORT_2026.md`](../docs/ux/audits/CALENDAR_QA_EXEC_R2_REPORT_2026.md)

---

## Calendar — Wave 5G-Calendar-QA-Remediation (June 2026) ✅

**Status:** **COMPLETE** — engineering remediation; R2 QA validated fixes.

**Evidence:** [`CALENDAR_QA_REMEDIATION_BATCH5G_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_QA_REMEDIATION_BATCH5G_CLOSEOUT.md)

---

## Calendar — Wave 5G-QA-EXEC Re-run (June 2026) ✅

**Status:** **Superseded by R3** — initial re-run **9 PASS / 5 FAIL / 9 BLOCKED**; remediation + R2 + R3 closed all exercisable rows.

**Evidence:** [`CALENDAR_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/CALENDAR_QA_EXECUTION_REPORT_2026.md)

---

## Calendar — UX-L3 Readiness Review (Wave 5G-Calendar-L3 Prep) (June 2026) ✅

**Status:** **Superseded by 5G-Calendar-D** — readiness audit complete; L3 now **Certified**.

**Evidence:** [`CALENDAR_UX_L3_READINESS_REVIEW.md`](../docs/ux/audits/CALENDAR_UX_L3_READINESS_REVIEW.md), [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](../docs/ux/audits/CALENDAR_UX_L3_CERTIFICATION_REVIEW.md)

---

## AI Platform — L3 Readiness & Strategic ROI Review (June 2026) ✅

**Status:** **COMPLETE** — planning/governance only; no runtime changes; **no L3 promotion**.

**Decision:** **Defer AI Platform L3** — readiness **52/100**; UX certification higher ROI.

**Evidence:** [`AI_PLATFORM_LEVEL3_READINESS_REVIEW.md`](../docs/architecture/audits/AI_PLATFORM_LEVEL3_READINESS_REVIEW.md).

**Recommended next:** **UX Wave 5G-QA** + **Calendar → UX-L3 → Reference UX #5**; parallel **Notifications L3** path. **Do not start** AI Waves 2A–2C yet.

---

## AI Platform — Level 2 Certification Review (June 2026) ✅

**Status:** **CERTIFIED** — formal governance review only; no runtime changes.

**Decision:** **APPROVED WITH FINDINGS** — **Level 2 — Platform Compliant** (2026-06-03).

**Evidence:** [`AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md), [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md), [`AI_PLATFORM_SCORECARD.md`](../docs/architecture/AI_PLATFORM_SCORECARD.md).

**Maturity:** **Level 2 — Platform Compliant** (ledger). Waves **1A–1E** + formal L2 review complete.

**Next:** See **L3 Readiness & ROI Review** above — L3 deferred.

---

## AI Platform — Wave 1E Provider Capability Matrix (June 2026) ✅

**Status:** **SHIPPED** — canonical LLM capability matrix, routing/fallback hardening, trace diagnostics.

**Changes:** `providerCapabilityMatrix.ts`, `providerRouting.ts`; `GET /api/ai/models` exposes `capabilities`; `llmProviderRouting` on pipeline trace; 12 vitest cases.

**Evidence:** [`AI_PLATFORM_WAVE_1E_PROVIDER_CAPABILITY_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1E_PROVIDER_CAPABILITY_CLOSEOUT.md).

**Maturity:** Historical — superseded by **Level 2 certification** above.

---

## AI Platform — Wave 1D Admin Gates & Diagnostics (June 2026) ✅

**Status:** **SHIPPED** — centralized-ai admin fence; diagnostics trace/reasoning alignment.

**Changes:** Mount `requireAdmin` + `centralizedAiDeprecatedMiddleware` on `/api/centralized-ai`; 410 for `/learning/event` and `/models/*`; `mergeDiagnosticsFromHistoryContext`; twin history saves `_conversationReasoning`.

**Evidence:** [`AI_PLATFORM_WAVE_1D_ADMIN_DIAGNOSTICS_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1D_ADMIN_DIAGNOSTICS_CLOSEOUT.md).

**Maturity:** Historical — superseded by Wave **1E**.

---

## AI Platform — Wave 1C Drive Context Provider (June 2026) ✅

**Status:** **SHIPPED** — Drive AI context on canonical `driveVisibilityService`; controller Prisma removed.

**Changes:** `driveAIContextService`; `listAccessibleRecentFilesForAIContext`, `aggregateAccessibleDriveStorageForAIContext`, `countAccessibleDriveFilesForAIContext`; 21 vitest cases; matrices **N → C** for Drive context providers.

**Evidence:** [`AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md), [`AI_CONTEXT_PROVIDER_MATRIX.md`](../docs/architecture/audits/AI_CONTEXT_PROVIDER_MATRIX.md).

**Maturity:** Historical — superseded by Wave **1D**.

---

## AI Platform — Wave 1B Constitutional Remediation (June 2026) ✅

**Status:** **SHIPPED** — P1 blockers resolved; superseded for context path by 1C.

**Changes:** `/api/ai/user-context` canonical mount; `driveAIActionService`, `hrAIActionService`, `schedulingAIActionService`; `grantFileShareByEmail`; autonomous writes **410**; `POST /api/ai/chat` deprecated; twin `/:module` UUID guard.

**Evidence:** [`AI_PLATFORM_SCORECARD.md`](../docs/architecture/AI_PLATFORM_SCORECARD.md), [`AI_CANONICAL_ROUTE_MAP.md`](../docs/architecture/AI_CANONICAL_ROUTE_MAP.md), tests under `server/src/ai/**/__tests__`.

**Maturity:** Historical — see Wave **1C** section above.

---

## AI Platform — Wave 1A Route Audit (June 2026) ✅

**Status:** **COMPLETE** — planning artifact; superseded by 1B implementation.

---

## AI Platform — Wave G0 Constitutional Framework (June 2026) ✅

**Status:** **GOVERNANCE COMPLETE** — no runtime changes.

**Constitutional authority:** [`AI_PLATFORM_CONSTITUTION.md`](../docs/architecture/AI_PLATFORM_CONSTITUTION.md), [`AI_PLATFORM_BOUNDARY_MODEL.md`](../docs/architecture/AI_PLATFORM_BOUNDARY_MODEL.md), [`AI_PLATFORM_OPERATION_MATRIX.md`](../docs/architecture/AI_PLATFORM_OPERATION_MATRIX.md), [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../docs/architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)

**Wave 0 audits (evidence):** [`audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md`](../docs/architecture/audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md) + tool/context/admin/legacy matrices.

---

## AI Platform — Wave 0 Audit (June 2026) ✅

**Status:** **DISCOVERY COMPLETE** — superseded for governance by G0 docs; audits remain evidence baseline.

---

## Business Workspace — Wave 0 Constitutional Audit (June 2026) ✅

**Status:** **DISCOVERY COMPLETE** — governance only; no runtime changes.

**Identity:** **Platform shell + workspace runtime** (Hybrid **D**) — **not** a product `moduleId`, **not** L3 certifiable as Drive/Todo, **not** Reference Module #6.

**Evidence:** [`BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [`BUSINESS_WORKSPACE_OPERATION_MATRIX.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_OPERATION_MATRIX.md)

**Maturity:** **Level 1 — Stabilizing** (ledger). Wave 3 target: **Level 2 platform shell** after 1A–2C.

**Next:** Wave **1A** — boundary doc + wire/delete dead `*WorkspaceLanding`; **1B** hub standard; **2B** retire stub dashboard/analytics/members widgets.

---

## UX Modernization — Wave 1.5 Skeleton Tokens (June 2026) ✅

**Status:** **SHIPPED** — Family 6 `--v-skeleton-*`, `.v-skeleton` + `skeleton-loading` in `ux.css`, `LoadingSkeleton` migrated. Zero module consumers today.

**Closeout:** [`docs/ux/audits/WAVE1_QA_CLOSEOUT.md`](../docs/ux/audits/WAVE1_QA_CLOSEOUT.md) — PASS. **Wave 2B-3 Batch 1:** **closed** — [`CONFIRMMODAL_BATCH1_CLOSEOUT.md`](../docs/ux/audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) (**PASS WITH FINDINGS**). **Batch 2 closed** — [`CONFIRMMODAL_BATCH2_CLOSEOUT.md`](../docs/ux/audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md); **43** confirms remaining. **Wave 3A-0–2:** **done** — menu primitives hardened — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../docs/ux/CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md). **Wave 3A-3:** **done** — Drive Reference Menu Certification — [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](../docs/ux/audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md). **Wave 3A-4A:** **done** — AI menu rollout — [`AI_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/AI_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4B:** **done** — Notifications menu rollout — [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4C:** **done** — Chat menu rollout — [`CHAT_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/CHAT_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4D:** **done** — Todo menu rollout — [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/TODO_MENU_ROLLOUT_CLOSEOUT.md): `TaskItem` → `DropdownMenu`; `pnpm type-check` PASS. **3A-4 platform rollout complete.** **Wave 3A-5:** **done** — platform menu certification — [`PLATFORM_MENU_CERTIFICATION.md`](../docs/ux/audits/PLATFORM_MENU_CERTIFICATION.md) (**PASS WITH FINDINGS**): `ContextMenu`/`DropdownMenu`/`Popover` ratified; 7+9+1 `web/` consumers; manual QA gate pending. **Wave 3C-0:** **done** — layout shell inventory — [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](../docs/ux/LAYOUT_SHELL_STANDARDIZATION_REVIEW.md): ~12 shell families; Drive = workspace reference; `WorkspaceSplitLayout` + `PlatformShell` extraction recommended. **Wave 3C-1:** **done** — `WorkspaceSplitLayout` primitive + Drive pilot (`DrivePageContent`, `DriveModule`); `pnpm type-check` PASS. **Wave 3C-2:** **done** — Drive `WorkspaceSplitLayout` rollout (starred/shared/recent/trash + business drive branch); `pnpm type-check` PASS. **Wave 3C-3:** **done** — Chat `WorkspaceSplitLayout` rollout (`ChatContent` 3-col + `EnhancedChatModule` 2/3-col); certified exceptions: `MobileChat`, `UnifiedGlobalChat`; `pnpm type-check` PASS. **Wave 3C-4:** **done (PLAN)** — PlatformShell standardization plan — [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](../docs/ux/PLATFORMSHELL_STANDARDIZATION_PLAN.md). **Wave 3C-4A:** **done** — `PlatformShell` foundation (`layouts/PlatformShell.tsx` + slot subcomponents); zero consumers; `pnpm type-check` PASS. **Wave 3C-4B:** **done** — `PlatformLeftSidebar` + `PlatformRightRail` extracted; `DashboardLayoutInner` + `DashboardLayoutWrapper` wired (behavior preserved); `pnpm type-check` PASS. **Wave 3C-4C:** **done** — `DashboardLayoutWrapper` → `PlatformShell` (`mode="business"`, `useNativePanels`); first production consumer; `pnpm type-check` PASS. **Wave 3C-4D:** **done (PLAN)** — header unification plan — [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](../docs/ux/PLATFORM_HEADER_STANDARDIZATION_PLAN.md): Option B (`PlatformHeader` + shared tabs); unify before Inner → PlatformShell. **Wave 3C-4D.1:** **done** — `PlatformHeader` + `platformHeaderTabs` + `useNativeHeader` on `PlatformShell`. **Wave 3C-4D.2:** **done** — `GlobalHeaderTabs` → `PlatformHeader` (`mode="business"`); `DashboardLayoutWrapper` `useNativeHeader`. **Wave 3C-4D.3:** **done** — `DashboardLayoutInner` personal header → `PlatformHeader` (`mode="personal"`). **Wave 3C-4D.4:** **done** — `PlatformHeaderActionRow` shared by both headers. **Wave 3C-4E:** **done** — `DashboardLayoutInner` → `PlatformShell`. **Wave 3C-4F:** **done** — PlatformShell certified — [`PLATFORMSHELL_CERTIFICATION.md`](../docs/ux/audits/PLATFORMSHELL_CERTIFICATION.md) (**PASS WITH FINDINGS**); Wave 3C PlatformShell program **complete**; manual QA pending. **Wave 3C-5:** **done** — AI Chat deduplication — [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](../docs/ux/audits/AI_CHAT_DEDUPLICATION_CLOSEOUT.md): `AIChatWorkspace` single implementation; `ai-chat/page.tsx` + `AIChatModule.tsx` thin entry points; `pnpm type-check` PASS. **Wave 3C-6:** **done** — Notifications layout consolidation — [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md): `PageHeader` + `PageToolbar` primitives; `/notifications` double chrome removed; `pnpm type-check` PASS. **Wave 3C paused.** **Wave 3B-0:** **done (PLAN)** — Drive interaction completion review — [`DRIVE_INTERACTION_COMPLETION_REVIEW.md`](../docs/ux/DRIVE_INTERACTION_COMPLETION_REVIEW.md). **Wave 3B-1:** **done** — empty-trash permanent purge ConfirmModal — [`DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md`](../docs/ux/audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md): `drive/trash/page.tsx` + `GlobalTrashBin.tsx`; 0 native empty-trash confirms; `pnpm type-check` PASS. **Wave 3B-3:** **done** — per-item permanent delete ConfirmModal — [`DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md`](../docs/ux/audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md): trash page + GlobalTrashBin per-item flows; `pnpm type-check` PASS. **Wave 3B-2:** **done** — drag-to-trash parity — [`DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md`](../docs/ux/audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md): `DriveModule` `handleDragEnd` → `requestMoveToTrash`; reuses existing `ConfirmModal`; `pnpm type-check` PASS. **Wave 3B-4:** **done** — folder create modal — [`DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md`](../docs/ux/audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md): `DriveCreateFolderModal` + 7 prompt sites migrated; 0 scoped `prompt()`; `pnpm type-check` PASS. **Wave 3B-4b:** **done** — business workspace folder create parity — [`DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md`](../docs/ux/audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md): `BusinessWorkspaceContent` → `DriveCreateFolderModal`; 0 Drive folder-create `prompt()`; `pnpm type-check` PASS. **Wave 3B-5:** **done** — keyboard + a11y pass — [`DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md`](../docs/ux/audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md). **Wave 3B-6:** **done** — Drive interaction certification — [`DRIVE_INTERACTION_CERTIFICATION.md`](../docs/ux/audits/DRIVE_INTERACTION_CERTIFICATION.md) + [`DRIVE_REFERENCE_UX_SCORECARD.md`](../docs/ux/audits/DRIVE_REFERENCE_UX_SCORECARD.md): **Reference UX Module #1 — Approved with Findings**; 3B program **complete**. **Next:** Human QA matrix execution + Wave 5 numeric UX-L3 audit (program choice; not 3C-7 unless reprioritized).

## UX Modernization — Wave 1 Token Foundation (June 2026) ✅

**Status:** **SHIPPED** — `Spinner`, `EmptyState`, `Card`, `Input`, `Button`, `LoadingOverlay` on `v.*` tokens.

## UX Modernization — Wave 0 Foundation (June 2026) ✅

**Status:** **SHIPPED** — UX governance docs (`docs/ux/`), `ux-standards.mdc`, additive `--v-*` tokens in `web/src/styles/tokens.css` + Tailwind `v.*` namespace.

**Canonical:** [`docs/ux/UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md), [`UX_MODERNIZATION_ROADMAP.md`](../docs/ux/UX_MODERNIZATION_ROADMAP.md)

**Reference UX Module #1:** Drive / File Hub — **Approved with Findings** (3B-6 + 5A registration — [`REFERENCE_MODULE_DRIVE.md`](../docs/ux/audits/REFERENCE_MODULE_DRIVE.md)). **Wave 5A:** **done** — platform UX-L3 framework — [`UX_CERTIFICATION_STANDARD.md`](../docs/ux/UX_CERTIFICATION_STANDARD.md), [`UX_CERTIFICATION_SCORECARD.md`](../docs/ux/UX_CERTIFICATION_SCORECARD.md), [`REFERENCE_MODULE_PROGRAM.md`](../docs/ux/REFERENCE_MODULE_PROGRAM.md). **Wave 5B:** **done** — Chat UX certification — [`CHAT_UX_CERTIFICATION.md`](../docs/ux/audits/CHAT_UX_CERTIFICATION.md) + [`CHAT_UX_SCORECARD.md`](../docs/ux/audits/CHAT_UX_SCORECARD.md): **UX-L1 Certified with Findings**; Reference UX Module #2 **Rejected** (pending re-cert). **Wave 5B.1:** **done** — Chat interaction safety — [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](../docs/ux/audits/CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md): C-1/C-2/C-3 resolved. **Wave 5B.2:** **done** — Chat mobile parity — [`CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md`](../docs/ux/audits/CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md). **Wave 5B.3:** **done** — Chat UX re-certification — [`CHAT_UX_RECERTIFICATION_2026.md`](../docs/ux/audits/CHAT_UX_RECERTIFICATION_2026.md): **UX-L1 CwF**; Reference UX #2 **Rejected**. **Wave 5C:** **done** — Notifications UX certification (initial audit). **Wave 5C.1:** **done** — interaction safety — [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md): N-1 resolved. **Wave 5C.2:** **done** — Notifications UX re-certification — **UX-L2 CwF** (9 PASS). **Wave 5D:** **done** — Todo UX certification (initial). **Wave 5D.1:** **done** — interaction safety — T-1 resolved. **Wave 5D.2:** **done** — Todo UX re-certification — [`TODO_UX_RECERTIFICATION_2026.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026.md): **UX-L1 CwF** (6 PASS / 5 PWF); L2/L3 not certified. **Wave 5D.3:** **done** — Todo layout/workflow — [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](../docs/ux/audits/TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md): T-2–T-5 resolved. **Wave 5D.4:** **done** — Todo UX re-certification — [`TODO_UX_RECERTIFICATION_2026_5D4.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026_5D4.md): **UX-L1 CwF** (8 PASS / 3 PWF); UX-L2 not met (one short). **Wave 5E:** **done** — Calendar UX certification — [`CALENDAR_UX_CERTIFICATION.md`](../docs/ux/audits/CALENDAR_UX_CERTIFICATION.md): **UX-L1 not certified** (2 PASS / 2 FAIL). **Wave 5E.1:** **done** — Calendar interaction safety — [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md): E-1–E-3, E-9 resolved; 0 native dialogs. **Wave 5E.2:** **done** — month workflow parity — [`CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md): E-4, E-5 resolved. **Wave 5E.3:** **done** — Calendar UX re-certification — [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](../docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_5E3.md): **UX-L1 CwF** (6 PASS / 5 PWF). **Wave 3C-7 plan:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../docs/ux/CALENDAR_LAYOUT_MODERNIZATION_PLAN.md). **Wave 3C-7A:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md): E-6, E-7 resolved; month + business hub on `WorkspaceSplitLayout`. **Wave 3C-7B:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md): day/week/year on `CalendarPageShell`; mobile sidebar; E-8, E-10, E-16 resolved; `BusinessCalendarWidget` removed. **Wave 3C-7C:** **done** — [`CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md): `EmptyState`, `ContextMenu` on chips, shortcuts help; E-11–E-13 resolved. **Wave 3C-7D:** **done** — [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](../docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md): **UX-L1 Certified**; **UX-L2 CwF** (9 PASS). **3C-7 complete.** **Wave 5F:** **done** — [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../docs/ux/PLATFORM_CERTIFICATION_GAP_ANALYSIS.md): platform gap report; fastest L2 = Todo; highest ROI = Calendar; Ref #2 = Notifications; Ref #5 = Calendar. **Wave 5G-Todo:** **done** — [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](../docs/ux/audits/TODO_L2_POLISH_BATCH5G_CLOSEOUT.md): T-8 shared `EmptyState`, T-9 overflow `aria-label`, T-7 partial responsive detail; `pnpm type-check` PASS. **Wave 5G-Todo-D:** **done** — [`TODO_UX_RECERTIFICATION_2026_5G.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026_5G.md): **9 PASS / 2 PWF**; **UX-L1 Certified**; **UX-L2 CwF**. **Wave 5G-QA (plan):** **done** — [`PLATFORM_MANUAL_QA_MATRIX.md`](../docs/ux/PLATFORM_MANUAL_QA_MATRIX.md) + [`PLATFORM_MANUAL_QA_RUNBOOK.md`](../docs/ux/PLATFORM_MANUAL_QA_RUNBOOK.md). **Wave 5G-QA-D:** **done** — [`PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md`](../docs/ux/audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md). **Wave 5G-Calendar-D:** **done** — Calendar **UX-L3 Certified**; **Reference UX #5 Approved with Findings**. **Wave 5G-Notifications-D:** **done** — Notifications **UX-L3 CwF** (11 PASS / 1 PWF). **Reference UX #2 Notifications:** **Approved with Findings** — [`REFERENCE_MODULE_NOTIFICATIONS.md`](../docs/ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md). **Next:** Todo T-11 QA → **5G-Todo-D**.

---

## AI Conversation Reasoning Layer (June 2026) ✅

**Status:** **IMPLEMENTED** — deterministic pre-generation layer in `server/src/ai/conversation/`, wired into `DigitalLifeTwinCore` after query analysis.

**Canonical doc:** [`docs/architecture/AI_CONVERSATION_REASONING.md`](../docs/architecture/AI_CONVERSATION_REASONING.md)

**Behavior:** Detects objective (`explore` | `diagnose` | `decide` | `plan` | `execute` | `learn`), understanding confidence (0–100), premature-solution risk, and coaching policy. In explore/diagnose + low confidence, suppresses recommendation richness and injects coaching prompt blocks (reflect/probe vs generic advice).

**Diagnostics:** `metadata.conversationReasoning` on twin responses; logged at `[AI_CONTEXT_ASSEMBLY]`.

---

## Most recent completed project — Notebook Level 3 Certified (June 2026) ✅

**Status:** **Level 3 — Certified** (composition module). **Not** Reference Module #5 — Place is Reference #5 **Strong Candidate** (**Level 2 Certified**).

**Evidence:** [`NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md), [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md)

**Next:** Business Workspace Wave 1A+ shell hardening, then Dashboard / Analytics modernization. Optional Place post-Reference hygiene PL-H1–H7.

**Place Wave 4B (2026-06-02):** **Reference Module #5 designated** — [PLACE_REFERENCE_COUNCIL_REVIEW.md](../docs/architecture/audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). Council vote: **Approve**.

**Place Wave 4A (2026-06-02):** Reference #5 evidence package.

**Place Wave 2D (2026-06-02):** **Level 2 — Certified** — [PLACE_LEVEL2_CERTIFICATION_REVIEW.md](../docs/architecture/audits/PLACE_LEVEL2_CERTIFICATION_REVIEW.md).

**Place Wave 2C (2026-06-03):** [PLACE_LEVEL2_READINESS_REVIEW.md](../docs/architecture/audits/PLACE_LEVEL2_READINESS_REVIEW.md) — P0 cleanup complete; eligible for L2 review.

**Place Wave 2A (2026-06-03):** Global Trash + V_Link + platform entities + Notebook `PLACE_LISTING` validation.

**Place Wave 1G (2026-06-03):** `placeCommunityService`; dismiss in `placeService`; `getEnrichedPlaceGraph`; connection boundary; transactions deferred — **Wave 1 extraction complete**.

**Place Wave 1F (2026-06-03):** `placeAIActionService`; ActionExecutor/toolExecutor read-only twins; thin `placeAIController`.

**Place Wave 1D (2026-06-03):** Listing/meeting write services + Calendar fix.

---

## Platform Standards Migration Batches 1–4 (May 2026) ✅

**Status:** **IMPLEMENTED** — Constitutional framework published **and** core migration batches executed in code (manifest/provisioning, workspace gaps, trash, events, V_Link resolvers, job registry).

**Canonical doc:** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)  
**Agent rule:** `.cursor/rules/platform-standards.mdc`  
**Migration tracker:** §30 in constitutional doc + [`memory-bank/progress.md`](progress.md)

### What shipped

| Batch | Outcome |
|-------|---------|
| **1 Foundation** | `BUILT_IN_MODULE_IDS`; manifest reconcile (`builtInModuleManifests.ts`); `moduleProvisionController` all 10 built-ins; `todo`/`place` in `BusinessWorkspaceContent` + `coreModuleRegistry`; ActionExecutor `todo` alias; `testingStrategy.md` → Vitest |
| **2 Contracts** | Notes `trashedAt` + migration `20260628120000_notes_trashed_at`; module activity on todo/notes create-delete; `moduleMutationPolicyDual`; notification domain-event subscriber (file.shared, member.added, module.installed) |
| **3 Integration** | V_Link resolvers for TASK/TODO, NOTE, CHAT_CONVERSATION; `orgChartPolicyAdapter.ts`; `BrandedWorkDashboard` → `MODULE_ICONS`; extended `ModuleCapability` type |
| **4 Platform infra** | `registerPlatformJob()` + `platformCronJobs.ts`; cleanup dedupe; workflow router + search index stubs on domain event bus |

### Key paths

- `server/src/constants/builtInModuleIds.ts`
- `server/src/startup/builtInModuleManifests.ts`
- `server/src/jobs/platformJobRegistry.ts`, `platformCronJobs.ts`
- `server/src/auth/moduleMutationPolicyDual.ts`, `orgChartPolicyAdapter.ts`
- `server/src/services/vlinkEntityResolverService.ts` (expanded)
- `docs/architecture/LEGACY_CLEANUP.md`, `DOMAIN_EVENTS.md` (adoption matrix)

### Deploy note

Run `pnpm prisma:migrate:deploy` for Notes Global Trash migration before relying on `trashedAt` in production.

### Deferred (next platform work)

- Extract `todoService` / `notesService`; slim `toolExecutor` + `ActionExecutor`
- hr/scheduling module activity + domain events
- Retire dead `WorkspaceLanding` components or wire hubs
- Wrap `WorkflowAutomationService` behind domain-event workflow router
- Optional `drive` → `file-hub` module id rename

**Cross-ref:** Runtime Kernel, extension boundaries, read/write paths, tiers — all in constitutional doc §1–3, §16, Appendix B.

---

## Context Provider Contract Phase A / B / B.5 (May 2026) ✅

**Status:** **IMPLEMENTED** — Intent-aware **Context Provider Orchestrator** replaces ad-hoc module fetches in `CrossModuleContextEngine`; pipeline grounding for module-backed sources; metadata-only **orchestration snapshots** for replay/debug.

**Canonical docs:**
- [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../docs/guides/AI_CONTEXT_PROVIDER_API.md) — provider API + orchestrator + snapshots
- [`docs/architecture/AI_CONTEXT_ASSEMBLY.md`](../docs/architecture/AI_CONTEXT_ASSEMBLY.md) — assembly + orchestration flow
- [`memory-bank/aiContextSystem.md`](aiContextSystem.md) — full AI context system reference (orchestrator section)

### Phase A — Orchestrator core ✅

| Delivered | Path / behavior |
|-----------|-----------------|
| **Contract types** | `shared/src/types/ai-context-provider-contract.ts` |
| **Orchestrator** | `ContextProviderOrchestrator.ts` — selection, fetch, lazy `fullContext` (`lazyUserContext.ts`) |
| **Registry / selection** | `contextProviderRegistry.ts`, `contextProviderSelection.ts`, `legacyProviderCanHandle.ts`, `fetchModuleContextProvider.ts` |
| **Engine delegate** | `CrossModuleContextEngine.getContextForAIQuery` → orchestrator (legacy if `AI_CONTEXT_ORCHESTRATOR_ENABLED=false`) |
| **Twin wiring** | `DigitalLifeTwinCore` — scope (`businessId`, `dashboardId`, `householdId`, `requestId`); `contextGenerations[]` cap **2** |
| **`contextGenerationId`** | New UUID **per orchestration pass** (module fetch + optional grounding pass) |

### Phase B — Metadata, grounding bridge, diagnostics ✅

| Delivered | Notes |
|-----------|--------|
| **Wave-1 provider metadata** | `registerBuiltInModules.ts`: `drive`, `calendar`, `chat`, `place`, `hr`, `scheduling` — optional `supportedIntents`, `retrievalCost`, `priority`, `pipelineSourceIds`, `volatility`, `freshnessPolicy` |
| **Certification parse** | `parseContextProviders` preserves optional metadata from registry JSON |
| **Grounding bridge** | `pipelineGroundingRetrieval` → `orchestratePipelineModuleSources` for `vssyl_place`, `drive_files`, `calendar`; **no double-fetch** when `existingModuleContexts` has place/drive/calendar |
| **Platform sources unchanged** | `location`, `vlink`, `web_search`, `business_context` |
| **Freshness diagnostics** | `contextProviderFreshness.ts` — `fresh` \| `stale` \| `unknown`, `staleContextWarnings[]` (no invalidation/SWR yet) |
| **Required grounding (hybrid)** | `requiredSourceFailures` always recorded; block only when enforcement `block` / `regenerate` |
| **Diagnostics** | `contextDensityReport.orchestration`, `mapPipelineTraceInputs`, `ai-context-debug` — selection, grounding map, generations |
| **Build order** | Root `type-check` / `verify:ci` run `build:shared` first; server `pretest` / `pretype-check` build shared |

### Phase B.5 — Orchestration snapshots ✅

| Delivered | Notes |
|-----------|--------|
| **Types** | `shared/src/types/ai-orchestration-snapshot.ts` — `AIOrchestrationSnapshot` |
| **Builder** | `orchestrationSnapshot.ts` — `buildOrchestrationSnapshot`, `deriveOrchestrationTraceTags`, `redactQueryPreview` |
| **Emit** | Structured log `operation: ai_orchestration_snapshot`; in-request `query.context.orchestrationSnapshots[]` (cap 2); trace `contextDensity.orchestration.snapshots` |
| **`orchestratorVersion`** | Central constant `phase-b5-v1` (bump when selection/freshness/ranking semantics change) |
| **`traceTags`** | Deterministic: `grounding_failure`, `required_source_failure`, `stale_context`, `admin_debug`, `grounding_boost`, `fallback_provider`, `high_latency`, `sampled_snapshot` (prod emit) |
| **Env** | `AI_ORCHESTRATION_SNAPSHOT_ENABLED` (default off prod), `AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE`, `AI_ORCHESTRATION_SNAPSHOT_LOG_LEVEL` |
| **Admin** | `POST /api/ai-context-debug/assemble` uses `snapshotForce: true` |

**Env (orchestrator):** `AI_CONTEXT_ORCHESTRATOR_ENABLED=false` → legacy `getContextForAIQueryLegacy` path.

**Tests:** `contextProviderSelection.test.ts`, `contextProviderOrchestrator.test.ts`, `lazyUserContext.test.ts`, `contextProviderFreshness.test.ts`, `contextProviderRegistryMetadata.test.ts`, `pipelineGroundingRetrieval.orchestrator.test.ts`, `orchestrationSnapshot.test.ts`, `mapPipelineTraceInputs.test.ts` (60+ cases in context/grounding suite).

**Deferred (Phase C — not started):** runtime `invalidatedByEvents` cache bust; websocket context refresh; stale-while-revalidate queues; health-based adaptive ranking; Active Context Graph; dedicated snapshot Prisma table + replay API; Test Lab snapshot UI panel; vector/embedding routing in orchestrator.

**Next (Phase C candidates):** event invalidation subscriber; optional `AI_CONTEXT_FRESHNESS_RANKING_ENABLED`; admin Test Lab orchestration snapshot card; certification validator for optional metadata shapes.

**Cross-ref:** `memory-bank/progress.md` (Context Provider Contract); `memory-bank/aiContextSystem.md` (orchestrator + snapshots).

---

## V_Link AI Pipeline integration (May 2026) ✅

V_Link is a **first-class AI Pipeline Context Source** (`vlink` / V_Link Relationships): registry + idempotent DB reconcile (context sources + grounding rules), permission-filtered runtime grounding in `DigitalLifeTwinCore`, `persistedVLinks` entity linking, and pipeline traces with `source: vlink`.

---

## V_Link platform layer (May 2026) ✅

**Status:** **IMPLEMENTED** — platform-wide contextual relationship layer (not a marketplace module).

**Canonical plan:** [`docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md`](../docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md)  
**Product context:** [`memory-bank/vlinkProductContext.md`](vlinkProductContext.md)

**Shipped (VL-0–VL-10):**
| Area | Delivered |
|------|-----------|
| **Schema** | `prisma/modules/platform/vlink.prisma`; migration `20260601120000_vlink_platform_foundation` |
| **API** | `/api/vlinks` — CRUD, members, entity link/unlink, archive, ownership transfer, suggestions, activity |
| **Events + search** | 14 `vlink.*` domain events; global search provider `vlink` |
| **Hub UI** | `/vlink` — filters, detail tabs (Files/Calendar functional; Chat/Tasks placeholders) |
| **Shell** | Right-sidebar icon under AI; drag-to-link + `VLinkConnectModal` |
| **Integrations** | Drive (indicators, context menu, upload toast); Calendar (`EventDrawer`, event chips) |
| **AI** | Context provider + **pipeline source `vlink`**; `entityLinking` persisted vlink merge; traces show `source: vlink` |

**AI pipeline completion (May 2026):** V_Link is a first-class Admin Portal Context Source (`vlink` / V_Link Relationships). Confirmed vlinks ground the twin via `vlinkPipelineContextService`; unapproved suggestions never ground responses.

**Corrective fix (May 2026):** Grounding rules now reconcile idempotently (`reconcileSystemPipelineGroundingRules`) so existing DBs receive optional `vlink` on system intents without overwriting admin-customized non-system rows.

**Non-negotiable (v1):** V_Link membership **does not** grant access to linked entity content; membership-only access (no UNLISTED); one primary vlink per entity.

**Ops follow-up:** `pnpm prisma:migrate:deploy` (includes `20260601120000_vlink_platform_foundation`).

---

## AI platform execution principles (May 2026) ✅

**Status:** **IMPLEMENTED (May 2026)** — Phases **1–4** and **Autonomy A1–A8** shipped per [`docs/plans/AI_PLATFORM_MATURITY_PLAN.md`](../docs/plans/AI_PLATFORM_MATURITY_PLAN.md).

**Docs:**
- **What to build:** `docs/plans/AI_PLATFORM_MATURITY_PLAN.md` (Memory → Learning → Cross-module → Extensibility)
- **How to build:** `docs/plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md`

**Anchor principle:** **Visible Intelligence > Hidden Intelligence** — a feature is not real unless the user can feel it, the system can explain it, and diagnostics can prove it.

**Ship summary (this run):**
| Track | Status |
|-------|--------|
| Phase 1 Memory (1A–1E) | ✅ |
| Phase 2 Learning (2A–2D) | ✅ |
| Phase 3 Cross-module (3A–3D) | ✅ |
| Phase 4 Extensibility (4A–4D) | ✅ |
| Autonomy de-emphasis (A1–A8) | ✅ |

**Ops follow-up (not code):** deploy pending migrations (`20260521180000_user_memory_fact_provenance`, `20260521190000_module_context_provider_cache`, `20260521200000_webhook_subscriptions`) when ready.

## AI Phase 5 — Ambient Contextual Assistance (May 2026) ✅

**Status:** **IMPLEMENTED (May 2026)** — Phases **5A–5F** complete per [`docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md`](../docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md).

**Canonical plan:** [`docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md`](../docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md)

**Goal:** Move from “AI that answers with context” to “AI that gently helps users navigate life and work by surfacing relevant, explainable suggestions.” **Not autonomy** — user accepts, dismisses, or ignores; no auto-execution.

**Builds on Phases 1–4:** memory influence, learning signals, context density, `contextUsed` / `responseInfluence`, context synthesis, domain events, webhook infrastructure, provider health, explain drawer, Learning tab, Memory tab.

**Subphases:** 5A model + lifecycle → 5B event correlation → 5C meeting/file/thread rules → 5D UI surfaces → 5E feedback + learning loop → 5F admin diagnostics + tests.

**Phase 5A (May 2026):** ✅ Schema + `ambientSuggestionService`; domain event → signal → document upload suggestion; API tenant filters + explain GET; migration `20260522120000` + `20260522120100`

**Phase 5B (May 2026):** ✅ `SuggestionCorrelationService`, `SuggestionRankingService`, `suggestionRules.ts`; async consumer path; hourly expiry cron; tests

**Phase 5C (May 2026):** ✅ `meeting_prep_v1`, `file_after_chat_v1`, `thread_activity_spike_v1` rules; entity linking for file/chat; correlation integration tests

**Phase 5D (May 2026):** ✅ `AmbientSuggestionCard`, `AmbientSuggestionsView` tab; dashboard `ai` widget wired; header dropdown explain expander; NotificationsWidget `ai` category; GET `/api/ai/suggestions?scope=history|all`

**Phase 5E (May 2026):** ✅ Dismissal decay in ranking; 90d do-not-show-again; repeated-accept → pending Learning proposal; quiet hours defer outbound `ai_suggestion` notification; correlation rule id in learning signals

**Phase 5F (May 2026):** ✅ Admin suggestion dry-run + funnel metrics; `SuggestionCorrelationDryRunPanel` on Test Lab; `ambientSuggestionAcceptance.test.ts` (§14); Phase 5 exit criteria met

**Next:** Phase 5 ambient assistance is **complete** — optional polish or Phase 6 per maturity plan.

### Implementation log (May 2026)
- **Autonomy de-emphasis A1–A8:** Action-boundaries copy; More → Actions hidden unless `NEXT_PUBLIC_AI_ACTIONS_UI=true`; onboarding/widget proactive toggle removed; pattern insights copy softened (`PredictiveIntelligenceDashboard`); `/api/ai/autonomous/*` + `AutonomyManager` deprecated in code (prompt boundaries via `PreferenceResolver` only); admin AI Context docs updated
- **Phase 1A (Memory):** Tenant-safe list filters, `PATCH /api/ai/memory/facts/:id`, expiry in resolver, business membership validation, dedupe on create, household scope rejected
- **Phase 1B (Memory provenance):** `sourceType`, `category`, `isExplicit` on `UserMemoryFact`; remember-that wiring; UI source badges; influence metadata
- **Phase 1C (Memory retrieval):** `MemoryRetrievalService` + `memoryScoring`; unified twin/resolver path; pipeline trace memory influence fields
- **Phase 1D (Influence UX):** Assembler explicit/inferred injection tiers; `memoryItems` in `responseInfluence`; explain drawer “Memories that shaped this reply”; Memory tab “Why I remembered this” expandable + source conversation link
- **Phase 1E (Memory UX + Phase 1 exit):** Edit/forget memories; filters (scope/category/source); pin via confidence; expiry on create/edit; Identity → “Manage in Memory”; Phase 1 exit tests (personalization, tenancy)
- **Phase 2A (Learning contract):** `LearningProposal` types; `learningEventContract` artifact envelope; one sync primary event per interaction + async derived upserts; human-reviewable filter in personal learning list; fixed pattern/prediction/insight parsing
- **Phase 2B (Behavioral signals):** `userLearningSignalService`; suggestion accept/dismiss + feedback + module usage signals; `POST /api/ai/learning/signals`; tenant-scoped `dashboardId`/`businessId` in signal payload
- **Phase 2C (Learning application):** `LearningApplicationService` promotes approved events → `UserMemoryFact` / `UserAIContext` / personality traits; confidence bump on approve, decay on dismiss; `PreferenceResolver` consumes applied events (`learning_applied` inferred kind); `GET /api/ai/learning/what-changed`; Learning tab **What changed** before/after UI; context promote records last promotion
- **Phase 2D (Learning observability):** Pipeline trace `learningRetrieved` stages (extract → pending → promote → resolver); learning confidence in explain drawer `learningItems`; collective patterns gated on `allowCollectiveLearning` (opt-in toggle in Learning tab); `PatternAnalysisScheduler` env-gated (`ENABLE_PATTERN_ANALYSIS_SCHEDULER`); LearningDashboard fake fallback metrics removed
- **Phase 3A (Context density):** `contextDensityReport` on pipeline trace + twin metadata summary; provider fetch audit (attempt/success/fail/cache/failure reason); assembly metrics from `assembleAIContext`; admin Test Lab + `POST /api/ai-context-debug/assemble`; dev flag `NEXT_PUBLIC_AI_CONTEXT_DENSITY_DEBUG`
- **Phase 3B (Fetch policy & provider cache):** Multi-module queries fetch high+medium modules via `resolveModulesToFetch`; sub-intent provider selection (`selectContextProvider`); per-provider cache on `ModuleInstallation.contextProviderCache` (keyed `provider:scope`); @mention aliases for todo, notes, place, dashboard; `businessId` passed consistently via `buildModuleContextFetchParams`; migration `20260521190000_module_context_provider_cache`
- **Phase 3C (Context synthesis):** Synthetic cross-module insights gated (`AI_SYNTHETIC_CONTEXT_ENABLED`); `ContextSynthesisService` + `entityLinking` v1 (chat↔calendar people, chat↔drive files); data-backed **Cross-module summary** block in assembler; `identifyCrossModuleConnections` uses entity links; admin assemble dry-run exposes `crossModuleSynthesis` + `referencesMultipleModules`
- **Phase 3D (Context budget & used vs available):** `ContextBudgetManager` tier allocation (35/25/25/15) with drop reasons; blocks marked `available`/`usedInPrompt`; `contextAvailability` on assembled context; `contextUsed` in `responseInfluence` + explain drawer; metadata `contextUsed` lists module names actually injected
- **Phase 4A (Domain events + AI consumption):** Adopted `chat.message.sent`, `calendar.event.created`, `module.enabled`/`module.disabled`; `AIEventConsumer` → `domain_event` learning stubs (idempotent); proactive upload suggestion unchanged at emit site; documented payload schemas in `DOMAIN_EVENTS.md`
- **Phase 4B (Module AI Context API hardening):** Canonical **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**; `moduleContextProviderCertification` + marketplace validator 1.1.0 (fail without valid providers); admin **`POST /api/admin/ai-pipeline/context-providers/health`** + Test Lab **Context Provider Health** panel; timeout/payload limits in `moduleContextProvider` constants
- **Phase 4C (Webhook subscriptions MVP):** `WebhookSubscription` + delivery attempts schema; HMAC signing (`webhookSigning.ts`); retry/dead-letter delivery; domain event fan-out (`module.installed`, `file.shared`); signed **`ActionExecutorRegistry`** webhook path; business admin API + settings webhooks shell; **`docs/architecture/WEBHOOK_SUBSCRIPTIONS.md`**
- **Phase 4D (SDK boundaries + Phase 4 exit):** **`docs/guides/MODULE_AI_SDK_BOUNDARIES.md`**; AI maturity gates G1–G7 in third-party pipeline docs; reference manifest **`docs/test-modules/full-ai-contract-module.json`** + certification test

**Phase 4 (Extensibility) — COMPLETE. Autonomy de-emphasis — COMPLETE.**

---

## Dynamic AI orchestration registry — R0–R5 (May 2026) ✅

**Status:** **COMPLETE** — Admin-managed **orchestration registry** for intents, context sources, tool policies, and grounding rules. Validated, archive-only lifecycle, audit on every mutation. Foundation for a future cognitive/relationship graph — not plain CRUD.

**Canonical doc:** `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` (§ Dynamic AI orchestration registry)

**Commits on `main`:** `c648ce2d` (R0–R5), `966a8121` (type-check seed types)

| Slice | Delivered |
|-------|-----------|
| **R0** | String-compatible registry IDs; `SYSTEM_*_IDS`; no silent ID stripping in `pipelineCatalogService` |
| **R1** | Prisma registry metadata (`isSystem`, `archived`, `capabilities`, `runtimeKind`, `mappedTools`, …); migration `20260520120000_ai_pipeline_registry_metadata` |
| **R2** | `pipelineRegistryValidator.ts` — `validateRegistryChange`, `buildRegistryGraph`, `buildCatalogValidationSummary` |
| **R3** | `pipelineRegistryService.ts` — create/duplicate/archive/restore/enable/disable + policy audit |
| **R4** | Admin APIs: `POST /registry/validate`, `GET /registry/graph`, registry CRUD under `/policies/*` |
| **R5** | Registry UI shell, filters, validation panel, dependency chips; full create/duplicate/archive on **Intents**; filters + modal editors on sources/tools/grounding |

**Product decisions (v1):**
- One grounding rule per intent (PK = `intentId`)
- Archive only — no hard delete
- Auto-create grounding rule on intent create (UI checkbox, default on when `groundingRequired`)
- Custom `mappedTools[]` on context source rows
- Capability flags: `executable`, `inferable`, `retrievalEnabled`, `enforceable`
- Tool `runtimeKind`: `openai_tool` \| `prepass` \| `policy_only`
- **Custom intents are policy metadata only** until catalog-driven inference (**v2**)

**Key paths:** `server/src/ai/pipeline/pipelineRegistryIds.ts`, `pipelineRegistryValidator.ts`, `pipelineRegistryService.ts`, `pipelineCatalogMappers.ts`, `web/src/components/admin-portal/ai-pipeline/registry/`

**Deploy:** `pnpm prisma:migrate:deploy` (includes `20260520120000`); `pnpm prisma:build` after module schema changes.

**Tests:** `server/src/ai/pipeline/__tests__/pipelineRegistryValidator.test.ts` (9 cases)

**Deferred (intentional):** catalog-driven inference for custom intents; graph visualization UI; `web_search` runtime; provider/prompt changes; hard delete.

**Cross-ref:** `memory-bank/progress.md` (Dynamic AI orchestration registry); Admin AI Pipeline Phases 1–5 + operations console below.

**Next:** Extend create/duplicate/archive modals to sources/tools/grounding pages; v2 catalog-driven inference; optional graph UI.

---

## Admin AI Pipeline tools — Phases 1–5 (May 2026) ✅

**Status:** **COMPLETE** — Admin Portal **AI Pipeline** instruments the live Digital Life Twin for grounding/orchestration inspection, editable policies, test lab, enforcement, evidence viewer, and compliance export. Additive; does not replace `QueryIntent` or rewrite provider prompts by default.

**Canonical doc:** `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md`

| Phase | Delivered |
|-------|-----------|
| **1A–1B** | `buildPipelineTrace`, catalog, twin `metadata.pipelineTrace`, admin APIs, history `_pipelineTrace` |
| **1 UI** | `/admin-portal/ai-pipeline` hub, diagnostics, test-lab, read-only catalog, AI System card |
| **2** | `AIPipelineDiagnostic` persistence, quality stats dashboard, sampling env |
| **3** | DB-backed intent/grounding/source/tool policies + audit log + editable admin UI |
| **4** | Enforcement modes (off/disclose/block/regenerate), Place + IP location prepass, response gating |
| **5** | `evidenceBundle` (assembled vs structured vs tools), retention/export/purge |

**Key paths:** `server/src/ai/pipeline/*`, `server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts`, `web/src/app/admin-portal/ai-pipeline/`, `prisma/modules/ai/ai-pipeline.prisma`

**Env:** `AI_PIPELINE_DIAGNOSTICS_ENABLED`, `AI_PIPELINE_DIAGNOSTIC_SAMPLE_RATE`, `AI_PIPELINE_ENFORCEMENT_ENABLED`, `AI_PIPELINE_ENFORCEMENT_MODE`

**Operations console (May 2026):** Hub health metrics, live activity feed, trace insights (`pipelineTraceInsights.ts`) — commits `c877cf9f`, `4066c4e7`.

**Deploy:** `pnpm prisma:migrate:deploy` (migrations `20260520010440` … `20260520013518`, **`20260520120000_ai_pipeline_registry_metadata`**)

**Tests:** `server/src/ai/pipeline/__tests__/` (32+ vitest cases incl. registry validator)

**Cross-ref:** `memory-bank/progress.md` (Admin AI Pipeline + Dynamic registry); `memory-bank/aiContextSystem.md` (assembled context)

**Next:** Registry UI parity on sources/tools/grounding; optional scheduled retention purge cron; wire `web_search` when product-ready; v2 catalog-driven inference for custom registry entries.

---

## AI cross-session memory recall — hardened (May 2026) ✅

**Status:** **COMPLETE** — Cross-session “we last talked about…” recall is production-shaped: broader intent detection, combined lexical scoring, topics fallback when `threadSummary` is missing, recall-biased `UserMemoryFact` loading, backfill for historical messages, and integration tests.

**Architecture (canonical):** `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`

**Commits on `main`:**
- `8432ed83` — `feat(ai): wire module context, thread memory, recall, and user facts into twin` (initial MVP)
- `297f4ffc` — `fix(ai): harden cross-session memory recall for production reliability`

**Layers (twin path):**

| Layer | Implementation |
|-------|----------------|
| Same-thread | `conversationContinuity.ts`, last 20 `AIMessage` rows, metadata on assistant turns |
| Cross-thread summaries | `AIConversation.threadSummary`, `topics` JSON; `GET /api/ai-conversations/memory/recent`, `/memory/topics` |
| Semantic recall | `AIMessageRecallIndex` + `indexAIMessageForRecall` on `POST .../messages`; `recallRelevantMessages` when `hasExplicitRecallIntent` |
| User facts | `UserMemoryFact` + `/api/ai/memory/facts`; on recall queries, top high-confidence facts even with weak token overlap |
| Module live context | `moduleContexts` in `assembleAIContext`; enterprise/non-conversation legacy prompt also gets `MODULE LIVE CONTEXT` |

**Recall intent (`server/src/ai/utils/recallIntent.ts`):** Phrases like “we last talked”, “what were we talking about”, “continue our trip planning”, “that vacation”, “those places you mentioned”, “where were we”, “what were the options”, plus travel follow-ups.

**Scoring (`recallScoring.ts`):** `combinedRecallScore` = semantic + keyword overlap + travel boost; recall queries use lower min similarity (`0.08`) and travel-snippet fallback when scores are empty.

**Assembler:** When `threadSummary` is null but `topics` exists, injects **“Recent conversation topics (other threads)”** with `activeTopic`, constraints, last assistant summary. Recalled chunks appear as **“Recalled prior messages (semantic)”** (private to providers via `assembledContext`).

**Backfill (deploy once per env):**
```bash
pnpm prisma:migrate:deploy   # includes 20260518120000, 20260518120100, 20260518120200
pnpm --filter vssyl-server backfill:ai-recall-index
```

**Migrations:** `20260518120000_ai_conversation_thread_memory`, `20260518120100_user_memory_facts`, `20260518120200_ai_message_recall_index`

**Tests:** `server/src/services/__tests__/aiMemoryRecall.integration.test.ts`, `server/src/routes/__tests__/ai-memory-routes.integration.test.ts`, `server/src/ai/utils/__tests__/recallIntent.test.ts`, `server/src/ai/context/__tests__/recallContextAssembly.test.ts`

**Preserved:** Conversation mode stays lean (no noisy module blocks in casual answers); enterprise modes unchanged; memory mechanics not surfaced in user-facing copy.

**Cross-ref:** `memory-bank/progress.md` (AI memory recall hardening); `memory-bank/aiContextSystem.md` (twin pipeline § Digital Life Twin).

**Next:** Production backfill after migrate; optional Phase E continuity QA on all AI chat surfaces; consider stronger embeddings later (out of scope for this hardening pass).

---

## AI Identity UX (May 2026) — Phases 0–4 ✅

**Status:** **COMPLETE** — `/ai` restructured as **AI Identity** (not a settings graveyard); identity snapshot API, chat explainability, Workspace AI employee drawer, Insights polish.

| Phase | Delivered |
|-------|-----------|
| **0** | Tabs: AI Identity, Learning, Memory, Behavior, More; legacy URL redirects |
| **1** | `GET /api/ai/identity`; `AIIdentityHome` influence stack |
| **2** | `metadata.responseInfluence`; `AIResponseExplainDrawer`; `AILearningNotice` in `/ai-chat` |
| **3** | `WorkspaceAIDrawer`; admin Workspace AI copy; `policyDigest` on employee-access |
| **4** | Insights collapsed (3 sub-tabs + activity strip); orphan components removed; docs updated |
| **5** | First-visit tour (Style / Learning / Memory); warm first-person microcopy; influence stack motion |

**Routes:** `/ai` default identity; `/ai?tab=more&section=insights`; legacy `?tab=intelligence` redirects. **Tour:** `AIIdentityTour` + `Tour` replay in header; `vssyl_ai_identity_hub_tour_v1` in localStorage.

**Docs:** `docs/architecture/AI_INTELLIGENCE_HUB.md` (Insights), `AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`.

---

## AI Control Center → Digital Life Twin wiring (May 2026) ✅

**Status:** **COMPLETE** — Phases **0A–5** shipped; personal Control Center settings, consent-gated inferred learning, session style promotion, business policy injection, and Intelligence hub are wired into the live `/api/ai/twin` path.

**Architecture (canonical — do not duplicate here):**
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — single prompt path; legacy `buildDigitalTwinPrompt` removed (Phase 0B)
- `docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md` — personal prefs vs `BusinessAIDigitalTwin` when `context.businessId` set (Phase 4)
- `docs/architecture/AI_INTELLIGENCE_HUB.md` — More → Insights (formerly Intelligence tab)

**Phase summary:**

| Phase | Delivered |
|-------|-----------|
| **0A** | `PreferenceResolver` merges `UserPreference`, `AIPersonalityProfile`, `AIAutonomySettings`, active `UserAIContext`, `UserMemoryFact` → `assembleAIContext` + provider options (`DigitalLifeTwinCore`) |
| **0B** | Canonical routes documented; monolithic twin prompt removed |
| **1** | `/ai?tab=memories` — facts CRUD, effective-preferences preview, onboarding hooks (`AIMemoriesView`) |
| **2** | `UserAIContext.learningStatus` (`active` \| `pending` \| `dismissed`); extraction → pending; `GET /api/ai/context/pending`, review + `POST /api/ai/teach`; only **active** in prompts |
| **3** | Questionnaire → soft prose templates; session detection/overrides; `POST /api/ai/preferences/promote-session`; chat learning banner (`AILearningNotice`) |
| **4** | `businessWorkspaceBoundaries` + business policy context block; effective preview stays `preferenceScope: personal` |
| **5** | Intelligence hub; personal `AILearningEvent` review (`GET/PUT /api/ai/learning/events`); orphaned dashboards routed with `embedded` |

**Key APIs:** `GET /api/ai/effective-preferences`; `GET/PUT /api/ai/autonomy/settings`; `GET/POST/DELETE /api/ai/personality/profile`; `GET /api/ai/learning/events`; `POST /api/ai/preferences/promote-session`.

**UI:** `/ai` — see **AI Identity UX** above for current tab IA. Business learning events remain on Workspace AI admin (separate from personal).

**Migration (deploy):** `20260518130000_user_ai_context_learning_status` — run `pnpm prisma migrate deploy` if not applied.

**Git:** `789c5f05` on `main` — `feat(ai): wire Control Center preferences into Digital Life Twin pipeline`.

**Tests:** `server/src/ai/preferences/__tests__/*`, `preferenceContextAssembly`, `businessWorkspaceBoundaries`, `userAIContextLearningService`, `personalAILearningEventsService`, `digitalLifeTwinPromptPipeline`.

**Cross-ref:** `memory-bank/progress.md` (AI Control Center audit); `memory-bank/aiContextSystem.md` (§ Digital Life Twin preferences).

**Next product focus:** Phase E conversational hardening checklist (optional); production validation of Intelligence API endpoints; continue structured logging migration.

---

## Platform hardening phase (May 2026) ✅

**Status:** Complete — policy engine, domain events, workspace realtime, marketplace certification gates, and Drive authorization are in production shape for wired paths. **No further horizontal hardening** unless a feature requires it.

**Quick refs:** `memory-bank/progress.md` (Platform Hardening Phase Complete table); `docs/architecture/POLICY_ENGINE.md`, `DOMAIN_EVENTS.md`, `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`.

**Implementation map (agents):**

| Concern | Where |
|---------|--------|
| Policy actions / engine | `server/src/auth/policyActions.ts`, `policyEngine.ts` |
| Dual enforcement | `drivePolicyDual.ts`, `businessMemberPolicyDual.ts`, `businessUpdatePolicyDual.ts`, `moduleInstallPolicyDual.ts`, `moduleUninstallPolicyDual.ts` |
| Domain events | `server/src/events/domainEventRegistry.ts`, `domainEventEmitters.ts` |
| Drive permissions | `server/src/services/drivePermissionHelpers.ts` |
| Certification gate | `server/src/services/moduleVersionCertificationGate.ts` |
| Workspace + socket | `web/src/runtime/`, `web/src/lib/realtimeClient.ts` |

**Known Drive deferrals:** restore/hard-delete/reorder/revoke policy; task-dashboard upload (`assertUserOwnsDashboard` vs folder write); socket events target actor not file owner.

**Tests:** server vitest ~286; web runtime ~22 (CI `verify` job).

**Git:** Pushed `9bf0e596` on `main` (May 2026 hardening bundle).

**Next product focus:** resume feature roadmap (not PE-D3 / calendar policy unless scheduled).

---

## Workspace Runtime Foundation v1 (May 2026) ✅

**Principle:** **Module = capability; widget = projection.**

**Source of truth:** `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`

**Goal:** Additive frontend contracts so personal, business, and future household/education contexts can derive available modules/widgets consistently—without replacing legacy registries or switch-based rendering.

**Shipped:**

| Area | What |
|------|------|
| **Contracts** | `web/src/runtime/modules/types.ts` — `ModuleDefinition`, `WidgetDefinition`, `RouteDefinition`; optional `source` (`core` \| `marketplace` \| `custom`), `capabilities`, `status` |
| **Core registry** | `web/src/runtime/modules/coreModuleRegistry.ts` — 17 first-party modules (dashboard, drive, chat, calendar, todo, notes, ai, utility widgets, hr, scheduling, analytics, members, admin) |
| **Lookup** | `web/src/runtime/modules/moduleRegistry.ts` — `normalizeModuleId`, `getModuleDefinition`, context filter; `connections` → `members` |
| **Adapters** | `fromWidgetRegistry.ts`, `widgetPickerAdapter.ts` — read-only bridge to `WIDGET_REGISTRY` (legacy registry unchanged) |
| **Runtime** | `web/src/runtime/workspace/` — pure helpers, **`WorkspaceRuntimeProvider` mounted** via `WorkspaceRuntimeScopeBridge` / `BusinessLayoutRuntimeShell`; `permissionSnapshot` bridged from `BusinessConfigurationContext` + `PositionAwareModuleProvider`; scope-key resets on tenant/context change; RT-Q1 shared socket via `realtimeClient.ts` + `WorkspaceRealtimeLifecycle` |
| **Integrations** | `WidgetPicker` uses contract adapter + legacy fallback; `BusinessWorkspaceContent` read-only contract lookup (switch unchanged); `BrandedWorkDashboard` display names via `getModuleDisplayName` |
| **Tests** | `pnpm --filter vssyl-web test` — ~22 unit tests under `web/src/runtime/__tests__/`; **in CI** (`verify` job) |

**Explicitly not replaced:** `WIDGET_REGISTRY`, `BusinessWorkspaceContent` `switch`, routing, widget components, business front-page `WidgetRegistry.tsx`.

**Follow-up (feature-driven, not hardening):**
1. ~~Mount `WorkspaceRuntimeProvider` at dashboard + business workspace roots.~~ ✅ WR-Q1
2. ~~Feed `permissionSnapshot` from `BusinessConfigurationContext`.~~ ✅ WR-Q1
3. Replace duplicate module name/icon helpers with `getModuleDefinition` + `MODULE_ICONS`.
4. ~~Add `pnpm --filter vssyl-web test` to CI.~~ ✅ in `.github/workflows/ci.yml`
5. Wire feature surfaces (e.g. `WidgetPicker`) to `useWorkspaceRuntime()` where beneficial (additive).
6. ~~RT-Q1: consolidate socket clients + runtime subscription ownership.~~ ✅ RT-Q1

**Cross-ref:** `memory-bank/progress.md` (Workspace Runtime v1); `memory-bank/dashboardProductContext.md` (§ Workspace runtime); `memory-bank/systemPatterns.md` (Business workspace + runtime layer).

---

## AI conversational continuity, rendering, and streaming UX (May 2026) ✅ / 🟡

**Source of truth:** `docs/plans/AI_CONVERSATIONAL_CONTINUITY_AND_RENDERING_SOURCE_OF_TRUTH.md` (indexed in `docs/plans/README.md`). **Phase E** (hardening/QA checklist) is documented there and intentionally not executed as a broad refactor until scheduled.

**Goal:** Move the Digital Life Twin from “structured report” tone to natural conversation while keeping a strict internal contract: orchestration metadata stays internal unless debug/analytical modes apply; users see conversational text first; `fileIssues` / vision badges remain visible.

**Shipped (implementation wave on `main`):**

| Area | What |
|------|------|
| **UI** | `AIResponseRenderer` gains `showOrchestrationDetails` (default off). Full chat, header dropdown, and embed module hide key insights, evidence, assumptions/risks, recommended actions, and numeric confidence unless explicitly enabled. |
| **Server text** | `polishConversationalResponse` + integration in `normalizeAIResponse.ts` strips internal phrasing (“Based on conversation history”, scaffold headings) from plain-text `response`. |
| **Continuity & topic** | `conversationContinuity.ts`: `ConversationContinuityState` + `ActiveTopicState`, transition classification, prompt injection via `DigitalLifeTwinCore` / `DigitalLifeTwinService` (persisted on assistant message metadata where applicable). |
| **Context tiers** | `AIContextAssembler` + Core scoring: tier labels (`tier1`–`tier4`), stricter trimming of broad cross-module blocks; richer `[AI_CONTEXT_BUDGET]` / relevance logging. |
| **Response modes** | `responseMode.ts` + prompt sections: inferred `conversational` / `analytical` / `planning` / `debug` / etc., wired through twin metadata. |
| **Structured JSON in chat (non-stream)** | `web/src/lib/aiResponseHandler.ts` + `AIAssistantMessageBody.tsx`: parse v2 JSON, render `summary` prose; wired on ai-chat, `AIChatDropdown`, `AIChatModule` (`976a2658`). |
| **Streaming UX (full-page ai-chat only)** | `web/src/lib/aiStreamHandler.ts`: buffer SSE chunks in memory; detect structured JSON start (`{`, `[`, fenced code); **never** append raw orchestration JSON to conversation state. While streaming: `isAILoading` + `AIThinkingIndicator` only (no `ai_stream_*` placeholder bubble). On `done`: single `finalizeTwinStream` → `buildAIConversationItemFromTwinData` append. Render safety net: `shouldHideStreamingContent` in `AIAssistantMessageBody`. **Commit:** `1deb6d48` — `fix(web): buffer AI stream and hide raw JSON during conversation`. Earlier guard: `19c2cc56`. |

**Streaming flow (client):**
1. User sends → thinking bubble (`AIThinkingIndicator`, animated dots).
2. `consumeTwinSseLine` accumulates `text` deltas in `TwinStreamState` (not in visible messages).
3. Structured streams set `bufferingStructured` → `displayText: null` (thinking only).
4. `done` + `data` → `normalizeTwinResponseData` → one assistant row with prose/`structured.summary`.
5. Plain-prose streams could stream incrementally via `displayText`, but conversation mode prefers polish over token typing (no mid-stream assistant row).

**Surfaces:** SSE streaming enabled on `web/src/app/ai-chat/page.tsx` (`stream: true`). `AIChatDropdown` / `AIChatModule` use non-stream twin JSON (already normalized via `aiResponseHandler`).

**Tests:** `web/src/lib/__tests__/aiStreamHandler.test.ts` (8); `web/src/lib/__tests__/aiResponseHandler.test.ts` (9); server orchestration visibility test (`aiResponseRendererVisibility.test.ts`). Do **not** import `web/` from `server/` tests.

**Residual / next:** Phase E checklist in plan doc; optional progressive `summary` typewriter during buffer (helpers exist: `extractPartialSummaryFromStream`); wire `showAIDetails` to a real debug toggle when product exposes it.

---

## AI assembled context — compression, relevance, token budget (May 2026) ✅

**Goal:** Keep provider prompts focused and cheaper by trimming assembled context blocks after deterministic compression and keyword relevance ranking—without embeddings, summarization, provider refactors, or frontend changes.

**Implementation (`server/src/ai/context/AIContextAssembler.ts`):**
- Pipeline: `contextBlocks` → compress → `rankContextBlocksForProvider` → **`applyContextBudget`** → returned as `contextBlocks`.
- Default budget: **`DEFAULT_CONTEXT_BUDGET_ESTIMATED_TOKENS` ≈ 6000** (char/4 token estimate via `estimateTokenCount`).
- **High** priority blocks always retained (even if over budget); **medium/low** filled in relevance order while under budget; **diversity pass** tries to keep at least one block per `sourceType` when budget allows.
- Each kept block may include **`budgetTokensEstimate`** for debugging; structured log **`[AI_CONTEXT_BUDGET]`** (`maxEstimatedTokens`, `blocksBefore`, `blocksAfter`, `estimatedTokensKept`).

**Cross-ref:** `memory-bank/aiContextSystem.md` (assembled context pipeline); `memory-bank/progress.md`.

---

## GitHub Actions CI — `verify` job green (May 2026) ✅

**Problem:** CI `pnpm type-check` failed with widespread `TS6305` because `web` resolves `shared` via `shared/dist/*.d.ts`, but the workflow did not build `shared` before recursive type-check. Later, `pnpm test` failed on missing `Module` row `scheduling` and a flaky admin analytics assertion under parallel Vitest.

**Shipped:**
- `.github/workflows/ci.yml` — after `pnpm install`, run `pnpm run build` with `working-directory: ./shared` so declarations exist before `pnpm type-check`.
- `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts` — `beforeAll` self-seeds built-in `scheduling` module when absent (CI DB has no startup seed).
- `server/src/routes/__tests__/admin-analytics.integration.test.ts` — growth test no longer assumes monotonic global `totalUsers` while other suites delete users concurrently.

**Commits (main):** `d7fbb746` (CI shared build), `8a89bc04` (scheduling test seed), `66d6b1d7` (analytics assertion stabilization).

**Validation:** User confirmed GitHub Actions `verify` all green after push.

---

## Structured logging migration — `console.*` → `logger` (May 2026) 🟡

**Goal:** Replace runtime `console.log` / `console.warn` / `console.error` with project `logger` (`server/src/lib/logger.ts`, web `@/lib/logger`) plus structured fields (`operation`, error payloads). Exclude tests (`__tests__/`, `*.test.ts`) unless explicitly requested.

**Shipped (this wave):**
- Broad server sweep: controllers, routes, middleware (`auth`, `hrPermissions`, `hrFeatureGating`, `schedulingFeatureGating`, `usageLimitMiddleware`), many services (Stripe/notifications/org-chart/email/security behavior modules), AI surfaces (`DigitalLifeTwinCore`, `RealTimeAnalyticsEngine`, `AnthropicProvider`, `OpenAIProvider`, related utils/types where touched).
- Startup / registration: `registerBuiltInModules.ts`, `seedTodoModule` / `seedNotesModule`, script `register-built-in-modules.ts`.
- Stripe ops scripts: `setupStripeProducts`, `setupQueryPackProducts`, `syncStripePrices`, `syncPerEmployeeStripePrices`, `syncQueryPackPrices`, `listStripePerEmployeePrices`.
- Web API proxy + trash routes migrated where previously outstanding.

**New / helper artifacts:** `server/src/ai/context/AIContextAssembler.ts`, `server/src/ai/utils/validateAIResponseQuality.ts`, `scripts/patch-console-to-logger.js` (do **not** bulk-run until `insertAfterImports` is fixed for multi-line imports — prefer manual edits).

**Remaining:** ~36 non-test server files still contain `console.*` (heavy hits: `AutoMLService`, `AIModelManagementService`, `WorkflowAutomationService`, `PatternAnalysisScheduler`, `SSOIntegrationService`, plus scripts like `initialize-logging-policies`, `verifyStripeSetup`). Continue iterative migration + `pnpm exec tsc --noEmit -p server` after batches.

---

## Vssyl_Business — naming source of truth (April 2026) ✅

Canonical domain definition and vocabulary (Work tab vs business workspace, tier meanings, member role vs org position): **`memory-bank/vssylBusinessNaming.md`**. Use it to avoid mixed terminology in specs and AI sessions.

## Module interoperability alignment — Phases 1–5 closed (April 2026) ✅

**Plan:** `docs/plans/MODULE_INTEROPERABILITY_ALIGNMENT_PHASED_PLAN.md` — **Status: Complete.**

**Shipped across phases (summary):**
1. Canonical contract in `memory-bank/moduleSpecs.md`; third-party guide and system/permissions/thread-activity/compliance docs aligned.
2. Backend: normalized module activity via `Log` (`module_activity_event`), Drive folder/file + Chat hooks, aggregated activity feed.
3. UI: dashboard `ActivityFeedWidget` push via `activity:feed:refresh`; Drive details activity; Chat right-panel activity tab; `chatSocket` event forwarding.
4. Enforcement: `.cursor/rules/module-interoperability.mdc`, pipeline publish gate (5), review checklist parity first-party/third-party.
5. **Phase 5 verification (2026-04-21):** `pnpm type-check` pass; `pnpm test` pass (30 files, 149 tests).

**Residual risks (owner: Platform Engineering):** semantic certification still human-gated (R1); dual activity storage until optional consolidation (R2); shared-folder full audit trail may need broader log query (R3). See plan Phase 5 table.

---

## System audit remediation — Phases A–F closed (April 2026)

Lettered remediation **A–F** for `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md` is **complete** (**D-020**). There is no open audit execution backlog; optional follow-ups **A-051** / **A-052** are **Deferred** on the tracker. **A-051 (partial):** environment matrix for module upload/GCS vs local and Docker sandbox limits — `docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`. **Consolidated “what’s next” plan:** `docs/plans/PROJECT_NEXT_PHASE_OPEN_WORK.md`. Current engineering focus is normal product roadmap work (this file), not audit closure.

---

## Most Recent UX + Stability Fix: Profile Settings & Avatar Reliability (April 2026) ✅

### **Profile settings now inside dashboard shell + sidebar IA**

**Issue summary**:
- Avatar menu route `/profile/settings` opened outside the expected global dashboard shell in some flows.
- Profile settings content was a long single-page stack without internal navigation.
- Profile photo behavior was inconsistent in production-like Google environments (personal slot breaking after business assignment).

**What was fixed**:
- Added profile route layout wrapper:
  - `web/src/app/profile/layout.tsx` now wraps profile pages with `DashboardLayout`.
- Refactored profile settings UX:
  - `web/src/app/profile/settings/page.tsx` now uses internal left-sidebar navigation with tabbed sections (`account`, `photos`, `location`, `preferences`) via `?tab=...`.
- Hardened profile photo serving path:
  - `server/src/controllers/profilePhotoController.ts` now emits proxy-relative image URLs (`/api/profile-photos/serve/:id?...`) so auth is consistently injected through Next proxy.
  - Replaced brittle manual storage URL parsing in `serveProfilePhoto` with `storageService.extractPathFromUrl(...)`.
- Fixed assignment regression causing personal photo breakage:
  - `assignProfilePhoto` no longer clears the opposite slot when assigning one slot.
  - Added distinct-slot validation so the same photo cannot be assigned to both personal and business.
  - Added legacy fallback in `getProfilePhotos` to resolve missing `*_photo_id` from library URLs when older records still have URL but no id.

**Validation status**:
- Lint checks passed on modified profile settings/controller files.
- User-confirmed behavior: profile settings layout and avatar flow now working as expected.

---

## Most Recent Completed Project: Module Upload Backend Phases 1-7 (April 2026) ✅

### **Third-party module upload/review/runtime hardening complete**

**Source of truth**: `docs/plans/MODULE_UPLOAD_BACKEND_PHASED_PLAN.md`

**What was completed**:
- **Phase 1-2**: Enforced module-to-business link policy (active business member allowed), ownership checks, idempotent linking, and audit events.
- **Phase 3**: Added developer-business designation fields (`isDeveloperBusiness`, `developerBusinessLinkedAt`, `developerBusinessLinkedBy`) and migration.
- **Phase 4**: Made admin module review operational with checklist signals, sandbox actions, and publish-readiness guardrails.
- **Phase 5**: Reconciled developer financial paths (subscriptions/revenue/payouts) and aligned API/UI contracts for developer and billing admin pages.
- **Phase 6**: Hardened marketplace/runtime business-scope checks and fixed business runtime subscription gating (`businessSubscriptions`).
- **Phase 7**: Added regression tests for critical module controller paths and created deployment runbook:
  - `server/src/controllers/__tests__/moduleController.phase7.test.ts`
  - `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md`

**Verification status**:
- Phase 7 test suite passed (`5/5`):
  - `pnpm vitest run src/controllers/__tests__/moduleController.phase7.test.ts`
- Lint checks on edited TS files passed.

---

## Most Recent Resolved Incident: Third-party Module Upload Pipeline (April 2026) ✅

### **Module upload to GCS — signing + CORS blockers resolved**

**Issue summary**:
- `POST /api/modules/:id/uploads/init` intermittently failed with 500.
- Initial blocker was GCS V4 signed URL generation (`iam.serviceAccounts.signBlob` denied).
- After signing was fixed, browser upload failed on preflight with GCS CORS error (`No 'Access-Control-Allow-Origin' header`).

**What was verified/fixed**:
- Confirmed runtime service account for `vssyl-server`: `235369681725-compute@developer.gserviceaccount.com`.
- Confirmed bucket access existed on `vssyl-storage-472202` (`roles/storage.objectAdmin`).
- Added missing signing permission: runtime SA granted `roles/iam.serviceAccountTokenCreator` on itself.
- Applied bucket CORS policy for signed browser uploads:
  - Origins: `https://vssyl.com`, `https://www.vssyl.com`, local dev origins
  - Methods: `GET`, `HEAD`, `PUT`, `POST`, `OPTIONS`
  - Headers include `Content-Type` (required by signed PUT flow)

**Current state**:
- User confirmed module ZIP upload flow is now working end-to-end.
- API now returns `errorCode` + `hint` for upload-init failures, and frontend surfaces those hints.

---

## Most Recent UX Hardening: Dashboard Dark Mode Readability (April 2026) ✅

### **Dashboard/module contrast and theming pass**

**Issue summary**:
- Dark mode dashboard still had low-contrast surfaces and unreadable text in several module widgets.
- React dev warning surfaced style collisions in dashboard tabs (`border` shorthand mixed with `borderBottom`).

**What was fixed**:
- `web/src/app/dashboard/DashboardLayout.tsx`
  - Replaced conflicting tab border style usage with explicit side widths (`borderTop/Right/Left/BottomWidth`) to remove rerender warning.
  - Improved personal left-sidebar dark-mode fallback colors (background/text/customize button) for readable contrast.
- `web/src/components/dashboard/WidgetShell.tsx`
  - Increased visual separation for widgets in dark mode (deeper surface, stronger border, stronger shadow).
  - Added explicit dark header/content surfaces so module cards pop from the page background.
- `web/src/components/widgets/DriveWidget.tsx`
  - Added dark-mode variants for household/family panels, list rows, dividers, and text so File Hub content remains readable.
- `web/src/components/widgets/NotificationsWidget.tsx`
  - Added dark-mode row/background/text states (read + unread) and dark-safe select/input styling in settings panel.

**Validation status**:
- Lint checks clean for edited files.
- Remaining work is iterative visual QA across authenticated routes (dashboard/chat/drive/admin) for any edge-case contrast regressions.

---

## Most Recent Completed Project: Connections & Member Management (March 2026) ✅

### **Connections & Member Management — Phases 1–4 COMPLETE ✅**

**Build Document**: `memory-bank/CONNECTIONS_AND_MEMBERS_BUILD_PLAN.md`

**Overview**: Aligned personal connections (ALL, Personal, Household, Following, Colleagues), business “Members” experience, and Phase 4 features: pinned colleagues, Place deep link, and colleague presence.

**Phases completed**:
- **Phase 1**: Personal connections viewer — Household and Following tabs; Colleagues = current colleagues only (filter by shared active business).
- **Phase 2**: Sidebar “Members” label and route to `/business/:id/workspace/members`; workspace members page uses real API; List / By department view.
- **Phase 3**: “Add as personal connection” on workspace members; canonical business roster API (member API: getBusinessMembers, updateEmployeeRole, removeEmployee); profile MemberManagement uses member API for update/remove.
- **Phase 4**: (1) **Pinned colleagues** — `PinnedColleague` model, GET/POST/DELETE `/api/member/business/:id/pinned`, “People I work with most” section and pin/unpin on workspace members. (2) **Place deep link** — `?tab=my-place&highlight=businessId`; PlaceGraph opens business panel when node exists; ConnectionList “View on Place” uses deep link. (3) **Colleague presence** — `User.lastActiveAt`, auth middleware updates on request; `getBusinessMembers` returns `lastActive`; workspace members list shows “Last active”.

**Key files**: `web/src/components/member/ConnectionList.tsx`, `web/src/app/business/[id]/workspace/members/page.tsx`, `web/src/app/business/[id]/profile/MemberManagement.tsx`, `server/src/controllers/memberController.ts`, `server/src/routes/member.ts`, `web/src/api/member.ts`, `web/src/app/place/page.tsx`, `web/src/components/place/PlaceGraph.tsx`, `prisma/modules/auth/user.prisma` (lastActiveAt), `prisma/modules/business/business.prisma` (PinnedColleague).

---

## Older context (archived)

Completed-project narratives and older session history that previously lived in this file were moved to **`docs/archive/session-summaries/active-context-archive-2026-04-pretrim.md`** (April 2026 cleanup). Keep this file focused on the last ~3 months of work; summarize new completions briefly and link to plans or PRs when detail is needed.
