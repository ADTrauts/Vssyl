import { prisma } from '../src/lib/prisma';

async function createDemoDashboards() {
  try {
    console.log('🚀 Creating Demo Dashboards with File Content');
    console.log('===============================================');

    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('❌ No test user found. Please run a seeding script first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email} (${testUser.id})`);

    // Check if personal dashboard exists
    let personalDashboard = await prisma.dashboard.findFirst({
      where: {
        userId: testUser.id,
        businessId: null,
        institutionId: null,
        householdId: null
      }
    });

    if (!personalDashboard) {
      personalDashboard = await prisma.dashboard.create({
        data: {
          userId: testUser.id,
          name: 'Personal Dashboard'
        }
      });
      console.log(`✅ Created personal dashboard: ${personalDashboard.name}`);
    } else {
      console.log(`✅ Found existing personal dashboard: ${personalDashboard.name}`);
    }

    // Create Work Dashboard with files
    const workDashboard = await prisma.dashboard.create({
      data: {
        userId: testUser.id,
        name: 'Work Project'
      }
    });

    console.log(`✅ Created work dashboard: ${workDashboard.name} (${workDashboard.id})`);

    // Create work folders and files
    const projectsFolder = await prisma.folder.create({
      data: {
        userId: testUser.id,
        dashboardId: workDashboard.id,
        name: 'Active Projects'
      }
    });

    const documentsFolder = await prisma.folder.create({
      data: {
        userId: testUser.id,
        dashboardId: workDashboard.id,
        name: 'Documents'
      }
    });

    const subFolder = await prisma.folder.create({
      data: {
        userId: testUser.id,
        dashboardId: workDashboard.id,
        parentId: projectsFolder.id,
        name: 'Q4 Reports'
      }
    });

    // Create work files
    const workFiles = [
      {
        name: 'project-plan.pdf',
        type: 'application/pdf',
        size: 2048576, // 2MB
        url: '/uploads/project-plan.pdf',
        folderId: projectsFolder.id
      },
      {
        name: 'budget-summary.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 512000, // 500KB
        url: '/uploads/budget-summary.xlsx',
        folderId: projectsFolder.id
      },
      {
        name: 'meeting-notes.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 256000, // 250KB
        url: '/uploads/meeting-notes.docx',
        folderId: documentsFolder.id
      },
      {
        name: 'quarterly-report.pdf',
        type: 'application/pdf',
        size: 1536000, // 1.5MB
        url: '/uploads/quarterly-report.pdf',
        folderId: subFolder.id
      },
      {
        name: 'work-presentation.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 3072000, // 3MB
        url: '/uploads/work-presentation.pptx',
        folderId: null // Root level
      }
    ];

    for (const fileData of workFiles) {
      await prisma.file.create({
        data: {
          userId: testUser.id,
          dashboardId: workDashboard.id,
          ...fileData
        }
      });
    }

    console.log(`✅ Created work content:`);
    console.log(`   📁 ${projectsFolder.name} (with 2 files)`);
    console.log(`   📁 ${documentsFolder.name} (with 1 file)`);
    console.log(`   📁 ${subFolder.name} (with 1 file)`);
    console.log(`   📄 work-presentation.pptx (root level)`);

    // Create Family Dashboard with files
    const familyDashboard = await prisma.dashboard.create({
      data: {
        userId: testUser.id,
        name: 'Family Planning'
      }
    });

    console.log(`✅ Created family dashboard: ${familyDashboard.name} (${familyDashboard.id})`);

    // Create family folders and files
    const photosFolder = await prisma.folder.create({
      data: {
        userId: testUser.id,
        dashboardId: familyDashboard.id,
        name: 'Family Photos'
      }
    });

    const familyFiles = [
      {
        name: 'vacation-2024.jpg',
        type: 'image/jpeg',
        size: 5242880, // 5MB
        url: '/uploads/vacation-2024.jpg',
        folderId: photosFolder.id
      },
      {
        name: 'birthday-party.jpg',
        type: 'image/jpeg',
        size: 3145728, // 3MB
        url: '/uploads/birthday-party.jpg',
        folderId: photosFolder.id
      },
      {
        name: 'meal-planning.pdf',
        type: 'application/pdf',
        size: 128000, // 125KB
        url: '/uploads/meal-planning.pdf',
        folderId: null // Root level
      }
    ];

    for (const fileData of familyFiles) {
      await prisma.file.create({
        data: {
          userId: testUser.id,
          dashboardId: familyDashboard.id,
          ...fileData
        }
      });
    }

    console.log(`✅ Created family content:`);
    console.log(`   📁 ${photosFolder.name} (with 2 photos)`);
    console.log(`   📄 meal-planning.pdf (root level)`);

    // Create an empty dashboard for testing
    const emptyDashboard = await prisma.dashboard.create({
      data: {
        userId: testUser.id,
        name: 'Empty Test Dashboard'
      }
    });

    console.log(`✅ Created empty dashboard: ${emptyDashboard.name} (${emptyDashboard.id})`);

    // Summary
    console.log('\n📊 Demo Setup Complete:');
    console.log(`   ${workDashboard.name}: 3 folders, 5 files (~7.3MB)`);
    console.log(`   ${familyDashboard.name}: 1 folder, 3 files (~8.3MB)`);
    console.log(`   ${emptyDashboard.name}: No content (for empty deletion testing)`);
    console.log('\n🎯 Ready for dashboard deletion demo at: http://localhost:3000/demo/dashboard-deletion');

  } catch (error) {
    console.error('❌ Demo setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo setup
createDemoDashboards().catch(console.error); 