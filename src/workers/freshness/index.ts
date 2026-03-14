import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function checkJobFreshness() {
    logger.info('FreshnessWorker: Starting job freshness check...');
    
    // Find jobs that haven't been seen in > 48 hours but are still marked active
    const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const staleJobs = await (prisma as any).jobPosting.findMany({
        where: {
            isActive: true,
            lastSeen: { lt: staleThreshold },
        },
        take: 100, // Batch check
    });

    logger.info(`FreshnessWorker: Found ${staleJobs.length} stale jobs to verify.`);

    for (const job of staleJobs) {
        try {
            if (!job.sourceUrl) continue;

            const response = await fetch(job.sourceUrl, { method: 'GET', redirect: 'follow' });
            
            if (response.status === 404 || response.status === 410) {
                logger.info(`FreshnessWorker: Marking job ${job.id} as INACTIVE (Status ${response.status})`);
                await (prisma as any).jobPosting.update({
                    where: { id: job.id },
                    data: { isActive: false, updatedAt: new Date() }
                });
            } else if (response.ok) {
                const text = await response.text();
                const lowerText = text.toLowerCase();
                const closedMarkers = [
                    'no longer accepting applications',
                    'this job is closed',
                    'this position has been filled',
                    'job is no longer available',
                    'vacancy is closed',
                    'not accepting new applicants',
                    'this posting has expired'
                ];

                const isClosed = closedMarkers.some(marker => lowerText.includes(marker));

                if (isClosed) {
                    logger.info(`FreshnessWorker: Marking job ${job.id} as INACTIVE (Content-based detection)`);
                    await (prisma as any).jobPosting.update({
                        where: { id: job.id },
                        data: { isActive: false, updatedAt: new Date() }
                    });
                } else {
                    // If still alive and open, update lastSeen so it's not checked again immediately
                    await (prisma as any).jobPosting.update({
                        where: { id: job.id },
                        data: { lastSeen: new Date(), updatedAt: new Date() }
                    });
                }
            }
        } catch (err: any) {
            logger.warn(`FreshnessWorker: Could not verify job ${job.id}`, err);
        }
    }

    logger.info('FreshnessWorker: Freshness check cycle complete.');
}
