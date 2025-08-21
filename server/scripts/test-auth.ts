import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@blockonblock.com' },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`Found admin user: ${adminUser.email} (${adminUser.name}) - ${adminUser.role}`);

    // Create a test token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment');
      return;
    }

    const token = jwt.sign(
      {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        userNumber: 'ADMIN001',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      },
      JWT_SECRET
    );

    console.log('✅ Test token created successfully!');
    console.log(`Token: ${token}`);
    console.log('\n🔐 Test the admin API with this token:');
    console.log(`curl -X GET http://localhost:3001/api/admin-portal/test -H "Authorization: Bearer ${token}"`);
    
  } catch (error) {
    console.error('❌ Error testing auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 