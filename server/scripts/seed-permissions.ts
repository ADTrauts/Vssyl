import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default permissions for common modules and features
const defaultPermissions = [
  // Drive Module
  {
    moduleId: 'drive',
    featureId: 'files',
    action: 'view',
    description: 'View files and folders',
    category: 'basic',
  },
  {
    moduleId: 'drive',
    featureId: 'files',
    action: 'create',
    description: 'Create new files and folders',
    category: 'basic',
  },
  {
    moduleId: 'drive',
    featureId: 'files',
    action: 'edit',
    description: 'Edit file and folder properties',
    category: 'basic',
  },
  {
    moduleId: 'drive',
    featureId: 'files',
    action: 'delete',
    description: 'Delete files and folders',
    category: 'advanced',
  },
  {
    moduleId: 'drive',
    featureId: 'files',
    action: 'manage',
    description: 'Manage file permissions and sharing',
    category: 'admin',
  },
  {
    moduleId: 'drive',
    featureId: 'permissions',
    action: 'view',
    description: 'View file permissions',
    category: 'basic',
  },
  {
    moduleId: 'drive',
    featureId: 'permissions',
    action: 'manage',
    description: 'Manage file permissions',
    category: 'admin',
  },

  // Chat Module
  {
    moduleId: 'chat',
    featureId: 'conversations',
    action: 'view',
    description: 'View conversations',
    category: 'basic',
  },
  {
    moduleId: 'chat',
    featureId: 'conversations',
    action: 'create',
    description: 'Create new conversations',
    category: 'basic',
  },
  {
    moduleId: 'chat',
    featureId: 'conversations',
    action: 'edit',
    description: 'Edit conversation properties',
    category: 'advanced',
  },
  {
    moduleId: 'chat',
    featureId: 'conversations',
    action: 'delete',
    description: 'Delete conversations',
    category: 'admin',
  },
  {
    moduleId: 'chat',
    featureId: 'messages',
    action: 'view',
    description: 'View messages',
    category: 'basic',
  },
  {
    moduleId: 'chat',
    featureId: 'messages',
    action: 'create',
    description: 'Send messages',
    category: 'basic',
  },
  {
    moduleId: 'chat',
    featureId: 'messages',
    action: 'edit',
    description: 'Edit messages',
    category: 'advanced',
  },
  {
    moduleId: 'chat',
    featureId: 'messages',
    action: 'delete',
    description: 'Delete messages',
    category: 'admin',
  },

  // Calendar Module
  {
    moduleId: 'calendar',
    featureId: 'events',
    action: 'view',
    description: 'View calendar events',
    category: 'basic',
  },
  {
    moduleId: 'calendar',
    featureId: 'events',
    action: 'create',
    description: 'Create calendar events',
    category: 'basic',
  },
  {
    moduleId: 'calendar',
    featureId: 'events',
    action: 'edit',
    description: 'Edit calendar events',
    category: 'basic',
  },
  {
    moduleId: 'calendar',
    featureId: 'events',
    action: 'delete',
    description: 'Delete calendar events',
    category: 'advanced',
  },
  {
    moduleId: 'calendar',
    featureId: 'events',
    action: 'manage',
    description: 'Manage all calendar events',
    category: 'admin',
  },
  {
    moduleId: 'calendar',
    featureId: 'calendars',
    action: 'view',
    description: 'View calendars',
    category: 'basic',
  },
  {
    moduleId: 'calendar',
    featureId: 'calendars',
    action: 'create',
    description: 'Create calendars',
    category: 'advanced',
  },
  {
    moduleId: 'calendar',
    featureId: 'calendars',
    action: 'manage',
    description: 'Manage calendars',
    category: 'admin',
  },

  // Business Module
  {
    moduleId: 'business',
    featureId: 'members',
    action: 'view',
    description: 'View business members',
    category: 'basic',
  },
  {
    moduleId: 'business',
    featureId: 'members',
    action: 'invite',
    description: 'Invite new members',
    category: 'advanced',
  },
  {
    moduleId: 'business',
    featureId: 'members',
    action: 'manage',
    description: 'Manage business members',
    category: 'admin',
  },
  {
    moduleId: 'business',
    featureId: 'settings',
    action: 'view',
    description: 'View business settings',
    category: 'basic',
  },
  {
    moduleId: 'business',
    featureId: 'settings',
    action: 'edit',
    description: 'Edit business settings',
    category: 'admin',
  },

  // Org Chart Module
  {
    moduleId: 'org-chart',
    featureId: 'structure',
    action: 'view',
    description: 'View organizational structure',
    category: 'basic',
  },
  {
    moduleId: 'org-chart',
    featureId: 'structure',
    action: 'edit',
    description: 'Edit organizational structure',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'positions',
    action: 'view',
    description: 'View positions',
    category: 'basic',
  },
  {
    moduleId: 'org-chart',
    featureId: 'positions',
    action: 'create',
    description: 'Create positions',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'positions',
    action: 'edit',
    description: 'Edit positions',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'positions',
    action: 'delete',
    description: 'Delete positions',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'employees',
    action: 'view',
    description: 'View employee assignments',
    category: 'basic',
  },
  {
    moduleId: 'org-chart',
    featureId: 'employees',
    action: 'assign',
    description: 'Assign employees to positions',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'employees',
    action: 'manage',
    description: 'Manage employee assignments',
    category: 'admin',
  },
  {
    moduleId: 'org-chart',
    featureId: 'permissions',
    action: 'view',
    description: 'View permissions',
    category: 'basic',
  },
  {
    moduleId: 'org-chart',
    featureId: 'permissions',
    action: 'manage',
    description: 'Manage permissions',
    category: 'admin',
  },

  // Analytics Module
  {
    moduleId: 'analytics',
    featureId: 'reports',
    action: 'view',
    description: 'View analytics reports',
    category: 'basic',
  },
  {
    moduleId: 'analytics',
    featureId: 'reports',
    action: 'create',
    description: 'Create analytics reports',
    category: 'advanced',
  },
  {
    moduleId: 'analytics',
    featureId: 'reports',
    action: 'manage',
    description: 'Manage analytics reports',
    category: 'admin',
  },
  {
    moduleId: 'analytics',
    featureId: 'dashboards',
    action: 'view',
    description: 'View analytics dashboards',
    category: 'basic',
  },
  {
    moduleId: 'analytics',
    featureId: 'dashboards',
    action: 'create',
    description: 'Create analytics dashboards',
    category: 'advanced',
  },
  {
    moduleId: 'analytics',
    featureId: 'dashboards',
    action: 'manage',
    description: 'Manage analytics dashboards',
    category: 'admin',
  },

  // Admin Module
  {
    moduleId: 'admin',
    featureId: 'users',
    action: 'view',
    description: 'View user management',
    category: 'admin',
  },
  {
    moduleId: 'admin',
    featureId: 'users',
    action: 'manage',
    description: 'Manage users',
    category: 'admin',
  },
  {
    moduleId: 'admin',
    featureId: 'system',
    action: 'view',
    description: 'View system settings',
    category: 'admin',
  },
  {
    moduleId: 'admin',
    featureId: 'system',
    action: 'manage',
    description: 'Manage system settings',
    category: 'admin',
  },
];

