import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// In-memory store for rate limiting (in production, consider using Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: NextRequest) => {
      // Default key generator uses IP address
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return function rateLimit(req: NextRequest) {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get current rate limit data
    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true, remaining: maxRequests - 1 };
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    // Increment count
    current.count++;
    rateLimitStore.set(key, current);

    return {
      success: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    };
  };
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req: NextRequest) => {
    // Use IP + user agent for auth endpoints
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `auth:${ip}:${userAgent}`;
  },
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
});

export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 chat messages per minute (increased for better UX)
});

// Clean up old entries periodically (every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

// Helper function to create rate-limited API handler
export function withRateLimit(
  rateLimiter: ReturnType<typeof createRateLimiter>,
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async function rateLimitedHandler(req: NextRequest) {
    const result = rateLimiter(req);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime?.toString() || '',
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req);

    if (response) {
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set(
        'X-RateLimit-Remaining',
        result.remaining?.toString() || '0',
      );
      response.headers.set(
        'X-RateLimit-Reset',
        result.resetTime?.toString() || '',
      );
    }

    return response;
  };
}
