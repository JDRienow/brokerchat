import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    // Retrieve the checkout session to verify it exists
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 },
      );
    }

    // Redirect to Stripe Checkout
    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Checkout URL not available' },
        { status: 500 },
      );
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    return NextResponse.json(
      { error: 'Failed to redirect to checkout' },
      { status: 500 },
    );
  }
}
