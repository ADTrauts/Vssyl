import { prisma } from '../lib/prisma';
import {
  BusinessRole,
  InteractionLinkType,
  MeetingInviteStatus,
  MeetingPlaceStatus,
  PlaceCategory,
  PlaceNodeType,
  PlaceTransactionStatus,
  PlaceTransactionType,
} from '@prisma/client';
import { hash } from 'bcrypt';

const MAIN_USER_EMAIL = 'place.tester@vssyl.local';

async function ensureTestUsers() {
  const usersToEnsure = [
    { email: MAIN_USER_EMAIL, name: 'Vssyl Place Tester' },
    { email: 'place.friend1@vssyl.local', name: 'Place Friend One' },
    { email: 'place.friend2@vssyl.local', name: 'Place Friend Two' },
  ] as const;

  const createdUsers: { email: string; id: string }[] = [];

  for (const u of usersToEnsure) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      createdUsers.push({ email: existing.email, id: existing.id });
      // eslint-disable-next-line no-console
      console.log(`ℹ️  User already exists: ${existing.email}`);
      continue;
    }

    const passwordHash = await hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        emailVerified: new Date(),
      },
    });

    createdUsers.push({ email: user.email, id: user.id });
    // eslint-disable-next-line no-console
    console.log(`✅ Created user: ${user.email}`);
  }

  const mainUser = createdUsers.find(u => u.email === MAIN_USER_EMAIL);
  if (!mainUser) {
    throw new Error('Main Place tester user was not created or found');
  }

  return {
    mainUserId: mainUser.id,
    friendUserIds: createdUsers.filter(u => u.email !== MAIN_USER_EMAIL).map(u => u.id),
  };
}

