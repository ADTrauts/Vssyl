<!--
Update Rules for deployment.md
- Updated when deployment, CI/CD, or operational practices change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- [Add major deployment, CI/CD, or operational changes here with date.]

# Deployment & Operations

## CI/CD
- All code is linted and tested in CI before merging (see [lintingAndCodeQuality.md](./lintingAndCodeQuality.md), [testingStrategy.md](./testingStrategy.md)).
- GitHub Actions is used for CI/CD pipelines.
- On push or PR to main, the following steps run:
  - Lint frontend and backend
  - Run all tests
  - Build frontend and backend
  - (Future) Deploy to staging/production if all checks pass
- Deployment is currently manual; automated deployment scripts and cloud integration are planned for future phases.

## Environment Setup
- **Local:**
  - Copy `.env.example` to `.env` (backend) and `.env.local` (frontend) and fill in required values.
  - Run `npm install` in both `web/` and `server/`.
  - Start backend: `cd server && npm run dev`
  - Start frontend: `cd web && npm run dev`
- **Staging/Production:**
  - Use environment-specific `.env` files with production secrets and URLs.
  - Build frontend: `cd web && npm run build`
  - Build backend: `cd server && npm run build`
  - Deploy built assets to cloud provider (e.g., Vercel, AWS, GCP, DigitalOcean).
  - Run database migrations: `cd prisma && npx prisma migrate deploy`
  - (Future) Use Docker or cloud-native deployment for scaling and reliability.

## Operational Best Practices
- **Monitoring:**
  - Use cloud provider or third-party tools (e.g., Datadog, Sentry) for monitoring uptime, errors, and performance.
- **Logging:**
  - Use Winston (backend) and browser console (frontend) for logging.
  - Centralize logs in cloud or log management service for production.
- **Incident Response:**
  - Set up alerts for errors, downtime, and performance issues.
  - Document incident response procedures and escalation paths.
  - Review and postmortem all major incidents.

## Cross-References
- [techContext.md](./techContext.md) (project structure, deployment stack)
- [progress.md](./progress.md) (deployment status, known issues)
- [testingStrategy.md](./testingStrategy.md) (test enforcement in CI)
- [lintingAndCodeQuality.md](./lintingAndCodeQuality.md) (linting in CI)

---

## Archive (Deprecated Deployment / Operational Practices)
- [Add deprecated or superseded deployment/operational practices here, with date and summary.] 