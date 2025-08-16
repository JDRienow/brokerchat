import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getBrokerByEmail } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch fresh data from database
    const broker = await getBrokerByEmail(session.user.email);

    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the fresh data
    return NextResponse.json({
      success: true,
      user: {
        id: broker.id,
        email: broker.email,
        first_name: broker.first_name,
        last_name: broker.last_name,
        company_name: broker.company_name,
        subscription_tier: broker.subscription_tier,
        subscription_status: broker.subscription_status,
        logo_url: broker.logo_url,
      },
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
