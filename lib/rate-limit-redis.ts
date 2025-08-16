import type { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server';

// Redis client for rate limiting
let redis: any = null;

async function getRedisClient() {
  if (redis) return redis;
  try {
    const { createClient } = await import('redis');
    if (!process.env.REDIS_URL) return null;
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    return redis;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

function isKvRestEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvRest<T = any>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.KV_REST_API_URL as string;
  const token = process.env.KV_REST_API_TOKEN as string;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`KV REST ${path} failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as unknown as T;
  return (await res.json()) as T;
}

// Minimal KV REST helpers for sorted set and simple counters
async function kvZRemRangeByScore(key: string, min: number, max: number) {
  await kvRest(`/zremrangebyscore/${encodeURIComponent(key)}`, {
    method: 'POST',
    body: JSON.stringify({ min, max }),
  });
}
async function kvZCard(key: string): Promise<number> {
  const data = await kvRest<{ value: number }>(
    `/zcard/${encodeURIComponent(key)}`,
  );
  return data?.value ?? 0;
}
async function kvZAdd(key: string, score: number, member: string) {
  await kvRest(`/zadd/${encodeURIComponent(key)}`, {
    method: 'POST',
    body: JSON.stringify({ score, member }),
  });
}
async function kvExpire(key: string, seconds: number) {
  await kvRest(`/expire/${encodeURIComponent(key)}/${seconds}`, {
    method: 'POST',
  });
}
async function kvZRangeWithScoresFirst(key: string): Promise<number | null> {
  // get first entry with scores; KV REST: /zrange/{key}?start=0&stop=0&withscores=true
  const data = await kvRest<{
    members: Array<{ member: string; score: number }>;
  }>(`/zrange/${encodeURIComponent(key)}?start=0&stop=0&withscores=true`);
  const first = (data as any)?.members?.[0];
  return first ? Number(first.score) : null;
}
async function kvGet(key: string): Promise<number> {
  const data = await kvRest<{ value: string | number | null }>(
    `/get/${encodeURIComponent(key)}`,
  );
  const raw = (data as any)?.value;
  return raw ? Number(raw) : 0;
}
async function kvIncr(key: string): Promise<void> {
  await kvRest(`/incr/${encodeURIComponent(key)}`, { method: 'POST' });
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRedisRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: NextRequest) => {
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async function rateLimit(req: NextRequest) {
    const client = await getRedisClient();

    // If neither KV nor Redis configured, allow
    if (!client && !isKvRestEnabled()) {
      return { success: true, remaining: maxRequests - 1 };
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      if (isKvRestEnabled()) {
        await kvZRemRangeByScore(key, 0, windowStart);
        const currentCount = await kvZCard(key);
        if (currentCount >= maxRequests) {
          const oldestScore = await kvZRangeWithScoresFirst(key);
          const resetTime = (oldestScore ?? now) + windowMs;
          return {
            success: false,
            remaining: 0,
            resetTime,
            retryAfter: Math.ceil((resetTime - now) / 1000),
          };
        }
        await kvZAdd(key, now, now.toString());
        await kvExpire(key, Math.ceil(windowMs / 1000));
        return {
          success: true,
          remaining: maxRequests - currentCount - 1,
          resetTime: now + windowMs,
        };
      }

      // Redis path
      const pipeline = client.multi();
      pipeline.zRemRangeByScore(key, 0, windowStart);
      pipeline.zCard(key);
      pipeline.zAdd(key, { score: now, value: now.toString() });
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      const results = await pipeline.exec();
      const currentCount = Number.parseInt(results[1] as string, 10);

      if (currentCount >= maxRequests) {
        const oldestEntry = await client.zRange(key, 0, 0, {
          WITHSCORES: true,
        });
        const resetTime =
          oldestEntry.length > 0
            ? Number.parseInt(oldestEntry[0].score, 10) + windowMs
            : now + windowMs;
        return {
          success: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        };
      }

      return {
        success: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowMs,
      };
    } catch (error) {
      console.error('Redis/KV rate limiting error:', error);
      return { success: true, remaining: maxRequests - 1 };
    }
  };
}

// User-based rate limiter for authenticated users
export function createUserRateLimiter(config: RateLimitConfig) {
  const baseLimiter = createRedisRateLimiter(config);

  return async function userRateLimit(req: NextRequest, userId?: string) {
    if (!userId) {
      // Fall back to IP-based limiting for unauthenticated users
      return baseLimiter(req);
    }

    // Create a user-specific key
    const userKey = `user:${userId}:${config.windowMs}`;

    // Override the key generator to use user ID
    const userLimiter = createRedisRateLimiter({
      ...config,
      keyGenerator: () => userKey,
    });

    return userLimiter(req);
  };
}

// Daily message limit checker
export async function checkDailyMessageLimit(
  userId: string,
  maxMessagesPerDay: number,
) {
  const client = await getRedisClient();

  if (!client && !isKvRestEnabled()) {
    return { allowed: true, remaining: maxMessagesPerDay - 1 };
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `daily_messages:${userId}:${today}`;

  try {
    if (isKvRestEnabled()) {
      const count = await kvGet(key);
      if (count >= maxMessagesPerDay) {
        return { allowed: false, remaining: 0 };
      }
      await kvIncr(key);
      await kvExpire(key, 24 * 60 * 60);
      return { allowed: true, remaining: maxMessagesPerDay - count - 1 };
    }

    const currentCount = await client.get(key);
    const count = currentCount ? Number.parseInt(currentCount, 10) : 0;

    if (count >= maxMessagesPerDay) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    await client.incr(key);
    await client.expire(key, 24 * 60 * 60); // Expire in 24 hours

    return { allowed: true, remaining: maxMessagesPerDay - count - 1 };
  } catch (error) {
    console.error('Daily message limit check error:', error);
    return { allowed: true, remaining: maxMessagesPerDay - 1 };
  }
}

// Pre-configured rate limiters
export const authRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `auth:${ip}:${userAgent}`;
  },
});

export const chatRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // Reduced for better protection
});

export const uploadRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // Reduced for upload protection
});

export const apiRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// Subscription tier-based rate limiters
export function createTierBasedRateLimiter() {
  return async function tierRateLimit(
    req: NextRequest,
    userId?: string,
    tier?: string,
  ) {
    const limits = {
      free_trial: { windowMs: 60 * 1000, maxRequests: 20 },
      individual: { windowMs: 60 * 1000, maxRequests: 50 },
      team: { windowMs: 60 * 1000, maxRequests: 100 },
    };

    const config = limits[tier as keyof typeof limits] || limits.free_trial;
    const limiter = createUserRateLimiter(config);

    return limiter(req, userId);
  };
}
