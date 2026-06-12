import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const PRISMA_CLIENT_VERSION = "shelf-analysis-v3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: string | undefined;
  pgPool: Pool | undefined;
};

function isPostgresUrl(databaseUrl: string | undefined): boolean {
  return (
    databaseUrl?.startsWith("postgres://") === true ||
    databaseUrl?.startsWith("postgresql://") === true
  );
}

function resolveSqliteDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL;
  const defaultPath = path.join(process.cwd(), "dev.db");

  if (!configuredUrl?.startsWith("file:")) {
    return `file:${defaultPath}`;
  }

  const rawPath = configuredUrl.slice("file:".length);
  const absolutePath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);

  return `file:${absolutePath}`;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (isPostgresUrl(databaseUrl)) {
    const pool =
      globalForPrisma.pgPool ?? new Pool({ connectionString: databaseUrl });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.pgPool = pool;
    }

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  const sqliteUrl = resolveSqliteDatabaseUrl();
  const adapter = new PrismaBetterSqlite3({ url: sqliteUrl });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function hasShelfAnalysisDelegate(
  client: PrismaClient | undefined,
): client is PrismaClient {
  return Boolean(
    client &&
      "shelfAnalysis" in client &&
      typeof client.shelfAnalysis?.findMany === "function",
  );
}

function getPrismaClient(): PrismaClient {
  const cachedClient = globalForPrisma.prisma;
  const cachedVersion = globalForPrisma.prismaClientVersion;

  if (
    hasShelfAnalysisDelegate(cachedClient) &&
    cachedVersion === PRISMA_CLIENT_VERSION
  ) {
    return cachedClient;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return client;
}

export const prisma = getPrismaClient();
