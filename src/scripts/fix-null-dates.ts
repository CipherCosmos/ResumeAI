import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

async function fixNullDates() {
    logger.info('Starting job visibility cleanup: fixing null postedAt dates...');

    try {
        const nullDateJobs = await (prisma as any).jobPosting.findMany({
            where: {
                postedAt: null
            }
        });

        logger.info(`Found ${nullDateJobs.length} jobs with missing postedAt.`);

        let updatedCount = 0;
        for (const job of nullDateJobs) {
            await (prisma as any).jobPosting.update({
                where: { id: job.id },
                data: {
                    postedAt: job.firstSeen || new Date()
                }
            });
            updatedCount++;
        }

        logger.info(`Successfully updated ${updatedCount} jobs.`);
    } catch (err) {
        logger.error('Failed to fix null dates:', err);
    } finally {
        process.exit(0);
    }
}

fixNullDates();