async function ensureBusinesses() {
  type SeedBusinessInput = {
    name: string;
    ein: string;
    website?: string;
    description?: string;
    category: PlaceCategory;
    shortDescription: string;
    interactionLinks: Array<{
      type: InteractionLinkType;
      label: string;
      url: string;
      sortOrder?: number;
    }>;
  };

  const seedBusinesses: SeedBusinessInput[] = [
    {
      name: 'Main Street Coffee',
      ein: '11-1111111',
      website: 'https://example.com/main-street-coffee',
      description: 'Neighborhood coffee shop with great espresso and cozy seating.',
      category: PlaceCategory.RESTAURANT,
      shortDescription: 'Espresso, pastries, and quiet work vibes.',
      interactionLinks: [
        {
          type: InteractionLinkType.WEBSITE,
          label: 'Visit Website',
          url: 'https://example.com/main-street-coffee',
          sortOrder: 0,
        },
        {
          type: InteractionLinkType.DOORDASH,
          label: 'Order on DoorDash',
          url: 'https://www.doordash.com/store/main-street-coffee',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Urban Bowl Kitchen',
      ein: '22-2222222',
      website: 'https://example.com/urban-bowl',
      description: 'Healthy grain bowls, salads, and smoothies.',
      category: PlaceCategory.RESTAURANT,
      shortDescription: 'Healthy bowls and smoothies for lunch.',
      interactionLinks: [
        {
          type: InteractionLinkType.WEBSITE,
          label: 'Menu & Ordering',
          url: 'https://example.com/urban-bowl/menu',
          sortOrder: 0,
        },
        {
          type: InteractionLinkType.UBEREATS,
          label: 'Order on Uber Eats',
          url: 'https://www.ubereats.com/store/urban-bowl-kitchen',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Sunrise Diner',
      ein: '33-3333333',
      website: 'https://example.com/sunrise-diner',
      description: 'Classic diner breakfast and late-night comfort food.',
      category: PlaceCategory.RESTAURANT,
      shortDescription: 'Breakfast all day and late-night comfort food.',
      interactionLinks: [
        {
          type: InteractionLinkType.WEBSITE,
          label: 'View Menu',
          url: 'https://example.com/sunrise-diner/menu',
          sortOrder: 0,
        },
        {
          type: InteractionLinkType.OPENTABLE,
          label: 'Reserve on OpenTable',
          url: 'https://www.opentable.com/r/sunrise-diner',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Cloud Sushi Bar',
      ein: '44-4444444',
      website: 'https://example.com/cloud-sushi',
      description: 'Modern sushi bar with takeout and delivery.',
      category: PlaceCategory.RESTAURANT,
      shortDescription: 'Sushi, sashimi, and rolls with fast pickup.',
      interactionLinks: [
        {
          type: InteractionLinkType.WEBSITE,
          label: 'Order Pickup',
          url: 'https://example.com/cloud-sushi/order',
          sortOrder: 0,
        },
        {
          type: InteractionLinkType.INSTACART,
          label: 'Groceries & Kits',
          url: 'https://www.instacart.com/store/cloud-sushi',
          sortOrder: 1,
        },
      ],
    },
  ];

  const businessRecords: { id: string; name: string }[] = [];

  for (const b of seedBusinesses) {
    const business = await prisma.business.upsert({
      where: { ein: b.ein },
      update: {
        name: b.name,
        website: b.website ?? null,
        description: b.description ?? null,
        einVerified: true,
      },
      create: {
        name: b.name,
        ein: b.ein,
        einVerified: true,
        website: b.website ?? null,
        description: b.description ?? null,
      },
    });

    businessRecords.push({ id: business.id, name: business.name });

    // Ensure BusinessPlaceListing
    const listing = await prisma.businessPlaceListing.upsert({
      where: { businessId: business.id },
      update: {
        isEnabled: true,
        isPublished: true,
        category: b.category,
        displayName: b.name,
        shortDescription: b.shortDescription,
      },
      create: {
        businessId: business.id,
        isEnabled: true,
        isPublished: true,
        category: b.category,
        displayName: b.name,
        shortDescription: b.shortDescription,
        tags: ['demo', 'seed', 'place', 'restaurant'],
      },
    });

    // Reset interaction links so seeding is idempotent
    await prisma.businessInteractionLink.deleteMany({
      where: { listingId: listing.id },
    });

    for (const link of b.interactionLinks) {
      await prisma.businessInteractionLink.create({
        data: {
          listingId: listing.id,
          type: link.type,
          label: link.label,
          url: link.url,
          sortOrder: link.sortOrder ?? 0,
        },
      });
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Ensured business and listing: ${business.name}`);
  }

  return businessRecords;
}

async function ensurePlaceForUser(userId: string) {
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
    // eslint-disable-next-line no-console
    console.log('✅ Created Place for tester user');
  }

  // Ensure some interests so Explore/AI feel seeded
  const interestCategories = ['restaurants', 'grocery', 'digital_services'];
  for (const category of interestCategories) {
    await prisma.placeInterest.upsert({
      where: {
        placeId_category: {
          placeId: place.id,
          category,
        },
      },
      update: {},
      create: {
        placeId: place.id,
        category,
      },
    });
  }

  return place;
}

async function connectUserToBusinesses(userId: string, businessRecords: { id: string; name: string }[], placeId: string) {
  // Give the user an admin role on each business for local testing
  for (const [index, b] of businessRecords.entries()) {
    await prisma.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: b.id,
          userId,
        },
      },
      update: {
        role: BusinessRole.ADMIN,
        isActive: true,
      },
      create: {
        businessId: b.id,
        userId,
        role: BusinessRole.ADMIN,
        isActive: true,
        canInvite: true,
        canManage: true,
        canBilling: true,
        title: 'Owner',
        department: 'Management',
      },
    });

    await prisma.businessFollow.upsert({
      where: {
        userId_businessId: {
          userId,
          businessId: b.id,
        },
      },
      update: {},
      create: {
        userId,
        businessId: b.id,
      },
    });

    await prisma.placeNode.upsert({
      where: {
        placeId_nodeType_entityId: {
          placeId,
          nodeType: PlaceNodeType.BUSINESS,
          entityId: b.id,
        },
      },
      update: { label: b.name },
      create: {
        placeId,
        nodeType: PlaceNodeType.BUSINESS,
        entityId: b.id,
        label: b.name,
        positionX: (index % 2 === 0 ? -1 : 1) * (150 + index * 25),
        positionY: 100 + index * 60,
      },
    });
  }
}

async function seedSampleTransactions(userId: string, businessRecords: { id: string; name: string }[]) {
  const now = new Date();

  const samples = [
    {
      business: businessRecords[0],
      type: PlaceTransactionType.PURCHASE,
      status: PlaceTransactionStatus.COMPLETED,
      amount: 14.5,
      description: 'Latte and croissant at Main Street Coffee',
      externalService: null,
      externalUrl: null,
    },
    {
      business: businessRecords[1],
      type: PlaceTransactionType.EXTERNAL_CLICK,
      status: PlaceTransactionStatus.COMPLETED,
      amount: null,
      description: 'DoorDash order from Urban Bowl Kitchen',
      externalService: 'doordash',
      externalUrl: 'https://www.doordash.com/store/urban-bowl-kitchen',
    },
    {
      business: businessRecords[2],
      type: PlaceTransactionType.RESERVATION,
      status: PlaceTransactionStatus.COMPLETED,
      amount: 42.75,
      description: 'Dinner for two at Sunrise Diner',
      externalService: 'opentable',
      externalUrl: 'https://www.opentable.com/r/sunrise-diner',
    },
  ];

  for (const [index, sample] of samples.entries()) {
    await prisma.placeTransaction.create({
      data: {
        userId,
        businessId: sample.business.id,
        type: sample.type,
        status: sample.status,
        amount: sample.amount,
        currency: 'USD',
        vssylFee: sample.amount ? Number((sample.amount * 0.02).toFixed(2)) : null,
        description: sample.description,
        externalService: sample.externalService,
        externalUrl: sample.externalUrl,
        isPrivate: false,
        completedAt: new Date(now.getTime() - (index + 1) * 60 * 60 * 1000),
      },
    });
  }
}

async function seedSampleMeeting(mainUserId: string, friendUserIds: string[], businessId: string | null) {
  if (friendUserIds.length === 0) {
    return;
  }

  const inviteeId = friendUserIds[0];

  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const meeting = await prisma.placeMeetingPlace.create({
    data: {
      creatorId: mainUserId,
      businessId,
      locationName: businessId ? 'Main Street Coffee' : 'Central Park Bench',
      locationAddress: businessId ? '123 Main St, Demo City' : 'Central Park, Demo City',
      scheduledAt,
      duration: 60,
      status: MeetingPlaceStatus.CONFIRMED,
      note: 'Catch up on life and talk about Place ideas.',
      isPrivate: false,
      invites: {
        create: [
          {
            inviteeId,
            status: MeetingInviteStatus.ACCEPTED,
            respondedAt: new Date(),
          },
        ],
      },
    },
    include: { invites: true },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Created sample meeting at ${meeting.locationName}`);
}

async function seedPlaceDemoData() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding Vssyl_Place demo data (local/testing only)...');

  const { mainUserId, friendUserIds } = await ensureTestUsers();
  const businesses = await ensureBusinesses();
  const place = await ensurePlaceForUser(mainUserId);
  await connectUserToBusinesses(mainUserId, businesses, place.id);
  await seedSampleTransactions(mainUserId, businesses);
  await seedSampleMeeting(mainUserId, friendUserIds, businesses[0]?.id ?? null);

  // eslint-disable-next-line no-console
  console.log('🎉 Vssyl_Place seeding completed. Log in as:');
  // eslint-disable-next-line no-console
  console.log(`   Email: ${MAIN_USER_EMAIL}`);
  // eslint-disable-next-line no-console
  console.log('   Password: password123');
}

if (require.main === module) {
  seedPlaceDemoData()
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('❌ Error seeding Vssyl_Place demo data:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedPlaceDemoData };

