const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  logger.info(`Created admin user: ${admin.email}`);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  logger.info(`Created regular user: ${user.email}`);

  // Add more seed data here as needed

  logger.info('Database seed completed successfully!');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
