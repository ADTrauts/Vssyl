# Batch Fix Plan: Drive, Profile Photos & Location Errors

**Created**: 2025-01-25  
**Implemented**: 2025-01-25  
**Context**: User reports Drive "Failed to fetch drive content", profile photo 500s (GET + upload), location 500, and Drive temp-upload 403.

---

## 1. Error Summary

| Error | Endpoint(s) | Root Cause |
|-------|-------------|------------|
| **Drive "Failed to fetch drive content"** | `GET /api/drive/files`, `GET /api/drive/folders` | One or both return `!ok` (503/500). Generic error message; no distinction which failed. |
| **Drive temp-upload 403** | `GET /api/drive/files/temp-upload-…/download` | UI requests download URL for **optimistic temp items** (client-only). Backend `canReadFile` → no file → 403. |
| **Profile photos 500** | `GET /api/profile-photos`, `POST /api/profile-photos/upload` | Backend throws (Prisma, storage, sharp, etc.). Catch returns 500 with generic message; actual error not logged in structured form. |
| **Location 500** | `GET /api/location/user-location` | Backend throws (e.g. Prisma include country/region/town) or returns 404 when no location; client treats as failure. |

---

## 2. Fixes (Batch)

### 2.1 Drive: Skip download URL for temp-upload-* (thumbnails + preview)

**Problem**: Temp files use `id: \`temp-upload-${Date.now()}-${index}\``. We use `/api/drive/files/${item.id}/download` for thumbnails and preview. Backend returns 403 (no such file).

**Solution**: Never use the download endpoint for IDs that start with `temp-upload-`.

**Files to change**:

- **`web/src/components/modules/DriveModule.tsx`**
  - **Thumbnails (list/grid)**: Where we use `src=…/download` for images (e.g. lines ~277, ~925), use a helper:
    - If `item.id.startsWith('temp-upload-')` → `src=""` or a data URL placeholder / transparent pixel; keep `onError` fallback.
  - **Preview**: When setting `setPreviewUrl` for images/PDFs (e.g. ~1050, ~1054), if `item.id.startsWith('temp-upload-')` → `setPreviewUrl(null)` or don’t set download-based preview.
  - **Details panel**: If we use download URL for preview in the details panel, apply the same check.

**Helper (optional)**:

```ts
function isTempUploadId(id: string): boolean {
  return id.startsWith('temp-upload-');
}
function getFileThumbnailUrl(item: DriveItem): string {
  if (isTempUploadId(item.id)) return '';
  return `/api/drive/files/${item.id}/download`;
}
```

Use `getFileThumbnailUrl` for thumbnails and similarly avoid download for temp items in preview.

---

### 2.2 Drive: Improve fetch error handling (which endpoint failed)

**Problem**: We `Promise.all` files + folders fetch, then `if (!filesResponse.ok || !foldersResponse.ok) throw new Error('Failed to fetch drive content')`. We can’t tell which failed or the status.

**Solution**: Check each response, throw a more specific error, and optionally log.

**File**: **`web/src/components/modules/DriveModule.tsx`** (around the `Promise.all` and `if (!filesResponse.ok || !foldersResponse.ok)` block).

- If `!filesResponse.ok`: throw e.g. `Failed to fetch drive files (${filesResponse.status})`.
- If `!foldersResponse.ok`: throw e.g. `Failed to fetch drive folders (${foldersResponse.status})`.
- Optionally: log `filesUrl`, `foldersUrl`, and respective statuses in `console.error` (or your logger) to help debug 503/500.

**Optional**: Retry once on 5xx for each request (or only for 503) before throwing.

---

### 2.3 Profile photos: Structured error logging in controller

**Problem**: `getProfilePhotos` and `uploadProfilePhoto` catch errors, return 500 with a generic message, and `console.error` the raw error. Not easy to trace in production.

**Solution**: Use the existing `logger` and log structured metadata (no PII).

**File**: **`server/src/controllers/profilePhotoController.ts`**

- In **`getProfilePhotos`** catch block:
  - `logger.error('Profile photos fetch failed', { operation: 'get_profile_photos', userId, error: { message, stack } })`.
  - Keep returning `res.status(500).json({ … })` with a generic message.
- In **`uploadProfilePhoto`** catch block:
  - `logger.error('Profile photo upload failed', { operation: 'upload_profile_photo', userId, error: { message, stack } })`.
  - Same for assign/remove/update handlers if they currently only `console.error`.

**Also verify**:

- Upload uses `multerUpload.single('photo')` and frontend sends `FormData` with `photo` (already correct in `profilePhotos.ts`).
- Proxy forwards `Authorization` and body correctly for `POST /api/profile-photos/upload` (no double `/api`, etc.).

---

### 2.4 Profile photos: Upload flow (proxy + FormData)

**Problem**: Upload 500 could be backend logic, or proxy/body/auth issues.

**Checks**:

