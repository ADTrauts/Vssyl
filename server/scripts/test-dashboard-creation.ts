import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardCreation() {
  try {
    console.log('🧪 Testing Dashboard Creation...');

    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@blockonblock.com' },
      select: { id: true, email: true }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);

    // Test creating a personal dashboard
    console.log('\n📊 Testing personal dashboard creation...');
    
    const personalDashboard = await prisma.dashboard.create({
      data: {
        userId: adminUser.id,
        name: 'Test Personal Dashboard',
        layout: {
          widgets: [
            { id: 'test-widget', x: 0, y: 0, w: 12, h: 6 }
          ]
        },
        preferences: {
          theme: 'light',
          compactMode: false
        }
      }
    });

    console.log(`✅ Personal dashboard created: ${personalDashboard.name} (${personalDashboard.id})`);

    // Test creating a business dashboard
    console.log('\n🏢 Testing business dashboard creation...');
    
    const testBusiness = await prisma.business.findUnique({
      where: { id: '8360c889-4839-4e90-ab34-f0a986177965' },
      select: { id: true, name: true }
    });

    if (testBusiness) {
      const businessDashboard = await prisma.dashboard.create({
        data: {
          userId: adminUser.id,
          name: 'Test Business Dashboard',
          layout: {
            widgets: [
              { id: 'business-widget', x: 0, y: 0, w: 12, h: 6 }
            ]
          },
          preferences: {
            theme: 'dark',
            compactMode: true
          },
          businessId: testBusiness.id
        }
      });

      console.log(`✅ Business dashboard created: ${businessDashboard.name} (${businessDashboard.id})`);
    }

    // Test creating widgets
    console.log('\n🧩 Testing widget creation...');
    
    const testWidget = await prisma.widget.create({
      data: {
        dashboardId: personalDashboard.id,
        type: 'test',
        config: {
          testSetting: true
        }
      }
    });

    console.log(`✅ Widget created: ${testWidget.type} (${testWidget.id})`);

    // Test dashboard service functions
    console.log('\n🔧 Testing dashboard service functions...');
    
    // Import the dashboard service
    const { getDashboards, getAllUserDashboards } = await import('../src/services/dashboardService');
    
    try {
      const dashboards = await getDashboards(adminUser.id);
      console.log(`✅ getDashboards successful: ${dashboards.length} dashboards found`);
      
      const allDashboards = await getAllUserDashboards(adminUser.id);
      console.log(`✅ getAllUserDashboards successful:`);
      console.log(`   Personal: ${allDashboards.personal.length}`);
      console.log(`   Business: ${allDashboards.business.length}`);
      console.log(`   Educational: ${allDashboards.educational.length}`);
      console.log(`   Household: ${allDashboards.household.length}`);
      
    } catch (error) {
      console.error('❌ Dashboard service test failed:', error);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    await prisma.widget.deleteMany({
      where: { dashboardId: personalDashboard.id }
    });
    
    await prisma.dashboard.deleteMany({
      where: { 
        id: { in: [personalDashboard.id] }
      }
    });

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Dashboard creation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing dashboard creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardCreation();
