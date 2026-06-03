# Vssyl UX Certification Scorecard

**Status:** Wave 0 foundation (2026-06-03)  
**Usage:** Score modules during Wave 4–5 audits using [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md).  
**No modules are certified in Wave 0.**

---

## Certification levels

| Level | Name | Meaning |
|-------|------|---------|
| **UX-L0** | Unreviewed | No UX audit; legacy patterns acceptable temporarily |
| **UX-L1** | Basic compliance | Constitution followed; no critical a11y blockers |
| **UX-L2** | Consistent module UX | Tokens, layout, components, states largely aligned |
| **UX-L3** | Reference-quality UX | Other modules should copy this module’s UX patterns |
| **Reference UX Module** | Canonical example | Formally designated in roadmap after council-style review |

Architecture certification (L0–L3 code) is separate — see [`docs/architecture/CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).

---

## Scoring model

Each category: **0–5** (integers only).

| Score | Meaning |
|-------|---------|
| **0** | Missing or actively violates standard |
| **1** | Ad hoc implementation; major gaps |
| **2** | Partial compliance; inconsistent |
| **3** | Acceptable; meets minimum bar (UX-L1 threshold) |
| **4** | Strong; minor remediation |
| **5** | Exemplary; suitable as reference for this category |

**UX-L1:** No category below 3; average ≥ 3.0.  
**UX-L2:** No category below 3; at least 7 categories ≥ 4; average ≥ 3.8.  
**UX-L3:** All categories ≥ 4; at least 5 categories = 5; average ≥ 4.2.

---

## Categories

### 1. Token compliance

| Score | Definition |
|-------|------------|
| 0 | Module-local token file or pervasive raw hex |
| 3 | Mix of legacy and some `--v-*` / semantic vars |
| 5 | New UI exclusively uses shared token families |

**Evidence:** Grep for hex in module; inspect `tokens.css` usage; Rule 11 compliance.

---

### 2. Typography compliance

| Score | Definition |
|-------|------------|
| 0 | Random font sizes/weights throughout |
| 3 | Mostly consistent; some one-off headings |
| 5 | Full type scale from [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) |

**Evidence:** Screenshot matrix; computed style audit on H1/body/caption.

---

### 3. Color usage

| Score | Definition |
|-------|------------|
| 0 | Illegible contrast; color-only state |
| 3 | Meets `ui-standards.mdc` minimums; minor issues |
| 5 | Semantic colors + dark mode verified; no contrast failures |

**Evidence:** Contrast checks light/dark; state indicators not color-only.

---

### 4. Layout compliance

| Score | Definition |
|-------|------------|
| 0 | No recognizable archetype; broken mobile |
| 3 | Correct archetype; minor region gaps |
| 5 | Full archetype with optional regions used correctly |

**Evidence:** Map to [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md); responsive screenshots.

---

### 5. Component reuse

| Score | Definition |
|-------|------------|
| 0 | Duplicated primitives; custom modals everywhere |
| 3 | Shared components for primary patterns |
| 5 | Shared primitives; no duplicate button/modal implementations |

**Evidence:** Import audit from `shared/components`.

---

### 6. Interaction consistency

| Score | Definition |
|-------|------------|
| 0 | Missing loading/empty/error; chaotic feedback |
| 3 | Core flows covered per [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md) |
| 5 | Matches Drive/Chat-level polish for module operations |

**Evidence:** Flow videos; empty/error path checklist.

---

### 7. Accessibility

| Score | Definition |
|-------|------------|
| 0 | Keyboard trap; no labels; contrast failures |
| 3 | Checklist mostly pass; known minor issues documented |
| 5 | WCAG AA verified on primary flows |

**Evidence:** [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md) checklist results.

---

### 8. Dark mode support

| Score | Definition |
|-------|------------|
| 0 | Broken or unreadable in dark mode |
| 3 | Usable; some hardcoded light surfaces |
| 5 | All module surfaces tested; tokens adapt correctly |

**Evidence:** Screenshot pairs light/dark for main views.

---

### 9. Responsive behavior

| Score | Definition |
|-------|------------|
| 0 | Unusable on mobile |
| 3 | Core tasks possible; cramped or overflow issues |
| 5 | Layout pattern mobile rules fully implemented |

**Evidence:** Viewport 375px and 1280px screenshots.

---

### 10. Visual polish

| Score | Definition |
|-------|------------|
| 0 | Cluttered, misaligned, inconsistent spacing |
| 3 | Professional; minor alignment/spacing issues |
| 5 | Reference-quality spacing, elevation, motion |

**Evidence:** Design review notes; comparison to Reference UX Module.

---

## Reference UX Module designation

Separate from per-module UX-L3:

- Candidate identified in [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- Confirmed only after audit + remediation
- Recorded in Memory Bank / UX ledger (future) when process exists

**Current candidate (not certified):** Drive / File Hub.

---

## Related

- [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md)
- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)

**Last updated:** 2026-06-03
