import "dotenv/config";
import { default as PrismaClientModule } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const PrismaClient = PrismaClientModule.PrismaClient || PrismaClientModule;
const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

let prisma: InstanceType<typeof PrismaClient>;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
