import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeTestDashboards() {
  console.log('🧹 Removing test dashboards...');

  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found.');
      return;
    }

    // List of test dashboard names to remove
    const testDashboardNames = [
      'My Work Dashboard',
      'Personal Projects', 
      'Analytics Overview'
    ];

    // Find and delete test dashboards
    for (const name of testDashboardNames) {
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          name: name,
          userId: user.id
        }
      });

      if (dashboard) {
        await prisma.dashboard.delete({
          where: {
            id: dashboard.id
          }
        });
        console.log(`✅ Removed dashboard: ${name}`);
      } else {
        console.log(`⏭️  Dashboard not found: ${name}`);
      }
    }

    console.log('🎉 Test dashboard cleanup completed!');
  } catch (error) {
    console.error('❌ Error removing test dashboards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeTestDashboards(); 