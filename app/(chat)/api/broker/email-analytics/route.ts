import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Missing broker_id parameter' },
        { status: 400 },
      );
    }

    // Fetch client sessions with document and email information
    const { data: sessions, error } = await supabase
      .from('client_sessions')
      .select(`
        client_email,
        client_name,
        created_at,
        public_link:public_links!inner(
          document_id,
          title,
          document_metadata!inner(
            title
          )
        )
      `)
      .eq('public_link.broker_id', brokerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email analytics' },
        { status: 500 },
      );
    }

    // Group sessions by document
    const emailsByDocument = new Map();

    sessions?.forEach((session: any) => {
      const documentId = session.public_link?.document_id;
      const documentTitle =
        session.public_link?.document_metadata?.title || 'Unknown Document';
      const linkTitle = session.public_link?.title;

      if (documentId && session.client_email) {
        if (!emailsByDocument.has(documentId)) {
          emailsByDocument.set(documentId, {
            document_id: documentId,
            document_title: documentTitle,
            link_title: linkTitle,
            emails: new Map(),
          });
        }

        const doc = emailsByDocument.get(documentId);
        if (!doc.emails.has(session.client_email)) {
          doc.emails.set(session.client_email, {
            email: session.client_email,
            name: session.client_name || null,
            first_accessed: session.created_at,
            access_count: 0,
          });
        }

        // Increment access count
        const emailData = doc.emails.get(session.client_email);
        emailData.access_count += 1;

        // Update first accessed if this is earlier
        if (session.created_at < emailData.first_accessed) {
          emailData.first_accessed = session.created_at;
        }
      }
    });

    // Convert to array format with email arrays
    const result = Array.from(emailsByDocument.values()).map((doc) => ({
      document_id: doc.document_id,
      document_title: doc.document_title,
      link_title: doc.link_title,
      emails: Array.from(doc.emails.values()).sort(
        (a: any, b: any) =>
          new Date(b.first_accessed).getTime() -
          new Date(a.first_accessed).getTime(),
      ),
      total_unique_emails: doc.emails.size,
    }));

    return NextResponse.json({
      documents: result,
      total_documents: result.length,
      total_unique_emails: new Set(sessions?.map((s) => s.client_email)).size,
    });
  } catch (error) {
    console.error('Email analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
