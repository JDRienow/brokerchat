import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl } from '@/lib/stripe';
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

    // Only team admins can manage subscription when part of a team
    if (broker.team_id && !broker.is_team_admin) {
      return NextResponse.json(
        { error: 'Only team admins can manage the team subscription' },
        { status: 403 },
      );
    }

    // Check if user has an active subscription
    if (!broker.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      );
    }

    const appUrl = getAppUrl();

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: broker.stripe_customer_id || '',
      return_url: `${appUrl}/dashboard?plan_updated=true`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe customer portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 },
    );
  }
}
