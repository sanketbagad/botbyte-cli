import "dotenv/config";

let prisma: any = null;

async function initializePrisma() {
  if (prisma) return prisma;
  
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  
  const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> };
  
  function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL!;
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }
  
  prisma = globalForPrisma.prisma || createPrismaClient();
  
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  
  return prisma;
}

export default await initializePrisma();
