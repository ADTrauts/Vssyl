import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetTestUserPassword() {
  try {
    console.log('🔧 Resetting primary local tester password...');

    // Same account as seedPlaceDemoData + seed-test-data (place.tester@vssyl.local)
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email: 'place.tester@vssyl.local' },
      data: { password: hashedPassword, role: 'ADMIN' },
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
    console.log('\n🌐 Local app:');
    console.log(`  URL: http://localhost:3000`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestUserPassword(); 