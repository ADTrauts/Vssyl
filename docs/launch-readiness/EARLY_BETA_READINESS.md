# Early Beta Readiness

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30

**Purpose:** Define what "ready for 20 businesses" means in practice — controlled cohort, not public launch.

---

## Beta definition

| Parameter | Recommendation |
|-----------|----------------|
| Cohort size | Up to 20 businesses (~50–200 users) |
| Tier | Free + optional paid pilots with white-glove billing support |
| Support model | Email + in-app tickets; 24–48h response SLA |
| Success criteria | Admin completes invite + employee accepts + one core action per user |
| Duration | 4–6 weeks before self-serve expansion |

---

## Go / no-go criteria

### Must have (go)

| # | Criterion | Verification |
|---|-----------|--------------|
| G1 | SMTP delivers invitation emails in production | SMTP checklist M4 |
| G2 | Password reset email works | SMTP checklist M3 |
| G3 | `/api/health` returns 200 in production | Automated probe |
| G4 | Support ticket creation works | Manual test signed-in |
| G5 | Beta runbook shared with support | This doc + checklists |
| G6 | Known limitations doc shared with beta admins | `/docs` + email |
| G7 | At least one operator reachable for incidents | On-call contact |

### Should have (go with documented limitations)

| # | Criterion | If missing |
|---|-----------|------------|
| S1 | Stripe live verified | Free-tier only beta |
| S2 | Uptime monitoring | Manual health checks daily |
| S3 | Product analytics | Manual check-ins with beta admins |
| S4 | Paid marketplace module E2E | Exclude paid partner apps from beta |

### Must not launch without

| # | Stop condition |
|---|----------------|
| N1 | Invitation emails undeliverable |
| N2 | Database migrations failing on deploy |
| N3 | Auth completely broken |
| N4 | Data leakage across tenants (any confirmed bug) |

---

## Beta admin onboarding script

1. Register at `https://vssyl.com/auth/register`
2. Choose **Business** in welcome modal → create business
3. Land on workspace → complete setup checklist
4. Invite 1–3 teammates (verify email received)
5. Install one optional app from marketplace (admin)
6. Each user: upload file (Drive), send chat, create calendar event
7. Review `/billing` for plan options
8. Submit test support ticket at `/support`

**Time budget:** 30–45 minutes with support on standby.

---

## Beta employee onboarding script

1. Click invitation link in email
2. Register or sign in
3. Accept invitation
4. Open Drive, Chat, or Calendar from sidebar
5. Complete one action

**Time budget:** 10–15 minutes.

---

## Support runbook (minimal)

| Issue | First response |
|-------|----------------|
| No invitation email | Check spam; resend invite; verify SMTP logs |
| Can't reset password | Verify SMTP; admin can use admin-portal reset |
| Billing confusion | Direct to `/billing`; operator handles Stripe manually if needed |
| App install 403 | Confirm user is business admin |
| Slow performance | Check Cloud Run metrics; `/api/health` |
| Data concern | Escalate to engineering; preserve logs |

**Escalation contact:** Operator on-call (define before beta start).

---

## Communication templates

### Beta welcome (admin)

> Welcome to the Vssyl early access program. Your workspace is ready at vssyl.com. Start by inviting your team — they'll receive an email with an accept link. Support: /support or support@vssyl.com. Known limitations: [link to /docs].

### Known limitations (honest)

- Status page is manually updated during early access
- Some paid marketplace apps may require manual billing setup
- Email verification is recommended but not enforced in all configurations
- Product analytics funnel not yet visible to admins

---

## Exit criteria (beta → broader launch)

| Metric | Target |
|--------|--------|
| Invite accept rate | > 90% without manual token paste |
| Admin completes setup checklist | > 80% |
| Support tickets per business | < 3 in first week (after onboarding) |
| P0 incidents | 0 unresolved > 24h |
| SMTP + Stripe operator checklists | 100% pass |
| Launch Readiness score | ≥ 75% |

---

## Recommended beta cohort profile

**Ideal first 20 businesses:**

- 10–200 employees
- Business administrator as champion
- Willing to provide weekly feedback
- Not requiring HIPAA BAA or SLA on day one
- Primary use: Drive + Chat + Calendar + team invite

**Defer:**

- Enterprise SSO requirements
- Paid partner modules without E2E verification
- High-volume API integrations

---

## Verdict

Vssyl is **ready for a controlled early beta** once operator SMTP verification completes and a support runbook is staffed.

Vssyl is **not ready for unmanaged self-serve launch** until Stripe live proof, monitoring, and product analytics are in place.

**Early Beta Readiness:** **Conditional go** — see [LAUNCH_READINESS_ASSESSMENT.md](./LAUNCH_READINESS_ASSESSMENT.md).
