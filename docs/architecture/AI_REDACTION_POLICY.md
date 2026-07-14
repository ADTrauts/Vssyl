# AI Redaction Policy

Applies **before** observation persistence. Phase 5B hardens Phase 5 rules.

## Always redact / drop

- Authorization headers / Bearer tokens / OAuth-like tokens
- Cookies / Set-Cookie
- API keys, passwords, secrets, JWTs
- Signed URL query signatures
- Base64 image data URLs
- Metadata keys: reasoning / chain-of-thought / raw provider payloads / file contents / signed URLs
- Circular structures → `[CIRCULAR]`
- Oversized payloads → fail-closed stub (`payload_too_large`)
- Redaction exceptions → fail-closed (`fail_closed`) + health counter

## Configuration

```ts
setRedactionConfig({
  enabled: true,
  redactProviderReasoning: true,
  maxStringLength: 2000,
  maxPayloadBytes: 16384,
  enforceAllowlist: false, // set true to keep only OBSERVATION_METADATA_ALLOWLIST keys
});
```

## Counters

`redactionFailures` exposed via observation health.

## Non-goals

Does not replace authZ, encryption at rest, or tenant isolation.
