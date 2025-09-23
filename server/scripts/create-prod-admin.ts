import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    console.log('🚀 Creating admin user in production database...');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'Andrew.Trautman@Vssyl.con' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (existingUser) {
      console.log(`Found existing user: ${existingUser.email} (${existingUser.name}) - Current role: ${existingUser.role}`);
      
      if (existingUser.role === 'ADMIN') {
        console.log('✅ User is already an admin!');
        console.log('\n🔐 You can access the admin portal at:');
        console.log('  Production: https://vssyl.com/admin-portal');
        return;
      } else {
        console.log('🔄 Promoting existing user to admin...');
        const updatedUser = await prisma.user.update({
          where: { email: 'Andrew.Trautman@Vssyl.con' },
          data: { role: 'ADMIN' },
          select: { id: true, email: true, name: true, role: true }
        });
        console.log('✅ User promoted to admin successfully!');
        console.log(`  Email: ${updatedUser.email}`);
        console.log(`  Name: ${updatedUser.name}`);
        console.log(`  New Role: ${updatedUser.role}`);
      }
    } else {
      console.log('📝 Creating new admin user in production...');
      
      // Create a secure password
      const password = 'VssylAdmin2025!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'Andrew.Trautman@Vssyl.con',
          password: hashedPassword,
          name: 'Andrew Trautman',
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });

      console.log('✅ Production admin user created successfully!');
      console.log(`  Email: ${newUser.email}`);
      console.log(`  Name: ${newUser.name}`);
      console.log(`  Role: ${newUser.role}`);
      console.log(`  Password: ${password}`);
    }

    console.log('\n🔐 Production Admin Portal Access:');
    console.log('  URL: https://vssyl.com/admin-portal');
    console.log('  Email: Andrew.Trautman@Vssyl.con');
    if (!existingUser) {
      console.log('  Password: VssylAdmin2025!');
      console.log('\n⚠️  Please change your password after first login for security!');
    }

    // Also show current admin users
    console.log('\n📊 Current admin users in production:');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true, role: true }
    });
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error creating/promoting admin user in production:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createProductionAdmin();
}

export { createProductionAdmin };
