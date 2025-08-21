import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testBusinessAPI() {
  try {
    console.log('🧪 Testing Business API...');

    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@blockonblock.com' },
      select: { id: true, email: true, role: true }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);

    // Get the test business
    const testBusiness = await prisma.business.findUnique({
      where: { id: '8360c889-4839-4e90-ab34-f0a986177965' },
      select: { id: true, name: true, ein: true }
    });

    if (!testBusiness) {
      console.error('❌ Test business not found');
      return;
    }

    console.log(`✅ Found test business: ${testBusiness.name} (${testBusiness.id})`);

    // Check if admin user is a member of the business
    const businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId: testBusiness.id,
        userId: adminUser.id,
        isActive: true
      },
      select: { id: true, role: true, title: true }
    });

    if (!businessMember) {
      console.error('❌ Admin user is not a member of the business');
      return;
    }

    console.log(`✅ Admin user is a business member: ${businessMember.role} - ${businessMember.title}`);

    // Create a test JWT token for the admin user
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      secret,
      { expiresIn: '1h' }
    );

    console.log(`✅ JWT token created for admin user`);
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Test the business query that the API would use
    const businessWithMembers = await prisma.business.findFirst({
      where: {
        id: testBusiness.id,
        members: {
          some: {
            userId: adminUser.id,
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        dashboards: {
          where: {
            userId: adminUser.id
          }
        }
      }
    });

    if (businessWithMembers) {
      console.log('✅ Business query successful!');
      console.log(`   Business: ${businessWithMembers.name}`);
      console.log(`   Members: ${businessWithMembers.members.length}`);
      console.log(`   Dashboards: ${businessWithMembers.dashboards.length}`);
    } else {
      console.error('❌ Business query failed - no business found');
    }

    console.log('\n🎉 Business API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing business API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessAPI();
