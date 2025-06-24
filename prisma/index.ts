import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  try {
    return new PrismaClient({
      log: ["error"],
    });
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw error;
  }
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
