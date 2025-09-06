import { PrismaClient } from "@prisma/client";

let dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!dbUrl) {
  throw new Error("❌ DATABASE_URL is not set. Check Netlify environment variables.");
}

if (dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

export default prisma;
