import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUserToAdmin(email: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`Found user: ${user.email} (${user.name}) - Current role: ${user.role}`);

    if (user.role === 'ADMIN') {
      console.log('ℹ️  User is already an admin');
      return;
    }

    // Promote user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log('✅ User promoted to admin successfully!');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  New Role: ${updatedUser.role}`);
    console.log('\n🔐 User can now access admin portal:');
    console.log(`  URL: http://localhost:3000/admin-portal`);

  } catch (error) {
    console.error('❌ Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/promote-user-to-admin.ts <email>');
  console.log('Example: npx tsx scripts/promote-user-to-admin.ts test@example.com');
  process.exit(1);
}

promoteUserToAdmin(email); 