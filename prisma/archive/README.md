# Prisma Schema Archive

This directory contains archived/legacy Prisma schema files that are no longer actively used.

## What's Here

- `schema.prisma.backup-*` - Legacy monolithic schema files that have been replaced by the modular system

## Important Note

⚠️ **DO NOT USE THESE FILES** ⚠️

The project now uses a **modular Prisma schema system** located in `/prisma/modules/`.

## Current Schema Process

1. **Individual modules** are stored in `/prisma/modules/` organized by feature area
2. **Build script** (`/scripts/build-prisma-schema.js`) combines all modules into the main schema
3. **Main schema** (`/prisma/schema.prisma`) is generated automatically - do not edit directly

## To Update the Schema

1. Edit the appropriate module file in `/prisma/modules/`
2. Run: `node scripts/build-prisma-schema.js`
3. Run: `npx prisma generate`
4. Create migration: `npx prisma migrate dev --name your_change_name`

## Module Structure

```
prisma/modules/
├── admin/          # Admin portal, security, audit
├── ai/             # AI models, analytics, enterprise AI
├── auth/           # User authentication, management
├── billing/        # Subscriptions, payments
├── business/       # Business entities, dashboards
├── calendar/       # Calendar and events
├── chat/           # Conversations, messaging
└── drive/          # Files and folders
```

---
*Archived on: $(date)*
*Reason: Replaced with modular schema system*
