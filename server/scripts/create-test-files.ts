import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestFiles() {
  try {
    console.log('🔧 Creating test files and folders...');

    // Get all users
    const users = await prisma.user.findMany();
    console.log('Found users:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));

    if (users.length === 0) {
      console.log('No users found, creating a test user...');
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test User',
        },
      });
      users.push(user);
    }

    // Create test data for each user
    for (const user of users) {
      console.log(`Creating test data for user: ${user.email}`);

      // Create a test folder
      const testFolder = await prisma.folder.create({
        data: {
          name: 'Test Documents',
          userId: user.id,
        },
      });

      console.log('Created folder:', testFolder.name);

      // Create some test files
      const testFiles = await Promise.all([
        prisma.file.create({
          data: {
            name: 'document.txt',
            type: 'text/plain',
            size: 1024,
            url: '/uploads/test-document.txt',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
        prisma.file.create({
          data: {
            name: 'presentation.pptx',
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 2048,
            url: '/uploads/test-presentation.pptx',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
        prisma.file.create({
          data: {
            name: 'spreadsheet.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 3072,
            url: '/uploads/test-spreadsheet.xlsx',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
        prisma.file.create({
          data: {
            name: 'image.jpg',
            type: 'image/jpeg',
            size: 4096,
            url: '/uploads/test-image.jpg',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
        // Add files that would match "drive" search
        prisma.file.create({
          data: {
            name: 'drive-settings.json',
            type: 'application/json',
            size: 512,
            url: '/uploads/drive-settings.json',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
        prisma.file.create({
          data: {
            name: 'my-drive-folder',
            type: 'folder',
            size: 0,
            url: '/uploads/my-drive-folder',
            userId: user.id,
            folderId: testFolder.id,
          },
        }),
      ]);

      console.log('Created files:', testFiles.map(f => f.name));

      // Create a root-level file
      const rootFile = await prisma.file.create({
        data: {
          name: 'README.md',
          type: 'text/markdown',
          size: 512,
          url: '/uploads/README.md',
          userId: user.id,
          // No folderId = root level
        },
      });

      console.log('Created root file:', rootFile.name);

      // Create another folder
      const anotherFolder = await prisma.folder.create({
        data: {
          name: 'Work Projects',
          userId: user.id,
        },
      });

      console.log('Created another folder:', anotherFolder.name);

      // Create a file in the second folder
      const workFile = await prisma.file.create({
        data: {
          name: 'project-plan.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1536,
          url: '/uploads/project-plan.docx',
          userId: user.id,
          folderId: anotherFolder.id,
        },
      });

      console.log('Created work file:', workFile.name);

      // Create a folder that would match "drive" search
      const driveFolder = await prisma.folder.create({
        data: {
          name: 'Google Drive Backup',
          userId: user.id,
        },
      });

      console.log('Created drive folder:', driveFolder.name);

      // Create a file in the drive folder
      const driveFile = await prisma.file.create({
        data: {
          name: 'drive-export.csv',
          type: 'text/csv',
          size: 256,
          url: '/uploads/drive-export.csv',
          userId: user.id,
          folderId: driveFolder.id,
        },
      });

      console.log('Created drive file:', driveFile.name);
    }

    console.log('✅ Test data created successfully for all users!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestFiles(); 