// Default permission sets for different roles
const defaultPermissionSets = [
  {
    name: 'Full Access',
    description: 'Complete access to all features and modules',
    category: 'admin',
    template: true,
    permissions: defaultPermissions,
  },
  {
    name: 'Executive Access',
    description: 'High-level access for executives and senior management',
    category: 'admin',
    template: true,
    permissions: defaultPermissions.filter(p => 
      p.category !== 'admin' || 
      ['business', 'org-chart', 'analytics'].includes(p.moduleId)
    ),
  },
  {
    name: 'Manager Access',
    description: 'Management-level access for team leaders',
    category: 'advanced',
    template: true,
    permissions: defaultPermissions.filter(p => 
      p.category === 'basic' || p.category === 'advanced'
    ),
  },
  {
    name: 'Employee Access',
    description: 'Standard access for regular employees',
    category: 'basic',
    template: true,
    permissions: defaultPermissions.filter(p => 
      p.category === 'basic'
    ),
  },
  {
    name: 'Restricted Access',
    description: 'Limited access for contractors or temporary staff',
    category: 'basic',
    template: true,
    permissions: defaultPermissions.filter(p => 
      p.category === 'basic' && 
      ['drive', 'chat'].includes(p.moduleId) &&
      p.action === 'view'
    ),
  },
];

async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    // Create permissions
    console.log('Creating permissions...');
    for (const permissionData of defaultPermissions) {
      await prisma.permission.upsert({
        where: {
          moduleId_featureId_action: {
            moduleId: permissionData.moduleId,
            featureId: permissionData.featureId,
            action: permissionData.action,
          },
        },
        update: permissionData,
        create: permissionData,
      });
    }
    console.log(`Created ${defaultPermissions.length} permissions`);

    // Create a system business for templates if it doesn't exist
    let systemBusiness = await prisma.business.findFirst({
      where: { name: 'System Templates' },
    });

    if (!systemBusiness) {
      systemBusiness = await prisma.business.create({
        data: {
          name: 'System Templates',
          ein: 'SYSTEM-0000',
          industry: 'system',
          size: '1-10',
          description: 'System-level business for storing permission templates',
        },
      });
      console.log('Created system business for templates');
    }

    // Create permission sets (templates)
    console.log('Creating permission set templates...');
    for (const permissionSetData of defaultPermissionSets) {
      await prisma.permissionSet.upsert({
        where: {
          businessId_name: {
            businessId: systemBusiness.id,
            name: permissionSetData.name,
          },
        },
        update: {
          description: permissionSetData.description,
          category: permissionSetData.category,
          template: permissionSetData.template,
          permissions: permissionSetData.permissions,
        },
        create: {
          name: permissionSetData.name,
          description: permissionSetData.description,
          category: permissionSetData.category,
          template: permissionSetData.template,
          permissions: permissionSetData.permissions,
          businessId: systemBusiness.id,
        },
      });
    }
    console.log(`Created ${defaultPermissionSets.length} permission set templates`);

    console.log('Permission seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('Failed to seed permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
