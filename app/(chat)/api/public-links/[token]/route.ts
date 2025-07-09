import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getPublicLinkByToken,
  createClientSession,
  trackAnalyticsEvent,
} from '@/lib/db/queries';

// GET: Get public link by token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Get the public link
    const publicLink = await getPublicLinkByToken(token);

    if (!publicLink) {
      return NextResponse.json(
        { error: 'Public link not found or inactive' },
        { status: 404 },
      );
    }

    // Track analytics event
    await trackAnalyticsEvent({
      broker_id: publicLink.broker_id,
      public_link_id: publicLink.id,
      event_type: 'link_view',
    });

    // If email is provided, create/update client session
    if (email) {
      try {
        const clientSession = await createClientSession({
          public_link_id: publicLink.id,
          client_email: email,
          client_name: name || undefined,
          client_phone: phone || undefined,
        });

        // Track email capture
        await trackAnalyticsEvent({
          broker_id: publicLink.broker_id,
          public_link_id: publicLink.id,
          client_session_id: clientSession.id,
          event_type: 'email_capture',
          event_data: { email, name, phone },
        });

        return NextResponse.json({
          publicLink,
          clientSession,
        });
      } catch (error) {
        console.error('Error creating client session:', error);
        // Still return the public link even if session creation fails
        return NextResponse.json({
          publicLink,
          clientSession: null,
        });
      }
    }

    return NextResponse.json({
      publicLink,
      clientSession: null,
    });
  } catch (error) {
    console.error('Error fetching public link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public link' },
      { status: 500 },
    );
  }
}
