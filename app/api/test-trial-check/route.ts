import { type NextRequest, NextResponse } from 'next/server';
import { hasUsedTrial } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trialUsed = await hasUsedTrial(email);

    return NextResponse.json({
      email,
      hasUsedTrial: trialUsed,
    });
  } catch (error) {
    console.error('Error checking trial usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
