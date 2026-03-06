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
                const caPath = path.resolve(process.cwd(), 'ca.pem');
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
        ssl: sslOptions
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as unknown as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
