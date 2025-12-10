import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@infrafix.local';
  const userEmail = 'user@infrafix.local';
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: 'Admin', email: adminEmail, password: adminPass, role: 'ADMIN' }
  });

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { name: 'Sample User', email: userEmail, password: userPass, role: 'USER' }
  });

  await prisma.report.create({
    data: {
      title: 'Pothole near Market Road',
      description: 'Large pothole causing traffic and potential accidents. Needs urgent repair.',
      category: 'Road',
      latitude: 19.9975,
      longitude: 73.7898,
      address: 'Market Rd, Nashik',
      userId: user.id,
      images: {
        create: [
          { url: 'https://example.com/pothole1.jpg' },
          { url: 'https://example.com/pothole2.jpg' }
        ]
      }
    }
  });

  await prisma.report.create({
    data: {
      title: 'Broken Streetlight in Sector 12',
      description: 'Streetlight not working for the past week. Area is very dark at night.',
      category: 'Lighting',
      latitude: 19.9822,
      longitude: 73.7749,
      address: 'Sector 12, Nashik',
      userId: user.id,
      images: {
        create: [
          { url: 'https://example.com/streetlight1.jpg' }
        ]
      }
    }
  });

  console.log(' Seed complete.');
  console.log('Admin login: admin@infrafix.local / admin123');
  console.log('User login: user@infrafix.local / user123');
}

main().finally(async () => prisma.$disconnect());
