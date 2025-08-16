import type { UserType } from '@/app/(auth)/auth';

// Rate limiting configuration for different user types and subscription tiers
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  description: string;
}

export interface TierRateLimits {
  chat: RateLimitConfig;
  upload: RateLimitConfig;
  api: RateLimitConfig;
  dailyMessages: number;
}

// Rate limits by subscription tier
export const tierRateLimits: Record<string, TierRateLimits> = {
  // Free trial users
  free_trial: {
    chat: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      description: '20 chat messages per minute',
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3,
      description: '3 uploads per minute',
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      description: '50 API requests per minute',
    },
    dailyMessages: 50,
  },

  // Individual plan
  individual: {
    chat: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      description: '50 chat messages per minute',
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      description: '10 uploads per minute',
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      description: '100 API requests per minute',
    },
    dailyMessages: 200,
  },

  // Team plan
  team: {
    chat: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      description: '100 chat messages per minute',
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      description: '20 uploads per minute',
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200,
      description: '200 API requests per minute',
    },
    dailyMessages: 500,
  },

  // Enterprise plan
  enterprise: {
    chat: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200,
      description: '200 chat messages per minute',
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      description: '50 uploads per minute',
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 500,
      description: '500 API requests per minute',
    },
    dailyMessages: 1000,
  },
};

// Default limits for unauthenticated users (broker clients)
export const guestRateLimits: TierRateLimits = {
  chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    description: '20 chat messages per minute',
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1,
    description: '1 upload per minute',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    description: '30 API requests per minute',
  },
  dailyMessages: 50,
};

// Authentication rate limits (same for all users)
export const authRateLimits: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  description: '5 authentication attempts per 15 minutes',
};

// Get rate limits for a specific tier
export function getRateLimitsForTier(tier?: string): TierRateLimits {
  if (!tier || !tierRateLimits[tier]) {
    return tierRateLimits.free_trial; // Default to free trial limits
  }
  return tierRateLimits[tier];
}

// Get rate limits for a user type
export function getRateLimitsForUserType(
  userType?: UserType,
  tier?: string,
): TierRateLimits {
  if (userType === undefined) {
    // Unauthenticated users are broker clients accessing via public links
    return guestRateLimits;
  }

  return getRateLimitsForTier(tier);
}

// Rate limiting error messages
export const rateLimitMessages = {
  chat: {
    title: 'Rate Limit Exceeded',
    message:
      'You have exceeded the maximum number of chat messages. Please wait a moment before sending another message.',
  },
  upload: {
    title: 'Upload Limit Exceeded',
    message:
      'You have exceeded the maximum number of uploads. Please wait a moment before uploading another file.',
  },
  daily: {
    title: 'Daily Limit Reached',
    message:
      'You have reached your daily message limit. Please upgrade your plan or try again tomorrow.',
  },
  auth: {
    title: 'Too Many Login Attempts',
    message:
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
};

// Rate limiting headers
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime?: number,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  };

  if (resetTime) {
    headers['X-RateLimit-Reset'] = resetTime.toString();
  }

  return headers;
}
