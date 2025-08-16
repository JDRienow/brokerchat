import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getBrokerByEmail, createPasswordResetToken } from '@/lib/db/queries';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const broker = await getBrokerByEmail(email);

    // Debug logging
    console.log('Setup link request for email:', email);
    console.log('Broker found:', !!broker);
    console.log('Broker data:', broker);

    if (!broker) {
      return NextResponse.json(
        { error: 'No account found for this email.' },
        { status: 404 },
      );
    }

    if (!broker.subscription_status || broker.subscription_status === 'trial') {
      return NextResponse.json(
        {
          error: 'No paid account found for this email.',
          debug: {
            subscription_status: broker.subscription_status,
            stripe_customer_id: broker.stripe_customer_id,
            stripe_subscription_id: broker.stripe_subscription_id,
          },
        },
        { status: 404 },
      );
    }
    if (broker.password_hash) {
      return NextResponse.json(
        {
          error:
            'Account already set up. Please log in or reset your password.',
        },
        { status: 400 },
      );
    }
    // Generate a setup token (reuse password reset logic)
    const setupToken = nanoid(32);
    await createPasswordResetToken(email, setupToken);
    const brokerName = `${broker.first_name} ${broker.last_name}`.trim();
    await sendPasswordResetEmail(email, setupToken, brokerName); // Use the same template for now
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending setup link:', error);
    return NextResponse.json(
      { error: 'Failed to send setup link' },
      { status: 500 },
    );
  }
}
