import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getPublicLinkByToken,
  createClientSession,
  trackAnalyticsEvent,
  getClientSessionChatHistory,
} from '@/lib/db/queries';

// GET: Get public link by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Get the public link
    const publicLinkRaw = await getPublicLinkByToken(token);

    if (!publicLinkRaw) {
      return NextResponse.json(
        { error: 'Public link not found or inactive' },
        { status: 404 },
      );
    }

    // Transform data to match public page expectations
    const publicLink = {
      id: publicLinkRaw.id,
      title: publicLinkRaw.title,
      description: publicLinkRaw.description,
      document_id: publicLinkRaw.document_id,
      broker_id: publicLinkRaw.broker_id,
      document_title:
        publicLinkRaw.document_metadata?.title || 'Unknown Document',
      document_url: publicLinkRaw.document_metadata?.url || '#',
      document_created_at:
        publicLinkRaw.document_metadata?.created_at || new Date().toISOString(),
      broker_name:
        `${publicLinkRaw.broker?.first_name || ''} ${publicLinkRaw.broker?.last_name || ''}`.trim(),
      broker_company: publicLinkRaw.broker?.company_name || '',
      requires_email: publicLinkRaw.requires_email,
      custom_branding: publicLinkRaw.custom_branding,
      broker: {
        logo_url: publicLinkRaw.broker?.logo_url || null,
      },
    };

    // Track analytics event
    await trackAnalyticsEvent({
      broker_id: publicLink.broker_id,
      public_link_id: publicLink.id,
      event_type: 'link_view',
    });

    // If email is provided, create/update client session
    if (email) {
      // SECURITY CHECK: Prevent brokers from creating client sessions with their own email
      const session = await auth();
      if (session?.user?.type === 'broker' && session.user.email === email) {
        return NextResponse.json(
          {
            error:
              'Brokers cannot create client sessions with their own email address',
          },
          { status: 403 },
        );
      }

      try {
        const clientSession = await createClientSession({
          public_link_id: publicLink.id,
          client_email: email,
          client_name: name || undefined,
          client_phone: phone || undefined,
        });

        // Load chat history for this session
        const chatHistory = await getClientSessionChatHistory(clientSession.id);

        // Track email capture only if this is a new session
        // (createClientSession now returns existing sessions, so we check if it's new)
        const isNewSession = !chatHistory || chatHistory.length === 0;
        if (isNewSession) {
          await trackAnalyticsEvent({
            broker_id: publicLink.broker_id,
            public_link_id: publicLink.id,
            client_session_id: clientSession.id,
            event_type: 'email_capture',
            event_data: { email, name, phone },
          });
        }

        return NextResponse.json({
          link: publicLink,
          session: {
            ...clientSession,
            chat_history: chatHistory,
          },
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
      link: publicLink,
      session: null,
    });
  } catch (error) {
    console.error('Error fetching public link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public link' },
      { status: 500 },
    );
  }
}

// POST: Create client session (email capture)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { client_email, client_name, client_phone } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    if (!client_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // SECURITY CHECK: Prevent brokers from creating client sessions with their own email
    const session = await auth();
    if (
      session?.user?.type === 'broker' &&
      session.user.email === client_email
    ) {
      return NextResponse.json(
        {
          error:
            'Brokers cannot create client sessions with their own email address',
        },
        { status: 403 },
      );
    }

    // Get the public link
    const publicLinkRaw = await getPublicLinkByToken(token);

    if (!publicLinkRaw) {
      return NextResponse.json(
        { error: 'Public link not found or inactive' },
        { status: 404 },
      );
    }

    console.log(
      'Creating client session for:',
      client_email,
      'on link:',
      publicLinkRaw.id,
    );

    // Create client session
    const clientSession = await createClientSession({
      public_link_id: publicLinkRaw.id,
      client_email,
      client_name: client_name || undefined,
      client_phone: client_phone || undefined,
    });

    console.log('Client session created:', clientSession.id);

    // Load chat history for this session
    const chatHistory = await getClientSessionChatHistory(clientSession.id);

    console.log('Chat history loaded:', chatHistory?.length || 0, 'messages');

    // Track email capture event only if this is a new session
    const isNewSession = !chatHistory || chatHistory.length === 0;
    if (isNewSession) {
      console.log('Tracking email capture event for new session');
      await trackAnalyticsEvent({
        broker_id: publicLinkRaw.broker_id,
        public_link_id: publicLinkRaw.id,
        client_session_id: clientSession.id,
        event_type: 'email_capture',
        event_data: {
          email: client_email,
          name: client_name,
          phone: client_phone,
        },
      });
    } else {
      console.log('Existing session found, not tracking email capture');
    }

    return NextResponse.json({
      session: {
        ...clientSession,
        chat_history: chatHistory,
      },
    });
  } catch (error) {
    console.error('Error creating client session:', error);
    return NextResponse.json(
      { error: 'Failed to create client session' },
      { status: 500 },
    );
  }
}
