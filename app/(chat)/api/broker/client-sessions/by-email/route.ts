import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { supabaseAdmin } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated broker
    const session = await auth();
    if (!session || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const documentId = searchParams.get('documentId');

    if (!email || !documentId) {
      return NextResponse.json(
        { error: 'Email and documentId are required' },
        { status: 400 },
      );
    }

    // Get client sessions for this email and document
    console.log(
      'Querying for email:',
      email,
      'documentId:',
      documentId,
      'brokerId:',
      session.user.id,
    );

    // Determine which broker IDs to query
    let brokerIds: string[];

    if (session.user.team_id) {
      // If user is on a team, get all team member IDs
      const { data: teamMembers } = await supabaseAdmin
        .from('brokers')
        .select('id')
        .eq('team_id', session.user.team_id);
      brokerIds = teamMembers?.map((b) => b.id) || [];
    } else {
      // Otherwise, use only the current user's ID
      brokerIds = [session.user.id];
    }

    if (brokerIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // First get the client sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('client_sessions')
      .select(`
        *,
        public_link:public_links!inner(
          id,
          title,
          document_id,
          broker_id
        )
      `)
      .eq('client_email', email)
      .eq('public_link.document_id', documentId)
      .in('public_link.broker_id', brokerIds)
      .order('last_activity', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching client sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch client sessions' },
        { status: 500 },
      );
    }

    // Then get chat histories for each session
    const sessionsWithChatHistory = await Promise.all(
      sessions.map(async (session) => {
        console.log('Fetching chat history for session:', session.id);
        const { data: chatHistory, error: chatError } = await supabaseAdmin
          .from('chat_histories')
          .select('id, role, content, created_at')
          .eq('client_session_id', session.id)
          .order('created_at', { ascending: true });

        if (chatError) {
          console.error(
            'Error fetching chat history for session:',
            session.id,
            chatError,
          );
          return { ...session, chat_histories: [] };
        }

        console.log(
          'Chat history for session',
          session.id,
          ':',
          JSON.stringify(chatHistory, null, 2),
        );
        return { ...session, chat_histories: chatHistory || [] };
      }),
    );

    console.log(
      'Client sessions data:',
      JSON.stringify(sessionsWithChatHistory, null, 2),
    );
    return NextResponse.json({ sessions: sessionsWithChatHistory });
  } catch (error) {
    console.error('Error in client sessions by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client sessions' },
      { status: 500 },
    );
  }
}
