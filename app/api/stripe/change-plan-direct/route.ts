import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';
import { getBrokerById, updateBrokerSubscription } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !['individual', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "individual" or "team"' },
        { status: 400 },
      );
    }

    const broker = await getBrokerById(session.user.id);
    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If there is an existing subscription, cancel immediately (no proration)
    if (broker.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(broker.stripe_subscription_id, {
          invoice_now: false,
          prorate: false,
        });
      } catch (e) {
        // If cancel fails, continue to create a new one to avoid blocking UX
        console.error('Failed to cancel existing subscription:', e);
      }

      // Mark as pending until new subscription is created
      await updateBrokerSubscription({
        brokerId: broker.id,
        subscriptionStatus: 'pending',
      });
    }

    const priceId =
      plan === 'individual'
        ? STRIPE_PRICE_IDS.INDIVIDUAL
        : STRIPE_PRICE_IDS.TEAM;
    const appUrl = getAppUrl();

    // Create a brand-new subscription via Checkout, billing starts now
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          plan_type: plan,
          user_id: broker.id,
          pre_checkout: 'true',
        },
        proration_behavior: 'none',
      },
      success_url: `${appUrl}/dashboard?plan_updated=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?plan_update_cancelled=true`,
      metadata: { user_id: broker.id, plan_type: plan, pre_checkout: 'true' },
      allow_promotion_codes: true,
      customer_email: broker.email,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe change-plan-direct error:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 },
    );
  }
}
