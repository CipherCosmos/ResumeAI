import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });

// Reusing existing ioredis connection
const queueSettings = { connection: redisClient as any };

export const crawlerQueue = new Queue('crawler-queue', queueSettings);
export const parserQueue = new Queue('parser-queue', queueSettings);
export const embeddingQueue = new Queue('embedding-queue', queueSettings);
export const matchQueue = new Queue('match-queue', queueSettings);
export const analyticsQueue = new Queue('analytics-queue', queueSettings);

// Helper for exporting strongly typed workers 
export function createWorker(queueName: string, processor: any, concurrency = 1) {
    return new Worker(queueName, processor, { connection: redisClient as any, concurrency });
}

// Queue Events for unified logging
export function createQueueEvents(queueName: string) {
    return new QueueEvents(queueName, { connection: redisClient as any });
}
