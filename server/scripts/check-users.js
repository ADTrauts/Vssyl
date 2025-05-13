import { prisma } from '../utils/prisma.js';

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    console.log(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      password: u.password.substring(0, 10) + '...' // Show part of the hashed password
    })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 