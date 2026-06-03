# Vssyl Accessibility Standards

**Status:** Wave 0 foundation (2026-06-03)  
**Target:** WCAG 2.1 Level AA for new and materially changed surfaces.

Aligns with [`.cursor/rules/ui-standards.mdc`](../../.cursor/rules/ui-standards.mdc) contrast rules.

---

## Keyboard navigation

- All interactive controls reachable via Tab order logical with visual layout
- Skip repetitive navigation where possible (skip link — roadmap)
- Custom widgets: roving tabindex (tabs, menus, listboxes)
- No keyboard traps except intentional modal focus trap

**Shortcuts:** Document module-specific shortcuts; avoid overriding browser defaults without alternative.

---

## Focus rings

- Visible focus on all interactive elements
- Use `.v-focus-ring` utility from `web/src/styles/ux.css` for new components
- Do not remove outline without replacement (`focus-visible:ring-2`)
- Focus order matches DOM order after modal close (return to trigger)

---

## ARIA labeling

| Element | Requirement |
|---------|-------------|
| Icon-only button | `aria-label` |
| Form fields | `<label>` or `aria-label` |
| Live regions | `aria-live="polite"` for toasts/status |
| Loading | `aria-busy="true"` on loading region |
| Errors | `aria-invalid="true"` + `aria-describedby` |
| Modals | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |

Avoid redundant ARIA that conflicts with native semantics.

---

## Color contrast

### Light backgrounds (white, gray-50/100)

| Role | Minimum |
|------|---------|
| Primary text | `text-gray-700` or darker |
| Secondary | `text-gray-600` minimum |
| Avoid for body | `text-gray-500`, `400`, `300` |

### Dark backgrounds

- Body: `text-gray-300` or `text-white` as appropriate
- Inactive UI: still readable — not `text-gray-500` on dark panels without verification

### Non-text contrast

UI boundaries and focus indicators: 3:1 against adjacent colors.

Do not convey state by color alone — add icon, text, or pattern.

---

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Respect in new animations — see ux.css */
}
```

- Disable decorative animations (AI icon pulses) when user prefers reduced motion
- Keep essential opacity fades short or instant

---

## Screen reader behavior

- Meaningful page `<title>` and h1
- Headings do not skip levels without reason
- Tables: headers associated with cells
- Images: `alt` text; decorative `alt=""`
- Dynamic updates: announce via live region, not silent DOM swap only

---

## Modal focus trap

- On open: focus first focusable element (or title close button per design)
- Tab cycles within modal
- Escape closes (unless destructive confirm requires explicit choice)
- On close: return focus to element that opened modal

Use `shared/components/Modal`.

---

## Escape key behavior

| Surface | Escape |
|---------|--------|
| Modal | Close |
| Drawer | Close |
| Context menu | Dismiss |
| Dropdown | Dismiss |
| Full-screen preview | Exit preview |

Do not close parent modal when child popover is open — dismiss inner first.

---

## Touch target size

- Minimum **44×44 CSS pixels** for touch primary actions
- Adequate spacing between adjacent targets
- Mobile: increase hit area with padding, not only visual icon size

---

## High contrast mode

- Prefer token borders (`--v-color-border-strong`) over pure color differentiation
- Test Windows High Contrast / increased contrast settings for admin surfaces
- Avoid relying on subtle gray-on-gray alone

---

## Required testing checklist (per feature PR)

- [ ] Tab through all interactive controls in logical order
- [ ] Visible focus on every focusable element
- [ ] Screen reader spot-check (VoiceOver or NVDA): title, headings, form labels
- [ ] Light and dark mode contrast spot-check
- [ ] Modal: trap, Escape, focus return
- [ ] `prefers-reduced-motion` spot-check for new animations
- [ ] Zoom 200%: no horizontal scroll on primary content (where feasible)
- [ ] Empty and error states readable and announced

---

## Related

- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md) §9
- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)
- [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md) — Accessibility section

**Last updated:** 2026-06-03
