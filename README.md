# Vssyl Monorepo

## Overview
Vssyl is a revolutionary digital workspace platform - a modular ERP/LRM platform with a monorepo structure managed by pnpm workspaces.

### Packages
- `web/` – Next.js frontend (TypeScript, Tailwind CSS, NextAuth.js)
- `server/` – Express backend (TypeScript, Passport, JWT, Socket.IO, Prisma)
- `shared/` – Shared TypeScript types and utilities
- `prisma/` – Database schema and migration scripts

## Getting Started

1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Set up environment variables for each package as needed.
3. Run the development servers:
   ```sh
   pnpm dev
   ```

## 📚 Documentation

- **[📖 Documentation Index](docs/README.md)** - Comprehensive guides and setup instructions
- **[🧠 Memory Bank](memory-bank/)** - Project context, requirements, and development notes
- **[🔧 Scripts](scripts/)** - Build and utility scripts

## Core Technologies
- pnpm workspaces
- TypeScript
- Next.js
- Express.js
- Prisma ORM
- Passport & NextAuth.js (OAuth2)
- Socket.IO
- Tailwind CSS

## Quick Development Commands

- **Start all services**: `pnpm dev`
- **Install dependencies**: `pnpm install`
- **Build all packages**: `pnpm build`
- **Run tests**: `pnpm test`

## Google Cloud Build vs GitHub Actions

- **GitHub Actions** (`.github/workflows/ci.yml`) runs on pushes and pull requests to this repo (type-check, tests, Postgres migrations in CI).
- **Google Cloud Build** is configured in **GCP** (Cloud Build → Triggers). It usually runs only for branches that match the trigger (often **`main`**). Pushing a **feature branch** may run Actions but **not** Cloud Build until you merge to `main` or widen the trigger.
- If GitHub shows *repository moved*, set `origin` to the canonical URL: `https://github.com/ADTrauts/Vssyl.git` (`git remote set-url origin <url>`).
- **Manual deploy build** from repo root: `gcloud builds submit --config cloudbuild.yaml .` (with `gcloud` authenticated to the correct project).
