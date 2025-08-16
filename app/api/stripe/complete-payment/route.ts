import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';
import { getBrokerById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the broker's current subscription tier
    const broker = await getBrokerById(session.user.id);

    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (broker.subscription_status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment not required' },
        { status: 400 },
      );
    }

    const plan = broker.subscription_tier || 'individual';

    if (!['individual', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "individual" or "team"' },
        { status: 400 },
      );
    }

    const priceId =
      plan === 'individual'
        ? STRIPE_PRICE_IDS.INDIVIDUAL
        : STRIPE_PRICE_IDS.TEAM;
    const appUrl = getAppUrl();

    // Create checkout session for existing account
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
          user_id: broker.id,
          pre_checkout: 'true',
        },
      },
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${appUrl}/payment-required?checkout_cancelled=true`,
      metadata: {
        user_id: broker.id,
        plan_type: plan,
        pre_checkout: 'true',
      },
      allow_promotion_codes: true,
      customer_email: broker.email, // Pre-fill email for existing user
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe complete payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
