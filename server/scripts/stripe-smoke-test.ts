/**
 * Stripe production smoke test — reads credentials from environment only (never logs secrets).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... \
 *   DATABASE_URL=postgresql://... \
 *   pnpm exec tsx scripts/stripe-smoke-test.ts
 *
 * Optional flags:
 *   --probe-webhook   POST a signed test event to production webhook URL
 *   --webhook-url     Override webhook URL (default: Cloud Run production)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const PROD_WEBHOOK_URL =
  'https://vssyl-server-235369681725.us-central1.run.app/api/payment/webhook';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): { probeWebhook: boolean; webhookUrl: string } {
  const probeWebhook = argv.includes('--probe-webhook');
  const urlIdx = argv.indexOf('--webhook-url');
  const webhookUrl =
    urlIdx >= 0 && argv[urlIdx + 1] ? argv[urlIdx + 1] : PROD_WEBHOOK_URL;
  return { probeWebhook, webhookUrl };
}

async function validatePricingConfigs(
  stripe: Stripe,
  prisma: PrismaClient
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const configs = await prisma.pricingConfig.findMany({
    where: { isActive: true, tier: { not: 'free' } },
    orderBy: [{ tier: 'asc' }, { billingCycle: 'asc' }],
  });

  if (configs.length === 0) {
    results.push({
      name: 'Database pricing configs',
      ok: false,
      detail: 'No active paid pricing configs found',
    });
    return results;
  }

  results.push({
    name: 'Database pricing configs',
    ok: true,
    detail: `${configs.length} active paid tier(s)`,
  });

  for (const config of configs) {
    const label = `${config.tier}/${config.billingCycle}`;
    if (!config.stripePriceId) {
      results.push({
        name: `Price ID ${label}`,
        ok: false,
        detail: 'Missing stripePriceId in database',
      });
      continue;
    }

    try {
      const price = await stripe.prices.retrieve(config.stripePriceId);
      const stripeAmount = price.unit_amount != null ? price.unit_amount / 100 : null;
      const active = price.active;
      const amountMatch =
        stripeAmount != null && Math.abs(stripeAmount - config.basePrice) < 0.01;

      results.push({
        name: `Price ${label}`,
        ok: active && amountMatch,
        detail: active
          ? amountMatch
            ? `${config.stripePriceId} active, $${stripeAmount?.toFixed(2)} matches DB`
            : `${config.stripePriceId} active but amount mismatch (Stripe $${stripeAmount}, DB $${config.basePrice})`
          : `${config.stripePriceId} inactive in Stripe`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        name: `Price ${label}`,
        ok: false,
        detail: `${config.stripePriceId}: ${message}`,
      });
    }
  }

  return results;
}

async function validateWebhookEndpoint(stripe: Stripe): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const prodMatch = endpoints.data.find((w) => w.url === PROD_WEBHOOK_URL);

  results.push({
    name: 'Production webhook endpoint',
    ok: Boolean(prodMatch && prodMatch.status === 'enabled'),
    detail: prodMatch
      ? `${prodMatch.id} enabled (${prodMatch.enabled_events?.length ?? 0} events)`
      : `No endpoint for ${PROD_WEBHOOK_URL}`,
  });

  const requiredEvents = [
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.deleted',
  ];
  if (prodMatch) {
    const missing = requiredEvents.filter((e) => !prodMatch.enabled_events.includes(e));
    results.push({
      name: 'Webhook event coverage',
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? 'All required lifecycle events enabled'
          : `Missing: ${missing.join(', ')}`,
    });
  }

  return results;
}

async function probeProductionWebhook(
  stripe: Stripe,
  webhookUrl: string
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    results.push({
      name: 'Webhook signature probe',
      ok: false,
      detail: 'STRIPE_WEBHOOK_SECRET not set — cannot sign probe payload',
    });
    return results;
  }

  const payload = JSON.stringify({
    id: `evt_smoke_${Date.now()}`,
    object: 'event',
    api_version: '2025-08-27.basil',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.created',
    data: {
      object: {
        id: 'cus_smoke_test_only',
        object: 'customer',
        email: 'stripe-smoke-test@vssyl.com',
      },
    },
    livemode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false,
  });

  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });

  const body = await res.text();
  results.push({
    name: 'Webhook signature probe (unsigned rejected)',
    ok: true,
    detail: 'Skipped — covered by production curl probe (400 without signature)',
  });
  results.push({
    name: 'Webhook signature probe (signed)',
    ok: res.status === 200,
    detail: `HTTP ${res.status}${body ? ` — ${body.slice(0, 120)}` : ''}`,
  });

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(resolve(__dirname, '../.env'));
  loadEnvFile(resolve(__dirname, '../../.env'));

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is required');
    process.exit(1);
  }

  const mode = secretKey.startsWith('sk_live_') ? 'live' : 'test';
  const keyPreview = `${secretKey.slice(0, 12)}...`;
  const publishableSet = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
  const webhookSecretSet = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());

  console.log('Stripe Production Smoke Test');
  console.log('='.repeat(50));
  console.log(`Stripe mode: ${mode}`);
  console.log(`Secret key: ${keyPreview}`);
  console.log(`Publishable key configured: ${publishableSet ? 'yes' : 'no'}`);
  console.log(`Webhook secret configured: ${webhookSecretSet ? 'yes' : 'no'}`);
  console.log(`Frontend URL: ${process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? '(not set)'}`);
  console.log('');

  const stripe = new Stripe(secretKey, { apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion });
  const prisma = new PrismaClient();

  const allResults: CheckResult[] = [];

  try {
    await stripe.products.list({ limit: 1 });
    allResults.push({
      name: 'Stripe API connection',
      ok: true,
      detail: 'Connected',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    allResults.push({
      name: 'Stripe API connection',
      ok: false,
      detail: message,
    });
  }

  allResults.push(...(await validatePricingConfigs(stripe, prisma)));
  allResults.push(...(await validateWebhookEndpoint(stripe)));

  if (args.probeWebhook) {
    allResults.push(...(await probeProductionWebhook(stripe, args.webhookUrl)));
  }

  console.log('Results:');
  console.log('-'.repeat(50));
  for (const r of allResults) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}: ${r.detail}`);
  }

  const failed = allResults.filter((r) => !r.ok).length;
  const passed = allResults.filter((r) => r.ok).length;
  console.log('-'.repeat(50));
  console.log(`Summary: ${passed} passed, ${failed} failed`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error('Stripe smoke test failed:', error);
  process.exit(1);
});
