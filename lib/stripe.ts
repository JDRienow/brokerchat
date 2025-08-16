import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Client-side Stripe configuration
export const getStripe = () => {
  if (typeof window === 'undefined') return null;

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Missing STRIPE_PUBLISHABLE_KEY');
  }

  return new (window as any).Stripe(publishableKey);
};

// Helper function to get the correct webhook secret based on environment
export const getWebhookSecret = () => {
  return process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_WEBHOOK_SECRET_PROD
    : process.env.STRIPE_WEBHOOK_SECRET_DEV;
};

// Helper function to get app URL based on environment
export const getAppUrl = () => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://om2chat.com'
      : 'http://localhost:3000')
  );
};

// Stripe price IDs
export const STRIPE_PRICE_IDS = {
  INDIVIDUAL: process.env.STRIPE_INDIVIDUAL_PRICE_ID || '',
  TEAM: process.env.STRIPE_TEAM_PRICE_ID || '',
} as const;

// Plan types
export type PlanType = 'individual' | 'team' | 'enterprise';

// Plan configurations
export const PLANS = {
  individual: {
    name: 'Individual',
    price: 25,
    documentLimit: 25,
    features: ['Basic AI chat', 'Client sharing links', 'Email support'],
  },
  team: {
    name: 'Team',
    price: 75,
    documentLimit: 200,
    features: [
      'Advanced AI chat',
      'Branded client links',
      'Analytics dashboard',
      'Priority support',
      'Team collaboration',
      'API access',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    documentLimit: -1, // Unlimited
    features: [
      'Custom AI training',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'On-premise option',
    ],
  },
} as const;
