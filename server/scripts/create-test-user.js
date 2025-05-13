import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    // Check if the test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Create a new test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      }
    });

    console.log('Created test user:', { 
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 