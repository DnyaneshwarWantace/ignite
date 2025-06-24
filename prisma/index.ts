import { PrismaClient } from "@prisma/client";

// Skip instantiation during build time
const shouldSkipPrisma = process.env.NEXT_PHASE === "phase-production-build";

const prismaClientSingleton = () => {
  if (shouldSkipPrisma) {
    return null;
  }
  
  return new PrismaClient({
    log: ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prisma: PrismaClientSingleton | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
