import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';
import { getBrokerById, updateBrokerSubscription } from '@/lib/db/queries';

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

    // If it's the same plan, return early
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 },
      );
    }

    // Update the subscription directly
    const updatedSubscription = await stripe.subscriptions.update(
      broker.stripe_subscription_id,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          plan_type: plan,
          user_id: authSession.user.id,
        },
      },
    );

    // Ensure the subscription is active
    if (updatedSubscription.status !== 'active') {
      throw new Error(
        `Subscription update failed. Status: ${updatedSubscription.status}`,
      );
    }

    // Update the broker's subscription in our database
    const updateResult = await updateBrokerSubscription({
      brokerId: broker.id,
      stripeSubscriptionId: updatedSubscription.id,
      subscriptionStatus:
        updatedSubscription.status === 'active' ? 'active' : 'pending',
      currentPlan: plan,
    });

    console.log('Subscription update result:', {
      brokerId: broker.id,
      oldPlan: broker.subscription_tier,
      newPlan: plan,
      updateResult,
      subscriptionStatus: updatedSubscription.status,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated to ${plan} plan`,
      subscription: updatedSubscription,
      oldPlan: broker.subscription_tier,
      newPlan: plan,
    });
  } catch (error) {
    console.error('Stripe subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 },
    );
  }
}
