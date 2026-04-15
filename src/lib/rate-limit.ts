import { redis } from './redis';

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
    const redisKey = `ratelimit:${key}`;
    const current = await redis.get<number>(redisKey);
    const count = current ?? 0;

    if (count >= limit) {
        return { success: false, limit, current: count };
    }

    // Use Upstash Redis INCR for atomic increment
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSeconds);
    await pipeline.exec();

    return { success: true, limit, current: count + 1 };
}
