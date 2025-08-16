import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl, STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { plan, email, userId } = await request.json();

    if (!plan || !['individual', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "individual" or "team"' },
        { status: 400 },
      );
    }

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 },
      );
    }

    const priceId =
      plan === 'individual'
        ? STRIPE_PRICE_IDS.INDIVIDUAL
        : STRIPE_PRICE_IDS.TEAM;
    const appUrl = getAppUrl();

    // Create checkout session for pre-created account
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan_type: plan,
          user_id: userId,
          pre_checkout: 'true',
        },
      },
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${appUrl}/dashboard?checkout_cancelled=true`,
      metadata: {
        user_id: userId,
        plan_type: plan,
        pre_checkout: 'true',
      },
      allow_promotion_codes: true,
      // Pre-fill email for existing user
      customer_email: email,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe pre-checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
