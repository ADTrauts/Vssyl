/**
 * Seed Place QA data for Wave 6B-Place-QA-R2.
 * Run: node docs/ux/audits/qa-evidence/5G-QA/place/seed-qa-place.mjs
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAIL = 'qa-calendar-5g-exec-2026@test.com';

const PUBLISHER_EIN = '99-5555100';
const DISCOVERY_EIN = '99-5555200';

async function ensurePlaceForUser(userId) {
  let place = await prisma.place.findUnique({ where: { userId } });
  if (!place) {
    place = await prisma.place.create({
      data: {
        userId,
        isSetupComplete: true,
        settings: {
          create: {
            neighborhoodVisibility: 'PRIVATE',
            defaultFollowVisibility: false,
            layoutMode: 'FORCE',
            showLabels: true,
            highContrastMode: false,
            showLocalSuggestions: true,
            suggestionRadius: 25,
          },
        },
      },
    });
  } else if (!place.isSetupComplete) {
    place = await prisma.place.update({
      where: { id: place.id },
      data: { isSetupComplete: true },
    });
  }

  for (const category of ['restaurants', 'retail', 'local_services']) {
    await prisma.placeInterest.upsert({
      where: { placeId_category: { placeId: place.id, category } },
      update: {},
      create: { placeId: place.id, category },
    });
  }

  return place;
}

async function ensureBusiness({ ein, name, userId, asMember }) {
  const business = await prisma.business.upsert({
    where: { ein },
    update: { name, einVerified: true },
    create: { name, ein, einVerified: true, website: 'https://example.com/qa-place' },
  });

  if (asMember) {
    await prisma.businessMember.upsert({
      where: { businessId_userId: { businessId: business.id, userId } },
      update: { role: 'ADMIN', isActive: true, canManage: true, canInvite: true, canBilling: true },
      create: {
        businessId: business.id,
        userId,
        role: 'ADMIN',
        isActive: true,
        canManage: true,
        canInvite: true,
        canBilling: true,
        title: 'Owner',
      },
    });

    const dash = await prisma.dashboard.findFirst({ where: { businessId: business.id, userId } });
    if (!dash) {
      await prisma.dashboard.create({
        data: { userId, businessId: business.id, name: `${name} Dashboard` },
      });
    }
  }

  const listing = await prisma.businessPlaceListing.upsert({
    where: { businessId: business.id },
    update: {
      isEnabled: true,
      isPublished: true,
      trashedAt: null,
      displayName: name,
      shortDescription: '[QA] Place discovery listing for Part 2G',
      category: 'RESTAURANT',
    },
    create: {
      businessId: business.id,
      isEnabled: true,
      isPublished: true,
      displayName: name,
      shortDescription: '[QA] Place discovery listing for Part 2G',
      category: 'RESTAURANT',
      tags: ['qa', 'place', '5g'],
    },
  });

  return { business, listing };
}

async function ensureCalendar(userId) {
  const existing = await prisma.calendar.findFirst({
    where: { contextType: 'PERSONAL', contextId: userId },
  });
  if (existing) return existing;

  return prisma.calendar.create({
    data: {
      name: '[QA] Personal Calendar',
      contextType: 'PERSONAL',
      contextId: userId,
      type: 'LOCAL',
      isPrimary: true,
    },
  });
}

async function cleanupStaleQaMeetings(userId) {
  await prisma.placeMeetingPlace.deleteMany({
    where: {
      creatorId: userId,
      locationName: { startsWith: '[QA] Place' },
    },
  });
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  await cleanupStaleQaMeetings(user.id);
  const place = await ensurePlaceForUser(user.id);

  const publisher = await ensureBusiness({
    ein: PUBLISHER_EIN,
    name: '[QA] Place Publisher 5G',
    userId: user.id,
    asMember: true,
  });

  const discovery = await ensureBusiness({
    ein: DISCOVERY_EIN,
    name: '[QA] Place Discovery 5G',
    userId: user.id,
    asMember: false,
  });

  const calendar = await ensureCalendar(user.id);

  // Unfollow discovery business so PLC-08 can exercise follow
  await prisma.businessFollow.deleteMany({
    where: { userId: user.id, businessId: discovery.business.id },
  });
  await prisma.placeNode.deleteMany({
    where: {
      placeId: place.id,
      nodeType: 'BUSINESS',
      entityId: discovery.business.id,
    },
  });

  const out = {
    userId: user.id,
    placeId: place.id,
    publisherBusinessId: publisher.business.id,
    discoveryBusinessId: discovery.business.id,
    calendarId: calendar.id,
  };

  fs.writeFileSync(path.join(__dirname, 'qa-seed.json'), JSON.stringify(out, null, 2));
  console.log('QA Place seed complete:', out);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
