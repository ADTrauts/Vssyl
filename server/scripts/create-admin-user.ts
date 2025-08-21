import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Checking existing users...');

    // Check if any admin users exist
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ${user.role}`);
    });

    // Check all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });

    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ${user.role}`);
    });

    // If no admin users exist, create one
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found. Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@blockonblock.com',
          password: hashedPassword,
          name: 'System Administrator',
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Password: admin123`);
      console.log(`  Role: ${adminUser.role}`);
      console.log('\n🔐 Login credentials for admin portal:');
      console.log(`  URL: http://localhost:3000/admin-portal`);
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Password: admin123`);
    } else {
      console.log('\n✅ Admin users already exist. No action needed.');
      console.log('\n🔐 To access admin portal:');
      console.log(`  URL: http://localhost:3000/admin-portal`);
      console.log(`  Use any of the admin accounts above`);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 