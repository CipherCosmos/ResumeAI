import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/resumebuilder';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // Supabase PgBouncer handles SSL natively — no manual CA cert needed
    const pool = new pg.Pool({
        connectionString,
        max: 15,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
    });

    pool.on('error', (err) => {
        console.error('Unexpected error on idle client in Prisma pg.Pool:', err);
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as unknown as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
