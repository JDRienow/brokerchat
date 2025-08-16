import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';
import { getBrokerById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth();

    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { plan } = await request.json();

    if (!plan || !['individual', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "individual" or "team"' },
        { status: 400 },
      );
    }

    // Get the broker's current subscription
    const broker = await getBrokerById(authSession.user.id);

    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (!broker.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      );
    }

    // Get the current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(
      broker.stripe_subscription_id,
    );

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 },
      );
    }

    // Get the new price ID
    const newPriceId =
      plan === 'individual'
        ? STRIPE_PRICE_IDS.INDIVIDUAL
        : STRIPE_PRICE_IDS.TEAM;

    // Get the current price ID from the subscription
    const currentPriceId = currentSubscription.items.data[0]?.price.id;

    // Note: We allow switching to the same plan in case user wants to update payment method
    // or if there are any billing changes needed

    const appUrl = getAppUrl();

    // Create checkout session for subscription update
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: currentSubscription.customer as string,
      mode: 'subscription',
      line_items: [
        {
          price: newPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan_type: plan,
          user_id: authSession.user.id,
          is_upgrade: 'true',
          current_subscription_id: broker.stripe_subscription_id,
        },
      },
      success_url: `${appUrl}/dashboard?plan_updated=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
      metadata: {
        user_id: authSession.user.id,
        plan_type: plan,
        is_upgrade: 'true',
        current_subscription_id: broker.stripe_subscription_id,
      },
      allow_promotion_codes: true,
      payment_method_collection: 'always',
      payment_method_types: ['card'],
      // These settings help with payment method reuse
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe subscription management error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
