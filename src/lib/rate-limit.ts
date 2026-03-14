import { redis } from './redis';

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
    const redisKey = `ratelimit:${key}`;
    const current = await redis.get(redisKey);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
        return { success: false, limit, current: count };
    }

    // Since our mock redis doesn't have INCR, we do it manually
    // In production with real Redis, use INCR and EXPIRE atomically
    await redis.set(redisKey, (count + 1).toString(), { ex: windowSeconds });

    return { success: true, limit, current: count + 1 };
}
