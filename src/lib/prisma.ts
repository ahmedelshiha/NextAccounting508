import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || "";

if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

function createClient(url: string) {
  return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
}

// Export a real Prisma client if DB URL present; otherwise export a safe proxy that throws on use
const prisma: PrismaClient = (() => {
  if (typeof global !== "undefined" && global.__prisma__) return global.__prisma__;

  const client = dbUrl
    ? createClient(dbUrl)
    : (new Proxy(
        {},
        {
          get() {
            throw new Error(
              "Database is not configured. Set NETLIFY_DATABASE_URL to enable DB features."
            );
          },
        }
      ) as unknown as PrismaClient);

  if (process.env.NODE_ENV !== "production") {
    global.__prisma__ = client;
  }

  return client;
})();

export default prisma;
