import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');

    // Get all users
    const users = await prisma.user.findMany();
    console.log('Users in database:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));

    // Check files for each user
    for (const user of users) {
      console.log(`\n📁 Checking files for user: ${user.email} (${user.id})`);
      
      const files = await prisma.file.findMany({
        where: { userId: user.id },
        include: { folder: true },
      });
      
      console.log(`Files found: ${files.length}`);
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.type}) ${file.folder ? `in folder: ${file.folder.name}` : '(root)'}`);
      });

      console.log(`\n📂 Checking folders for user: ${user.email}`);
      const folders = await prisma.folder.findMany({
        where: { userId: user.id },
        include: { parent: true },
      });
      
      console.log(`Folders found: ${folders.length}`);
      folders.forEach(folder => {
        console.log(`  - ${folder.name} ${folder.parent ? `(parent: ${folder.parent.name})` : '(root)'}`);
      });
    }

    // Test the exact search query that's failing
    const testUserId = 'b17312b5-dffd-4571-b53b-a629352853d9';
    console.log(`\n🔍 Testing search query for user: ${testUserId}`);
    
    // Test file search
    const testFiles = await prisma.file.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: 'drive', mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { userId: testUserId },
              { permissions: { some: { userId: testUserId, canRead: true } } },
            ],
          },
          { trashedAt: null },
        ],
      },
      include: {
        folder: true,
      },
      take: 10,
    });

    console.log(`Files matching 'drive' query: ${testFiles.length}`);
    testFiles.forEach(file => {
      console.log(`  - ${file.name} (${file.type})`);
    });

    // Test folder search
    const testFolders = await prisma.folder.findMany({
      where: {
        AND: [
          { name: { contains: 'drive', mode: 'insensitive' } },
          { userId: testUserId },
          { trashedAt: null },
        ],
      },
      take: 5,
    });

    console.log(`Folders matching 'drive' query: ${testFolders.length}`);
    testFolders.forEach(folder => {
      console.log(`  - ${folder.name}`);
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 