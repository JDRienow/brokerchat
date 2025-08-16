import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getClientSessionConversation } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    // Get the authenticated broker
    const session = await auth();
    if (!session || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY CHECK: Prevent brokers from accessing client session API when logged in
    // This endpoint should only be accessible to client users, not brokers
    return NextResponse.json(
      { error: 'Brokers cannot access client session API' },
      { status: 403 },
    );
  } catch (error) {
    console.error('Error fetching client session conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 },
    );
  }
}
