# PP-2 — Findings Review

**Program:** Account Platform — PP-2 Settings Platform Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Post-evaluation findings disposition  
**Outcome:** **0 blocking · 1 major partial · 6 advisory**

---

## Findings summary

| Class | Open at eval | Closed at eval | New at eval |
|-------|--------------|----------------|-------------|
| **Blocking** | 0 | 3 (F01–F03 historical) | 0 |
| **Major** | 1 partial | 8 | 0 |
| **Advisory** | 4 | 2 (F10, F11) | 2 (eval-surfaced A01–A03) |

---

## Blocking findings — **NONE**

| ID | Description | Eval status |
|----|-------------|-------------|
| PP2-F01 | No Settings Platform / `settingsService` | **Closed** — confirmed |
| PP2-F02 | `/settings` API contract missing | **Closed** — confirmed |
| PP2-F03 | No preference registry | **Closed** — confirmed |

**Evaluation blockers:** **0**

---

## Major findings (F01–F09)

| ID | Description | Pre-eval | Post-eval | Cert impact |
|----|-------------|----------|-----------|-------------|
| PP2-F01 | No Settings Platform | Closed | **Confirmed closed** | — |
| PP2-F02 | API contract missing | Closed | **Confirmed closed** | — |
| PP2-F03 | No registry | Closed | **Confirmed closed** | — |
| PP2-F04 | 16 fragmented hubs | Closed | **Confirmed closed** | — |
| **PP2-F05** | Business settings triplication | Partial | **Partial — WITH FINDINGS** | Blocks plain L3 only |
| PP2-F06 | Triple notification write path | Closed | **Confirmed closed** | — |
| PP2-F07 | Theme localStorage only | Closed | **Confirmed closed** | — |
| PP2-F08 | Privacy outside hub | Closed | **Confirmed closed** | — |
| PP2-F09 | Notification bypass | Closed | **Confirmed closed** | — |

### PP2-F05 detail (sole open major)

| Field | Value |
|-------|-------|
| **Severity** | Major (partial) |
| **Owner** | Business Administration |
| **Settings Platform role** | IA cross-link + documentation only |
| **Blocks evaluation?** | No |
| **Blocks L3 WITH FINDINGS?** | No — documentable |
| **Blocks plain L3?** | Yes |
| **Remediation** | BA charter — redirect duplicate profile/branding pages |

---

## Advisory findings

| ID | Description | Status | Owner |
|----|-------------|--------|-------|
| PP2-F10 | Legacy preference API drift | **Closed** | — |
| PP2-F11 | Avatar duplicate entry | **Closed** | — |
| PP2-F12 | HR settings 404 link in nav | **Open — WITH FINDINGS** | HR module |
| PP2-F13 | Misleading business 2FA UI | **Open — WITH FINDINGS** | BA |
| **PP2-EVAL-A01** | Email notification writes without PE | **New — advisory** | Notifications |
| **PP2-EVAL-A02** | Email notification writes without activity | **New — advisory** | Notifications |
| **PP2-EVAL-A03** | Legacy API families (~22) not converged | **New — advisory** | Reference inventory |

---

## Findings blocker matrix

| Finding | Blocks eval? | Blocks L3 WF cert? | Blocks plain L3? |
|---------|--------------|-------------------|------------------|
| PP2-F05 | No | No | **Yes** |
| PP2-F12 | No | No (WITH FINDINGS) | Partial |
| PP2-F13 | No | No (WITH FINDINGS) | No |
| PP2-EVAL-A01–A03 | No | No | No |

---

## Closed findings — evaluation confirmation

Evaluator verified closure evidence for:

- **F04:** Personal hubs 6→2; canonical `/profile/settings`
- **F06/F09:** `notificationSettingsAdapter` → `settingsService` with PE + activity
- **F07:** Server theme persistence + `ThemeProvider` hydration
- **F08:** Privacy tab in settings hub
- **F10:** Legacy API delegates for registry keys
- **F11:** Avatar menu deduplicated

No false closures detected.

---

## Remediation required (post-certification hygiene)

| Priority | Item | Required for L3 WF? |
|----------|------|---------------------|
| P2 | PP2-F05 BA UI dedup | No — WITH FINDINGS accepted |
| P3 | Email notification adapter convergence (A01/A02) | No |
| P3 | Legacy API family retirement (A03) | No |
| P3 | PP2-F12 HR link fix | No |
| P3 | PP2-F13 business 2FA UI truthfulness | No — BA |

**Remediation required before plain L3:** PP2-F05 minimum.

---

## Certification findings package (for ratification council)

Recommended WITH FINDINGS register at ratification:

1. **PP2-F05** — Business settings triplication (BA-owned)
2. **PP2-F12** — HR settings 404 nav link
3. **PP2-F13** — Misleading business 2FA UI (BA)
4. **PP2-EVAL-A01** — Email notification PE gap
5. **PP2-EVAL-A02** — Email notification activity gap
6. **PP2-EVAL-A03** — Legacy API inventory not converged

---

**Last updated:** 2026-06-20 (Certification Evaluation)
