# Test Modules for Action Executor System

This directory contains test module manifests that can be used to verify the action executor registration system.

## Interoperability certification dry-run (Phase 4)

To **manually verify** the platform module certification checklist (`memory-bank/moduleSpecs.md`):

- **First-party shape:** compare against built-in registration and controllers linked from `server/src/startup/registerBuiltInModules.ts`.
- **Third-party / marketplace shape:** use `test-action-executor-module.json` (manifest + AI context) and the zip fixtures under **Module Upload Pipeline Mock Fixtures** below against the same checklist items (permissions story, scoping, declared notifications, AI context, etc.).

Automated CI does not replace this semantic review; use the checklist explicitly when approving submissions or reviewing module PRs.

## Test Action Executor Module

**File**: `test-action-executor-module.json`

A complete test module manifest that includes:
- AI context definition
- Action executor configuration (webhook-based)
- All required fields for module submission

### How to Test

#### Option 1: Submit via API

```bash
# Get your auth token first
TOKEN="your-auth-token"

# Submit the module
curl -X POST http://localhost:5000/api/modules/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-action-executor-module.json
```

#### Option 2: Submit via Admin Portal

1. Go to the module submission page
2. Copy the contents of `test-action-executor-module.json`
3. Fill in the submission form with the module data
4. Submit for review

#### Option 3: Direct Database Insert (For Quick Testing)

If you want to skip submission and directly test the sync:

```sql
-- Insert test module
INSERT INTO modules (id, name, description, version, category, tags, manifest, permissions, dependencies, "developerId", status, "createdAt", "updatedAt")
VALUES (
  'test-action-executor',
  'Test Action Executor Module',
  'A test module to verify action executor registration',
  '1.0.0',
  'PRODUCTIVITY',
  ARRAY['test', 'demo'],
  '{
    "aiContext": { ... },
    "aiActionExecutor": {
      "executorUrl": "https://httpbin.org/post",
      "supportedOperations": ["create_test_item", "update_test_item"],
      "timeout": 30000
    }
  }'::jsonb,
  ARRAY['test-module:read', 'test-module:write'],
  ARRAY[]::text[],
  'your-user-id',
  'APPROVED',
  NOW(),
  NOW()
);

-- Then trigger sync manually
-- This will be done automatically when module is approved via admin portal
```

### What to Verify

After submitting and approving:

1. **Check Logs**: Look for:
   ```
   ✅ Registered action executor for module: test-action-executor (4 operations)
   ✅ Module AI context synced for: Test Action Executor Module
   ```

2. **Verify Registry**: The executor should be registered in `ActionExecutorRegistry`

3. **Test Execution**: Try asking the AI to "create a test item" and verify it attempts to call the webhook

### Notes

- The webhook URL (`https://httpbin.org/post`) is a public testing service that echoes back requests
- In production, you'd use your own module's webhook endpoint
- The executor will be automatically registered when the module is approved
- No manual registration needed - it's all automatic via the sync service

### Customizing for Your Test

To test with your own webhook:

1. Update `executorUrl` in the manifest
2. Ensure your webhook accepts POST requests with the format:
   ```json
   {
     "action": "create_test_item",
     "parameters": { ... },
     "userId": "...",
     "context": { ... }
   }
   ```
3. Return `ActionExecutionResult` format

---

## Module Upload Pipeline Mock Fixtures

Use these fixtures to validate the third-party module upload flow end-to-end (submit -> upload finalize -> admin review -> sandbox/runtime).

### Build Fixture ZIPs

From repo root:

```bash
pnpm module-fixtures:build
```

This generates:

- `docs/test-modules/dist/mock-hosted-no-html.zip`
- `docs/test-modules/dist/mock-bundle-with-html.zip`
- `docs/test-modules/dist/mock-invalid-no-html.zip`

### Expected Outcomes

1. **Hosted happy path**  
   ZIP: `mock-hosted-no-html.zip`  
   Submission manifest: provide valid `frontend.entryUrl` (HTTPS).  
   Expected: artifact scan **PASSED** (`html_entry_not_required` behavior).

2. **Bundle happy path**  
   ZIP: `mock-bundle-with-html.zip`  
   Submission manifest: leave `frontend.entryUrl` blank (or provide one).  
   Expected: artifact scan **PASSED** (`html_entry_present` behavior).

3. **Negative guardrail check**  
   ZIP: `mock-invalid-no-html.zip`  
   Submission manifest: leave `frontend.entryUrl` blank.  
   Expected: artifact scan **FAILED** with `reason: no_html_entry`.

### Notes

- These fixtures are intentionally minimal and safe.
- Regenerate any time with `pnpm module-fixtures:build`.
- If your local machine does not have `zip` installed, install it first and rerun.