- **`web/src/api/profilePhotos.ts`**: Uses `authenticatedApiCall` with `body: formData` and no `Content-Type` (correct for FormData).
- **`web/src/app/api/[...slug]/route.ts`**: Proxy supports `multipart/form-data`, forwards body and headers. Confirm it doesn’t overwrite or strip `Content-Type` for multipart.

No code change if already correct; otherwise fix proxy to preserve multipart and auth.

---

### 2.5 Location: 200 + null when no location; fix 500 handling

**Problem**: `getUserLocation` returns `null` when user has no location (or user not found). Route returns **404** when `!location`. Frontend expects success and throws on 404/500, so we see "Failed to fetch user location".

**Solution**:

- **Backend** (**`server/src/routes/location.ts`**):
  - When `getUserLocation` returns `null`, respond with **200** and a JSON body like `{ location: null }` or `{ country: null, region: null, town: null, ... }` so the contract is “success, no location” instead of 404.
  - On thrown errors (e.g. Prisma): catch, log via `logger.error` with `operation: 'get_user_location'`, and return 500 with a generic message.
- **Frontend** (**`web/src/api/location.ts`**):
  - `getUserLocation` should treat 200 + `location: null` as success and return `null` (or equivalent). Profile settings already handles missing location; ensure it doesn’t treat 200 + null as an error.

**Optional**: Add a **GET /api/location/user-location** health check or lightweight log when the handler runs, to confirm it’s hit and not 404/500 for unrelated reasons.

---

## 3. Implementation Order (all done)

1. **Drive temp-upload 403** (2.1): ✅ Done. `isTempUploadId` / `getFileThumbnailUrl` in DriveModule + DriveDetailsPanel; placeholder data URL for temp thumbnails; skip preview for temp.
2. **Drive fetch error handling** (2.2): ✅ Done. Separate checks for files vs folders, specific error messages and `console.error` with URLs/status.
3. **Profile photos logging** (2.3): ✅ Done. `logger.error` with `operation`, `userId`, `error: { message, stack }` in getProfilePhotos, upload, assign, updateAvatar, remove.
4. **Profile photos upload** (2.4): ✅ Verified. FormData `photo` + proxy multipart handling OK; no code change.
5. **Location** (2.5): ✅ Done. User-location returns `200 { location: null }` when no location, `200 { location }` when set; structured logging in catch; `getUserLocation()` returns `UserLocation | null`.

---

## 4. Verification

- **Drive**: Load Drive with and without temp files (upload in progress). No 403 for `temp-upload-*`; clear errors when files/folders fail.
- **Profile photos**: GET library and upload a photo. On failure, check logs for `get_profile_photos` / `upload_profile_photo` and error details.
- **Location**: User with no location → 200 + null, no 404/500. User with location → 200 + location. Profile settings load without “Failed to fetch user location” when no location.

---

## 5. Related

- Logger DB logging was disabled when `LogLevel` enum is missing (separate change). These fixes don’t depend on it.
- `min-instances: 1` for vssyl-server and logger resilience may reduce 503s and cascading failures; this batch addresses the remaining drive/profile/location behavior and diagnostics.

---

## 6. Local vs Google Cloud (Dual-Environment)

**All batch-fix changes work for both local development and Google Cloud production.** None of them add GCP-only or local-only branches.

**Existing patterns (unchanged by this batch):**

| Concern | Local development | Google Cloud |
|--------|-------------------|--------------|
| **API proxy** | `NODE_ENV !== "production"` → `BACKEND_URL` or `http://localhost:5000` | `NEXT_PUBLIC_API_BASE_URL` / `BACKEND_URL` or prod fallback |
| **WebSocket** | `getWebSocketConfig` uses same env hierarchy; dev → `ws://localhost:5000` | `NEXT_PUBLIC_WS_URL` or API base → `wss://...` |
| **CORS (server)** | Allows `localhost:3000`, `3002`, `127.0.0.1` when `NODE_ENV === "development"` | Allows `vssyl.com`, Cloud Run web URL |
| **Storage** | `STORAGE_PROVIDER=local` (or unset) → disk uploads | `STORAGE_PROVIDER=gcs` → GCS bucket |
| **Logger** | Console + optional DB; skips DB if `DATABASE_URL` has `password@localhost` | Console → Cloud Logging; DB if `fix_logging_enums` applied |

**What to set:**

- **Local**: `web/.env.local` and `server/.env` per `web/ENVIRONMENT_SETUP.md` (e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`, `BACKEND_URL=http://localhost:5000`, `FRONTEND_URL=http://localhost:3000`). Use `pnpm dev` from root.
- **GCP**: Cloud Run env / Secret Manager (see `env.production.template`, `memory-bank/deployment.md`). No localhost URLs.

**Batch-fix specifics:**

- **Drive** (temp-upload, fetch errors): Frontend-only; no env or backend URL logic.
- **Profile photos** (logging): Use `logger` only; same behavior locally and in prod.
- **Location** (200 + null, logging): Same; response shape and logging are env-agnostic.

