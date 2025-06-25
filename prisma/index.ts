import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const connectionString = process.env.POSTGRES_PRISMA_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  
  prisma = new PrismaClient({
    adapter,
    log: ['error'],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

export default prisma;
