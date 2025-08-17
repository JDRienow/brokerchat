import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe, getAppUrl } from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';
import { getBrokerById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Stripe not configured. Please contact support.' },
        { status: 500 },
      );
    }

    const authSession = await auth();

    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    console.log('Customer portal request for:', authSession.user.email);

    // Get the broker's current subscription
    const broker = await getBrokerById(authSession.user.id);

    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Broker data:', {
      stripe_subscription_id: broker.stripe_subscription_id,
      stripe_customer_id: broker.stripe_customer_id,
      subscription_status: broker.subscription_status,
    });

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
    console.log(
      'Creating portal session for customer:',
      broker.stripe_customer_id,
    );

    // Verify customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(
        broker.stripe_customer_id || '',
      );
      console.log('Customer verified in Stripe:', customer.id);
    } catch (customerError: any) {
      console.error('Customer not found in Stripe:', customerError);
      return NextResponse.json(
        { error: 'Customer not found in Stripe. Please contact support.' },
        { status: 400 },
      );
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: broker.stripe_customer_id || '',
      return_url: `${appUrl}/dashboard`,
    });

    console.log('Portal session created successfully:', portalSession.url);
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe customer portal error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });

    // Check if it's a configuration error
    if (
      error.code === 'resource_missing' ||
      error.message?.includes('billing portal') ||
      error.message?.includes('Customer portal')
    ) {
      return NextResponse.json(
        { error: 'Billing portal not configured. Please contact support.' },
        { status: 400 },
      );
    }

    // Check if it's an authentication error
    if (error.code === 'authentication_error') {
      return NextResponse.json(
        { error: 'Stripe authentication failed. Please contact support.' },
        { status: 500 },
      );
    }

    // Check if it's a customer not found error
    if (
      error.code === 'resource_missing' &&
      error.message?.includes('customer')
    ) {
      return NextResponse.json(
        { error: 'Customer not found in Stripe. Please contact support.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: `Failed to create customer portal session: ${error.message || 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
