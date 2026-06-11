# QA Environment Blocker — Calendar 5G-QA-EXEC

**Date:** 2026-06-03  
**Finding ID:** **QA-ENV-01** (new — discovered during execution)  
**Severity:** **P0** for QA session (not a Calendar UX certification finding)

---

## Symptom

Navigating to `http://localhost:3000/calendar/month` or `http://localhost:3001/calendar/month` renders **Failed to compile** instead of the Calendar module.

## Error

```
Module not found: Can't resolve './menuShared.js'
```

**Source:** `shared/src/components/ContextMenu.tsx` (and `DropdownMenu.tsx`) import `./menuShared.js`.

**On disk:** `shared/src/components/menuShared.tsx` exists.

## Reproduction steps

1. `pnpm dev` from repo root (builds shared via script, starts web on :3000 or :3001).
2. Open `/calendar/month` in browser.
3. Next.js turbo compile fails before calendar UI loads.

## Mitigation attempted (no code changes)

| Step | Outcome |
|------|---------|
| `pnpm build:shared` | PASS — `pnpm type-check` PASS |
| Restart `pnpm dev` after build | Compile error persists on calendar route |
| Alternate port :3001 | Same error |

## Impact on 5G-QA-EXEC

- **All CAL-01–CAL-24 cases:** **BLOCKED**
- **E-14:** **Cannot close** without runnable environment or staging deploy
- **Recommended unblock:** Engineering fix for Next.js shared import resolution **or** execute matrix on **staging** (`https://vssyl.com`) with QA credentials

## Scope note

This blocker is **outside** Calendar UX findings E-1–E-16. It is a **platform dev/staging readiness** issue discovered at QA execution time.

---

*Documented for Wave 5G-QA-EXEC evidence package.*
