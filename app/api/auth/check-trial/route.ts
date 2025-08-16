import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { checkTrialStatus } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const trialStatus = await checkTrialStatus(session.user.id);

    return NextResponse.json({
      isValid: trialStatus.isValid,
      reason: trialStatus.reason,
      needsUpgrade: !trialStatus.isValid,
    });
  } catch (error) {
    console.error('Error checking trial status:', error);
    return NextResponse.json(
      { error: 'Failed to check trial status' },
      { status: 500 },
    );
  }
}
