import { Redis } from "@upstash/redis";

// Only initialize Redis if env vars are set (skip during build)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function rateLimit(
  key: string,
  limit = 10,
  windowSeconds = 60
): Promise<boolean> {
  // If Redis not configured, allow all requests
  if (!redis) return true;

  const nowBucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `rl:${key}:${nowBucket}`;

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  return count <= limit;
}
