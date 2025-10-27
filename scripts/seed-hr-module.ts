/**
 * Seed HR Module
 * 
 * Creates the HR module record in the database
 * This runs automatically on server startup if HR module doesn't exist
 * 
 * Can also be run manually: npx ts-node scripts/seed-hr-module.ts
 */

import { PrismaClient } from '@prisma/client';

// Allow using custom prisma instance (for server startup)
export async function seedHRModule(prismaInstance?: PrismaClient): Promise<boolean> {
  const prisma = prismaInstance || new PrismaClient();
  
  try {
    // Check if HR module already exists
    const existing = await prisma.module.findUnique({
      where: { id: 'hr' }
    });
    
    if (existing) {
      console.log('   ✅ HR module already registered');
      return true;
    }
    
    console.log('   📝 Creating HR module record...');
    
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
    
    console.log('   ✅ HR module registered successfully');
    return true;
    
  } catch (error) {
    console.error('   ❌ Error seeding HR module:', error);
    return false;
  } finally {
    // Only disconnect if we created our own prisma instance
    if (!prismaInstance) {
      await prisma.$disconnect();
    }
  }
}

// ============================================================================
// STANDALONE EXECUTION (Manual Run)
// ============================================================================

async function runStandalone() {
  try {
    console.log('\n🏥 ============================================');
    console.log('🏥 HR Module Seed - Manual Execution');
    console.log('🏥 ============================================\n');
    
    const success = await seedHRModule();
    
    if (success) {
      console.log('\n🎯 Next Steps:');
      console.log('   1. Restart server to register AI context');
      console.log('   2. Install HR module for a business via admin panel\n');
    } else {
      console.error('\n❌ Seeding failed. Check errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runStandalone();
}

export default seedHRModule;

