import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 },
      );
    }

    // Get customer email from session details
    const customer =
      session.customer_details?.email || session.customer_email || '';

    return NextResponse.json({
      valid: true,
      customer_email: customer,
      plan_type: session.metadata?.plan_type || 'individual',
      payment_status: session.payment_status,
    });
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 },
    );
  }
}
