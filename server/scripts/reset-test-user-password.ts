import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetTestUserPassword() {
  try {
    console.log('🔧 Resetting test user password...');

    // Reset test@example.com password
    const newPassword = 'test123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email: 'test@example.com' },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log('✅ Test user password reset successfully!');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  New Password: ${newPassword}`);
    console.log('\n🔐 Login credentials:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Password: ${newPassword}`);
    console.log('\n🌐 Access admin portal:');
    console.log(`  URL: http://localhost:3000/admin-portal`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestUserPassword(); 