import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedModules() {
  try {
    console.log('🌱 Seeding modules...');

    // Get the first user as developer (or create one if none exists)
    let developer = await prisma.user.findFirst();
    if (!developer) {
      console.log('No users found, creating a default developer...');
      developer = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: 'hashedpassword', // This should be properly hashed in production
          name: 'System Admin',
          role: 'ADMIN'
        }
      });
    }

    const modules = [
      {
        id: 'drive',
        name: 'Drive',
        description: 'Secure file storage and sharing with advanced collaboration features',
        version: '1.0.0',
        category: 'PRODUCTIVITY' as const,
        tags: ['file-storage', 'collaboration', 'security'],
        icon: '📁',
        screenshots: [],
        developerId: developer.id,
        status: 'APPROVED' as const,
        downloads: 0,
        rating: 4.5,
        reviewCount: 0,
        manifest: {
          frontend: {
            entryUrl: 'http://localhost:3000/modules/drive',
            permissions: ['files:read', 'files:write', 'files:share']
          },
          backend: {
            entryUrl: 'http://localhost:5000/api/modules/drive',
            permissions: ['files:access', 'storage:manage']
          }
        },
        dependencies: [],
        permissions: ['files:read', 'files:write', 'files:share'],
        pricingTier: 'free',
        basePrice: 0,
        enterprisePrice: 29.99,
        isProprietary: false,
        revenueSplit: 0.7
      },
      {
        id: 'chat',
        name: 'Chat',
        description: 'Real-time messaging with AI assistance and enterprise compliance features',
        version: '1.0.0',
        category: 'COMMUNICATION' as const,
        tags: ['messaging', 'ai', 'compliance'],
        icon: '💬',
        screenshots: [],
        developerId: developer.id,
        status: 'APPROVED' as const,
        downloads: 0,
        rating: 4.3,
        reviewCount: 0,
        manifest: {
          frontend: {
            entryUrl: 'http://localhost:3000/modules/chat',
            permissions: ['messages:read', 'messages:write', 'conversations:manage']
          },
          backend: {
            entryUrl: 'http://localhost:5000/api/modules/chat',
            permissions: ['messages:access', 'ai:assist']
          }
        },
        dependencies: [],
        permissions: ['messages:read', 'messages:write', 'conversations:manage'],
        pricingTier: 'free',
        basePrice: 0,
        enterprisePrice: 19.99,
        isProprietary: false,
        revenueSplit: 0.7
      },
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Smart scheduling with resource management and workflow automation',
        version: '1.0.0',
        category: 'PRODUCTIVITY' as const,
        tags: ['scheduling', 'automation', 'workflows'],
        icon: '📅',
        screenshots: [],
        developerId: developer.id,
        status: 'APPROVED' as const,
        downloads: 0,
        rating: 4.7,
        reviewCount: 0,
        manifest: {
          frontend: {
            entryUrl: 'http://localhost:3000/modules/calendar',
            permissions: ['events:read', 'events:write', 'schedules:manage']
          },
          backend: {
            entryUrl: 'http://localhost:5000/api/modules/calendar',
            permissions: ['events:access', 'automation:manage']
          }
        },
        dependencies: [],
        permissions: ['events:read', 'events:write', 'schedules:manage'],
        pricingTier: 'free',
        basePrice: 0,
        enterprisePrice: 24.99,
        isProprietary: false,
        revenueSplit: 0.7
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Customizable analytics and reporting with real-time insights',
        version: '1.0.0',
        category: 'ANALYTICS' as const,
        tags: ['analytics', 'reporting', 'insights'],
        icon: '📊',
        screenshots: [],
        developerId: developer.id,
        status: 'APPROVED' as const,
        downloads: 0,
        rating: 4.6,
        reviewCount: 0,
        manifest: {
          frontend: {
            entryUrl: 'http://localhost:3000/modules/dashboard',
            permissions: ['analytics:read', 'reports:create', 'widgets:manage']
          },
          backend: {
            entryUrl: 'http://localhost:5000/api/modules/dashboard',
            permissions: ['analytics:access', 'data:aggregate']
          }
        },
        dependencies: [],
        permissions: ['analytics:read', 'reports:create', 'widgets:manage'],
        pricingTier: 'free',
        basePrice: 0,
        enterprisePrice: 39.99,
        isProprietary: false,
        revenueSplit: 0.7
      }
    ];

    for (const moduleData of modules) {
      const existingModule = await prisma.module.findUnique({
        where: { id: moduleData.id }
      });

      if (existingModule) {
        console.log(`✅ Module ${moduleData.name} already exists`);
        continue;
      }

      const module = await prisma.module.create({
        data: moduleData
      });

      console.log(`✅ Created module: ${module.name} (${module.id})`);
    }

    console.log('🎉 Module seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding modules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedModules()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }); 