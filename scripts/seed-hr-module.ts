/**
 * Seed HR Module
 * 
 * Creates the HR module record in the database
 * This should be run once to register the HR module
 * 
 * Usage: npx ts-node scripts/seed-hr-module.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHRModule() {
  try {
    console.log('🏥 Seeding HR Module...\n');
    
    // Check if HR module already exists
    const existing = await prisma.module.findUnique({
      where: { id: 'hr' }
    });
    
    if (existing) {
      console.log('✅ HR module already exists');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Version: ${existing.version}`);
      console.log(`   Status: ${existing.status}`);
      console.log(`   Pricing: ${existing.pricingTier}\n`);
      return;
    }
    
    // Get a user to be the developer (system user or first admin)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!systemUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    // Create HR module
    const hrModule = await prisma.module.create({
      data: {
        id: 'hr',
        name: 'HR Management',
        description: 'Complete human resources management system for employee lifecycle, attendance, payroll, and performance management',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['hr', 'human-resources', 'business', 'enterprise', 'proprietary'],
        icon: 'Users',
        screenshots: [],
        developerId: systemUser.id,
        status: 'APPROVED',
        downloads: 0,
        rating: 5.0,
        reviewCount: 0,
        
        // Pricing configuration
        pricingTier: 'business_advanced',  // Minimum tier
        basePrice: 0,  // Included in subscription
        enterprisePrice: 0,  // Included in Enterprise
        isProprietary: true,
        revenueSplit: 0,  // No revenue split (proprietary)
        
        // Module manifest
        manifest: {
          name: 'HR Management',
          version: '1.0.0',
          description: 'Human resources management system',
          author: 'Vssyl',
          license: 'proprietary',
          
          // Module configuration
          businessOnly: true,
          requiresOrgChart: true,
          minimumTier: 'business_advanced',
          
          // Entry points for different user types
          routes: {
            admin: '/business/[id]/admin/hr',
            employee: '/business/[id]/workspace/hr/me',
            manager: '/business/[id]/workspace/hr/team'
          },
          
          // Required permissions
          permissions: [
            'hr:admin',
            'hr:employees:read',
            'hr:employees:write',
            'hr:team:view',
            'hr:team:approve',
            'hr:self:view',
            'hr:self:update'
          ],
          
          // Tiered features
          tierFeatures: {
            business_advanced: {
              employees: {
                enabled: true,
                limit: 50,
                customFields: false
              },
              attendance: {
                enabled: true,
                clockInOut: false,
                geolocation: false
              },
              payroll: false,
              recruitment: false,
              performance: false,
              benefits: false
            },
            enterprise: {
              employees: {
                enabled: true,
                limit: null,
                customFields: true
              },
              attendance: {
                enabled: true,
                clockInOut: true,
                geolocation: true
              },
              payroll: true,
              recruitment: true,
              performance: true,
              benefits: true
            }
          },
          
          // Module dependencies
          dependencies: [],  // No module dependencies (but requires org chart setup)
          
          // Runtime configuration
          runtime: {
            apiVersion: '1.0',
            endpoints: {
              admin: '/api/hr/admin',
              manager: '/api/hr/team',
              employee: '/api/hr/me',
              ai: '/api/hr/ai'
            }
          },
          
          // Frontend configuration
          frontend: {
            entryUrl: '/business/[id]/admin/hr',
            adminUrl: '/business/[id]/admin/hr',
            employeeUrl: '/business/[id]/workspace/hr/me',
            managerUrl: '/business/[id]/workspace/hr/team'
          },
          
          // Feature settings (toggles for future features)
          settings: {
            features: {
              employees: true,
              attendance: false,  // Not implemented yet
              payroll: false,
              recruitment: false,
              performance: false,
              benefits: false
            }
          }
        },
        
        // Required dependencies
        dependencies: [],
        
        // Required permissions
        permissions: [
          'hr:admin',
          'hr:employees:read',
          'hr:employees:write',
          'hr:team:view',
          'hr:self:view'
        ]
      }
    });
    
    console.log('✅ HR module created successfully!\n');
    console.log('Module Details:');
    console.log(`   ID: ${hrModule.id}`);
    console.log(`   Name: ${hrModule.name}`);
    console.log(`   Version: ${hrModule.version}`);
    console.log(`   Category: ${hrModule.category}`);
    console.log(`   Status: ${hrModule.status}`);
    console.log(`   Pricing Tier: ${hrModule.pricingTier}`);
    console.log(`   Minimum Tier: business_advanced`);
    console.log(`   Is Proprietary: ${hrModule.isProprietary}`);
    console.log('\n🎯 Next Steps:');
    console.log('   1. Run database migration: npm run prisma:migrate');
    console.log('   2. Restart server to register AI context');
    console.log('   3. Install HR module for a business via admin panel\n');
    
  } catch (error) {
    console.error('❌ Error seeding HR module:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedHRModule();
}

export default seedHRModule;

