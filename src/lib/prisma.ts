import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/resumebuilder';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    let sslOptions: any = false;

    // The pg module's connection string parser overrides explicit ssl options if sslmode is in the query.
    // We remove it here so our explicit sslOptions take precedence.
    let finalConnectionString = connectionString;
    try {
        const urlArgs = new URL(finalConnectionString);
        urlArgs.searchParams.delete('sslmode');
        finalConnectionString = urlArgs.toString();
    } catch (e) {
        // Ignore URL parsing errors
    }

    if (process.env.NODE_ENV === 'production' || connectionString.includes('aivencloud.com')) {
        try {
            if (process.env.DATABASE_CA_CERT) {
                // If provided via environment variable (useful for Vercel/Netlify)
                // Replace literal \n with actual newlines in case it was stored as a single line
                const caContent = process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n');
                sslOptions = {
                    rejectUnauthorized: true,
                    ca: caContent
                };
            } else {
                // Read the CA cert from disk (useful for local dev or Docker)
                const caPath = path.resolve(process.cwd(), 'prisma', 'ca.pem');
                if (fs.existsSync(caPath)) {
                    sslOptions = {
                        rejectUnauthorized: true,
                        ca: fs.readFileSync(caPath).toString()
                    };
                } else {
                    // Fallback to ignoring unauthorized if cert is missing but required
                    sslOptions = { rejectUnauthorized: false };
                }
            }
        } catch (e) {
            console.error('Error loading CA certificate:', e);
            sslOptions = { rejectUnauthorized: false };
        }
    }

    const pool = new pg.Pool({
        connectionString: finalConnectionString,
        ssl: sslOptions,
        max: 15, // max concurrent connections per client
        connectionTimeoutMillis: 10000, 
        idleTimeoutMillis: 30000, // Reapply idleTimeout to recycle stale connections
        keepAlive: true, // Crucial for cloud databases (Supabase, Aiven, AWS)
        // Set initial delay to 10 seconds for keepAlive pings
        // Need to pass it via options since node-postgres v8 supports it
    });

    // Important: Prevent connection drops from crashing the Node.js process
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client in Prisma pg.Pool:', err);
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as unknown as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
