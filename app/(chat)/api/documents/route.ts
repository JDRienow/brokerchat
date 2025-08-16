import { auth } from '@/app/(auth)/auth';
import { supabase } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Documents API - Session user:', {
    id: session.user.id,
    email: session.user.email,
    type: session.user.type,
  });

  try {
    // Get documents for the current user only
    const { data: documents, error } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('broker_id', session.user.id)
      .order('created_at', { ascending: false });

    console.log('Documents query result:', { documents, error });

    if (error) {
      console.error('Error fetching documents:', error);
      return Response.json(
        { error: 'Failed to fetch documents' },
        { status: 500 },
      );
    }

    // For each document, get chunk count
    const documentsWithChunks = await Promise.all(
      documents.map(async (doc) => {
        const { data: chunks, error: chunkError } = await supabase
          .from('documents')
          .select('id')
          .eq('file_id', doc.id);

        const chunkCount = chunkError ? 0 : chunks?.length || 0;

        return {
          ...doc,
          chunks: chunkCount,
        };
      }),
    );

    console.log('Final documents with chunks:', documentsWithChunks);

    return Response.json({
      success: true,
      documents: documentsWithChunks,
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
