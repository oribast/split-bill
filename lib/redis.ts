import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getFailedAttempts(ip: string, roomId: string): Promise<number> {
  const val = await redis.get<number>(`auth_fail:${ip}:${roomId}`);
  return val ?? 0;
}

export async function incrementFailedAttempts(ip: string, roomId: string): Promise<number> {
  const key = `auth_fail:${ip}:${roomId}`;
  const val = await redis.incr(key);
  if (val === 1) await redis.expire(key, 300);
  return val;
}

export async function resetFailedAttempts(ip: string, roomId: string): Promise<void> {
  await redis.del(`auth_fail:${ip}:${roomId}`);
}
