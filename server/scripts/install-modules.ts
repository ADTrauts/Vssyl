import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function installModules() {
  console.log('🔧 Installing modules for current user...');

  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    // Get some modules to install
    const modules = await prisma.module.findMany({
      take: 3
    });

    if (modules.length === 0) {
      console.log('❌ No modules found. Please seed modules first.');
      return;
    }

    // Install modules for the user
    for (const module of modules) {
      const existingInstallation = await prisma.moduleInstallation.findUnique({
        where: {
          moduleId_userId: {
            moduleId: module.id,
            userId: user.id
          }
        }
      });

      if (!existingInstallation) {
        await prisma.moduleInstallation.create({
          data: {
            moduleId: module.id,
            userId: user.id,
            enabled: true,
            configured: {
              // Default configuration
              enabled: true,
              settings: {}
            }
          }
        });
        console.log(`✅ Installed module: ${module.name}`);
      } else {
        console.log(`⏭️  Module already installed: ${module.name}`);
      }
    }

    console.log('🎉 Module installation completed!');
  } catch (error) {
    console.error('❌ Error installing modules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

installModules(); 