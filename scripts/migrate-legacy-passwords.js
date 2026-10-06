import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be configured');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function migrateLegacyPasswords() {
  let cursor;
  let migrated = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        password: { not: null },
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: 100,
      select: { id: true, password: true },
    });
    if (users.length === 0) break;

    for (const user of users) {
      cursor = user.id;
      if (typeof user.password !== 'string' || isBcryptHash(user.password)) {
        continue;
      }

      const hash = await bcrypt.hash(user.password, 10);
      const update = await prisma.user.updateMany({
        where: { id: user.id, password: user.password },
        data: { password: hash },
      });
      migrated += update.count;
    }
  }

  console.log(`Hashed ${migrated} legacy password(s).`);
}

try {
  await prisma.$connect();
  await migrateLegacyPasswords();
} finally {
  await prisma.$disconnect();
}
