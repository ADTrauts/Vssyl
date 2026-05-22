# Webhook subscriptions architecture (Phase 4C)

**Status:** MVP — outbound business webhooks + signed AI action executor payloads  
**Related:** [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md), [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md)

---

## Goals

1. **Outbound event subscriptions** — business admins register HTTPS endpoints for selected domain events.
2. **Signed deliveries** — HMAC-SHA256 on every POST (`X-Vssyl-Signature`, `X-Vssyl-Timestamp`, `X-Vssyl-Delivery-Id`).
3. **Retry + dead-letter** — up to 3 attempts with backoff; failed deliveries marked `DEAD_LETTER`.
4. **Partner safety** — third-party modules use **webhook / iframe / artifact** executors only; no in-process partner code.

---

## Components

| Component | Path | Role |
|-----------|------|------|
| Subscription registry | `WebhookSubscription` (Prisma) | Business-scoped URL + secret + event types |
| Delivery log | `WebhookDeliveryAttempt` | Attempt status, HTTP code, dead-letter |
| Signing | `server/src/services/webhookSigning.ts` | HMAC sign/verify |
| Delivery | `server/src/services/webhookDeliveryService.ts` | POST + retry |
| Subscription API | `server/src/services/webhookSubscriptionService.ts` | CRUD + domain fan-out |
| Domain subscriber | `events/subscribers/webhookDomainEventSubscriber.ts` | Hooks domain bus |
| AI executor webhooks | `ActionExecutorRegistry.ts` | Signed POST to `manifest.aiActionExecutor.executorUrl` |

---

## Supported subscription events (MVP)

| Event | Notes |
|-------|-------|
| `module.installed` | Requires `businessId` on event or metadata |
| `file.shared` | Resolves `businessId` via file → dashboard when missing on event |

Additional events follow the same pattern: register in `SUPPORTED_WEBHOOK_EVENT_TYPES`, document payload in `DOMAIN_EVENTS.md`.

---

## Signature format

```
X-Vssyl-Signature: t=<unix_seconds>,v1=<hex_hmac_sha256>
X-Vssyl-Timestamp: <unix_seconds>
X-Vssyl-Delivery-Id: whd_...
```

Signed payload string: `{timestamp}.{raw_json_body}`

Partners verify with `verifyWebhookSignature()` (see `webhookSigning.ts`). Reject timestamps older than 5 minutes.

---

## Retry policy

| Attempt | Delay before retry |
|---------|-------------------|
| 1 | immediate |
| 2 | 1 s |
| 3 | 5 s |

After attempt 3 failure → `DEAD_LETTER`. Timeout per POST: 10 s (subscriptions), 30 s default (action executors).

---

## Business admin API

Authenticated business **ADMIN** only:

| Method | Path |
|--------|------|
| GET | `/api/business/supported-events` |
| GET | `/api/business/:businessId/webhook-subscriptions` |
| POST | `/api/business/:businessId/webhook-subscriptions` |
| DELETE | `/api/business/:businessId/webhook-subscriptions/:id` |
| POST | `/api/business/:businessId/webhook-subscriptions/:id/test` |

Create response includes one-time `signingSecret` (store securely; not returned on list).

---

## AI action executor webhooks

Marketplace manifest:

```json
"aiActionExecutor": {
  "executorUrl": "https://partner.example.com/v1/execute",
  "signingSecret": "<partner-generated-secret>",
  "supportedOperations": ["create_item"],
  "timeout": 30000
}
```

Registry sync (`ModuleRegistrySyncService`) registers webhook executors in `ActionExecutorRegistry`. Twin tool execution POSTs signed JSON; partner returns `ActionExecutionResult`.

**No in-process partner code** — only `executorType: 'webhook'` for third-party modules.

---

## Internal test receiver

When `NODE_ENV=test` or `WEBHOOK_TEST_RECEIVER_ENABLED=true`:

- `POST /api/internal/webhooks/test-receiver` — captures signed payloads for integration tests
- `GET /api/internal/webhooks/test-receiver/capture` — inspect captures

---

## UI shell

Business workspace: **Settings → Webhooks** (`/business/[id]/workspace/settings/webhooks`) — list/create/delete/test subscriptions (MVP shell).

---

## Future (post-MVP)

- Admin portal delivery log viewer
- Per-subscription rate limits
- mTLS / rotating secrets
- Additional event types (`module.enabled`, `folder.shared`, …)
- Async queue worker instead of in-process retry timers

---

## Version history

| Date | Change |
|------|--------|
| 2026-05-21 | Phase 4C MVP — schema, signing, delivery, business API, executor HMAC |
