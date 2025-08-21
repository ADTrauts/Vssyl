# Block on Block Monorepo

## Overview
This is a modular ERP/LRM platform with a monorepo structure managed by pnpm workspaces.

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
   - Frontend: `pnpm --filter web dev`
   - Backend: `pnpm --filter server dev`

## Core Technologies
- pnpm workspaces
- TypeScript
- Next.js
- Express.js
- Prisma ORM
- Passport & NextAuth.js (OAuth2)
- Socket.IO
- Tailwind CSS

## Memory Bank
See `memory-bank/` for all project context, requirements, and documentation.
