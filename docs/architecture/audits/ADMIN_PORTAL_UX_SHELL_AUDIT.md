# Admin Portal UX Shell Audit

**Program:** Stage 1A — UX Shell Modernization  
**Date:** 2026-06-18  
**Findings:** AP-F-023, AP-F-024, AP-F-025, AP-F-026

---

## 1. Scope

Re-audited all `/admin-portal/**` pages (41 routes), `web/src/components/admin-portal/**` (31 components), shell (`layout.tsx`), and destructive/empty-state patterns.

---

## 2. Pre-1A baseline

| Issue | Evidence |
|-------|----------|
| Token drift | ~1,500+ `gray-*` class usages across 58 admin files |
| Empty states | Hand-built `text-center py-8` paragraphs; zero `EmptyState` imports |
| Confirm patterns | Custom fixed-overlay modals (users, impersonate); ad-hoc `Modal` confirm bodies (modules promote) |
| Native confirm | `confirm()` / `window.confirm` on seed-modules, overrides (×3), system-logs, PipelineIntentRegistrySection |

**G9:** FAIL (0/3 points)

---

## 3. Post-1A state

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Shell tokens | **PASS** | `layout.tsx` uses `bg-v-background`, `bg-v-surface`, `text-v-text-*` |
| Page tokens | **PASS WITH FINDINGS** | Bulk migration to `v-*`; ~90 residual `gray-*` on semantic badges/chart strokes |
| Empty states | **PASS** | `AdminPortalEmptyState` → shared `EmptyState` on 9+ surfaces |
| ConfirmModal | **PASS** | `useConfirm` + `ConfirmModal` on all prior native/custom confirm paths |
| Native confirm | **PASS** | Zero `window.confirm` / browser `confirm()` in admin-portal tree |

---

## 4. Surfaces audited

| Area | Pages / components | 1A changes |
|------|-------------------|------------|
| Shell | `layout.tsx` | v-* operator chrome |
| Operations | dashboard, users, moderation, support | tokens, EmptyState, ConfirmModal |
| Commercial | billing, pricing | tokens |
| AI | ai-system, ai-pipeline/* | tokens, EmptyState, useConfirm |
| Platform | analytics, performance, security, governance, retention, system-logs, system | tokens, useConfirm |
| Developer | developers, modules | tokens, EmptyState, ConfirmModal |
| Admin Labs | overrides, testing, impersonate, seed-modules | useConfirm, ConfirmModal |
| Debug | gated via `adminPortalDebugGate` | seed-modules confirm fixed |

---

## 5. Residual (non-blocking)

- Semantic status colors (`bg-green-100`, `text-blue-600`) retained per UX Constitution legacy allowance for state semantics.
- Large form modals (support ticket, pricing tier edit) remain `Modal` — not confirmation dialogs; out of AP-F-025 scope.

---

**Last updated:** 2026-06-18
