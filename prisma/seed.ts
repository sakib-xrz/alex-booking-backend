import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('Alexande11!', 12);

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'info@alexrodriguez.com.au' },
    update: {},
    create: {
      name: 'Alexander Rodriguez',
      email: 'info@alexrodriguez.com.au',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log(
    'Super Admin - Email: info@alexrodriguez.com.au, Password: Alexande11!',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
