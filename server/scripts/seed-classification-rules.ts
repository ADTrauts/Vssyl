import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedClassificationRules() {
  try {
    console.log('Seeding classification rules and templates...');

    // Get the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('No admin user found. Creating a test admin user...');
      const testAdmin = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: '$2b$10$test', // This is just for seeding
          name: 'Test Admin',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      console.log('Created test admin user:', testAdmin.id);
    }

    const userId = adminUser?.id || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id;

    if (!userId) {
      throw new Error('No admin user available for seeding');
    }

    // Create sample classification rules
    const rules = [
      {
        name: 'Financial Data Detection',
        description: 'Detects financial information like credit card numbers, bank accounts',
        pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b',
        resourceType: 'file',
        sensitivity: 'CONFIDENTIAL',
        priority: 10,
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Personal Information Detection',
        description: 'Detects personal information like names, addresses, phone numbers',
        pattern: '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b|\\b\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}\\b',
        resourceType: 'message',
        sensitivity: 'INTERNAL',
        priority: 5,
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Password Detection',
        description: 'Detects potential passwords and credentials',
        pattern: 'password|passwd|pwd|secret|key|token|credential',
        resourceType: 'file',
        sensitivity: 'RESTRICTED',
        priority: 15,
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Business Strategy Detection',
        description: 'Detects business strategy and planning content',
        pattern: 'strategy|planning|roadmap|quarterly|annual|budget|revenue|profit',
        resourceType: 'conversation',
        sensitivity: 'CONFIDENTIAL',
        priority: 8,
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Public Information',
        description: 'Marks general public information as public',
        pattern: 'public|general|announcement|news|update',
        resourceType: 'message',
        sensitivity: 'PUBLIC',
        priority: 1,
        isActive: true,
        createdBy: userId
      }
    ];

    for (const rule of rules) {
      const existingRule = await prisma.classificationRule.findUnique({
        where: { name: rule.name }
      });

      if (!existingRule) {
        await prisma.classificationRule.create({
          data: rule
        });
        console.log(`Created classification rule: ${rule.name}`);
      } else {
        console.log(`Classification rule already exists: ${rule.name}`);
      }
    }

    // Create sample classification templates
    const templates = [
      {
        name: 'Standard Internal',
        description: 'Standard template for internal company information',
        sensitivity: 'INTERNAL',
        expiresIn: 365, // 1 year
        notes: 'Standard internal classification template'
      },
      {
        name: 'Confidential Financial',
        description: 'Template for confidential financial information',
        sensitivity: 'CONFIDENTIAL',
        expiresIn: 730, // 2 years
        notes: 'Use for financial documents and sensitive business information'
      },
      {
        name: 'Restricted HR',
        description: 'Template for restricted HR and personnel information',
        sensitivity: 'RESTRICTED',
        expiresIn: 1095, // 3 years
        notes: 'Use for HR documents, personnel files, and highly sensitive information'
      },
      {
        name: 'Public Announcement',
        description: 'Template for public announcements and general information',
        sensitivity: 'PUBLIC',
        expiresIn: null, // No expiration
        notes: 'Use for public announcements and general company information'
      },
      {
        name: 'Temporary Internal',
        description: 'Template for temporary internal information',
        sensitivity: 'INTERNAL',
        expiresIn: 30, // 30 days
        notes: 'Use for temporary internal communications and short-term projects'
      }
    ];

    for (const template of templates) {
      const existingTemplate = await prisma.classificationTemplate.findUnique({
        where: { name: template.name }
      });

      if (!existingTemplate) {
        await prisma.classificationTemplate.create({
          data: {
            ...template,
            createdBy: userId
          }
        });
        console.log(`Created classification template: ${template.name}`);
      } else {
        console.log(`Classification template already exists: ${template.name}`);
      }
    }

    console.log('Classification rules and templates seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding classification rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClassificationRules(); 