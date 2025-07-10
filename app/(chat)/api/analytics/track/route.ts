import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { trackAnalyticsEventSafely } from '@/lib/db/queries';

// POST: Track analytics event
export async function POST(request: NextRequest) {
  try {
    const {
      broker_id,
      public_link_id,
      client_session_id,
      event_type,
      event_data,
    } = await request.json();

    if (!broker_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: broker_id, event_type' },
        { status: 400 },
      );
    }

    // Track the analytics event
    const result = await trackAnalyticsEventSafely({
      broker_id,
      public_link_id,
      client_session_id,
      event_type,
      event_data,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 },
    );
  }
}
