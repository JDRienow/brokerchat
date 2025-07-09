import { auth } from '@/app/(auth)/auth';
import { supabase } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all documents from document_metadata table
    const { data: documents, error } = await supabase
      .from('document_metadata')
      .select('*')
      .order('created_at', { ascending: false });

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

    return Response.json({
      success: true,
      documents: documentsWithChunks,
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
