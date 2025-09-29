const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Use production database URL
const DATABASE_URL = "postgresql://vssyl_user:ThJhZWJiKPFa1AWPUNgxI61v1/zo810j348ncouT3w0=@/vssyl_production?host=/cloudsql/vssyl-472202:us-central1:vssyl-db";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL + '?connection_limit=1&pool_timeout=20&connect_timeout=60'
    }
  }
});

async function createProductionTestUser() {
  try {
    console.log('🔧 Creating production test user...');
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id);
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', existingUser.name);
      console.log('🔑 Role:', existingUser.role);
      return existingUser.id;
    }

    // Hash the password properly
    const hashedPassword = await bcrypt.hash('test123', 12);
    console.log('🔐 Password hashed successfully');

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date()
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('🆔 ID:', testUser.id);
    console.log('📧 Email:', testUser.email);
    console.log('👤 Name:', testUser.name);
    console.log('🔑 Role:', testUser.role);
    console.log('🔐 Password: test123');
    
    return testUser.id;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProductionTestUser();
