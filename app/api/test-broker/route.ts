import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getBrokerByEmail } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'rienowjd@gmail.com';

    const broker = await getBrokerByEmail(email);

    return NextResponse.json({
      email,
      broker,
      exists: !!broker,
      subscription_status: broker?.subscription_status,
      has_password: !!broker?.password_hash,
      stripe_customer_id: broker?.stripe_customer_id,
      stripe_subscription_id: broker?.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Error testing broker:', error);
    return NextResponse.json(
      { error: 'Failed to test broker' },
      { status: 500 },
    );
  }
}
