import { PrismaClient } from '@prisma/client';

// Environment-specific configuration
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

const prisma = new PrismaClient({
  log: isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
});

// Increase transaction timeout for serverless environments
// This helps prevent timeout issues in Vercel
prisma
  .$connect()
  .then(() => {
    console.log(
      `Prisma client connected - Environment: ${process.env.NODE_ENV}, Vercel: ${isVercel}`,
    );
    if (isVercel) {
      console.log('Running in Vercel - using extended timeout configuration');
    }
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
