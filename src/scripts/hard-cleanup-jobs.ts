import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { parserQueue } from '../lib/queue';

async function hardCleanup() {
    logger.info('🧹 Starting Hard Cleanup of "Unknown" Job Data...');
    
    try {
        // 1. Find all active jobs with "Unknown" in basic fields
        const badJobs = await (prisma as any).jobPosting.findMany({
            where: {
                OR: [
                    { title: 'Unknown Role' },
                    { company: 'Unknown Company' },
                    { title: { contains: 'Unknown', mode: 'insensitive' } },
                    { company: { contains: 'Unknown', mode: 'insensitive' } }
                ],
                isActive: true
            }
        });

        logger.info(`🧹 Found ${badJobs.length} jobs with "Unknown" placeholders.`);

        if (badJobs.length === 0) {
            logger.info('✨ No "Unknown" jobs found. Cleanup complete.');
            return;
        }

        // 2. Decide: Delete or Re-parse
        // Jobs with no description are useless, delete them.
        // Jobs with description but unknown title can be re-parsed once.
        let deletedCount = 0;
        let requeuedCount = 0;

        for (const job of badJobs) {
            if (!job.description || job.description.length < 200) {
                await (prisma as any).jobPosting.delete({ where: { id: job.id } });
                deletedCount++;
            } else {
                // Re-queue for parsing with the new enhanced parser
                await parserQueue.add('parse-job', { jobId: job.id });
                requeuedCount++;
            }
        }

        logger.info(`✅ Hard Cleanup Finished: Deleted ${deletedCount}, Re-queued ${requeuedCount} for AI parsing.`);
    } catch (err) {
        logger.error('❌ Hard Cleanup Failed', err);
    } finally {
        process.exit(0);
    }
}

hardCleanup();
